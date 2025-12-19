-- Fix 1: Remove overly permissive "Deny anonymous access" policy from profiles table
-- This policy grants access to all authenticated users instead of restricting it
-- The existing "Users can view own profile" and "Admins can view all profiles" policies provide proper access control
DROP POLICY IF EXISTS "Deny anonymous access" ON public.profiles;

-- Fix 2: Remove overly permissive bookings policies and create proper restrictive ones
-- First, drop the existing policies that may be too permissive
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;

-- Recreate with explicit user_id check (belt and suspenders approach)
CREATE POLICY "Users can view own bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Ensure admins policy exists with proper check
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;

CREATE POLICY "Admins can manage all bookings" 
ON public.bookings 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));