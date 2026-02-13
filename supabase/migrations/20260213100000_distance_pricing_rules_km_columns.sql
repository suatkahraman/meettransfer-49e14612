-- distance_pricing_rules: KM bazlı fiyatlandırma için base_price ve price_per_km
-- Uzun mesafe / şehirler arası transferlerde kullanılır (örn: IST/SAW -> Bursa)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules' AND column_name = 'base_price') THEN
      ALTER TABLE public.distance_pricing_rules ADD COLUMN base_price numeric DEFAULT 0;
      RAISE NOTICE 'distance_pricing_rules.base_price eklendi.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules' AND column_name = 'price_per_km') THEN
      ALTER TABLE public.distance_pricing_rules ADD COLUMN price_per_km numeric DEFAULT 0;
      RAISE NOTICE 'distance_pricing_rules.price_per_km eklendi.';
    END IF;
  END IF;
END $$;

COMMENT ON COLUMN public.distance_pricing_rules.base_price IS 'KM bazlı hesaplamada kullanılan sabit taban fiyat: fiyat = base_price + (mesafe_km * price_per_km)';
COMMENT ON COLUMN public.distance_pricing_rules.price_per_km IS 'KM başına birim fiyat (mesafe ile çarpılır)';
