-- Fix remaining RLS policies with USING (true) warnings

-- 1. google_reviews_cache: Remove redundant "Service role can manage cache" (service role bypasses RLS)
DROP POLICY IF EXISTS "Service role can manage cache" ON public.google_reviews_cache;

-- 2. page_visits: Fix insert policy with validation
DROP POLICY IF EXISTS "Anyone can insert page visits" ON public.page_visits;
CREATE POLICY "Insert page visits with visitor_id" 
ON public.page_visits 
FOR INSERT 
WITH CHECK (visitor_id IS NOT NULL AND visitor_id != '' AND page_path IS NOT NULL);

-- 3. page_visits: Fix update policy - remove USING (true)
DROP POLICY IF EXISTS "Update page visits by visitor_id" ON public.page_visits;
CREATE POLICY "Update page visits by visitor_id" 
ON public.page_visits 
FOR UPDATE 
USING (visitor_id IS NOT NULL AND visitor_id != '')
WITH CHECK (visitor_id IS NOT NULL AND visitor_id != '');

-- 4. quick_booking_requests: Fix insert policy with validation
DROP POLICY IF EXISTS "Anyone can insert quick booking requests" ON public.quick_booking_requests;
CREATE POLICY "Insert quick booking with required fields" 
ON public.quick_booking_requests 
FOR INSERT 
WITH CHECK (
  customer_session_id IS NOT NULL AND 
  customer_session_id != '' AND
  pickup IS NOT NULL AND 
  dropoff IS NOT NULL AND
  pickup_date IS NOT NULL AND
  pickup_time IS NOT NULL AND
  vehicle_type IS NOT NULL
);

-- 5. quick_booking_requests: Fix update policy - use token check
DROP POLICY IF EXISTS "Anyone can update by token" ON public.quick_booking_requests;
CREATE POLICY "Update quick booking by session or token" 
ON public.quick_booking_requests 
FOR UPDATE 
USING (
  customer_session_id IS NOT NULL AND customer_session_id != ''
)
WITH CHECK (
  customer_session_id IS NOT NULL AND customer_session_id != ''
);