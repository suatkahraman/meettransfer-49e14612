
-- Allow all authenticated users to read OTP settings (public config, not sensitive)
CREATE POLICY "Authenticated users can read OTP settings"
ON public.otp_settings
FOR SELECT
TO authenticated
USING (true);
