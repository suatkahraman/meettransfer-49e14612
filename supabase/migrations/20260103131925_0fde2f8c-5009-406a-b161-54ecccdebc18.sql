-- Add TRY conversion fields to agency_reservation_details
ALTER TABLE public.agency_reservation_details
ADD COLUMN IF NOT EXISTS company_amount_try numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS exchange_rate_used numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS conversion_date date DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.agency_reservation_details.company_amount_try IS 'Company amount converted to TRY using daily exchange rate';
COMMENT ON COLUMN public.agency_reservation_details.exchange_rate_used IS 'Exchange rate used for TRY conversion (1 foreign currency = X TRY)';
COMMENT ON COLUMN public.agency_reservation_details.conversion_date IS 'Date when the exchange rate was applied';