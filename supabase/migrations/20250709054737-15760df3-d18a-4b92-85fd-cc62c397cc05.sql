-- Add helper function to get invitation by token
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invitation_token text)
RETURNS TABLE(
  email text,
  role text,
  invited_by uuid,
  expires_at timestamp with time zone,
  custom_message text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    user_invitations.email,
    user_invitations.role::text,
    user_invitations.invited_by,
    user_invitations.expires_at,
    user_invitations.custom_message
  FROM public.user_invitations
  WHERE user_invitations.token = invitation_token
    AND user_invitations.status = 'pending';
$$;