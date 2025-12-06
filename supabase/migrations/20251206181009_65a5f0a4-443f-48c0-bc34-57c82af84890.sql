-- Add DELETE policy for bookings table to allow users to delete their own bookings
CREATE POLICY "Users can delete own bookings"
ON public.bookings
FOR DELETE
USING (auth.uid() = user_id);