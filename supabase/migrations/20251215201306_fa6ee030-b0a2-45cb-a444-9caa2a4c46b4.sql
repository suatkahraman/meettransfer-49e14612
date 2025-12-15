-- Allow customers to view only the driver assigned to their own reservations
-- Needed for CustomerReservationDetail embedded `drivers(...)` select

CREATE POLICY "Customers can view assigned driver"
ON public.drivers
AS PERMISSIVE
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.reservations r
    WHERE r.driver_id = drivers.id
      AND r.customer_id = auth.uid()
  )
);
