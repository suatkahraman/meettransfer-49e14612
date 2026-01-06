-- Add luggage_count and baby_seat_count fields to quick_booking_requests
ALTER TABLE public.quick_booking_requests
ADD COLUMN IF NOT EXISTS luggage_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS baby_seat_count integer DEFAULT 0;