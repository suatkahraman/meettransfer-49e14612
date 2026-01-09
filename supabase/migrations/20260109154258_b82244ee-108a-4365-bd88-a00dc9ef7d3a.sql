-- Allow drivers to update their own record
CREATE POLICY "Drivers can update own profile"
ON public.drivers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);