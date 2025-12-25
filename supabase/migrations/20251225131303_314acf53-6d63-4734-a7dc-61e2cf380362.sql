-- Add policy requiring authentication for all access to profiles table
CREATE POLICY "Require authentication for profiles access"
ON public.profiles
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);