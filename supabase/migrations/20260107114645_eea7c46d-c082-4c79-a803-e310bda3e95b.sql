-- Add from_district and to_district columns to intercity_prices
ALTER TABLE public.intercity_prices 
ADD COLUMN IF NOT EXISTS from_district TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS to_district TEXT DEFAULT NULL;

-- Drop the existing unique constraint properly
ALTER TABLE public.intercity_prices 
DROP CONSTRAINT IF EXISTS intercity_prices_from_city_to_city_vehicle_type_key;

-- Create new unique constraint including districts
CREATE UNIQUE INDEX intercity_prices_route_vehicle_unique 
ON public.intercity_prices (from_city, COALESCE(from_district, ''), to_city, COALESCE(to_district, ''), vehicle_type);