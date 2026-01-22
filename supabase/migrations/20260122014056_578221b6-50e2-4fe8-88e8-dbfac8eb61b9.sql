-- Fix customer_magic_links: Remove public/anon SELECT access
-- Only admins should be able to read magic links (service role handles verification)
REVOKE SELECT ON public.customer_magic_links FROM anon;
REVOKE SELECT ON public.customer_magic_links FROM authenticated;

-- Grant only to authenticated (for admin access via RLS)
GRANT SELECT ON public.customer_magic_links TO authenticated;

-- Fix agency_applications: Remove public SELECT access
-- Only admins should see applications
REVOKE SELECT ON public.agency_applications FROM anon;

-- Admins already have SELECT via the ALL policy, no changes needed

-- Fix whatsapp_conversations: Remove anon access
REVOKE ALL ON public.whatsapp_conversations FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_conversations TO authenticated;

-- Fix two_factor_otp: Remove anon access (only authenticated users use 2FA)
REVOKE ALL ON public.two_factor_otp FROM anon;