-- Drop the existing status check constraint
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

-- Add updated status check constraint with cancelled_by_agency
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
  'cancelled_by_customer'::text,
  'cancelled_by_agency'::text,
  'customer_rejected'::text,
  'rejected'::text, 
  'pending_customer_info'::text, 
  'active'::text
]));

-- Update existing agency cancellations to use the new status
UPDATE public.reservations 
SET status = 'cancelled_by_agency' 
WHERE status = 'cancelled_by_customer' 
AND agency_id IS NOT NULL;