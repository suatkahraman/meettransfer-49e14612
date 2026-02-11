-- Add Google Place ID columns for location-based price matching
-- Migration script (scripts/migrate-place-ids.ts) will populate these.
-- Fiyat verilerine (price, valid_from, valid_to) dokunulmaz.

-- region_prices: airport = pickup (origin), district = dropoff (destination)
ALTER TABLE public.region_prices
  ADD COLUMN IF NOT EXISTS pickup_place_id TEXT,
  ADD COLUMN IF NOT EXISTS dropoff_place_id TEXT,
  ADD COLUMN IF NOT EXISTS pickup_formatted_address TEXT,
  ADD COLUMN IF NOT EXISTS dropoff_formatted_address TEXT,
  ADD COLUMN IF NOT EXISTS place_id_status TEXT DEFAULT NULL;

COMMENT ON COLUMN public.region_prices.pickup_place_id IS 'Google Place ID for airport/pickup location';
COMMENT ON COLUMN public.region_prices.dropoff_place_id IS 'Google Place ID for district/dropoff location';
COMMENT ON COLUMN public.region_prices.place_id_status IS 'ok | pickup_not_found | dropoff_not_found | both_not_found - for manual review';

-- intercity_prices: from = pickup, to = dropoff
ALTER TABLE public.intercity_prices
  ADD COLUMN IF NOT EXISTS pickup_place_id TEXT,
  ADD COLUMN IF NOT EXISTS dropoff_place_id TEXT,
  ADD COLUMN IF NOT EXISTS pickup_formatted_address TEXT,
  ADD COLUMN IF NOT EXISTS dropoff_formatted_address TEXT,
  ADD COLUMN IF NOT EXISTS place_id_status TEXT DEFAULT NULL;

COMMENT ON COLUMN public.intercity_prices.pickup_place_id IS 'Google Place ID for from_city/from_district';
COMMENT ON COLUMN public.intercity_prices.dropoff_place_id IS 'Google Place ID for to_city/to_district';
COMMENT ON COLUMN public.intercity_prices.place_id_status IS 'ok | pickup_not_found | dropoff_not_found | both_not_found - for manual review';
