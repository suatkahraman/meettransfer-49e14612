-- distance_pricing_rules: KM aralığı için min_km, max_km (opsiyonel)
-- Kural: min_km <= mesafe <= max_km ise bu kural uygulanır. NULL = sınırsız.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules' AND column_name = 'min_km') THEN
      ALTER TABLE public.distance_pricing_rules ADD COLUMN min_km numeric DEFAULT 0;
      RAISE NOTICE 'distance_pricing_rules.min_km eklendi.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules' AND column_name = 'max_km') THEN
      ALTER TABLE public.distance_pricing_rules ADD COLUMN max_km numeric;
      RAISE NOTICE 'distance_pricing_rules.max_km eklendi.';
    END IF;
  END IF;
END $$;

COMMENT ON COLUMN public.distance_pricing_rules.min_km IS 'Minimum mesafe (km) - bu kural için alt sınır. NULL/0 = sınırsız';
COMMENT ON COLUMN public.distance_pricing_rules.max_km IS 'Maksimum mesafe (km) - bu kural için üst sınır. NULL = sınırsız';
