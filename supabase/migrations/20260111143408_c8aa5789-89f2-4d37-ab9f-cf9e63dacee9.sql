-- Create table for configurable minimum price thresholds
CREATE TABLE public.price_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_type TEXT NOT NULL UNIQUE,
  min_price_eur NUMERIC NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.price_thresholds ENABLE ROW LEVEL SECURITY;

-- Admin can read
CREATE POLICY "Admins can read price thresholds"
ON public.price_thresholds
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admin can insert
CREATE POLICY "Admins can insert price thresholds"
ON public.price_thresholds
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admin can update
CREATE POLICY "Admins can update price thresholds"
ON public.price_thresholds
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admin can delete
CREATE POLICY "Admins can delete price thresholds"
ON public.price_thresholds
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default thresholds
INSERT INTO public.price_thresholds (vehicle_type, min_price_eur) VALUES
  ('mercedes-vito', 50),
  ('vip-mercedes', 60),
  ('maybach-minibus', 70),
  ('minibus', 100);

-- Create trigger for updated_at
CREATE TRIGGER update_price_thresholds_updated_at
BEFORE UPDATE ON public.price_thresholds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();