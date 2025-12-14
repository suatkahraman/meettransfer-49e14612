-- Drop the existing check constraint
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_payment_type_check;

-- Add updated check constraint that includes all existing values plus agency_pay
ALTER TABLE public.reservations ADD CONSTRAINT reservations_payment_type_check 
CHECK (payment_type IN ('cash', 'payment_link', 'agency_pay', 'none', 'online'));