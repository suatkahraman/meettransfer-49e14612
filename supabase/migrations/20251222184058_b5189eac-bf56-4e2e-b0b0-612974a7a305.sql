-- Add promo_code column to reservations table
ALTER TABLE public.reservations ADD COLUMN promo_code text DEFAULT NULL;

-- Add comment for the column
COMMENT ON COLUMN public.reservations.promo_code IS 'Promotion code used for the reservation (e.g., Meet40Return for 40% discount)';