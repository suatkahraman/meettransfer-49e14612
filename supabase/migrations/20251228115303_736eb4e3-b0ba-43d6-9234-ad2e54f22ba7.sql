-- Update the driver balance trigger to handle both payment types
CREATE OR REPLACE FUNCTION public.update_driver_balance_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If payment is TO driver, add to balance (company paid driver)
  -- If payment is FROM driver, subtract from balance (driver paid company)
  IF NEW.payment_type = 'to_driver' THEN
    INSERT INTO public.driver_balances (driver_id, balance, updated_at)
    VALUES (NEW.driver_id, NEW.amount, now())
    ON CONFLICT (driver_id)
    DO UPDATE SET 
      balance = driver_balances.balance + NEW.amount,
      updated_at = now();
  ELSIF NEW.payment_type = 'from_driver' THEN
    INSERT INTO public.driver_balances (driver_id, balance, updated_at)
    VALUES (NEW.driver_id, -NEW.amount, now())
    ON CONFLICT (driver_id)
    DO UPDATE SET 
      balance = driver_balances.balance - NEW.amount,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;