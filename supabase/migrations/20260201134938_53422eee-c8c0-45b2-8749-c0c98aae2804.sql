
-- Add SELECT policy for service role operations
-- The verify_otp function needs to read OTP records

-- First, let's add a policy that allows the function owner (security definer) to access the table
-- Since verify_otp is SECURITY DEFINER, it runs as the function owner, but RLS still applies to the underlying queries

-- Option 1: Add explicit policies for authenticated users to SELECT their own OTP
CREATE POLICY "Users can select their own OTP records"
ON public.two_factor_otp
FOR SELECT
USING (auth.uid() = user_id);

-- Add DELETE policy for cleanup
CREATE POLICY "Users can delete their own OTP records"
ON public.two_factor_otp
FOR DELETE
USING (auth.uid() = user_id);

-- Also, ensure the service_role can bypass RLS (this is usually automatic but let's make it explicit)
-- The issue is that when using service_role key, RLS should be bypassed
-- But RPC functions run in a different context

-- The real fix: Make sure the verify_otp function properly bypasses RLS
-- We need to recreate the function with proper search_path that includes necessary permissions
CREATE OR REPLACE FUNCTION public.verify_otp(p_user_id uuid, p_otp_code text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Also update generate_otp function to ensure it works
CREATE OR REPLACE FUNCTION public.generate_otp(p_user_id uuid, p_email text, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Grant execute permissions to authenticated users for the RPC functions
GRANT EXECUTE ON FUNCTION public.verify_otp(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_otp(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_otp(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_otp(uuid, text, text, text) TO service_role;
