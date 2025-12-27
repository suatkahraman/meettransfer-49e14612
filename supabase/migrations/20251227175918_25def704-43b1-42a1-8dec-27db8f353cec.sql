-- Update price_history RLS policy to allow inserts for quick_booking_id
DROP POLICY IF EXISTS "Admins can manage price history" ON public.price_history;

CREATE POLICY "Admins can manage price history" 
ON public.price_history 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Also allow service role to insert (for edge functions)
DROP POLICY IF EXISTS "Service role can insert price history" ON public.price_history;

CREATE POLICY "Service role can insert price history"
ON public.price_history
FOR INSERT
WITH CHECK (true);