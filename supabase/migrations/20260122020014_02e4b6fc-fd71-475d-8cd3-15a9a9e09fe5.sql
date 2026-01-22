-- Revoke anonymous access to drivers table to prevent public scraping of driver contact information
-- RLS policies already restrict access to admins, drivers themselves, and authenticated users with valid reservations
REVOKE ALL ON public.drivers FROM anon;

-- Grant access only to authenticated users (RLS will further restrict what they can see)
GRANT SELECT, INSERT, UPDATE ON public.drivers TO authenticated;