-- Add NOT NULL constraint to customer_id to ensure proper RLS enforcement
ALTER TABLE public.reservations 
ALTER COLUMN customer_id SET NOT NULL;