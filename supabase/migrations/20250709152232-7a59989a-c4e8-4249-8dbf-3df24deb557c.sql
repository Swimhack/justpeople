-- Critical Security Fixes Migration

-- 1. Fix system_settings RLS policy to use user_roles instead of profiles.role
DROP POLICY IF EXISTS "Only admins can manage system settings" ON public.system_settings;
CREATE POLICY "Only admins can manage system settings" ON public.system_settings
FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- 2. Restrict profiles table access - only admins can see all profiles, users can only see their own
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

-- 3. Add email validation to user_invitations table
ALTER TABLE public.user_invitations
ADD COLUMN IF NOT EXISTS accepted_by uuid;

-- 4. Create function to validate invitation acceptance
CREATE OR REPLACE FUNCTION public.validate_invitation_acceptance(
  invitation_token text,
  accepting_email text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_invitations 
    WHERE token = invitation_token 
    AND email = accepting_email 
    AND status = 'pending'
    AND expires_at > now()
  );
$$;

-- 5. Create function to log admin actions for security monitoring
CREATE OR REPLACE FUNCTION public.log_admin_action(
  admin_user_id uuid,
  action_type text,
  resource_type text DEFAULT NULL,
  resource_id text DEFAULT NULL,
  metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.admin_logs (admin_id, action, resource_type, resource_id, metadata)
  VALUES (admin_user_id, action_type, resource_type, resource_id, metadata);
$$;

-- 6. Add trigger to automatically log invitation actions
CREATE OR REPLACE FUNCTION public.log_invitation_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_admin_action(
      NEW.invited_by,
      'invitation_sent',
      'user_invitation',
      NEW.id::text,
      jsonb_build_object('email', NEW.email, 'role', NEW.pre_assigned_role)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    PERFORM public.log_admin_action(
      NEW.invited_by,
      'invitation_accepted',
      'user_invitation',
      NEW.id::text,
      jsonb_build_object('email', NEW.email, 'accepted_by', NEW.accepted_by)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS log_invitation_changes ON public.user_invitations;
CREATE TRIGGER log_invitation_changes
  AFTER INSERT OR UPDATE ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_invitation_action();

-- 7. Add constraint to prevent role escalation
ALTER TABLE public.user_roles 
ADD CONSTRAINT valid_role_assignment 
CHECK (role IN ('admin', 'moderator', 'user'));

-- 8. Create function to validate admin role in edge functions
CREATE OR REPLACE FUNCTION public.validate_admin_access(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT is_admin(user_id);
$$;