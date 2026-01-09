-- Create table to store 2FA OTP codes
CREATE TABLE IF NOT EXISTS public.two_factor_otp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.two_factor_otp ENABLE ROW LEVEL SECURITY;

-- Index for faster lookups
CREATE INDEX idx_two_factor_otp_user_email ON public.two_factor_otp(user_id, email);
CREATE INDEX idx_two_factor_otp_expires ON public.two_factor_otp(expires_at);

-- RLS policies - allow insert/select for authenticated users on their own records
CREATE POLICY "Users can view their own OTP records"
  ON public.two_factor_otp FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OTP records"
  ON public.two_factor_otp FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OTP records"
  ON public.two_factor_otp FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role policy for edge functions (using anon/service access)
CREATE POLICY "Service can manage OTP records"
  ON public.two_factor_otp FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to generate and store OTP
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
BEGIN
  -- Generate 6-digit OTP
  v_otp := lpad(floor(random() * 1000000)::text, 6, '0');
  
  -- Delete any existing unexpired OTPs for this user
  DELETE FROM public.two_factor_otp 
  WHERE user_id = p_user_id 
    AND verified_at IS NULL;
  
  -- Insert new OTP (expires in 5 minutes)
  INSERT INTO public.two_factor_otp (user_id, email, otp_code, expires_at, ip_address, user_agent)
  VALUES (p_user_id, p_email, v_otp, now() + interval '5 minutes', p_ip_address, p_user_agent);
  
  RETURN v_otp;
END;
$$;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_otp(
  p_user_id UUID,
  p_otp_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_result JSON;
BEGIN
  -- Find valid OTP
  SELECT * INTO v_record
  FROM public.two_factor_otp
  WHERE user_id = p_user_id
    AND otp_code = p_otp_code
    AND verified_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Check if OTP exists but expired
    SELECT * INTO v_record
    FROM public.two_factor_otp
    WHERE user_id = p_user_id
      AND otp_code = p_otp_code
      AND verified_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF FOUND THEN
      RETURN json_build_object('success', false, 'error', 'expired');
    ELSE
      RETURN json_build_object('success', false, 'error', 'invalid');
    END IF;
  END IF;
  
  -- Mark as verified
  UPDATE public.two_factor_otp
  SET verified_at = now()
  WHERE id = v_record.id;
  
  RETURN json_build_object('success', true, 'email', v_record.email);
END;
$$;

-- Cleanup function for old OTPs (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.two_factor_otp
  WHERE expires_at < now() - interval '1 hour';
END;
$$;

-- Add 2FA enabled column to user_roles table for admin/agency/driver
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT true;