
-- Add RLS policy for agencies to view their own payments
CREATE POLICY "Agencies can view their own payments"
ON public.agency_payments
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM public.agencies WHERE user_id = auth.uid()
  )
);

-- Also add RLS policy for agency_transactions if not exists
-- First check what exists
DO $$
BEGIN
  -- Drop and recreate if needed
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agency_transactions' 
    AND policyname = 'Agencies can view their own transactions'
  ) THEN
    EXECUTE 'CREATE POLICY "Agencies can view their own transactions" ON public.agency_transactions FOR SELECT USING (agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid()))';
  END IF;
END
$$;
