-- Comprehensive Security Enhancement Migration
-- Phase 1: Authentication Security Tables

-- Create login attempt tracking table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- email or IP
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_type TEXT NOT NULL DEFAULT 'password', -- 'password', '2fa', 'reset'
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for login attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for login attempts (admins only)
CREATE POLICY "Admins can view login attempts" ON public.login_attempts
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert login attempts" ON public.login_attempts
  FOR INSERT WITH CHECK (true);

-- Create session tracking table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Enable RLS for user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT USING (is_admin(auth.uid()));

-- Create account lockout function
CREATE OR REPLACE FUNCTION public.check_account_lockout(
  p_identifier TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_lockout_minutes INTEGER DEFAULT 15
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  failed_attempts INTEGER;
  latest_attempt TIMESTAMP WITH TIME ZONE;
  lockout_until TIMESTAMP WITH TIME ZONE;
  result JSONB;
BEGIN
  -- Get failed attempts in the last lockout period
  SELECT COUNT(*), MAX(created_at) INTO failed_attempts, latest_attempt
  FROM public.login_attempts
  WHERE identifier = p_identifier
    AND success = false
    AND created_at > now() - (p_lockout_minutes || ' minutes')::INTERVAL;
  
  -- Calculate lockout time
  lockout_until := latest_attempt + (p_lockout_minutes || ' minutes')::INTERVAL;
  
  -- Check if account is locked
  IF failed_attempts >= p_max_attempts AND now() < lockout_until THEN
    result := jsonb_build_object(
      'locked', true,
      'attempts', failed_attempts,
      'lockout_until', lockout_until,
      'message', 'Account temporarily locked due to too many failed attempts'
    );
    
    -- Log security event
    PERFORM public.log_security_event(
      'account_locked',
      NULL,
      jsonb_build_object(
        'identifier', p_identifier,
        'failed_attempts', failed_attempts,
        'lockout_until', lockout_until
      )
    );
  ELSE
    result := jsonb_build_object(
      'locked', false,
      'attempts', failed_attempts,
      'remaining_attempts', GREATEST(0, p_max_attempts - failed_attempts)
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Create session management function
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate expired sessions
  UPDATE public.user_sessions
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
  
  -- Delete old inactive sessions (older than 30 days)
  DELETE FROM public.user_sessions
  WHERE created_at < now() - interval '30 days' AND is_active = false;
END;
$$;

-- Create session activity update function
CREATE OR REPLACE FUNCTION public.update_session_activity(
  p_session_id TEXT,
  p_user_id UUID DEFAULT auth.uid()
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_sessions
  SET 
    last_activity = now(),
    expires_at = now() + interval '24 hours'
  WHERE session_id = p_session_id 
    AND user_id = p_user_id 
    AND is_active = true;
END;
$$;

-- Create comprehensive file validation function (enhanced)
CREATE OR REPLACE FUNCTION public.validate_file_upload_enhanced(
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  file_content BYTEA DEFAULT NULL,
  user_id UUID DEFAULT auth.uid()
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB := '{"valid": true, "errors": [], "warnings": []}'::jsonb;
  errors TEXT[] := '{}';
  warnings TEXT[] := '{}';
  max_size BIGINT := 10 * 1024 * 1024; -- 10MB default
  allowed_types TEXT[] := ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
  magic_numbers JSONB := '{
    "image/jpeg": ["FFD8FF"],
    "image/png": ["89504E47"],
    "image/gif": ["474946"],
    "application/pdf": ["255044462D"]
  }'::jsonb;
  file_header TEXT;
  expected_headers TEXT[];
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
  IF file_name ~* '\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|php|asp|jsp|html|htm|svg)$' THEN
    errors := array_append(errors, 'Potentially dangerous file extension');
  END IF;
  
  -- Check for null bytes and control characters
  IF file_name ~ '[\x00-\x1F\x7F]' THEN
    errors := array_append(errors, 'Invalid characters in filename');
  END IF;
  
  -- Magic number validation (if file content provided)
  IF file_content IS NOT NULL AND length(file_content) > 8 THEN
    file_header := upper(encode(substring(file_content from 1 for 8), 'hex'));
    expected_headers := ARRAY(SELECT jsonb_array_elements_text(magic_numbers->mime_type));
    
    IF expected_headers IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM unnest(expected_headers) AS header
        WHERE file_header LIKE header || '%'
      ) THEN
        errors := array_append(errors, 'File content does not match declared MIME type');
      END IF;
    END IF;
  END IF;
  
  -- Rate limit file uploads (5 files per minute per user)
  IF NOT public.check_rate_limit(user_id::text, 'file_upload', 5, 1) THEN
    errors := array_append(errors, 'Upload rate limit exceeded');
  END IF;
  
  -- Additional security checks
  IF file_size = 0 THEN
    warnings := array_append(warnings, 'Empty file detected');
  END IF;
  
  IF length(file_name) > 100 THEN
    warnings := array_append(warnings, 'Very long filename');
  END IF;
  
  -- Build result
  IF array_length(errors, 1) > 0 THEN
    result := jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(errors),
      'warnings', to_jsonb(warnings)
    );
    
    -- Log security event for failed validation
    PERFORM public.log_security_event(
      'file_upload_validation_failed',
      user_id,
      jsonb_build_object(
        'filename', file_name,
        'mime_type', mime_type,
        'file_size', file_size,
        'errors', errors,
        'warnings', warnings
      )
    );
  ELSE
    result := jsonb_build_object(
      'valid', true,
      'errors', '[]'::jsonb,
      'warnings', to_jsonb(warnings)
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Create security monitoring functions
CREATE OR REPLACE FUNCTION public.detect_security_anomalies()
RETURNS TABLE(
  anomaly_type TEXT,
  user_id UUID,
  details JSONB,
  severity TEXT,
  detected_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Multiple failed login attempts from same IP
  RETURN QUERY
  SELECT 
    'multiple_failed_logins'::TEXT,
    NULL::UUID,
    jsonb_build_object(
      'ip_address', ip_address,
      'attempt_count', COUNT(*),
      'time_window', '1 hour'
    ),
    'high'::TEXT,
    now()
  FROM public.login_attempts
  WHERE created_at > now() - interval '1 hour'
    AND success = false
  GROUP BY ip_address
  HAVING COUNT(*) > 10;
  
  -- Unusual file upload patterns
  RETURN QUERY
  SELECT 
    'excessive_file_uploads'::TEXT,
    ur.user_id,
    jsonb_build_object(
      'upload_count', ur.count,
      'time_window', '1 hour'
    ),
    'medium'::TEXT,
    now()
  FROM (
    SELECT 
      identifier::uuid as user_id,
      COUNT(*) as count
    FROM public.rate_limits 
    WHERE action_type = 'file_upload'
      AND window_start > now() - interval '1 hour'
    GROUP BY identifier
    HAVING COUNT(*) > 20
  ) ur;
  
  -- Multiple concurrent sessions
  RETURN QUERY
  SELECT 
    'multiple_sessions'::TEXT,
    user_id,
    jsonb_build_object(
      'session_count', COUNT(*),
      'different_ips', COUNT(DISTINCT ip_address)
    ),
    'medium'::TEXT,
    now()
  FROM public.user_sessions
  WHERE is_active = true
    AND last_activity > now() - interval '1 hour'
  GROUP BY user_id
  HAVING COUNT(*) > 5;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_created ON public.login_attempts(identifier, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success_created ON public.login_attempts(success, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id_active ON public.user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

-- Create triggers for automatic cleanup
CREATE OR REPLACE FUNCTION public.trigger_session_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up expired sessions when new ones are created
  PERFORM public.cleanup_expired_sessions();
  RETURN NEW;
END;
$$;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_cleanup_sessions_on_insert'
  ) THEN
    CREATE TRIGGER trigger_cleanup_sessions_on_insert
      AFTER INSERT ON public.user_sessions
      FOR EACH STATEMENT
      EXECUTE FUNCTION public.trigger_session_cleanup();
  END IF;
END $$;