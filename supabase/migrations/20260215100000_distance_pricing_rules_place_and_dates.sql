-- distance_pricing_rules: Google Place, tarih aralığı ve havalimanı baz fiyat yönetimi
-- Admin panel KM hesaplama bölümü için gerekli sütunlar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules') THEN
    -- Google Place ID (şehir/havalimanı seçimi için)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules' AND column_name = 'place_id') THEN
      ALTER TABLE public.distance_pricing_rules ADD COLUMN place_id text;
      RAISE NOTICE 'distance_pricing_rules.place_id eklendi.';
    END IF;
    -- Google'dan gelen konum adı (görüntüleme için)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules' AND column_name = 'location_display') THEN
      ALTER TABLE public.distance_pricing_rules ADD COLUMN location_display text;
      RAISE NOTICE 'distance_pricing_rules.location_display eklendi.';
    END IF;
    -- Tarih aralığı: geçerlilik başlangıcı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules' AND column_name = 'valid_from') THEN
      ALTER TABLE public.distance_pricing_rules ADD COLUMN valid_from date;
      RAISE NOTICE 'distance_pricing_rules.valid_from eklendi.';
    END IF;
    -- Tarih aralığı: geçerlilik bitişi
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules' AND column_name = 'valid_to') THEN
      ALTER TABLE public.distance_pricing_rules ADD COLUMN valid_to date;
      RAISE NOTICE 'distance_pricing_rules.valid_to eklendi.';
    END IF;
  END IF;
END $$;

COMMENT ON COLUMN public.distance_pricing_rules.place_id IS 'Google Place ID - şehir veya havalimanı seçimi';
COMMENT ON COLUMN public.distance_pricing_rules.location_display IS 'Google Places''tan gelen konum adı (havalimanı/şehir)';
COMMENT ON COLUMN public.distance_pricing_rules.valid_from IS 'Kuralın geçerli olduğu tarih aralığı başlangıcı';
COMMENT ON COLUMN public.distance_pricing_rules.valid_to IS 'Kuralın geçerli olduğu tarih aralığı bitişi';
