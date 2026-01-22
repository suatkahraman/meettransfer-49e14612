-- Fix profiles table RLS: Remove overly permissive policy that allows any authenticated user to access all profiles
-- This policy was allowing any logged-in user to view all profile data

-- Drop the problematic overly permissive policy
DROP POLICY IF EXISTS "Require authentication for profiles access" ON public.profiles;

-- The remaining policies are correct:
-- - "Users can view own profile" (auth.uid() = id) - SELECT
-- - "Users can insert own profile" (auth.uid() = id) - INSERT  
-- - "Users can update own profile" (auth.uid() = id) - UPDATE
-- - "Users can delete own profile" (auth.uid() = id) - DELETE
-- - "Admins can view all profiles" - SELECT for admins
-- - "Admins can update all profiles" - UPDATE for admins
-- - "Admins can delete all profiles" - DELETE for admins