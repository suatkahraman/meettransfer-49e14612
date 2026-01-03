-- Drop the existing policy
DROP POLICY IF EXISTS "Agencies can update own reservations" ON public.reservations;

-- Create updated policy that includes both cancelled and cancelled_by_customer status
CREATE POLICY "Agencies can update own reservations" ON public.reservations
FOR UPDATE USING (
  (agency_user_id = auth.uid()) AND 
  (status = ANY (ARRAY['awaiting-price'::text, 'pending_admin_review'::text, 'waiting_for_agency_approval'::text, 'customer_approved'::text, 'confirmed'::text, 'sent_to_driver'::text, 'active'::text]))
)
WITH CHECK (agency_user_id = auth.uid());