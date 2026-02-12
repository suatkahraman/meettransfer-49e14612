-- Distance/KM-based pricing rules (Turkey-first rollout)
CREATE TABLE IF NOT EXISTS public.distance_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL DEFAULT 'TR',
  city TEXT,
  month SMALLINT,
  km_from INTEGER NOT NULL,
  km_to INTEGER NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT '__all__',
  pricing_mode TEXT NOT NULL DEFAULT 'incremental_per_km',
  price_amount NUMERIC NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'EUR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT distance_pricing_rules_month_check CHECK (month IS NULL OR (month >= 1 AND month <= 12)),
  CONSTRAINT distance_pricing_rules_km_range_check CHECK (km_from >= 1 AND km_to >= km_from),
  CONSTRAINT distance_pricing_rules_mode_check CHECK (pricing_mode IN ('flat_base', 'incremental_per_km')),
  CONSTRAINT distance_pricing_rules_amount_check CHECK (price_amount > 0)
);

COMMENT ON TABLE public.distance_pricing_rules IS 'Configurable KM pricing rules used by auto-pricing edge functions';
COMMENT ON COLUMN public.distance_pricing_rules.city IS 'NULL = all cities in selected country';
COMMENT ON COLUMN public.distance_pricing_rules.month IS 'NULL = all months, otherwise 1-12';
COMMENT ON COLUMN public.distance_pricing_rules.vehicle_type IS '__all__ for shared per-km rules, otherwise concrete vehicle type';
COMMENT ON COLUMN public.distance_pricing_rules.pricing_mode IS 'flat_base for fixed base, incremental_per_km for range-based per-km add-on';

CREATE INDEX IF NOT EXISTS idx_distance_pricing_rules_lookup
  ON public.distance_pricing_rules (country, is_active, city, month, pricing_mode, vehicle_type, km_from, km_to);

CREATE UNIQUE INDEX IF NOT EXISTS idx_distance_pricing_rules_unique_active
  ON public.distance_pricing_rules (
    country,
    COALESCE(city, ''),
    COALESCE(month, 0),
    pricing_mode,
    vehicle_type,
    km_from,
    km_to
  )
  WHERE is_active = true;

ALTER TABLE public.distance_pricing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage distance pricing rules" ON public.distance_pricing_rules;
CREATE POLICY "Admins can manage distance pricing rules"
ON public.distance_pricing_rules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can read active distance pricing rules" ON public.distance_pricing_rules;
CREATE POLICY "Public can read active distance pricing rules"
ON public.distance_pricing_rules
FOR SELECT
USING (is_active = true);

DROP TRIGGER IF EXISTS update_distance_pricing_rules_updated_at ON public.distance_pricing_rules;
CREATE TRIGGER update_distance_pricing_rules_updated_at
BEFORE UPDATE ON public.distance_pricing_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default Türkiye KM rules
INSERT INTO public.distance_pricing_rules (
  country, city, month, km_from, km_to, vehicle_type, pricing_mode, price_amount, price_currency, is_active
)
VALUES
  ('TR', NULL, NULL, 1, 50, 'sedan', 'flat_base', 46, 'EUR', true),
  ('TR', NULL, NULL, 1, 50, 'mercedes-vito', 'flat_base', 50, 'EUR', true),
  ('TR', NULL, NULL, 1, 50, 'vip-mercedes', 'flat_base', 55, 'EUR', true),
  ('TR', NULL, NULL, 1, 50, 'maybach-minibus', 'flat_base', 65, 'EUR', true),
  ('TR', NULL, NULL, 1, 50, 'minibus', 'flat_base', 90, 'EUR', true),
  ('TR', NULL, NULL, 51, 70, '__all__', 'incremental_per_km', 1.30, 'EUR', true),
  ('TR', NULL, NULL, 71, 85, '__all__', 'incremental_per_km', 1.50, 'EUR', true)
ON CONFLICT DO NOTHING;
