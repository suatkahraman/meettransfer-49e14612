-- Create table for trusted devices/IPs
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

-- Enable RLS
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

-- Indexes for faster lookups
CREATE INDEX idx_trusted_devices_user ON public.trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_fingerprint ON public.trusted_devices(user_id, device_fingerprint);

-- RLS policies
CREATE POLICY "Users can view their own trusted devices"
  ON public.trusted_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own trusted devices"
  ON public.trusted_devices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to check if device is trusted
CREATE OR REPLACE FUNCTION public.is_device_trusted(
  p_user_id UUID,
  p_device_fingerprint TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.trusted_devices
    WHERE user_id = p_user_id
      AND device_fingerprint = p_device_fingerprint
      AND is_active = true
  ) INTO v_found;
  
  -- Update last used time if found
  IF v_found THEN
    UPDATE public.trusted_devices
    SET last_used_at = now()
    WHERE user_id = p_user_id
      AND device_fingerprint = p_device_fingerprint;
  END IF;
  
  RETURN v_found;
END;
$$;

-- Function to register trusted device after successful 2FA
CREATE OR REPLACE FUNCTION public.register_trusted_device(
  p_user_id UUID,
  p_device_fingerprint TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device_id UUID;
BEGIN
  INSERT INTO public.trusted_devices (user_id, device_fingerprint, ip_address, user_agent, device_name)
  VALUES (p_user_id, p_device_fingerprint, p_ip_address, p_user_agent, p_device_name)
  ON CONFLICT (user_id, device_fingerprint) 
  DO UPDATE SET 
    last_used_at = now(),
    ip_address = COALESCE(p_ip_address, trusted_devices.ip_address),
    is_active = true
  RETURNING id INTO v_device_id;
  
  RETURN v_device_id;
END;
$$;

-- Clean up old unused devices (older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_trusted_devices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.trusted_devices
  WHERE last_used_at < now() - interval '90 days';
END;
$$;