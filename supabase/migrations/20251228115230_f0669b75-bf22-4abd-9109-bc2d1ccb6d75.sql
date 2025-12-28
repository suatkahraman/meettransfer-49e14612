-- Add payment_type column to driver_payments
ALTER TABLE public.driver_payments 
ADD COLUMN payment_type text NOT NULL DEFAULT 'to_driver';

-- Add comment for clarity
COMMENT ON COLUMN public.driver_payments.payment_type IS 'to_driver = şoföre ödeme yapıldı, from_driver = şoförden ödeme alındı';