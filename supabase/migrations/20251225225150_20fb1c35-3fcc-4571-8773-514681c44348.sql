-- Allow Quick Booking reservations to exist before a real customer account is created
-- (customer_id will be filled later by update-quick-booking-customer)
ALTER TABLE public.reservations
  ALTER COLUMN customer_id DROP NOT NULL;