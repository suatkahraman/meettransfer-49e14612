-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Anyone can insert app installations" ON public.app_installations;

-- Create a new permissive insert policy that allows anyone to insert
CREATE POLICY "Anyone can insert app installations" 
ON public.app_installations 
FOR INSERT 
TO public
WITH CHECK (true);