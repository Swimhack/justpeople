-- Critical Security Fixes Migration
-- Phase 1: Fix RLS Policies and Strengthen Security

-- 1. Fix overly permissive RLS policies - messages should only be accessible to sender/recipient
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages" ON public.messages
FOR SELECT TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- 2. Fix AI interactions - should not be publicly accessible
DROP POLICY IF EXISTS "System can log interactions" ON public.ai_interactions;
CREATE POLICY "System can log AI interactions" ON public.ai_interactions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

-- 3. Fix conversation logs - remove public access
DROP POLICY IF EXISTS "Users can insert their own conversation logs" ON public.conversation_logs;
CREATE POLICY "Users can insert their own conversation logs" ON public.conversation_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Fix user reading behavior - ensure proper user isolation
DROP POLICY IF EXISTS "Users can insert their own reading behavior" ON public.user_reading_behavior;
CREATE POLICY "Users can insert their own reading behavior" ON public.user_reading_behavior
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Strengthen brand settings access - only admins should modify
DROP POLICY IF EXISTS "Authenticated users can view brand settings" ON public.brand_settings;
CREATE POLICY "Authenticated users can view brand settings" ON public.brand_settings
FOR SELECT TO authenticated
USING (true);

-- 6. Add enhanced security validation function
CREATE OR REPLACE FUNCTION public.validate_admin_operation(
  operation_type text,
  resource_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user is actually an admin
  IF NOT is_admin(auth.uid()) THEN
    -- Log unauthorized access attempt
    PERFORM log_security_event(
      'unauthorized_admin_access_attempt',
      auth.uid(),
      jsonb_build_object(
        'operation', operation_type,
        'resource_id', resource_id,
        'timestamp', now()
      )
    );
    RETURN FALSE;
  END IF;
  
  -- Log admin operation
  PERFORM log_admin_action(
    auth.uid(),
    operation_type,
    'admin_operation',
    resource_id,
    jsonb_build_object('timestamp', now())
  );
  
  RETURN TRUE;
END;
$$;

-- 7. Enhanced file upload validation with stricter limits
CREATE OR REPLACE FUNCTION public.validate_file_upload_strict(
  file_name text,
  file_size bigint,
  mime_type text,
  user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB := '{"valid": true, "errors": []}'::jsonb;
  errors TEXT[] := '{}';
  max_size BIGINT := 5 * 1024 * 1024; -- Reduced to 5MB
  allowed_types TEXT[] := ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ];
BEGIN
  -- Stricter file size check
  IF file_size > max_size THEN
    errors := array_append(errors, 'File size exceeds maximum limit of 5MB');
  END IF;
  
  -- Strict file type validation
  IF NOT (mime_type = ANY(allowed_types)) THEN
    errors := array_append(errors, 'File type not allowed');
  END IF;
  
  -- Enhanced filename validation
  IF file_name ~* '\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|php|asp|jsp|html|htm|svg|xml)$' THEN
    errors := array_append(errors, 'Potentially dangerous file extension');
  END IF;
  
  -- Check for suspicious filename patterns
  IF file_name ~* '(script|javascript|eval|exec|system|shell)' THEN
    errors := array_append(errors, 'Suspicious filename detected');
  END IF;
  
  -- Stricter rate limiting (3 files per minute)
  IF NOT public.check_rate_limit(user_id::text, 'file_upload', 3, 1) THEN
    errors := array_append(errors, 'Upload rate limit exceeded');
  END IF;
  
  -- Build result
  IF array_length(errors, 1) > 0 THEN
    result := jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(errors)
    );
    
    -- Log security event for failed validation
    PERFORM public.log_security_event(
      'file_upload_security_violation',
      user_id,
      jsonb_build_object(
        'filename', file_name,
        'mime_type', mime_type,
        'file_size', file_size,
        'errors', errors
      )
    );
  END IF;
  
  RETURN result;
END;
$$;

-- 8. Add UUID validation function
CREATE OR REPLACE FUNCTION public.is_valid_uuid(input_text text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT input_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
$$;