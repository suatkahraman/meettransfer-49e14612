-- Add RLS policy for agencies to update reservations when approving/rejecting price
CREATE POLICY "Agencies can update own reservations for price approval"
ON public.reservations
FOR UPDATE
USING (agency_user_id = auth.uid() AND status = 'waiting_for_agency_approval')
WITH CHECK (agency_user_id = auth.uid());