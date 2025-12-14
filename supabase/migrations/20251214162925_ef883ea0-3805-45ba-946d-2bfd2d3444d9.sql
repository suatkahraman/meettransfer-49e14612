-- Add payment_link and payment_status fields to reservations table
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS payment_link TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add comment for clarity
COMMENT ON COLUMN public.reservations.payment_link IS 'External payment URL for online payment method';
COMMENT ON COLUMN public.reservations.payment_status IS 'Payment status: pending, paid';