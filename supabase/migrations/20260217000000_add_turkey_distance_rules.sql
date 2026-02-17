-- Add new columns to distance_pricing_rules
ALTER TABLE public.distance_pricing_rules 
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Insert/Update rules for Turkey
-- First, let's clear existing general Turkey rules to avoid duplicates if we are re-running or replacing
-- We assume "general Turkey rules" are those with region='Turkey' (which we just added) or maybe just by vehicle type if we want a fresh start for these ranges.
-- For safety, I will just INSERT. The user said "VALUES ...", implying new data.

INSERT INTO public.distance_pricing_rules 
(region, min_km, max_km, base_price, extra_km_price, vehicle_type, pricing_mode, currency, is_active)
VALUES 
-- Standard Sedan 
('Turkey', 0, 25, 20, 0, 'Standard Sedan', 'fixed', 'EUR', true), 
('Turkey', 26, 70, 0, 1.10, 'Standard Sedan', 'distance', 'EUR', true), 
('Turkey', 71, 85, 0, 1.20, 'Standard Sedan', 'distance', 'EUR', true), 

-- Mercedes Vito or Similar 
('Turkey', 0, 25, 22, 0, 'Mercedes Vito or Similar', 'fixed', 'EUR', true), 
('Turkey', 26, 70, 0, 1.20, 'Mercedes Vito or Similar', 'distance', 'EUR', true), 
('Turkey', 71, 85, 0, 1.30, 'Mercedes Vito or Similar', 'distance', 'EUR', true), 

-- VIP Mercedes Vito 
('Turkey', 0, 25, 25, 0, 'VIP Mercedes Vito', 'fixed', 'EUR', true), 
('Turkey', 26, 70, 0, 1.30, 'VIP Mercedes Vito', 'distance', 'EUR', true), 
('Turkey', 71, 85, 0, 1.40, 'VIP Mercedes Vito', 'distance', 'EUR', true), 

-- Mercedes Maybach Minivan 
('Turkey', 0, 25, 30, 0, 'Mercedes Maybach Minivan', 'fixed', 'EUR', true), 
('Turkey', 26, 70, 0, 1.40, 'Mercedes Maybach Minivan', 'distance', 'EUR', true), 
('Turkey', 71, 85, 0, 1.50, 'Mercedes Maybach Minivan', 'distance', 'EUR', true), 

-- Mercedes Sprinter or Similar 
('Turkey', 0, 25, 60, 0, 'Mercedes Sprinter or Similar', 'fixed', 'EUR', true), 
('Turkey', 26, 70, 0, 1.50, 'Mercedes Sprinter or Similar', 'distance', 'EUR', true), 
('Turkey', 71, 85, 0, 1.70, 'Mercedes Sprinter or Similar', 'distance', 'EUR', true);
