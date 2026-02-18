-- Bölge fiyatları: Sadece Türkiye kayıtlarını sil (Dubai ve Cyprus korunur)
-- Türkiye fiyatlandırması artık distance_pricing_rules (KM bazlı) üzerinden yapılıyor
DELETE FROM public.region_prices
WHERE LOWER(TRIM(city)) NOT IN ('dubai', 'cyprus')
   OR city IS NULL;
