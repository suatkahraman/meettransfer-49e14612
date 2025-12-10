-- Create agency_payments table for tracking payments from agencies
CREATE TABLE public.agency_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.agency_payments ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admins can manage agency payments"
ON public.agency_payments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for agency_payments
ALTER PUBLICATION supabase_realtime ADD TABLE public.agency_payments;