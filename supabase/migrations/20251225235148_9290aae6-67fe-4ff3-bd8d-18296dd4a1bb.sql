-- Create price history table for tracking price submissions and customer responses
CREATE TABLE public.price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  quick_booking_id UUID REFERENCES public.quick_booking_requests(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'TRY',
  action TEXT NOT NULL, -- 'sent', 'accepted', 'rejected'
  admin_user_id UUID,
  customer_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure at least one reference exists
  CONSTRAINT price_history_has_reference CHECK (reservation_id IS NOT NULL OR quick_booking_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Admins can manage all price history
CREATE POLICY "Admins can manage price history"
ON public.price_history
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Customers can view price history for their own reservations
CREATE POLICY "Customers can view own reservation price history"
ON public.price_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.id = price_history.reservation_id
    AND r.customer_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_price_history_reservation ON public.price_history(reservation_id);
CREATE INDEX idx_price_history_quick_booking ON public.price_history(quick_booking_id);
CREATE INDEX idx_price_history_created_at ON public.price_history(created_at DESC);