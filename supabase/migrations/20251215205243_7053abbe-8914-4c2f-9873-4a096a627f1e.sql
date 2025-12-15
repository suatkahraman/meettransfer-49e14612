-- Fix infinite recursion in user_roles table
-- The problem: policies that query user_roles while checking access to user_roles

-- Drop all problematic policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Keep only the simple user policy that doesn't cause recursion
-- Users can view their own roles - this is safe because it only checks auth.uid() = user_id
-- No subquery needed

-- For admin access to user_roles, we'll use the service role or the has_role function
-- which is SECURITY DEFINER and bypasses RLS

-- Create admin policy using has_role function (SECURITY DEFINER bypasses RLS)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
AS PERMISSIVE
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Create admin ALL policy for insert/update/delete
CREATE POLICY "Admins can manage roles"
ON public.user_roles
AS PERMISSIVE
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));