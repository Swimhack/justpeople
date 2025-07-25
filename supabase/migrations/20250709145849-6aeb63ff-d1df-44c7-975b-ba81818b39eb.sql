-- Fix the generate_invitation_token function to use hex encoding instead of base64url
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE sql
AS $$
  SELECT encode(gen_random_bytes(32), 'hex');
$$;