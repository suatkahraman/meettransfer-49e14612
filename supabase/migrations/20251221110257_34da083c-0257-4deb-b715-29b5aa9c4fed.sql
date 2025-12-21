-- Create driver_payments table for tracking payments between admin and drivers
CREATE TABLE public.driver_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create driver_balances table for tracking running balance per driver
CREATE TABLE public.driver_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_balances ENABLE ROW LEVEL SECURITY;

-- RLS policies for driver_payments
CREATE POLICY "Admins can manage driver payments"
ON public.driver_payments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Drivers can view own payments"
ON public.driver_payments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.drivers d
  WHERE d.id = driver_payments.driver_id
  AND d.user_id = auth.uid()
));

-- RLS policies for driver_balances
CREATE POLICY "Admins can manage driver balances"
ON public.driver_balances
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Drivers can view own balance"
ON public.driver_balances
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.drivers d
  WHERE d.id = driver_balances.driver_id
  AND d.user_id = auth.uid()
));

-- Function to update driver balance after payment
CREATE OR REPLACE FUNCTION public.update_driver_balance_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update driver balance
  INSERT INTO public.driver_balances (driver_id, balance, updated_at)
  VALUES (NEW.driver_id, NEW.amount, now())
  ON CONFLICT (driver_id)
  DO UPDATE SET 
    balance = driver_balances.balance + NEW.amount,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically update balance when payment is made
CREATE TRIGGER on_driver_payment_insert
  AFTER INSERT ON public.driver_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_balance_on_payment();