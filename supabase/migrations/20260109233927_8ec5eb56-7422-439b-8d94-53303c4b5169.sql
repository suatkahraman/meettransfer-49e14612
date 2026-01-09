-- Create login_attempts table for rate limiting and audit logging
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  user_id UUID,
  role TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts (email, attempted_at DESC);
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts (ip_address, attempted_at DESC);
CREATE INDEX idx_login_attempts_user_id ON public.login_attempts (user_id);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can read login attempts
CREATE POLICY "Admins can read login attempts"
ON public.login_attempts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create a function to check if account is locked
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_email TEXT, p_ip_address TEXT DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  failed_count INTEGER;
  last_attempt TIMESTAMP WITH TIME ZONE;
  lockout_until TIMESTAMP WITH TIME ZONE;
  lockout_minutes INTEGER := 15;
  max_attempts INTEGER := 5;
  time_window_minutes INTEGER := 5;
BEGIN
  -- Count failed attempts in the last time window
  SELECT COUNT(*), MAX(attempted_at)
  INTO failed_count, last_attempt
  FROM public.login_attempts
  WHERE email = LOWER(p_email)
    AND success = false
    AND attempted_at > (now() - (time_window_minutes || ' minutes')::interval);
  
  -- If too many failed attempts, check if still locked
  IF failed_count >= max_attempts THEN
    lockout_until := last_attempt + (lockout_minutes || ' minutes')::interval;
    
    IF lockout_until > now() THEN
      RETURN jsonb_build_object(
        'locked', true,
        'remaining_seconds', EXTRACT(EPOCH FROM (lockout_until - now()))::integer,
        'failed_attempts', failed_count
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'locked', false,
    'remaining_attempts', max_attempts - failed_count,
    'failed_attempts', failed_count
  );
END;
$$;

-- Create function to log login attempt (callable without auth)
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_role TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (
    email,
    ip_address,
    user_agent,
    success,
    failure_reason,
    user_id,
    role
  ) VALUES (
    LOWER(p_email),
    p_ip_address,
    p_user_agent,
    p_success,
    p_failure_reason,
    p_user_id,
    p_role
  );
END;
$$;