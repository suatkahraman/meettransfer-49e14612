-- Cihaza guven RLS yumusatmasi - Customer/Agency ayni cihazdan 2. giris
-- Edge functionlar service_role ile zaten RLS bypass eder.
-- Bu migration: trusted_devices icin self-manage policy'lerinin varligini garanti eder.
-- Client (SecuritySettings) kendi cihazlarini gorebilsin.

DO $$
BEGIN
  -- Users can view their own trusted devices - yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'trusted_devices' 
    AND policyname = 'Users can view their own trusted devices'
  ) THEN
    CREATE POLICY "Users can view their own trusted devices"
    ON public.trusted_devices FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Users can manage (insert/update/delete) their own - yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'trusted_devices' 
    AND policyname = 'Users can manage their own trusted devices'
  ) THEN
    CREATE POLICY "Users can manage their own trusted devices"
    ON public.trusted_devices FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
