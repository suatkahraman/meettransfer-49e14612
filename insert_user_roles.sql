
-- 1. Enum ve Tablo Kontrolü
DO $$ 
BEGIN
    -- Enum yoksa oluştur
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'driver', 'customer', 'agency');
    END IF;
END $$;

-- Tablo yoksa oluştur
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Çakışan/Tekrar Eden Kayıtları Temizle
-- Eğer tablo önceden varsa ve duplicate veriler içeriyorsa, constraint eklemeden önce temizlememiz gerekir.
DELETE FROM public.user_roles
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
        ROW_NUMBER() OVER (partition BY user_id, role ORDER BY created_at) as rnum
        FROM public.user_roles
    ) t
    WHERE t.rnum > 1
);

-- 3. Unique Constraint Ekle
-- Artık veri temiz olduğu için constraint güvenle eklenebilir.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_roles_user_id_role_key'
    ) THEN
        ALTER TABLE public.user_roles 
        ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
    END IF;
END $$;

-- RLS Aktif Et
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Rolleri Ekle (ON CONFLICT artık çalışır)
INSERT INTO public.user_roles (user_id, role) VALUES
('9f380270-56d1-40e3-abe8-41ea6d3afe5f', 'admin'),
('1eb228f2-45b3-4ef8-a513-8aec76b3fd91', 'agency'),
('b12f5233-41da-4de2-9e81-c24f5f322c9f', 'driver'),
('2cf7a7da-8c16-488a-bbbc-b7888f289468', 'driver'),
('e44c4a1a-4960-49e3-a885-93b1a518b272', 'driver'),
('db6df62b-860a-4bea-b769-23ad2b9dd053', 'customer'),
('74fd7f39-617e-44c1-a1a0-8f07886ca199', 'customer'),
('b3332cbe-6649-4427-9266-f0b93dc08fd5', 'customer'),
('e11e84c4-970c-49c3-8ef1-e84b6fc781e9', 'customer'),
('ca0b1ff6-dea6-474f-8478-b1614cfbd87a', 'customer'),
('b49bf036-6e45-4a36-9749-f3ceefe6a7fb', 'customer'),
('3dc34233-a707-4e6a-87ab-6e9f64617afa', 'customer'),
('54ef4d25-9472-4a2d-9660-92d235695a3b', 'customer'),
('367ce38b-6dc5-4516-8817-da00d35f46ed', 'customer'),
('7484aae0-aab7-47b7-b9c9-7a7247fe6747', 'customer'),
('878a9116-2cec-4000-be5f-afa6861308bb', 'customer'),
('b217ecf3-cc93-4e5a-9727-1d15eb2f2af1', 'driver'),
('b2dbb516-c1a0-4e03-81b4-397b90684bfc', 'driver'),
('9c886437-67a1-4c8f-a799-e52fb0bff011', 'customer'),
('614b2f86-eff8-4a24-a455-ac27f6bb197a', 'customer'),
('0f3405fc-2432-4bff-82ef-d73459dac6c9', 'customer'),
('8f5b7717-b49b-4668-b687-18d12508738e', 'customer'),
('98e7e247-56da-45e4-bc42-cc9e3c1380f7', 'customer'),
('6e28b7cd-6351-4886-a71a-3f97cb7f09d0', 'agency'),
('f07dcfa0-89b4-4d5c-ab92-54d13d2f1f5d', 'agency'),
('e2e78250-490b-482b-816f-07312f4d3066', 'customer'),
('0537f8d8-d7cf-4577-877f-9881a9c15a87', 'customer'),
('884ed157-ec68-4808-b129-888d52eb5b5a', 'customer'),
('aca55724-a5d6-416e-8695-63e38c043b30', 'customer'),
('72e467f3-aafe-4da4-98e0-23bfee6ac55b', 'customer'),
('86583f06-3a5c-4a96-ae73-09169c70e0b6', 'customer'),
('31dc477a-2c80-4b9d-b50c-3d445ee1bb6d', 'customer'),
('5240628a-5db6-446d-b10b-09c9c2cba852', 'customer'),
('3ad60ffe-039d-491c-ad67-083c1a6ffdd3', 'customer'),
('49afaf54-9fbb-473d-bc86-08bfa93f330f', 'driver'),
('7bc9f678-18f7-4973-8501-f336b953361c', 'customer'),
('3598d20e-cd8c-42a1-a873-c80ebdcab695', 'customer'),
('192a098e-04bf-433c-9484-40695e7dabf1', 'customer'),
('ce21fb0e-7291-4dd0-9268-bc2b7a058d47', 'customer'),
('dc5e71c9-7530-47f7-97f5-fcb0829ad466', 'customer')
ON CONFLICT (user_id, role) DO UPDATE SET
  role = EXCLUDED.role;

-- 5. Profiles Tablosuna Role Sütunu Ekle (Kullanıcı isteği üzerine)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT;
    END IF;
END $$;

-- 6. Profiles Tablosundaki Rolleri Güncelle
-- user_id lerin UUID oldugunu varsayarak, cast islemi ekliyoruz.
UPDATE public.profiles p
SET role = ur.role::text
FROM public.user_roles ur
WHERE p.id = ur.user_id::uuid;

-- 7. Özel Kontrol: sautkahraman@gmail.com (9f380270-56d1-40e3-abe8-41ea6d3afe5f) Admin Yap
-- user_roles tablosunda
INSERT INTO public.user_roles (user_id, role)
VALUES ('9f380270-56d1-40e3-abe8-41ea6d3afe5f', 'admin')
ON CONFLICT (user_id, role) DO UPDATE SET role = 'admin';

-- profiles tablosunda
UPDATE public.profiles
SET role = 'admin'
WHERE id = '9f380270-56d1-40e3-abe8-41ea6d3afe5f';

-- auth.users metadata güncelle
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE id = '9f380270-56d1-40e3-abe8-41ea6d3afe5f';
