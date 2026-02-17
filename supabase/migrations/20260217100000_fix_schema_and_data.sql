-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.distance_pricing_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Ensure columns exist
ALTER TABLE public.distance_pricing_rules 
ADD COLUMN IF NOT EXISTS vehicle_type text,
ADD COLUMN IF NOT EXISTS pricing_mode text, -- 'fixed' or 'distance'
ADD COLUMN IF NOT EXISTS base_price numeric,
ADD COLUMN IF NOT EXISTS extra_km_price numeric,
ADD COLUMN IF NOT EXISTS min_km numeric,
ADD COLUMN IF NOT EXISTS max_km numeric,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS airport_code text,
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_airport_transfer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS airport_extra_fee numeric DEFAULT 0;

-- Enable RLS if not enabled (optional but good practice)
ALTER TABLE public.distance_pricing_rules ENABLE ROW LEVEL SECURITY;

-- Policy for reading (public read)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'distance_pricing_rules' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" 
        ON public.distance_pricing_rules 
        FOR SELECT 
        USING (true);
    END IF;
END
$$;

-- Insert/Update Data for Turkey
-- We use ON CONFLICT DO NOTHING doesn't work well without unique constraint on content.
-- So we delete existing 'Turkey' rules to avoid duplication and re-insert.
DELETE FROM public.distance_pricing_rules WHERE region = 'Turkey';

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
