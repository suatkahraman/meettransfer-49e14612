-- Add agency_id to quick_booking_requests to link quick bookings to agencies
ALTER TABLE public.quick_booking_requests
ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);

-- Add agency_user_id to quick_booking_requests for RLS
ALTER TABLE public.quick_booking_requests
ADD COLUMN IF NOT EXISTS agency_user_id uuid;

-- Add index for faster agency lookups
CREATE INDEX IF NOT EXISTS idx_quick_booking_requests_agency_id ON public.quick_booking_requests(agency_id);

-- Update RLS policy to allow agencies to view/manage their own quick bookings
CREATE POLICY "Agencies can view own quick booking requests"
ON public.quick_booking_requests
FOR SELECT
USING (agency_user_id = auth.uid());

CREATE POLICY "Agencies can create quick booking requests"
ON public.quick_booking_requests
FOR INSERT
WITH CHECK (agency_user_id = auth.uid());

CREATE POLICY "Agencies can update own quick booking requests"
ON public.quick_booking_requests
FOR UPDATE
USING (agency_user_id = auth.uid());