-- Create km_based_prices table for regional KM-based pricing
-- Admin can define prices based on city, month, km range, and vehicle type
-- The 1-50 km range serves as the fixed base price

CREATE TABLE IF NOT EXISTS public.km_based_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  city text NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  km_from integer NOT NULL CHECK (km_from >= 0),
  km_to integer NOT NULL CHECK (km_to > 0),
  vehicle_type text NOT NULL DEFAULT 'mercedes-vito',
  price numeric NOT NULL CHECK (price >= 0),
  price_currency text NOT NULL DEFAULT 'EUR',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT km_range_valid CHECK (km_to > km_from),
  CONSTRAINT unique_km_price UNIQUE (city, month, km_from, km_to, vehicle_type)
);

-- Enable RLS
ALTER TABLE public.km_based_prices ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (needed for pricing lookups)
CREATE POLICY "km_based_prices_select" ON public.km_based_prices
  FOR SELECT USING (true);

-- Allow authenticated users with admin role to insert/update/delete
CREATE POLICY "km_based_prices_insert" ON public.km_based_prices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "km_based_prices_update" ON public.km_based_prices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "km_based_prices_delete" ON public.km_based_prices
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for fast lookups
CREATE INDEX idx_km_based_prices_city_month ON public.km_based_prices (city, month);
CREATE INDEX idx_km_based_prices_lookup ON public.km_based_prices (city, month, vehicle_type, km_from, km_to);
