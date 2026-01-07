-- Add all_vehicle_prices JSON column to store manual prices for all vehicle types
ALTER TABLE public.quick_booking_requests 
ADD COLUMN IF NOT EXISTS all_vehicle_prices JSONB DEFAULT NULL;

-- Comment to explain the column
COMMENT ON COLUMN public.quick_booking_requests.all_vehicle_prices IS 'JSON object storing manual prices for all vehicle types when auto-pricing fails. Format: {"mercedes-vito": 100, "vip-mercedes": 120, "maybach-minibus": 150, "minibus": 180}';