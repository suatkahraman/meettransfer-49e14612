-- Add RLS policy for agencies to view assigned drivers for their reservations
CREATE POLICY "Agencies can view assigned drivers for their reservations" 
ON public.drivers 
FOR SELECT 
USING (
  id IN (
    SELECT driver_id FROM public.reservations 
    WHERE agency_id IN (
      SELECT id FROM public.agencies WHERE user_id = auth.uid()
    )
    AND driver_id IS NOT NULL
  )
);