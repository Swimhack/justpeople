-- Create application logs table
CREATE TABLE public.application_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug')),
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT, -- component, page, or function name
  stack_trace TEXT,
  metadata JSONB DEFAULT '{}',
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_application_logs_user_timestamp ON public.application_logs(user_id, timestamp DESC);
CREATE INDEX idx_application_logs_level_timestamp ON public.application_logs(level, timestamp DESC);
CREATE INDEX idx_application_logs_session_timestamp ON public.application_logs(session_id, timestamp DESC);

-- Enable RLS
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own logs" 
ON public.application_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs" 
ON public.application_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all logs
CREATE POLICY "Admins can view all logs" 
ON public.application_logs 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Function to clean up old logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_application_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.application_logs
  WHERE created_at < now() - interval '30 days';
END;
$$;

-- Function to log application events
CREATE OR REPLACE FUNCTION log_application_event(
  p_level TEXT,
  p_message TEXT,
  p_source TEXT DEFAULT NULL,
  p_stack_trace TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_session_id TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.application_logs (
    user_id, level, message, source, stack_trace, 
    metadata, session_id, user_agent, ip_address
  )
  VALUES (
    auth.uid(), p_level, p_message, p_source, p_stack_trace,
    p_metadata, p_session_id, p_user_agent, p_ip_address
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;