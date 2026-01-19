-- Insert Switzerland Zurich Airport (ZRH) transfer prices
-- Same price for all vehicle types: s_class, mercedes_vclass
-- Note: Using s_class as the vehicle type for Mercedes S-Class and mercedes_vclass for V-Class

INSERT INTO public.region_prices (city, district, airport, vehicle_type, price, price_currency, is_active)
VALUES
  -- St. Moritz - 920 EUR
  ('Switzerland', 'St. Moritz', 'ZRH', 's_class', 920, 'EUR', true),
  ('Switzerland', 'St. Moritz', 'ZRH', 'mercedes_vclass', 920, 'EUR', true),
  
  -- Gstaad - 920 EUR
  ('Switzerland', 'Gstaad', 'ZRH', 's_class', 920, 'EUR', true),
  ('Switzerland', 'Gstaad', 'ZRH', 'mercedes_vclass', 920, 'EUR', true),
  
  -- Davos - 900 EUR
  ('Switzerland', 'Davos', 'ZRH', 's_class', 900, 'EUR', true),
  ('Switzerland', 'Davos', 'ZRH', 'mercedes_vclass', 900, 'EUR', true),
  
  -- Arosa - 900 EUR
  ('Switzerland', 'Arosa', 'ZRH', 's_class', 900, 'EUR', true),
  ('Switzerland', 'Arosa', 'ZRH', 'mercedes_vclass', 900, 'EUR', true),
  
  -- Zermatt - 1100 EUR
  ('Switzerland', 'Zermatt', 'ZRH', 's_class', 1100, 'EUR', true),
  ('Switzerland', 'Zermatt', 'ZRH', 'mercedes_vclass', 1100, 'EUR', true),
  
  -- Verbier - 980 EUR
  ('Switzerland', 'Verbier', 'ZRH', 's_class', 980, 'EUR', true),
  ('Switzerland', 'Verbier', 'ZRH', 'mercedes_vclass', 980, 'EUR', true),
  
  -- Crans-Montana - 1240 EUR
  ('Switzerland', 'Crans-Montana', 'ZRH', 's_class', 1240, 'EUR', true),
  ('Switzerland', 'Crans-Montana', 'ZRH', 'mercedes_vclass', 1240, 'EUR', true)

ON CONFLICT DO NOTHING;