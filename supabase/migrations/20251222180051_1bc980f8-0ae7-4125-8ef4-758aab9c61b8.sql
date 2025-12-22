-- Add policy to block unauthenticated access to bookings table
-- This ensures only authenticated users can access the table at all

CREATE POLICY "Require authentication for bookings access"
ON public.bookings
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);