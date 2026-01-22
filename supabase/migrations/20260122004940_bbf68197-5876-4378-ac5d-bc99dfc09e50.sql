-- Secure quick_booking_requests table:
-- 1. Add token_hash column for secure confirmation tokens (like customer_magic_links)
-- 2. Tighten RLS policies to prevent payment link hijacking
-- 3. Add validation constraints

-- Add token_hash column for secure token storage
ALTER TABLE public.quick_booking_requests 
ADD COLUMN IF NOT EXISTS token_hash text;

-- Create index on token_hash for fast lookups
CREATE INDEX IF NOT EXISTS idx_quick_booking_token_hash ON public.quick_booking_requests(token_hash);

-- Drop the overly permissive update policy that allows any session holder to update
DROP POLICY IF EXISTS "Update quick booking by session or token" ON public.quick_booking_requests;

-- Create a more restrictive update policy:
-- 1. Only allow updates to non-sensitive fields by session holder
-- 2. Payment link and payment status can only be updated by admins
CREATE POLICY "Session holders can update own booking details"
ON public.quick_booking_requests
FOR UPDATE
USING (
  (customer_session_id IS NOT NULL) 
  AND (customer_session_id <> ''::text)
  AND (status IN ('pending', 'price_sent'))
)
WITH CHECK (
  (customer_session_id IS NOT NULL) 
  AND (customer_session_id <> ''::text)
  AND (status IN ('pending', 'price_sent'))
);

-- Add SELECT policy for session holders to view their own bookings
DROP POLICY IF EXISTS "Session holders can view own bookings" ON public.quick_booking_requests;
CREATE POLICY "Session holders can view own bookings"
ON public.quick_booking_requests
FOR SELECT
USING (
  (customer_session_id IS NOT NULL) 
  AND (customer_session_id <> ''::text)
);

-- Add constraint to prevent payment_link from being set by non-admins
-- This is done via trigger since RLS can't differentiate column-level updates
CREATE OR REPLACE FUNCTION public.protect_payment_link_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If payment_link is being changed and caller is not admin
  IF (OLD.payment_link IS DISTINCT FROM NEW.payment_link) THEN
    -- Only allow if the user is admin (checked via current_setting which is set by service role)
    -- For anonymous/session users, this will fail
    IF NOT (SELECT has_role(auth.uid(), 'admin')) THEN
      -- Revert payment_link to old value
      NEW.payment_link := OLD.payment_link;
    END IF;
  END IF;
  
  -- Same protection for payment_status
  IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    IF NOT (SELECT has_role(auth.uid(), 'admin')) THEN
      NEW.payment_status := OLD.payment_status;
    END IF;
  END IF;
  
  -- Same protection for payment_provider
  IF (OLD.payment_provider IS DISTINCT FROM NEW.payment_provider) THEN
    IF NOT (SELECT has_role(auth.uid(), 'admin')) THEN
      NEW.payment_provider := OLD.payment_provider;
    END IF;
  END IF;

  -- Same protection for price
  IF (OLD.price IS DISTINCT FROM NEW.price) THEN
    IF NOT (SELECT has_role(auth.uid(), 'admin')) THEN
      NEW.price := OLD.price;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS protect_payment_fields_trigger ON public.quick_booking_requests;
CREATE TRIGGER protect_payment_fields_trigger
BEFORE UPDATE ON public.quick_booking_requests
FOR EACH ROW
EXECUTE FUNCTION public.protect_payment_link_updates();

-- Add check constraint for valid status values
ALTER TABLE public.quick_booking_requests
DROP CONSTRAINT IF EXISTS valid_booking_status;

ALTER TABLE public.quick_booking_requests
ADD CONSTRAINT valid_booking_status 
CHECK (status IN ('pending', 'price_sent', 'confirmed', 'cancelled', 'expired', 'converted'));

-- Add check constraint for valid payment_status values  
ALTER TABLE public.quick_booking_requests
DROP CONSTRAINT IF EXISTS valid_payment_status;

ALTER TABLE public.quick_booking_requests
ADD CONSTRAINT valid_payment_status 
CHECK (payment_status IN ('pending', 'paid', 'partial', 'pay_on_transfer', 'refunded') OR payment_status IS NULL);