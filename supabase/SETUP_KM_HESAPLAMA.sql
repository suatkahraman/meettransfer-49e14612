-- ============================================================
-- KM HESAPLAMA - TAM KURULUM
-- Supabase Dashboard > SQL Editor'da çalıştırın
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- 1. Tablo oluştur (yoksa)
CREATE TABLE IF NOT EXISTS public.distance_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type text,
  city text,
  place_id text,
  location_display text,
  price_amount numeric,
  price_currency text DEFAULT 'TRY',
  base_price numeric DEFAULT 0,
  price_per_km numeric DEFAULT 0,
  min_km numeric DEFAULT 0,
  max_km numeric,
  is_airport_transfer boolean DEFAULT false,
  airport_extra_fee numeric DEFAULT 0,
  valid_from date,
  valid_to date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Eksik sütunları ekle (tablo varsa)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='distance_pricing_rules' AND column_name='place_id') THEN
    ALTER TABLE public.distance_pricing_rules ADD COLUMN place_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='distance_pricing_rules' AND column_name='location_display') THEN
    ALTER TABLE public.distance_pricing_rules ADD COLUMN location_display text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='distance_pricing_rules' AND column_name='valid_from') THEN
    ALTER TABLE public.distance_pricing_rules ADD COLUMN valid_from date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='distance_pricing_rules' AND column_name='valid_to') THEN
    ALTER TABLE public.distance_pricing_rules ADD COLUMN valid_to date;
  END IF;
END $$;

-- 3. RLS aktif et
ALTER TABLE public.distance_pricing_rules ENABLE ROW LEVEL SECURITY;

-- 4. Mevcut politikaları kaldır (tekrar oluşturmak için)
DROP POLICY IF EXISTS "Service role full access to distance_pricing_rules" ON public.distance_pricing_rules;
DROP POLICY IF EXISTS "Public read distance_pricing_rules" ON public.distance_pricing_rules;

-- 5. Politikaları oluştur (admin panel CRUD + public read)
CREATE POLICY "Admin full access to distance_pricing_rules"
  ON public.distance_pricing_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read distance_pricing_rules"
  ON public.distance_pricing_rules FOR SELECT USING (true);

-- 6. Varsayılan kurallar (tablo boşsa - 0-50 km Türkiye)
DO $$
DECLARE cnt integer;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.distance_pricing_rules;
  IF cnt = 0 THEN
    INSERT INTO public.distance_pricing_rules (vehicle_type, price_amount, base_price, price_per_km, min_km, max_km)
    VALUES 
      ('Standard Sedan', 35, 20, 0.8, 0, 50),
      ('Mercedes Vito or Similar', 50, 25, 1.0, 0, 50),
      ('Mercedes Maybach', 75, 35, 1.2, 0, 50),
      ('Mercedes Sprinter or Similar', 100, 50, 1.5, 0, 50);
    RAISE NOTICE 'Varsayılan KM kuralları (0-50 km) eklendi.';
  END IF;
END $$;

-- 7. Doğrulama
SELECT COUNT(*) as toplam_kural FROM public.distance_pricing_rules;
