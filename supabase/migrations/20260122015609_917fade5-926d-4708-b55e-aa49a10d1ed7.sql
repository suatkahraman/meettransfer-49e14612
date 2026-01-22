-- Remove the SELECT policy that exposes active OTP codes
-- Edge functions use service_role and don't need this policy
DROP POLICY IF EXISTS "Users can view their own OTP records" ON public.two_factor_otp;