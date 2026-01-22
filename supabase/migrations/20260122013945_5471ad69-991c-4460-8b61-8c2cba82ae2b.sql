-- Remove the duplicate/redundant policies
DROP POLICY IF EXISTS "Agencies can create quick booking requests" ON public.quick_booking_requests;

-- Update the INSERT policy to be more restrictive - only service role and authenticated agencies/admins
DROP POLICY IF EXISTS "Service role or agencies can create bookings" ON public.quick_booking_requests;

CREATE POLICY "Authenticated users can create bookings"
ON public.quick_booking_requests
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admins can insert
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Agencies can insert with their user_id
  (agency_user_id = auth.uid())
);

-- Note: Anonymous inserts are now ONLY possible via edge functions using service_role
-- The service_role bypasses RLS entirely, so no policy is needed for anonymous booking creation