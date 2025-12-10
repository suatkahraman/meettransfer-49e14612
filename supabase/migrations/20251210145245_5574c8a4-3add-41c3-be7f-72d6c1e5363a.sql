
-- Add 'agency' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agency';

-- Add balance field to agencies table
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0;

-- Add user_id to agencies for agency login
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create agency_reservation_details table for agency-specific pricing (separate from driver view)
CREATE TABLE IF NOT EXISTS public.agency_reservation_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  customer_price numeric DEFAULT 0,
  company_amount numeric DEFAULT 0,
  agency_profit numeric GENERATED ALWAYS AS (customer_price - company_amount) STORED,
  agency_notes text,
  payment_status text DEFAULT 'not_paid' CHECK (payment_status IN ('not_paid', 'partially_paid', 'paid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(reservation_id)
);

-- Create agency_transactions table for balance history
CREATE TABLE IF NOT EXISTS public.agency_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('top_up', 'deduction')),
  description text,
  reservation_id uuid REFERENCES public.reservations(id),
  balance_after numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agency_reservation_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_transactions ENABLE ROW LEVEL SECURITY;

-- RLS for agency_reservation_details
CREATE POLICY "Admins can manage agency reservation details"
ON public.agency_reservation_details FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agencies can view own reservation details"
ON public.agency_reservation_details FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reservations r
    JOIN public.agencies a ON r.agency_id = a.id
    WHERE r.id = agency_reservation_details.reservation_id
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Agencies can update own reservation details"
ON public.agency_reservation_details FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.reservations r
    JOIN public.agencies a ON r.agency_id = a.id
    WHERE r.id = agency_reservation_details.reservation_id
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Agencies can insert own reservation details"
ON public.agency_reservation_details FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reservations r
    JOIN public.agencies a ON r.agency_id = a.id
    WHERE r.id = reservation_id
    AND a.user_id = auth.uid()
  )
);

-- RLS for agency_transactions
CREATE POLICY "Admins can manage agency transactions"
ON public.agency_transactions FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agencies can view own transactions"
ON public.agency_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = agency_transactions.agency_id
    AND a.user_id = auth.uid()
  )
);

-- Update agencies RLS to allow agency users to view their own agency
CREATE POLICY "Agencies can view own agency"
ON public.agencies FOR SELECT
USING (user_id = auth.uid());

-- Update reservations RLS for agency access
CREATE POLICY "Agencies can view own reservations"
ON public.reservations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = reservations.agency_id
    AND a.user_id = auth.uid()
  )
);

-- Trigger for updated_at on agency_reservation_details
CREATE TRIGGER update_agency_reservation_details_updated_at
BEFORE UPDATE ON public.agency_reservation_details
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.agency_reservation_details;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agency_transactions;
