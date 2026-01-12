
-- Create promo_codes table for managing discount codes
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percentage INTEGER NOT NULL DEFAULT 30,
  description TEXT,
  applies_to TEXT NOT NULL DEFAULT 'return_transfer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_usage INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Everyone can read active promo codes (for validation)
CREATE POLICY "Anyone can read active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the current MEET30RETURN promo code
INSERT INTO public.promo_codes (code, discount_percentage, description, applies_to, is_active)
VALUES ('MEET30RETURN', 30, 'Gidiş-dönüş transferlerde %30 indirim', 'return_transfer', true);
