-- Giris rolleri RLS engeli - tum kullanicilar kendi panellerine girebilsin
-- get-user-role edge function zaten service_role ile RLS bypass yapiyor.
-- Bu migration: user_roles ve drivers tablolarinda self-read policy'lerinin varligini garanti eder.
-- (Fallback path ve diger client-side sorgular icin)

-- user_roles: 20260211130000'da zaten yapildi - burada tekrar create etmeye gerek yok
-- drivers: Varsa skip - yoksa ekle (bazi kurulumlarda eksik kalabilir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'drivers' AND policyname = 'Drivers can view own profile'
  ) THEN
    CREATE POLICY "Drivers can view own profile"
    ON public.drivers
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;
