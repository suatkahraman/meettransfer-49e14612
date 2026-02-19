
-- 1. Tablo ve Constraint Kontrolü
DO $$ 
BEGIN
    -- Tablo yoksa oluştur
    CREATE TABLE IF NOT EXISTS public.drivers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        name text NOT NULL,
        phone text NOT NULL,
        region text,
        commission_rate numeric(5,2) DEFAULT 10.00,
        active boolean DEFAULT true,
        plate_number text,
        vehicle_model text,
        vehicle_color text,
        average_rating numeric(2,1) DEFAULT 0,
        total_reviews integer DEFAULT 0,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- Unique Constraint (user_id) kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'drivers_user_id_key'
    ) THEN
        ALTER TABLE public.drivers ADD CONSTRAINT drivers_user_id_key UNIQUE (user_id);
    END IF;

    -- Foreign Key (user_id -> auth.users) kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'drivers_user_id_fkey'
    ) THEN
        ALTER TABLE public.drivers 
        ADD CONSTRAINT drivers_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. RLS Aktif Et
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- 3. Verileri Ekle (ON CONFLICT ile güncelle)
INSERT INTO public.drivers (
    id, user_id, name, phone, region, commission_rate, active, 
    plate_number, vehicle_model, vehicle_color, average_rating, total_reviews
) VALUES
('f18b35b5-29f8-4fc0-9961-4ac2487b5267', 'e44c4a1a-4960-49e3-a885-93b1a518b272', 'Fikret Karadağ İzmir', '+90 542 809 88 85', 'Izmir', 10, true, '35 ADH 964', 'Mercedes Vito', 'Siyah', 0, 0),
('5d1dfc09-35a9-4e8d-beba-c06df30506c7', '2cf7a7da-8c16-488a-bbbc-b7888f289468', 'Serhat Antalya', '+90 538 922 77 88', 'Antalya', 10, true, '07 ABC 001', 'Mercedes Vito', 'Siyah', 0, 0),
('4ecc376c-9ec5-4e6b-8a50-16743488efb6', 'b217ecf3-cc93-4e5a-9727-1d15eb2f2af1', 'Mesut Kızıl', '+90 532 202 76 12', 'Bodrum', 10, true, '48 AJU 841', 'Mercedes VIP Vito', NULL, 0, 0),
('3cad2faf-c2ee-4bf4-9468-648e5b63c3b4', 'b12f5233-41da-4de2-9e81-c24f5f322c9f', 'Cem', '+90 544 316 65 00', 'Istanbul', 10, true, '34 FM 4344', 'Mercedes VIP Vito', 'Siyah', 0, 0),
('ee26b60b-3a2b-4340-aab9-555929551290', 'b2dbb516-c1a0-4e03-81b4-397b90684bfc', 'Sadık', '+905321748390', 'Istanbul', 10, true, '34 HFZ 942', 'Mercedes Maybach Minivan', NULL, 0, 0),
('d878f87b-6eb0-43f6-91aa-e48a15710c54', '49afaf54-9fbb-473d-bc86-08bfa93f330f', 'Test Driver', '+905530344150', 'Istanbul', 10, true, '34HSHS34', 'Sedan', NULL, 0, 0)
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  region = EXCLUDED.region,
  commission_rate = EXCLUDED.commission_rate,
  active = EXCLUDED.active,
  plate_number = EXCLUDED.plate_number,
  vehicle_model = EXCLUDED.vehicle_model,
  vehicle_color = EXCLUDED.vehicle_color,
  average_rating = EXCLUDED.average_rating,
  total_reviews = EXCLUDED.total_reviews,
  updated_at = now();
