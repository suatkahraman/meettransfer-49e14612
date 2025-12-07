-- Update existing 'new' status reservations to 'awaiting-price'
UPDATE public.reservations 
SET status = 'awaiting-price' 
WHERE status = 'new';

-- Change the default status for new reservations
ALTER TABLE public.reservations 
ALTER COLUMN status SET DEFAULT 'awaiting-price';