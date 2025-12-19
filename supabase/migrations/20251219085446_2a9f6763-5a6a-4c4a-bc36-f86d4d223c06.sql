-- Drop existing customer policy that's too permissive
DROP POLICY IF EXISTS "Customers can view assigned driver" ON public.drivers;

-- Recreate with stricter conditions - only for active reservations
CREATE POLICY "Customers can view assigned driver for active reservations" 
ON public.drivers 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM reservations r
    WHERE r.driver_user_id = drivers.user_id 
    AND r.customer_id = auth.uid()
    AND r.status IN ('confirmed', 'sent_to_driver', 'customer_approved', 'in_progress')
  )
);