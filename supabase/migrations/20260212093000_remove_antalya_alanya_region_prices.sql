-- Antalya <-> Alanya rotalari artik sadece intercity_prices tablosundan yonetilir.
-- Bu migration, Antalya sehir fiyatlarinda birikmis Alanya tabanli kayitlari temizler.

DELETE FROM public.region_prices
WHERE lower(city) = 'antalya'
  AND (
    lower(district) IN (
      'alanya',
      'alanya merkez',
      'alanya center',
      'mahmutlar',
      'okurcalar',
      'avsallar',
      'konakli',
      'konaklı',
      'incekum'
    )
    OR lower(district) LIKE 'alanya %'
    OR lower(district) LIKE '% alanya'
  );
