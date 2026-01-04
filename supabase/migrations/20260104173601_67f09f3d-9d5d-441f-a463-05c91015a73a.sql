-- Drop the existing agency SELECT policy
DROP POLICY IF EXISTS "Agencies can view own reservations" ON public.reservations;

-- Create a new policy that allows agencies to view reservations by agency_user_id OR by matching agency_id through agencies table
CREATE POLICY "Agencies can view own reservations" 
ON public.reservations 
FOR SELECT 
USING (
  agency_user_id = auth.uid() 
  OR 
  agency_id IN (SELECT id FROM agencies WHERE user_id = auth.uid())
);