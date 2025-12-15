-- Add pending_admin_review and cancelled_by_customer to reservations status check constraint
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

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
  'cancelled'::text,
  'pending_admin_review'::text,
  'cancelled_by_customer'::text
]));