-- Allow customers to edit/cancel their own reservations (used by CustomerEditReservation)
-- Old row must belong to customer and be in an editable state
-- New row must remain customer-owned and move into a controlled review/cancel state

CREATE POLICY "Customers can update own reservations (edit/cancel)"
ON public.reservations
AS PERMISSIVE
FOR UPDATE
USING (
  auth.uid() = customer_id
  AND status IN ('customer_approved', 'confirmed', 'sent_to_driver', 'pending_admin_review')
)
WITH CHECK (
  auth.uid() = customer_id
  AND status IN ('pending_admin_review', 'cancelled_by_customer')
);
