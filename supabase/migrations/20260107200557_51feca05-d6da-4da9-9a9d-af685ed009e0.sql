-- Add language column to quick_booking_requests table
ALTER TABLE public.quick_booking_requests 
ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en';

-- Add comment for clarity
COMMENT ON COLUMN public.quick_booking_requests.language IS 'Customer preferred language for emails (en, tr, de, ru, ar)';