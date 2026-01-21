-- Add new payment status values by updating the column type
-- Current: pending, paid
-- New: pending, paid, partial, pay_on_transfer

-- First, update any existing NULL values to 'pending'
UPDATE public.reservations 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

-- Add a check constraint to validate payment status values
-- (Using a constraint instead of enum for flexibility)
ALTER TABLE public.reservations 
DROP CONSTRAINT IF EXISTS reservations_payment_status_check;

ALTER TABLE public.reservations 
ADD CONSTRAINT reservations_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'partial', 'pay_on_transfer'));

-- Add partial_amount column to track partial payments
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS partial_amount numeric DEFAULT NULL;

-- Add payment_provider column to track which provider was used
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT NULL;

-- Add payment_completed_at column to track when payment was completed
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS payment_completed_at timestamptz DEFAULT NULL;

-- Also update quick_booking_requests to support the same statuses
ALTER TABLE public.quick_booking_requests 
DROP CONSTRAINT IF EXISTS quick_booking_payment_status_check;

-- Add payment_status column if it doesn't exist
ALTER TABLE public.quick_booking_requests 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';

ALTER TABLE public.quick_booking_requests 
ADD CONSTRAINT quick_booking_payment_status_check 
CHECK (payment_status IS NULL OR payment_status IN ('pending', 'paid', 'partial', 'pay_on_transfer'));

-- Add partial_amount to quick_booking_requests
ALTER TABLE public.quick_booking_requests 
ADD COLUMN IF NOT EXISTS partial_amount numeric DEFAULT NULL;

-- Add payment_provider to quick_booking_requests  
ALTER TABLE public.quick_booking_requests 
ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT NULL;