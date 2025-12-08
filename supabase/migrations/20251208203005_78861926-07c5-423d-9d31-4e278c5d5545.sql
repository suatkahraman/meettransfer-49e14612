-- Drop existing check constraints
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_payment_type_check;

-- Add updated status constraint with all workflow statuses
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check 
CHECK (status = ANY (ARRAY[
  'new'::text, 
  'pending_price'::text,
  'awaiting-price'::text,
  'waiting_for_customer_approval'::text,
  'awaiting-customer'::text,
  'customer_approved'::text,
  'customer_rejected'::text,
  'confirmed'::text,
  'assigned'::text,
  'sent_to_driver'::text,
  'active'::text, 
  'completed'::text, 
  'cancelled'::text
]));

-- Add updated payment type constraint with all payment options
ALTER TABLE public.reservations ADD CONSTRAINT reservations_payment_type_check 
CHECK (payment_type = ANY (ARRAY[
  'cash'::text, 
  'no-cash'::text,
  'card'::text,
  'online'::text,
  'invoice'::text,
  'none'::text
]));