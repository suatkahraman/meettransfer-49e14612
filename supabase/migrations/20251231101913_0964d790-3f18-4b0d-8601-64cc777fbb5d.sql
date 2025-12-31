-- Allow agencies to create reservations on behalf of customers
CREATE POLICY "Agencies can create reservations"
ON public.reservations
FOR INSERT
WITH CHECK (agency_user_id = auth.uid());