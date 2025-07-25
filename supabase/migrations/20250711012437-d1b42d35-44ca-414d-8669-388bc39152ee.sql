-- Fix infinite recursion in user_roles RLS policy
-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;

-- Create new secure policy using SECURITY DEFINER function to prevent recursion
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()));