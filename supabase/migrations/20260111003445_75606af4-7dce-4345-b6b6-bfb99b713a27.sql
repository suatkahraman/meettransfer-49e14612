-- Create hourly rental prices table
CREATE TABLE public.hourly_rental_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'vito',
  duration_type TEXT NOT NULL CHECK (duration_type IN ('4h', '8h', 'custom')),
  price NUMERIC NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'EUR',
  hourly_rate NUMERIC, -- For custom duration type
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(city, vehicle_type, duration_type)
);

-- Enable RLS
ALTER TABLE public.hourly_rental_prices ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all hourly rental prices"
ON public.hourly_rental_prices
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert hourly rental prices"
ON public.hourly_rental_prices
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update hourly rental prices"
ON public.hourly_rental_prices
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete hourly rental prices"
ON public.hourly_rental_prices
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Public read access for website display
CREATE POLICY "Anyone can view active hourly rental prices"
ON public.hourly_rental_prices
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_hourly_rental_prices_updated_at
BEFORE UPDATE ON public.hourly_rental_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default prices for major cities
INSERT INTO public.hourly_rental_prices (city, vehicle_type, duration_type, price, price_currency, hourly_rate) VALUES
-- Istanbul
('Istanbul', 'vito', '4h', 120, 'EUR', NULL),
('Istanbul', 'vito', '8h', 200, 'EUR', NULL),
('Istanbul', 'vito', 'custom', 0, 'EUR', 30),
('Istanbul', 'vito_vip', '4h', 150, 'EUR', NULL),
('Istanbul', 'vito_vip', '8h', 250, 'EUR', NULL),
('Istanbul', 'vito_vip', 'custom', 0, 'EUR', 40),
('Istanbul', 'maybach', '4h', 300, 'EUR', NULL),
('Istanbul', 'maybach', '8h', 500, 'EUR', NULL),
('Istanbul', 'maybach', 'custom', 0, 'EUR', 80),
-- Antalya
('Antalya', 'vito', '4h', 100, 'EUR', NULL),
('Antalya', 'vito', '8h', 170, 'EUR', NULL),
('Antalya', 'vito', 'custom', 0, 'EUR', 25),
-- Bodrum
('Bodrum', 'vito', '4h', 110, 'EUR', NULL),
('Bodrum', 'vito', '8h', 180, 'EUR', NULL),
('Bodrum', 'vito', 'custom', 0, 'EUR', 28),
-- Dubai
('Dubai', 'vito', '4h', 150, 'EUR', NULL),
('Dubai', 'vito', '8h', 250, 'EUR', NULL),
('Dubai', 'vito', 'custom', 0, 'EUR', 40),
('Dubai', 'maybach', '4h', 400, 'EUR', NULL),
('Dubai', 'maybach', '8h', 700, 'EUR', NULL),
('Dubai', 'maybach', 'custom', 0, 'EUR', 100);