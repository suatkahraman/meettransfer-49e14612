-- Add field to track original admin-set price
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS admin_set_price numeric DEFAULT NULL;

-- Add a comment to explain the field
COMMENT ON COLUMN public.reservations.admin_set_price IS 'Original price set by admin before driver modifications';