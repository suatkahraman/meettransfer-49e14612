-- ============================================================
-- MANUEL MİGRATİON - Supabase Dashboard > SQL Editor'da çalıştırın
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================
-- Bu script: Türkiye region_prices siler (Dubai ve Cyprus korunur)
-- Fiyatlandırma artık distance_pricing_rules (KM bazlı) üzerinden yapılıyor
-- ============================================================

-- Önce kaç kayıt silineceğini kontrol et
SELECT COUNT(*) AS silinecek_turkiye_kayit
FROM public.region_prices
WHERE (city IS NULL) OR (LOWER(TRIM(city)) NOT IN ('dubai', 'cyprus'));

-- Türkiye bölge fiyatlarını sil
DELETE FROM public.region_prices
WHERE (city IS NULL) OR (LOWER(TRIM(city)) NOT IN ('dubai', 'cyprus'));

-- Doğrulama: Kalan kayıtlar (sadece Dubai, Cyprus olmalı)
SELECT city, COUNT(*) FROM public.region_prices GROUP BY city;
