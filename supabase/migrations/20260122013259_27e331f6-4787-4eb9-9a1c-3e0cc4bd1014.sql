-- Drop the existing agency policy that's too permissive (no status filter)
DROP POLICY IF EXISTS "Agencies can view assigned drivers for their reservations" ON public.drivers;

-- Drop the existing customer policy to recreate with stricter status filter
DROP POLICY IF EXISTS "Customers can view assigned driver for active reservations" ON public.drivers;

-- Create stricter customer policy - only confirmed/active reservations
CREATE POLICY "Customers can view driver for confirmed reservations only"
ON public.drivers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM reservations r
    WHERE r.driver_id = drivers.id
      AND r.customer_id = auth.uid()
      AND r.status IN ('confirmed', 'sent_to_driver', 'in_progress', 'active')
  )
);

-- Create stricter agency policy - only confirmed/active reservations
CREATE POLICY "Agencies can view driver for confirmed reservations only"
ON public.drivers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM reservations r
    JOIN agencies a ON r.agency_id = a.id
    WHERE r.driver_id = drivers.id
      AND a.user_id = auth.uid()
      AND r.status IN ('confirmed', 'sent_to_driver', 'in_progress', 'active', 'completed')
  )
);