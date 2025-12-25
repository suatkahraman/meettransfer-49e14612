-- Drop existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can insert page visits" ON public.page_visits;
DROP POLICY IF EXISTS "Anyone can update own visits" ON public.page_visits;

-- Recreate as PERMISSIVE (default) policies for anonymous tracking
CREATE POLICY "Anyone can insert page visits" 
ON public.page_visits 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update page visits" 
ON public.page_visits 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Grant necessary permissions to anon role
GRANT INSERT, UPDATE, SELECT ON public.page_visits TO anon;
GRANT INSERT, UPDATE, SELECT ON public.page_visits TO authenticated;