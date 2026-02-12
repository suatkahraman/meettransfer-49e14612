-- Bekleyen migration'lar - Supabase SQL Editor'de calistirin
-- Her bolum tablo varligini kontrol eder, yoksa atlar

-- ========== 1. user_roles: Kullanici kendi rolunu okuyabilsin ==========
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
    CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT
      USING (auth.uid() = user_id);
    RAISE NOTICE 'user_roles policy eklendi.';
  ELSE
    RAISE NOTICE 'user_roles tablosu yok, atlandi.';
  END IF;
END $$;

-- ========== 2. drivers: Surucu kendi profilini gorebilir ==========
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drivers') THEN
    DROP POLICY IF EXISTS "Drivers can view own profile" ON public.drivers;
    CREATE POLICY "Drivers can view own profile" ON public.drivers FOR SELECT
      USING (auth.uid() = user_id);
    RAISE NOTICE 'drivers policy eklendi.';
  ELSE
    RAISE NOTICE 'drivers tablosu yok, atlandi.';
  END IF;
END $$;

-- ========== 3. sautkahraman@gmail.com sadece admin ==========
DO $$
DECLARE admin_user_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'sautkahraman@gmail.com' LIMIT 1;
    IF admin_user_id IS NOT NULL THEN
      DELETE FROM public.user_roles WHERE user_id = admin_user_id;
      INSERT INTO public.user_roles (user_id, role) VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
      RAISE NOTICE 'sautkahraman@gmail.com admin yapildi.';
    ELSE
      RAISE NOTICE 'sautkahraman@gmail.com auth.users''da bulunamadi.';
    END IF;
  END IF;
END $$;

-- ========== 4. region_prices / intercity_prices - Place ID kolonlari ==========
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'region_prices') THEN
    ALTER TABLE public.region_prices
      ADD COLUMN IF NOT EXISTS pickup_place_id TEXT,
      ADD COLUMN IF NOT EXISTS dropoff_place_id TEXT,
      ADD COLUMN IF NOT EXISTS pickup_formatted_address TEXT,
      ADD COLUMN IF NOT EXISTS dropoff_formatted_address TEXT,
      ADD COLUMN IF NOT EXISTS place_id_status TEXT DEFAULT NULL;
    RAISE NOTICE 'region_prices place_id kolonlari eklendi.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'intercity_prices') THEN
    ALTER TABLE public.intercity_prices
      ADD COLUMN IF NOT EXISTS pickup_place_id TEXT,
      ADD COLUMN IF NOT EXISTS dropoff_place_id TEXT,
      ADD COLUMN IF NOT EXISTS pickup_formatted_address TEXT,
      ADD COLUMN IF NOT EXISTS dropoff_formatted_address TEXT,
      ADD COLUMN IF NOT EXISTS place_id_status TEXT DEFAULT NULL;
    RAISE NOTICE 'intercity_prices place_id kolonlari eklendi.';
  END IF;
END $$;

-- ========== 5. Turkiye fiyatlari %5 artis (tablolar varsa) ==========
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'region_prices') THEN
    UPDATE public.region_prices SET price = ROUND(price * 1.05, 2), updated_at = now()
    WHERE is_active = true AND city NOT IN ('Kuzey Kıbrıs','Kuzey Kibris','Dubai','Cyprus','Switzerland','Greece','Frankfurt');
    RAISE NOTICE 'region_prices guncellendi.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'intercity_prices') THEN
    UPDATE public.intercity_prices SET price = ROUND(price * 1.05, 2), updated_at = now()
    WHERE is_active = true
      AND from_city NOT IN ('Kuzey Kıbrıs','Kuzey Kibris','Dubai','Cyprus','Switzerland','Greece','Frankfurt')
      AND to_city NOT IN ('Kuzey Kıbrıs','Kuzey Kibris','Dubai','Cyprus','Switzerland','Greece','Frankfurt');
    RAISE NOTICE 'intercity_prices guncellendi.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hourly_rental_prices') THEN
    UPDATE public.hourly_rental_prices SET
      price = CASE WHEN price > 0 THEN ROUND(price * 1.05, 2) ELSE price END,
      hourly_rate = CASE WHEN hourly_rate IS NOT NULL AND hourly_rate > 0 THEN ROUND(hourly_rate * 1.05, 2) ELSE hourly_rate END,
      updated_at = now()
    WHERE city NOT IN ('Kuzey Kıbrıs','Kuzey Kibris','Dubai','Cyprus','Switzerland','Greece','Frankfurt');
    RAISE NOTICE 'hourly_rental_prices guncellendi.';
  END IF;
END $$;
