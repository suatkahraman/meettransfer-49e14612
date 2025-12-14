-- Drop old constraint and add updated one with 'payment_link'
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_payment_type_check;

ALTER TABLE public.reservations ADD CONSTRAINT reservations_payment_type_check 
CHECK (payment_type = ANY (ARRAY['cash'::text, 'no-cash'::text, 'card'::text, 'online'::text, 'invoice'::text, 'none'::text, 'payment_link'::text]));