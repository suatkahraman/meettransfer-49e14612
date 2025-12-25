-- Grant INSERT permission to anon role for page_visits
GRANT INSERT ON public.page_visits TO anon;
GRANT UPDATE ON public.page_visits TO anon;
GRANT SELECT ON public.page_visits TO anon;

-- Also grant to authenticated users
GRANT INSERT ON public.page_visits TO authenticated;
GRANT UPDATE ON public.page_visits TO authenticated;
GRANT SELECT ON public.page_visits TO authenticated;