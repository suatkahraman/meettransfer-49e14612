-- Create OTP settings table for configurable OTP parameters
CREATE TABLE IF NOT EXISTS public.otp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default OTP settings
INSERT INTO public.otp_settings (setting_key, setting_value, description) VALUES
  ('otp_length', '6', 'Number of digits in OTP code (4, 6, or 8)'),
  ('otp_expiry_minutes', '5', 'OTP expiration time in minutes'),
  ('max_verify_attempts', '5', 'Maximum verification attempts before lockout'),
  ('resend_cooldown_seconds', '60', 'Seconds to wait before allowing OTP resend'),
  ('failed_login_threshold', '2', 'Number of failed logins to trigger 2FA')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.otp_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify settings
CREATE POLICY "Admins can view OTP settings"
  ON public.otp_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update OTP settings"
  ON public.otp_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can always read (for edge functions)
CREATE POLICY "Service role can read OTP settings"
  ON public.otp_settings
  FOR SELECT
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_otp_settings_updated_at
  BEFORE UPDATE ON public.otp_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update generate_otp function to use configurable length and expiry
CREATE OR REPLACE FUNCTION public.generate_otp(
  p_user_id UUID,
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_otp TEXT;
  v_otp_length INT;
  v_expiry_minutes INT;
BEGIN
  -- Get configurable settings
  SELECT COALESCE(
    (SELECT setting_value::INT FROM public.otp_settings WHERE setting_key = 'otp_length'),
    6
  ) INTO v_otp_length;
  
  SELECT COALESCE(
    (SELECT setting_value::INT FROM public.otp_settings WHERE setting_key = 'otp_expiry_minutes'),
    5
  ) INTO v_expiry_minutes;
  
  -- Generate OTP with configurable length
  v_otp := lpad(floor(random() * power(10, v_otp_length))::TEXT, v_otp_length, '0');
  
  -- Delete any existing unexpired OTPs for this user
  DELETE FROM public.two_factor_otp 
  WHERE user_id = p_user_id 
    AND verified_at IS NULL;
  
  -- Insert new OTP with configurable expiry
  INSERT INTO public.two_factor_otp (user_id, email, otp_code, expires_at, ip_address, user_agent)
  VALUES (p_user_id, p_email, v_otp, now() + (v_expiry_minutes || ' minutes')::INTERVAL, p_ip_address, p_user_agent);
  
  RETURN v_otp;
END;
$$;