-- Insert Ercan Airport (ECN) - North Cyprus transfer prices
-- Currency: EUR

-- Region 1: Girne Merkez, Lefkoşe, Karakum, Çatalköy
INSERT INTO public.region_prices (city, airport, district, vehicle_type, price, price_currency, is_active)
VALUES
  ('Kuzey Kıbrıs', 'ECN', 'Girne Merkez', 'standard_sedan', 62, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Girne Merkez', 'minivan', 68, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Girne Merkez', 'vip_minivan', 88, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Lefkoşe', 'standard_sedan', 62, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Lefkoşe', 'minivan', 68, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Lefkoşe', 'vip_minivan', 88, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Karakum', 'standard_sedan', 62, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Karakum', 'minivan', 68, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Karakum', 'vip_minivan', 88, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Çatalköy', 'standard_sedan', 62, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Çatalköy', 'minivan', 68, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Çatalköy', 'vip_minivan', 88, 'EUR', true),

-- Region 2: Girne Alsancak, Mağusa, İskele
  ('Kuzey Kıbrıs', 'ECN', 'Alsancak', 'standard_sedan', 74, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Alsancak', 'minivan', 82, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Alsancak', 'vip_minivan', 108, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Mağusa', 'standard_sedan', 74, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Mağusa', 'minivan', 82, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Mağusa', 'vip_minivan', 108, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'İskele', 'standard_sedan', 74, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'İskele', 'minivan', 82, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'İskele', 'vip_minivan', 108, 'EUR', true),

-- Region 3: Lapta
  ('Kuzey Kıbrıs', 'ECN', 'Lapta', 'standard_sedan', 88, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Lapta', 'minivan', 98, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Lapta', 'vip_minivan', 148, 'EUR', true),

-- Region 4: Bafra
  ('Kuzey Kıbrıs', 'ECN', 'Bafra', 'standard_sedan', 96, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Bafra', 'minivan', 108, 'EUR', true),
  ('Kuzey Kıbrıs', 'ECN', 'Bafra', 'vip_minivan', 188, 'EUR', true)
ON CONFLICT DO NOTHING;