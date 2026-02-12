-- Bu dosyayi Supabase Dashboard > SQL Editor'de calistirin
-- https://supabase.com/dashboard/project/zqykoyugubaeealrspxm/sql/new

-- ========== 1. trusted_devices tablosu (yoksa olustur) ==========
CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_name TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, device_fingerprint)
);

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON public.trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON public.trusted_devices(user_id, device_fingerprint);

-- ========== 2. RLS policy'ler (yumusak - driver/backend erisimi) ==========
DROP POLICY IF EXISTS "Users can view their own trusted devices" ON public.trusted_devices;
DROP POLICY IF EXISTS "Users can manage their own trusted devices" ON public.trusted_devices;
DROP POLICY IF EXISTS "trusted_devices_select" ON public.trusted_devices;
DROP POLICY IF EXISTS "trusted_devices_insert" ON public.trusted_devices;
DROP POLICY IF EXISTS "trusted_devices_update" ON public.trusted_devices;
DROP POLICY IF EXISTS "trusted_devices_delete" ON public.trusted_devices;

CREATE POLICY "trusted_devices_select" ON public.trusted_devices FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);
CREATE POLICY "trusted_devices_insert" ON public.trusted_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
CREATE POLICY "trusted_devices_update" ON public.trusted_devices FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IS NULL) WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
CREATE POLICY "trusted_devices_delete" ON public.trusted_devices FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- ========== 3. register_trusted_device fonksiyonu ==========
CREATE OR REPLACE FUNCTION public.register_trusted_device(
  p_user_id UUID,
  p_device_fingerprint TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_device_id UUID;
BEGIN
  INSERT INTO public.trusted_devices (user_id, device_fingerprint, ip_address, user_agent, device_name)
  VALUES (p_user_id, p_device_fingerprint, p_ip_address, p_user_agent, p_device_name)
  ON CONFLICT (user_id, device_fingerprint)
  DO UPDATE SET last_used_at = now(), ip_address = COALESCE(p_ip_address, trusted_devices.ip_address), is_active = true
  RETURNING id INTO v_device_id;
  RETURN v_device_id;
END;
$$;

-- ========== 4. Drivers - kendi profilini gorebilir (tablo varsa) ==========
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drivers') THEN
    DROP POLICY IF EXISTS "Drivers can view own profile" ON public.drivers;
    CREATE POLICY "Drivers can view own profile" ON public.drivers FOR SELECT
      USING (auth.uid() = user_id);
    RAISE NOTICE 'Drivers policy eklendi.';
  ELSE
    RAISE NOTICE 'drivers tablosu yok, policy atlandi.';
  END IF;
END $$;
