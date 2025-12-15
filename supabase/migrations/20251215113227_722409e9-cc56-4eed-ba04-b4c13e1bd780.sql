-- Add new field for cash amount to collect from passenger (informational only, not for calculations)
ALTER TABLE public.reservations 
ADD COLUMN passenger_cash_amount numeric DEFAULT NULL;

-- Add currency field for passenger cash
ALTER TABLE public.reservations 
ADD COLUMN passenger_cash_currency text DEFAULT 'TRY';