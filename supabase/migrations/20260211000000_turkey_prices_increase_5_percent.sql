-- Türkiye şehirleri için tüm fiyatları %5 artır
-- Hariç tutulan bölgeler: Kuzey Kıbrıs, Dubai, Cyprus, Switzerland

-- Non-Turkey regions to exclude
-- Kuzey Kıbrıs, Dubai, Cyprus, Switzerland

-- 1. region_prices: Türkiye şehirleri (city bazlı)
UPDATE public.region_prices
SET 
  price = ROUND(price * 1.05, 2),
  updated_at = now()
WHERE 
  is_active = true
  AND city NOT IN (
    'Kuzey Kıbrıs',
    'Kuzey Kibris',
    'Dubai',
    'Cyprus',
    'Switzerland',
    'Greece',
    'Frankfurt'
  );

-- 2. intercity_prices: Her iki şehir de Türkiye'de olan güzergahlar
UPDATE public.intercity_prices
SET 
  price = ROUND(price * 1.05, 2),
  updated_at = now()
WHERE 
  is_active = true
  AND from_city NOT IN (
    'Kuzey Kıbrıs', 'Kuzey Kibris', 'Dubai', 'Cyprus', 'Switzerland', 'Greece', 'Frankfurt'
  )
  AND to_city NOT IN (
    'Kuzey Kıbrıs', 'Kuzey Kibris', 'Dubai', 'Cyprus', 'Switzerland', 'Greece', 'Frankfurt'
  );

-- 3. hourly_rental_prices: Türkiye şehirleri
UPDATE public.hourly_rental_prices
SET 
  price = CASE WHEN price > 0 THEN ROUND(price * 1.05, 2) ELSE price END,
  hourly_rate = CASE WHEN hourly_rate IS NOT NULL AND hourly_rate > 0 
    THEN ROUND(hourly_rate * 1.05, 2) 
    ELSE hourly_rate 
  END,
  updated_at = now()
WHERE 
  city NOT IN (
    'Kuzey Kıbrıs', 'Kuzey Kibris', 'Dubai', 'Cyprus', 'Switzerland', 'Greece', 'Frankfurt'
  );
