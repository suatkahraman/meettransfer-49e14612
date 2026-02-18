-- v2.8.8: distance_pricing_rules - price_amount sütunu (0-50 fixed, 51-85 per-km, 86+ için)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules' AND column_name = 'price_amount') THEN
      ALTER TABLE public.distance_pricing_rules ADD COLUMN price_amount numeric;
      RAISE NOTICE 'distance_pricing_rules.price_amount eklendi.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules' AND column_name = 'city') THEN
      ALTER TABLE public.distance_pricing_rules ADD COLUMN city text;
      RAISE NOTICE 'distance_pricing_rules.city eklendi.';
    END IF;
  END IF;
END $$;
