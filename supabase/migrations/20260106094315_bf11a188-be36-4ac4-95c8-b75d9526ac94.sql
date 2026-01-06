-- Add luggage_count and baby_seat_count columns to reservations table
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS luggage_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS baby_seat_count integer DEFAULT 0;