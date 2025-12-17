-- Add place details fields for pickup location
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS pickup_place_name text,
ADD COLUMN IF NOT EXISTS pickup_lat numeric,
ADD COLUMN IF NOT EXISTS pickup_lng numeric;

-- Add place details fields for dropoff location
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS dropoff_place_name text,
ADD COLUMN IF NOT EXISTS dropoff_lat numeric,
ADD COLUMN IF NOT EXISTS dropoff_lng numeric;

-- Add comments for clarity
COMMENT ON COLUMN public.reservations.pickup_place_name IS 'Name of the pickup location (hotel, establishment name)';
COMMENT ON COLUMN public.reservations.pickup_lat IS 'Latitude of pickup location';
COMMENT ON COLUMN public.reservations.pickup_lng IS 'Longitude of pickup location';
COMMENT ON COLUMN public.reservations.dropoff_place_name IS 'Name of the dropoff location (hotel, establishment name)';
COMMENT ON COLUMN public.reservations.dropoff_lat IS 'Latitude of dropoff location';
COMMENT ON COLUMN public.reservations.dropoff_lng IS 'Longitude of dropoff location';