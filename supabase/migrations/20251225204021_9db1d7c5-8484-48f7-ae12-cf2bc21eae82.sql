-- Add payment_method and payment_link columns to quick_booking_requests
ALTER TABLE public.quick_booking_requests 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS payment_link text DEFAULT NULL;