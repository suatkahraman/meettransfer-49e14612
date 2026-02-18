-- distance_pricing_rules: is_airport_transfer ve airport_extra_fee sütunları
-- Kullanıcı bu sütunları manuel eklemiş olabilir; bu migration eksikse tamamlar.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules' AND column_name = 'is_airport_transfer') THEN
      ALTER TABLE public.distance_pricing_rules ADD COLUMN is_airport_transfer boolean DEFAULT false;
      RAISE NOTICE 'distance_pricing_rules.is_airport_transfer eklendi.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'distance_pricing_rules' AND column_name = 'airport_extra_fee') THEN
      ALTER TABLE public.distance_pricing_rules ADD COLUMN airport_extra_fee numeric DEFAULT 0;
      RAISE NOTICE 'distance_pricing_rules.airport_extra_fee eklendi.';
    END IF;
  ELSE
    -- Tablo yoksa oluştur (minimal yapı)
    CREATE TABLE public.distance_pricing_rules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_type text,
      is_airport_transfer boolean DEFAULT false,
      airport_extra_fee numeric DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    ALTER TABLE public.distance_pricing_rules ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Service role full access to distance_pricing_rules"
      ON public.distance_pricing_rules FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public read distance_pricing_rules"
      ON public.distance_pricing_rules FOR SELECT USING (true);
    RAISE NOTICE 'distance_pricing_rules tablosu oluşturuldu.';
  END IF;
END $$;

COMMENT ON COLUMN public.distance_pricing_rules.is_airport_transfer IS 'Havalimanı transferlerinde bu kural geçerli mi';
COMMENT ON COLUMN public.distance_pricing_rules.airport_extra_fee IS 'Havalimanı transferi için hesaplanan tutara eklenecek ek ücret';
