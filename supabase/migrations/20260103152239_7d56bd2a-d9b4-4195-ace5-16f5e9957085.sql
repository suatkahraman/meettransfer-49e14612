-- Add currency column to agency_payments
ALTER TABLE public.agency_payments 
ADD COLUMN currency TEXT NOT NULL DEFAULT 'EUR';

-- Create index for faster currency-based queries
CREATE INDEX idx_agency_payments_currency ON public.agency_payments(agency_id, currency);