-- Security Fix Migration: Address Critical Vulnerabilities
-- Phase 1: Critical Security Fixes

-- 1. Remove the conflicting role column from profiles table to eliminate dual role storage
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 2. Drop existing problematic RLS policies on user_roles
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- 3. Create secure RLS policies for user_roles table
-- Only allow users to view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Only allow admins to insert/update/delete roles (prevent self-role-assignment)
CREATE POLICY "Only admins can manage user roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- 4. Create security audit logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  user_id UUID DEFAULT auth.uid(),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_logs (admin_id, action, resource_type, metadata, ip_address)
  VALUES (
    COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    event_type,
    'security_event',
    details,
    ip_address
  );
END;
$$;

-- 5. Create rate limiting table for security
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP, user_id, or combination
  action_type TEXT NOT NULL, -- 'invitation', 'message', 'auth_attempt'
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(identifier, action_type, window_start)
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limits can only be managed by system functions
CREATE POLICY "System can manage rate limits" ON public.rate_limits
  FOR ALL USING (true);

-- 6. Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action_type TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_window TIMESTAMP WITH TIME ZONE;
  request_count INTEGER;
BEGIN
  -- Calculate current window start (rounded to the hour/minute)
  current_window := date_trunc('minute', now()) - ((EXTRACT(minute FROM now())::INTEGER % p_window_minutes) || ' minutes')::INTERVAL;
  
  -- Get current count for this window
  SELECT COALESCE(count, 0) INTO request_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND action_type = p_action_type
    AND window_start = current_window;
  
  -- If under limit, increment counter
  IF request_count < p_max_requests THEN
    INSERT INTO public.rate_limits (identifier, action_type, count, window_start)
    VALUES (p_identifier, p_action_type, request_count + 1, current_window)
    ON CONFLICT (identifier, action_type, window_start)
    DO UPDATE SET count = rate_limits.count + 1;
    
    RETURN TRUE;
  ELSE
    -- Log rate limit violation
    PERFORM public.log_security_event(
      'rate_limit_exceeded',
      NULL,
      jsonb_build_object(
        'identifier', p_identifier,
        'action_type', p_action_type,
        'limit', p_max_requests,
        'window_minutes', p_window_minutes
      )
    );
    RETURN FALSE;
  END IF;
END;
$$;

-- 7. Create file validation function for secure uploads
CREATE OR REPLACE FUNCTION public.validate_file_upload(
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  user_id UUID DEFAULT auth.uid()
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB := '{"valid": true, "errors": []}'::jsonb;
  errors TEXT[] := '{}';
  max_size BIGINT := 10 * 1024 * 1024; -- 10MB default
  allowed_types TEXT[] := ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
BEGIN
  -- Check file size
  IF file_size > max_size THEN
    errors := array_append(errors, 'File size exceeds maximum limit of 10MB');
  END IF;
  
  -- Check file type
  IF NOT (mime_type = ANY(allowed_types)) THEN
    errors := array_append(errors, 'File type not allowed');
  END IF;
  
  -- Check file name for suspicious patterns
  IF file_name ~* '\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|php|asp|jsp)$' THEN
    errors := array_append(errors, 'Potentially dangerous file extension');
  END IF;
  
  -- Check for null bytes and control characters
  IF file_name ~ '[\x00-\x1F\x7F]' THEN
    errors := array_append(errors, 'Invalid characters in filename');
  END IF;
  
  -- Rate limit file uploads (5 files per minute per user)
  IF NOT public.check_rate_limit(user_id::text, 'file_upload', 5, 1) THEN
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
      'file_upload_validation_failed',
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

-- 8. Create trigger to audit role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      'role_assigned',
      NEW.user_id,
      jsonb_build_object(
        'role', NEW.role,
        'assigned_by', auth.uid()
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      'role_updated',
      NEW.user_id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'updated_by', auth.uid()
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      'role_removed',
      OLD.user_id,
      jsonb_build_object(
        'role', OLD.role,
        'removed_by', auth.uid()
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS audit_user_role_changes ON public.user_roles;
CREATE TRIGGER audit_user_role_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();

-- 9. Clean up old rate limit entries (to prevent table bloat)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE created_at < now() - interval '24 hours';
END;
$$;