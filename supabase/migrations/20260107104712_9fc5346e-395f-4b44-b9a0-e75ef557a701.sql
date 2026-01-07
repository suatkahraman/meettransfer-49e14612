-- Create intercity_prices table for city-to-city transfers
CREATE TABLE public.intercity_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'mercedes-vito',
  price NUMERIC NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'EUR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(from_city, to_city, vehicle_type)
);

-- Enable RLS
ALTER TABLE public.intercity_prices ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all intercity prices" 
ON public.intercity_prices 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert intercity prices" 
ON public.intercity_prices 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update intercity prices" 
ON public.intercity_prices 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete intercity prices" 
ON public.intercity_prices 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Allow public read for edge functions (auto-pricing)
CREATE POLICY "Public can read active intercity prices" 
ON public.intercity_prices 
FOR SELECT 
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_intercity_prices_updated_at
BEFORE UPDATE ON public.intercity_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();