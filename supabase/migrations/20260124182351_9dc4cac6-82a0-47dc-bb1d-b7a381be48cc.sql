-- Add trigger to protect payment-related fields on reservations table
-- This ensures customers/agencies can only change payment_type and payment_provider
-- while admins retain full control over price, payment_link, and payment_status

CREATE TRIGGER protect_payment_link_updates_trigger
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_payment_link_updates();