-- Trusted devices RLS yumusatma - Driver ve backend erisimi
-- 1. auth.uid() NULL (backend/service) tum islemlere izin
-- 2. Kullanicilar kendi kayitlarini gorebilir/yonetebilir
-- 3. register_trusted_device RPC ve edge function sorunsuz calissin

-- Mevcut kisitlayici policy'leri kaldir (varsa)
DROP POLICY IF EXISTS "Users can view their own trusted devices" ON public.trusted_devices;
DROP POLICY IF EXISTS "Users can manage their own trusted devices" ON public.trusted_devices;

-- Yumusak policy: Backend (auth.uid() NULL) veya kendi user_id icin tum islemlere izin
CREATE POLICY "trusted_devices_select"
  ON public.trusted_devices FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "trusted_devices_insert"
  ON public.trusted_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "trusted_devices_update"
  ON public.trusted_devices FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "trusted_devices_delete"
  ON public.trusted_devices FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);
