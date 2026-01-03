-- Add currency column to agency_transactions
ALTER TABLE public.agency_transactions 
ADD COLUMN currency TEXT NOT NULL DEFAULT 'EUR';