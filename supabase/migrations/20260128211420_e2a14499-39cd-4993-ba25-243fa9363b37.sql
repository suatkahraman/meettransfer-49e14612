
-- Drop the constraint first (not just the index)
ALTER TABLE public.hourly_rental_prices 
  DROP CONSTRAINT IF EXISTS hourly_rental_prices_city_vehicle_type_duration_type_key;

-- Create new unique index that includes date range
CREATE UNIQUE INDEX hourly_rental_prices_city_vehicle_duration_date_key ON public.hourly_rental_prices 
  USING btree (
    city, 
    vehicle_type, 
    duration_type,
    COALESCE(valid_from, '1900-01-01'::date), 
    COALESCE(valid_to, '1900-01-01'::date)
  );
