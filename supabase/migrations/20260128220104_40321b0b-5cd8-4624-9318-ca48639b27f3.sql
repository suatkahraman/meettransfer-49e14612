-- Add RLS policy to allow public read access to active region prices
-- This is necessary for the public website to display transfer prices

CREATE POLICY "Public can read active region prices"
ON public.region_prices
FOR SELECT
USING (is_active = true);