-- Revoke anonymous access to customer_magic_links table to protect authentication tokens
-- Only admins should manage these links via RLS policies
REVOKE ALL ON public.customer_magic_links FROM anon;

-- Grant access only to authenticated users (RLS restricts to admins only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_magic_links TO authenticated;