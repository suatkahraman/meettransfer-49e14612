-- Drop and recreate the agency update policy to include active and in_progress statuses
DROP POLICY IF EXISTS "Agencies can update own reservations" ON public.reservations;

CREATE POLICY "Agencies can update own reservations"
ON public.reservations
FOR UPDATE
USING (
  (agency_user_id = auth.uid()) 
  AND (status = ANY (ARRAY[
    'awaiting-price'::text, 
    'pending_admin_review'::text, 
    'waiting_for_agency_approval'::text, 
    'customer_approved'::text, 
    'confirmed'::text, 
    'sent_to_driver'::text, 
    'active'::text,
    'in_progress'::text,
    'cancelled_by_agency'::text
  ]))
)
WITH CHECK (agency_user_id = auth.uid());