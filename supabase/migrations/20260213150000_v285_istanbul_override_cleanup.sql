-- v2.8.5: İstanbul ile ilgili tüm override (ezici) fiyatları temizle
-- İstanbul artık SADECE distance_pricing_rules tablosundan fiyat alacak.

-- 1. region_prices: city'si Istanbul/İstanbul olan veya IST/SAW havalimanı içeren tüm satırları sil
DELETE FROM public.region_prices
WHERE 
  LOWER(TRIM(city)) IN ('istanbul', 'i̇stanbul')
  OR airport ILIKE '%IST%'
  OR airport ILIKE '%SAW%'
  OR airport ILIKE '%Istanbul Airport%'
  OR airport ILIKE '%Sabiha Gokcen%'
  OR airport ILIKE '%Sabiha Gökçen%';

-- 2. intercity_prices: from_city veya to_city Istanbul içeren tüm rotaları sil
DELETE FROM public.intercity_prices
WHERE 
  from_city ILIKE '%istanbul%'
  OR from_city ILIKE '%i̇stanbul%'
  OR to_city ILIKE '%istanbul%'
  OR to_city ILIKE '%i̇stanbul%';

-- 3. fixed_prices (tablo varsa): Istanbul geçen rotaları sil
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fixed_prices') THEN
    PERFORM 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fixed_prices' AND column_name = 'from_city';
    IF FOUND THEN
      DELETE FROM public.fixed_prices WHERE from_city::text ILIKE '%istanbul%' OR to_city::text ILIKE '%istanbul%' OR from_city::text ILIKE '%i̇stanbul%' OR to_city::text ILIKE '%i̇stanbul%';
      RAISE NOTICE 'fixed_prices Istanbul kayıtları silindi.';
    END IF;
  END IF;
END $$;

-- 4. seasonal_prices (tablo varsa): Istanbul için tanımlı kayıtları sil
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'seasonal_prices') THEN
    DELETE FROM public.seasonal_prices WHERE city ILIKE '%istanbul%' OR city ILIKE '%i̇stanbul%' OR region ILIKE '%istanbul%' OR region ILIKE '%i̇stanbul%';
    RAISE NOTICE 'seasonal_prices Istanbul kayıtları silindi.';
  END IF;
EXCEPTION WHEN undefined_column OR OTHERS THEN RAISE NOTICE 'seasonal_prices atlandı (sütun yok).';
END $$;

-- 5. airport_prices (tablo varsa): IST ve SAW ile ilgili sabit tanımları kaldır
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'airport_prices') THEN
    DELETE FROM public.airport_prices
    WHERE (airport_code ILIKE '%IST%' OR airport_code ILIKE '%SAW%' OR airport_name ILIKE '%Istanbul%' OR airport_name ILIKE '%Sabiha%');
    RAISE NOTICE 'airport_prices IST/SAW kayıtları silindi.';
  END IF;
EXCEPTION WHEN undefined_column OR OTHERS THEN NULL;
END $$;
