-- Add passenger_names array field to reservations table
ALTER TABLE public.reservations 
ADD COLUMN passenger_names text[] DEFAULT ARRAY[]::text[];