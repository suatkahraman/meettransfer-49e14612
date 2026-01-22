-- Fix drivers: Remove anon access - drivers table should only be accessible by authenticated users
REVOKE ALL ON public.drivers FROM anon;
GRANT SELECT, UPDATE ON public.drivers TO authenticated;