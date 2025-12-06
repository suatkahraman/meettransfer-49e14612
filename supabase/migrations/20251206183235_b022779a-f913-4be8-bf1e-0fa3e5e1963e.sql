-- Ensure RLS is enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;

-- Create permissive policies for users
CREATE POLICY "Users can view own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add admin access for managing all bookings
CREATE POLICY "Admins can manage all bookings"
ON public.bookings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));