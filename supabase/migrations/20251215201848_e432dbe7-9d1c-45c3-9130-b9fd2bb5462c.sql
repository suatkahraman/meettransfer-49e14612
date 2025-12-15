-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Customers can update own reservations (edit/cancel)" ON public.reservations;

-- Create a new policy that allows customers to update their reservations
-- while keeping them in valid states including their current status during edits
CREATE POLICY "Customers can update own reservations (edit/cancel)"
ON public.reservations
AS PERMISSIVE
FOR UPDATE
USING (
  auth.uid() = customer_id
  AND status IN ('customer_approved', 'confirmed', 'sent_to_driver', 'pending_admin_review', 'waiting_for_customer_approval')
)
WITH CHECK (
  auth.uid() = customer_id
);
