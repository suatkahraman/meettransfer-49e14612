-- Drop the overly broad authentication policy that allows any authenticated user access
-- The individual owner-based policies already handle authentication implicitly
DROP POLICY IF EXISTS "Require authentication for profiles access" ON public.profiles;

-- The existing policies already properly restrict access:
-- - "Users can view own profile" with USING (auth.uid() = id)
-- - "Admins can view all profiles" with has_role check
-- These are sufficient for proper access control