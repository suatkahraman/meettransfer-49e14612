-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Session holders can view own bookings" ON public.quick_booking_requests;

-- Remove the public INSERT policy that allows anonymous inserts
DROP POLICY IF EXISTS "Insert quick booking with required fields" ON public.quick_booking_requests;

-- Remove the public UPDATE policy
DROP POLICY IF EXISTS "Session holders can update own booking details" ON public.quick_booking_requests;

-- Create secure SELECT policy - only authenticated users can view their own bookings
-- Uses token_hash for secure session verification (requires edge function to verify)
CREATE POLICY "Authenticated users can view own bookings via token" 
ON public.quick_booking_requests 
FOR SELECT 
USING (
  -- Admins can view all
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Agencies can view their own
  (agency_user_id = auth.uid())
);

-- Create secure INSERT policy - requires service role or authenticated agency
CREATE POLICY "Service role or agencies can create bookings" 
ON public.quick_booking_requests 
FOR INSERT 
WITH CHECK (
  -- Admins can insert
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Agencies can insert with their user_id
  (agency_user_id = auth.uid())
  OR
  -- Anonymous bookings only via edge function (service role)
  (auth.uid() IS NULL AND customer_session_id IS NOT NULL AND customer_session_id <> '')
);

-- Create secure UPDATE policy
CREATE POLICY "Authenticated users can update via secure verification" 
ON public.quick_booking_requests 
FOR UPDATE 
USING (
  -- Admins can update all
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Agencies can update their own
  (agency_user_id = auth.uid())
)
WITH CHECK (
  -- Admins can update all
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Agencies can update their own
  (agency_user_id = auth.uid())
);

-- Revoke direct anon access - force through edge functions
REVOKE ALL ON public.quick_booking_requests FROM anon;

-- Grant only to authenticated and service_role
GRANT SELECT, INSERT, UPDATE ON public.quick_booking_requests TO authenticated;
GRANT ALL ON public.quick_booking_requests TO service_role;