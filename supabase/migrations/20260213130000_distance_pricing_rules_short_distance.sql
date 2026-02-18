-- Kısa mesafe (0-50 km) şehir içi transferler için düşük per_km kuralları
-- Mevcut kurallar (min_km=0, max_km=NULL) uzun mesafe/havalimanı için geçerli kalır.
-- Bu kurallar 0-50 km arası için daha makul fiyat sağlar: base_price + düşük per_km.
-- Birden fazla kural eşleşirse en düşük fiyat kullanılır.
DO $$
DECLARE
  cnt integer;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.distance_pricing_rules 
    WHERE min_km = 0 AND max_km = 50 AND vehicle_type IN ('mercedes-vito','vip-mercedes','maybach-minibus','minibus');
  IF cnt = 0 THEN
    INSERT INTO public.distance_pricing_rules (vehicle_type, base_price, price_per_km, min_km, max_km)
    VALUES 
      ('mercedes-vito', 20, 0.8, 0, 50),
      ('vip-mercedes', 28, 1.0, 0, 50),
      ('maybach-minibus', 40, 1.2, 0, 50),
      ('minibus', 50, 1.5, 0, 50);
    RAISE NOTICE 'distance_pricing_rules 0-50 km şehir içi kuralları eklendi.';
  END IF;
END $$;
