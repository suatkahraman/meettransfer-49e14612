-- Fix driver_reviews: Revoke anon access to prevent public viewing of reviews
REVOKE ALL ON public.driver_reviews FROM anon;

-- Grant only to authenticated users (RLS policies will further restrict access)
GRANT SELECT, INSERT ON public.driver_reviews TO authenticated;