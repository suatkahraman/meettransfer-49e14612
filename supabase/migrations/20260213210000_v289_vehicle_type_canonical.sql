-- v2.8.9: vehicle_type değerlerini Booking Form ile birebir aynı yap
-- Frontend tam isimleri: Standard Sedan, Mercedes Vito or Similar, Mercedes Maybach, Mercedes Sprinter or Similar

-- Eski isimleri yeni canonical isimlere güncelle
UPDATE public.distance_pricing_rules SET vehicle_type = 'Standard Sedan'
  WHERE LOWER(TRIM(vehicle_type)) IN ('sedan', 'standard_sedan', 'standard-sedan', 'standard sedan');

UPDATE public.distance_pricing_rules SET vehicle_type = 'Mercedes Vito or Similar'
  WHERE LOWER(TRIM(vehicle_type)) IN ('mercedes-vito', 'mercedes vito', 'vito', 'mercedes vito or similar');

UPDATE public.distance_pricing_rules SET vehicle_type = 'Mercedes Maybach'
  WHERE LOWER(TRIM(vehicle_type)) IN ('maybach', 'maybach-minibus', 'maybach-minivan', 'vip-mercedes', 'vip-vito', 'mercedes maybach');

UPDATE public.distance_pricing_rules SET vehicle_type = 'Mercedes Sprinter or Similar'
  WHERE LOWER(TRIM(vehicle_type)) IN ('minibus', 'mercedes-sprinter', 'mercedes sprinter', 'mercedes sprinter or similar');

-- Yeni kurallar yoksa ekle (0-50: price_amount = toplam sabit fiyat)
DO $$
DECLARE
  cnt integer;
  has_price_amount boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='distance_pricing_rules' AND column_name='price_amount') INTO has_price_amount;
  SELECT COUNT(*) INTO cnt FROM public.distance_pricing_rules 
    WHERE TRIM(vehicle_type) = 'Standard Sedan' AND COALESCE(min_km,0) <= 50 AND COALESCE(max_km,999) >= 50;
  IF cnt = 0 THEN
    IF has_price_amount THEN
      INSERT INTO public.distance_pricing_rules (vehicle_type, price_amount, base_price, price_per_km, min_km, max_km)
      VALUES 
        ('Standard Sedan', 35, 20, 0.8, 0, 50),
        ('Mercedes Vito or Similar', 50, 25, 1.0, 0, 50),
        ('Mercedes Maybach', 75, 35, 1.2, 0, 50),
        ('Mercedes Sprinter or Similar', 100, 50, 1.5, 0, 50);
    ELSE
      INSERT INTO public.distance_pricing_rules (vehicle_type, base_price, price_per_km, min_km, max_km)
      VALUES 
        ('Standard Sedan', 20, 0.8, 0, 50),
        ('Mercedes Vito or Similar', 25, 1.0, 0, 50),
        ('Mercedes Maybach', 35, 1.2, 0, 50),
        ('Mercedes Sprinter or Similar', 50, 1.5, 0, 50);
    END IF;
    RAISE NOTICE 'v2.8.9: distance_pricing_rules canonical vehicle_type (0-50) eklendi.';
  END IF;
END $$;
