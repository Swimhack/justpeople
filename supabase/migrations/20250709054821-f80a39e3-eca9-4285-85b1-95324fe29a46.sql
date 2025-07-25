-- Create user invitations and branding system

-- 1. Create user_invitations table
CREATE TABLE public.user_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  invited_by uuid NOT NULL,
  pre_assigned_role app_role NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  
  CONSTRAINT unique_pending_email UNIQUE (email, status) DEFERRABLE INITIALLY DEFERRED
);

-- 2. Create brand_settings table
CREATE TABLE public.brand_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Create email_templates table
CREATE TABLE public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key text NOT NULL UNIQUE,
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Enable RLS on all new tables
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for user_invitations
CREATE POLICY "Admins can manage all invitations"
ON public.user_invitations
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view invitations they sent"
ON public.user_invitations
FOR SELECT
TO authenticated
USING (auth.uid() = invited_by);

-- 6. Create RLS policies for brand_settings
CREATE POLICY "Admins can manage brand settings"
ON public.brand_settings
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view brand settings"
ON public.brand_settings
FOR SELECT
TO authenticated
USING (true);

-- 7. Create RLS policies for email_templates
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active templates"
ON public.email_templates
FOR SELECT
TO authenticated
USING (is_active = true);

-- 8. Create updated_at triggers
CREATE TRIGGER update_user_invitations_updated_at
  BEFORE UPDATE ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_settings_updated_at
  BEFORE UPDATE ON public.brand_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Insert default brand settings
INSERT INTO public.brand_settings (setting_key, setting_value, description) VALUES
('company_name', '"Your Company"'::jsonb, 'Company name displayed in emails and interface'),
('company_tagline', '"Professional Business Solutions"'::jsonb, 'Company tagline or slogan'),
('primary_color', '"#3b82f6"'::jsonb, 'Primary brand color (hex)'),
('secondary_color', '"#10b981"'::jsonb, 'Secondary brand color (hex)'),
('logo_url', '""'::jsonb, 'URL to company logo'),
('email_from_name', '"Your Company"'::jsonb, 'Name shown in from field of emails'),
('email_from_address', '"noreply@yourcompany.com"'::jsonb, 'Email address for outgoing emails'),
('support_email', '"support@yourcompany.com"'::jsonb, 'Support contact email'),
('website_url', '"https://yourcompany.com"'::jsonb, 'Company website URL');

-- 10. Insert default email templates
INSERT INTO public.email_templates (template_key, subject, html_content, text_content, variables) VALUES
('user_invitation', 
 'You''re invited to join {{company_name}}!',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, {{primary_color}}, {{secondary_color}}); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
      <h1 style="color: white; margin: 0; font-size: 28px;">{{company_name}}</h1>
      <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">{{company_tagline}}</p>
    </div>
    <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid {{primary_color}};">
      <h2 style="color: #1e293b; margin-top: 0;">You''re Invited!</h2>
      <p style="color: #475569; line-height: 1.6;">
        {{invited_by_name}} has invited you to join {{company_name}} as a {{role}}.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{invitation_link}}" style="background: {{primary_color}}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      <p style="color: #475569; line-height: 1.6; font-size: 14px;">
        This invitation will expire on {{expires_at}}. If you don''t want to join, you can safely ignore this email.
      </p>
    </div>
  </div>',
 'You''re invited to join {{company_name}}!\n\n{{invited_by_name}} has invited you to join {{company_name}} as a {{role}}.\n\nAccept your invitation: {{invitation_link}}\n\nThis invitation expires on {{expires_at}}.',
 '["company_name", "company_tagline", "primary_color", "secondary_color", "invited_by_name", "role", "invitation_link", "expires_at"]'::jsonb
),
('welcome', 
 'Welcome to {{company_name}}!',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, {{primary_color}}, {{secondary_color}}); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to {{company_name}}!</h1>
      <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your account is ready</p>
    </div>
    <div style="background: #f0f9ff; padding: 30px; border-radius: 10px; border-left: 4px solid {{primary_color}};">
      <h2 style="color: #1e293b; margin-top: 0;">Welcome {{user_name}}!</h2>
      <p style="color: #475569; line-height: 1.6;">
        Your account has been successfully created. You now have access to our platform.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboard_link}}" style="background: {{primary_color}}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Access Dashboard
        </a>
      </div>
    </div>
  </div>',
 'Welcome to {{company_name}}!\n\nYour account has been successfully created, {{user_name}}.\n\nAccess your dashboard: {{dashboard_link}}',
 '["company_name", "primary_color", "secondary_color", "user_name", "dashboard_link"]'::jsonb
);

-- 11. Create function to get brand setting
CREATE OR REPLACE FUNCTION public.get_brand_setting(setting_key_param text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT setting_value
  FROM public.brand_settings
  WHERE setting_key = setting_key_param;
$$;

-- 12. Create function to generate invitation token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE sql
AS $$
  SELECT encode(gen_random_bytes(32), 'base64url');
$$;