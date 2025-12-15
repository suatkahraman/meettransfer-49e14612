-- Fix infinite recursion for drivers table
-- The "Customers can view assigned driver" policy queries reservations which queries drivers

-- Drop the problematic policy
DROP POLICY IF EXISTS "Customers can view assigned driver" ON public.drivers;

-- Create a simpler policy that doesn't cause recursion
-- Customers can view drivers assigned to their reservations using driver_user_id
CREATE POLICY "Customers can view assigned driver"
ON public.drivers
AS PERMISSIVE
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.driver_user_id = drivers.user_id
    AND r.customer_id = auth.uid()
  )
);