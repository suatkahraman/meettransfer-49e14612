-- Create trigger to update driver balance when payment is deleted
CREATE OR REPLACE FUNCTION public.update_driver_balance_on_payment_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reverse the balance change when payment is deleted
  IF OLD.payment_type = 'to_driver' THEN
    -- Payment was to driver, so we need to subtract the amount
    UPDATE public.driver_balances
    SET balance = balance - OLD.amount, updated_at = now()
    WHERE driver_id = OLD.driver_id;
  ELSIF OLD.payment_type = 'from_driver' THEN
    -- Payment was from driver, so we need to add the amount back
    UPDATE public.driver_balances
    SET balance = balance + OLD.amount, updated_at = now()
    WHERE driver_id = OLD.driver_id;
  END IF;
  
  RETURN OLD;
END;
$function$;

-- Create the delete trigger
DROP TRIGGER IF EXISTS on_driver_payment_delete ON public.driver_payments;
CREATE TRIGGER on_driver_payment_delete
  BEFORE DELETE ON public.driver_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_balance_on_payment_delete();