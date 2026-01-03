-- Drop the old agency update policy
DROP POLICY IF EXISTS "Agencies can update own reservations for price approval" ON public.reservations;

-- Create new policy that allows agencies to update for both price approval AND cancellation
CREATE POLICY "Agencies can update own reservations" 
ON public.reservations 
FOR UPDATE 
USING (
  agency_user_id = auth.uid() 
  AND status IN (
    'awaiting-price',
    'pending_admin_review',
    'waiting_for_agency_approval',
    'customer_approved',
    'confirmed',
    'sent_to_driver'
  )
)
WITH CHECK (
  agency_user_id = auth.uid()
);

-- Add cancelled status to status colors/labels
-- Also add 'cancelled_by_customer' and 'pending_agency_update' to allow tracking