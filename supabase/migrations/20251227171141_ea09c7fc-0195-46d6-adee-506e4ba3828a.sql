-- Add customer_notes column to reservations table
ALTER TABLE public.reservations 
ADD COLUMN customer_notes text DEFAULT NULL;