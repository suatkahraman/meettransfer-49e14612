-- Drop existing check constraint and add new one with all needed statuses
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check 
CHECK (status IN (
  'awaiting-price',
  'pending_admin_review', 
  'waiting_for_customer_approval',
  'customer_approved',
  'confirmed',
  'sent_to_driver',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
  'pending_customer_info',
  'active'
));