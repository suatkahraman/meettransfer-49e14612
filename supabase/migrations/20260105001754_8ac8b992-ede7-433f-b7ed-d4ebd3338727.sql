-- Add return trip fields to quick_booking_requests
ALTER TABLE public.quick_booking_requests
ADD COLUMN IF NOT EXISTS has_return_trip boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS return_date date,
ADD COLUMN IF NOT EXISTS return_time time without time zone,
ADD COLUMN IF NOT EXISTS return_price numeric,
ADD COLUMN IF NOT EXISTS promo_code text;