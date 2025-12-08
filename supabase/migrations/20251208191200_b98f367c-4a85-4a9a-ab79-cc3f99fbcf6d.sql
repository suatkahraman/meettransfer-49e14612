-- Add price_currency column to reservations table
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS price_currency text DEFAULT 'TRY';

-- Update existing status values to new workflow
-- Map old statuses to new ones:
-- 'awaiting-price' -> 'pending_price'
-- 'awaiting-customer' -> 'waiting_for_customer_approval'
-- 'confirmed' -> 'customer_approved'
-- 'cancelled' -> 'customer_rejected'
-- 'assigned' -> 'sent_to_driver'

UPDATE public.reservations SET status = 'pending_price' WHERE status = 'awaiting-price';
UPDATE public.reservations SET status = 'waiting_for_customer_approval' WHERE status = 'awaiting-customer';
UPDATE public.reservations SET status = 'customer_approved' WHERE status = 'confirmed';
UPDATE public.reservations SET status = 'customer_rejected' WHERE status = 'cancelled';
UPDATE public.reservations SET status = 'sent_to_driver' WHERE status = 'assigned';

-- Add comment for documentation
COMMENT ON COLUMN public.reservations.price_currency IS 'Currency code: TRY, EUR, USD, GBP';