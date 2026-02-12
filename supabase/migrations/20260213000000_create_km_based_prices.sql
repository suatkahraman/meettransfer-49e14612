DROP TABLE IF EXISTS public.km_based_prices;

CREATE TABLE IF NOT EXISTS public.distance_pricing_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  country text NOT NULL DEFAULT 'TR',
  city text,
  month integer CHECK (month IS NULL OR (month >= 1 AND month <= 12)),
  km_from integer NOT NULL DEFAULT 0,
  km_to integer NOT NULL DEFAULT 50,
  vehicle_type text NOT NULL DEFAULT 'mercedes-vito',
  pricing_mode text NOT NULL DEFAULT 'fixed' CHECK (pricing_mode IN ('fixed', 'per_km')),
  price_amount numeric NOT NULL CHECK (price_amount >= 0),
  price_currency text NOT NULL DEFAULT 'EUR',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT km_range_valid CHECK (km_to > km_from)
);

ALTER TABLE public.distance_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "distance_pricing_rules_select" ON public.distance_pricing_rules
  FOR SELECT USING (true);

CREATE POLICY "distance_pricing_rules_insert" ON public.distance_pricing_rules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "distance_pricing_rules_update" ON public.distance_pricing_rules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "distance_pricing_rules_delete" ON public.distance_pricing_rules
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE INDEX idx_dpr_country_city ON public.distance_pricing_rules (country, city);
CREATE INDEX idx_dpr_lookup ON public.distance_pricing_rules (country, vehicle_type, km_from, km_to, is_active);

INSERT INTO public.distance_pricing_rules (country, city, month, km_from, km_to, vehicle_type, pricing_mode, price_amount, price_currency) VALUES
  ('TR', NULL, NULL, 1, 50, 'sedan',          'fixed', 46, 'EUR'),
  ('TR', NULL, NULL, 1, 50, 'mercedes-vito',  'fixed', 50, 'EUR'),
  ('TR', NULL, NULL, 1, 50, 'vip-mercedes',   'fixed', 55, 'EUR'),
  ('TR', NULL, NULL, 1, 50, 'maybach-minibus', 'fixed', 65, 'EUR'),
  ('TR', NULL, NULL, 1, 50, 'minibus',        'fixed', 90, 'EUR');

INSERT INTO public.distance_pricing_rules (country, city, month, km_from, km_to, vehicle_type, pricing_mode, price_amount, price_currency) VALUES
  ('TR', NULL, NULL, 51, 70, 'sedan',          'per_km', 1.30, 'EUR'),
  ('TR', NULL, NULL, 51, 70, 'mercedes-vito',  'per_km', 1.30, 'EUR'),
  ('TR', NULL, NULL, 51, 70, 'vip-mercedes',   'per_km', 1.30, 'EUR'),
  ('TR', NULL, NULL, 51, 70, 'maybach-minibus', 'per_km', 1.30, 'EUR'),
  ('TR', NULL, NULL, 51, 70, 'minibus',        'per_km', 1.30, 'EUR');

INSERT INTO public.distance_pricing_rules (country, city, month, km_from, km_to, vehicle_type, pricing_mode, price_amount, price_currency) VALUES
  ('TR', NULL, NULL, 71, 85, 'sedan',          'per_km', 1.50, 'EUR'),
  ('TR', NULL, NULL, 71, 85, 'mercedes-vito',  'per_km', 1.50, 'EUR'),
  ('TR', NULL, NULL, 71, 85, 'vip-mercedes',   'per_km', 1.50, 'EUR'),
  ('TR', NULL, NULL, 71, 85, 'maybach-minibus', 'per_km', 1.50, 'EUR'),
  ('TR', NULL, NULL, 71, 85, 'minibus',        'per_km', 1.50, 'EUR');
