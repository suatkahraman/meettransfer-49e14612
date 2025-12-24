-- Allow customers to view admin notes for their own reservations
CREATE POLICY "Customers can view admin notes for own reservations"
ON public.reservation_admin_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM reservations r
    WHERE r.id = reservation_admin_notes.reservation_id
    AND r.customer_id = auth.uid()
  )
);