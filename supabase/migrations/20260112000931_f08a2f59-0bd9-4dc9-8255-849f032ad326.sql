-- Drop the existing check constraint and add a new one that includes 6h
ALTER TABLE public.hourly_rental_prices DROP CONSTRAINT IF EXISTS hourly_rental_prices_duration_type_check;

ALTER TABLE public.hourly_rental_prices ADD CONSTRAINT hourly_rental_prices_duration_type_check 
CHECK (duration_type IN ('4h', '6h', '8h', '10h', '12h', 'custom'));