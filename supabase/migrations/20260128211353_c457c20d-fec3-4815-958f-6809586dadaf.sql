
-- Drop the existing unique index that doesn't include date range
DROP INDEX IF EXISTS idx_region_prices_unique;

-- Create a new unique index that includes valid_from and valid_to
-- Using COALESCE with a date constant instead of text casting
CREATE UNIQUE INDEX idx_region_prices_unique ON public.region_prices 
  USING btree (
    city, 
    COALESCE(airport, ''::text), 
    district, 
    vehicle_type, 
    COALESCE(valid_from, '1900-01-01'::date), 
    COALESCE(valid_to, '1900-01-01'::date)
  ) 
  WHERE (is_active = true);
