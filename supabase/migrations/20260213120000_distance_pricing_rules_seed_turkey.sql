-- distance_pricing_rules: Türkiye KM bazlı fiyatlandırma için varsayılan kurallar
-- Sadece tablo boşsa eklenir. Admin panelden güncellenebilir.
-- Formül: fiyat = base_price + (mesafe_km * price_per_km). Havalimanı: +5 EUR.
DO $$
DECLARE
  cnt integer;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.distance_pricing_rules WHERE base_price IS NOT NULL AND price_per_km IS NOT NULL;
  IF cnt = 0 THEN
    INSERT INTO public.distance_pricing_rules (vehicle_type, base_price, price_per_km, min_km, max_km)
    VALUES 
      ('mercedes-vito', 25, 1.5, 0, NULL),
      ('vip-mercedes', 35, 2.0, 0, NULL),
      ('maybach-minibus', 50, 2.5, 0, NULL),
      ('minibus', 60, 3.0, 0, NULL);
    RAISE NOTICE 'distance_pricing_rules varsayılan Türkiye kuralları eklendi.';
  END IF;
END $$;
