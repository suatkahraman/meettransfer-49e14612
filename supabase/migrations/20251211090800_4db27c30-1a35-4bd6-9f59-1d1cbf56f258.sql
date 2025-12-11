-- Add agency_price_currency column to agency_reservation_details table
ALTER TABLE public.agency_reservation_details 
ADD COLUMN IF NOT EXISTS agency_price_currency text DEFAULT 'TRY';