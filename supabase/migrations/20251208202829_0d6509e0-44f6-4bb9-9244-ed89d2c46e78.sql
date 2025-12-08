-- Drop the existing admin policy that doesn't have WITH CHECK for INSERT
DROP POLICY IF EXISTS "Admins can manage reservations" ON public.reservations;

-- Create new admin policy with both USING and WITH CHECK for ALL operations
CREATE POLICY "Admins can manage reservations" 
ON public.reservations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));