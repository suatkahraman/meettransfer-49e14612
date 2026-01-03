-- Drop the old constraint and add a new one with the missing status value
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check 
CHECK (status = ANY (ARRAY[
  'awaiting-price'::text, 
  'pending_admin_review'::text, 
  'waiting_for_customer_approval'::text,
  'waiting_for_agency_approval'::text,
  'customer_approved'::text, 
  'confirmed'::text, 
  'sent_to_driver'::text, 
  'in_progress'::text, 
  'completed'::text, 
  'cancelled'::text, 
  'rejected'::text, 
  'pending_customer_info'::text, 
  'active'::text
]));