-- Create update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create region_prices table for storing location-based pricing
CREATE TABLE public.region_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  airport TEXT,
  district TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'mercedes-vito',
  price NUMERIC NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'EUR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX idx_region_prices_unique ON public.region_prices (city, COALESCE(airport, ''), district, vehicle_type) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.region_prices ENABLE ROW LEVEL SECURITY;

-- Only admins can manage region prices
CREATE POLICY "Admins can manage region prices" 
ON public.region_prices 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_region_prices_updated_at
BEFORE UPDATE ON public.region_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();