-- Create reservation_templates table for storing reusable route templates
CREATE TABLE public.reservation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pickup TEXT NOT NULL,
  dropoff TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'mercedes-vito',
  payment_type TEXT NOT NULL DEFAULT 'cash',
  price NUMERIC,
  price_currency TEXT DEFAULT 'TRY',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reservation_templates ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admins can manage templates"
ON public.reservation_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update trigger for updated_at
CREATE TRIGGER update_reservation_templates_updated_at
BEFORE UPDATE ON public.reservation_templates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();