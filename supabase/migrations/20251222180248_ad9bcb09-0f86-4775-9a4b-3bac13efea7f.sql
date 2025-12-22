-- Add policy to block unauthenticated access to profiles table
-- This ensures only authenticated users can access profiles

CREATE POLICY "Require authentication for profiles access"
ON public.profiles
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);