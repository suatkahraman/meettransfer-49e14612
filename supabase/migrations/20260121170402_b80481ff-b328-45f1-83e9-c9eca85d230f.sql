-- Fix RLS policies for security issues

-- 1. Fix visitor_interactions: Replace USING (true) with service role only access
DROP POLICY IF EXISTS "Service role can manage visitor_interactions" ON public.visitor_interactions;

-- Create policies that only allow service role access (via Edge Functions)
-- No client-side access needed for this analytics table
CREATE POLICY "Service role insert visitor_interactions" 
ON public.visitor_interactions 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Admins can view visitor_interactions" 
ON public.visitor_interactions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix promo_codes: Remove public read access, only admins can manage
DROP POLICY IF EXISTS "Anyone can read active promo codes" ON public.promo_codes;

-- Promo codes should only be validated through edge functions now
-- No direct client access needed

-- 3. Fix quick_booking_requests: Remove overly permissive "Anyone can view by token" policy
DROP POLICY IF EXISTS "Anyone can view by token" ON public.quick_booking_requests;

-- Quick booking requests should only be viewable by:
-- - Admins (already have ALL policy)
-- - Agencies (already have their own policy)
-- - The session owner via edge function (not direct RLS)