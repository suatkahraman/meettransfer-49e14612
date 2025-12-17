-- Allow drivers to view admin notes for their assigned reservations
CREATE POLICY "Drivers can view admin notes for assigned reservations"
ON public.reservation_admin_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.id = reservation_admin_notes.reservation_id
    AND r.driver_user_id = auth.uid()
  )
);