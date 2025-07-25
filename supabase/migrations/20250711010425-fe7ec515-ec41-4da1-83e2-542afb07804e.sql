-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- 'message', 'system', 'mention', 'reaction', etc.
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  priority_level TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Create notification templates table
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL, -- 'email', 'sms', 'push', 'in_app'
  subject_template TEXT,
  body_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification logs table
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  template_id UUID REFERENCES public.notification_templates(id),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'read'
  subject TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create device tokens table for push notifications
CREATE TABLE public.device_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'web', 'mobile'
  browser_info JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Create notification queue table
CREATE TABLE public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences"
ON public.notification_preferences
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification preferences"
ON public.notification_preferences
FOR SELECT
USING (is_admin(auth.uid()));

-- Create RLS policies for notification_templates
CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active templates"
ON public.notification_templates
FOR SELECT
USING (is_active = true);

-- Create RLS policies for notification_logs
CREATE POLICY "Users can view their own notification logs"
ON public.notification_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notification logs"
ON public.notification_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all notification logs"
ON public.notification_logs
FOR SELECT
USING (is_admin(auth.uid()));

-- Create RLS policies for device_tokens
CREATE POLICY "Users can manage their own device tokens"
ON public.device_tokens
FOR ALL
USING (auth.uid() = user_id);

-- Create RLS policies for notification_queue
CREATE POLICY "System can manage notification queue"
ON public.notification_queue
FOR ALL
USING (true);

CREATE POLICY "Users can view their own queued notifications"
ON public.notification_queue
FOR SELECT
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX idx_device_tokens_user_id ON public.device_tokens(user_id);
CREATE INDEX idx_notification_queue_scheduled_for ON public.notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_status ON public.notification_queue(status);

-- Create function to automatically create default notification preferences
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert default notification preferences for new users
  INSERT INTO public.notification_preferences (user_id, notification_type, email_enabled, sms_enabled, push_enabled, in_app_enabled)
  VALUES 
    (NEW.id, 'message', true, false, true, true),
    (NEW.id, 'mention', true, true, true, true),
    (NEW.id, 'reaction', false, false, true, true),
    (NEW.id, 'system', true, false, true, true),
    (NEW.id, 'security', true, true, true, true);
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set up notification preferences for new users
CREATE TRIGGER on_auth_user_created_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_notification_preferences();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_notification_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_updated_at_column();

-- Insert default notification templates
INSERT INTO public.notification_templates (template_key, name, description, channel, subject_template, body_template, variables) VALUES
('new_message_email', 'New Message Email', 'Email template for new messages', 'email', 'New message from {{sender_name}}', 
 '<h2>You have a new message</h2><p><strong>From:</strong> {{sender_name}}</p><p><strong>Subject:</strong> {{message_subject}}</p><p>{{message_preview}}</p><a href="{{message_url}}">View Message</a>', 
 '["sender_name", "message_subject", "message_preview", "message_url"]'::jsonb),
 
('new_message_sms', 'New Message SMS', 'SMS template for new messages', 'sms', NULL, 
 'New message from {{sender_name}}: {{message_preview}}', 
 '["sender_name", "message_preview"]'::jsonb),
 
('new_message_push', 'New Message Push', 'Push notification template for new messages', 'push', '{{sender_name}} sent you a message', 
 '{{message_preview}}', 
 '["sender_name", "message_preview"]'::jsonb),
 
('system_alert_email', 'System Alert Email', 'Email template for system alerts', 'email', 'System Alert: {{alert_type}}', 
 '<h2>System Alert</h2><p><strong>Type:</strong> {{alert_type}}</p><p><strong>Priority:</strong> {{priority}}</p><p>{{alert_message}}</p>', 
 '["alert_type", "priority", "alert_message"]'::jsonb),
 
('mention_notification', 'Mention Notification', 'Template for when user is mentioned', 'push', 'You were mentioned by {{mention_by}}', 
 '{{mention_context}}', 
 '["mention_by", "mention_context"]'::jsonb);