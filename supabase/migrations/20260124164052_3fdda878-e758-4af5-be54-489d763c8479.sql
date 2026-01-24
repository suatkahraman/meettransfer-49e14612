-- Update the trigger function to allow customers/agencies to change payment method
-- but still protect against unauthorized changes to payment_status (only 'paid' status should be protected)

CREATE OR REPLACE FUNCTION public.protect_payment_link_updates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_admin BOOLEAN;
  is_customer BOOLEAN;
  is_agency BOOLEAN;
  user_id_match BOOLEAN;
BEGIN
  -- Check if user is admin
  is_admin := (SELECT has_role(auth.uid(), 'admin'));
  
  -- Check if user is the customer who owns this reservation
  is_customer := (OLD.customer_id IS NOT NULL AND OLD.customer_id = auth.uid());
  
  -- Check if user is the agency who owns this reservation
  is_agency := (OLD.agency_user_id IS NOT NULL AND OLD.agency_user_id = auth.uid());
  
  -- Allow if user is admin, customer owner, or agency owner
  user_id_match := is_admin OR is_customer OR is_agency;

  -- PAYMENT_LINK: Only admins can set payment links
  IF (OLD.payment_link IS DISTINCT FROM NEW.payment_link) THEN
    IF NOT is_admin THEN
      NEW.payment_link := OLD.payment_link;
    END IF;
  END IF;
  
  -- PAYMENT_STATUS: 
  -- - Admins can change anything
  -- - Customers/Agencies can change ONLY if not already 'paid' (prevent fraud)
  -- - Customers/Agencies can set to 'pending' or 'pay_on_transfer'
  IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    IF NOT is_admin THEN
      -- If already paid, no one except admin can change it
      IF OLD.payment_status = 'paid' THEN
        NEW.payment_status := OLD.payment_status;
      -- If user is customer or agency, allow changing to pending or pay_on_transfer
      ELSIF user_id_match THEN
        IF NEW.payment_status NOT IN ('pending', 'pay_on_transfer') THEN
          NEW.payment_status := OLD.payment_status;
        END IF;
      ELSE
        NEW.payment_status := OLD.payment_status;
      END IF;
    END IF;
  END IF;
  
  -- PAYMENT_PROVIDER: Allow customer/agency to change if they own the reservation
  IF (OLD.payment_provider IS DISTINCT FROM NEW.payment_provider) THEN
    IF NOT user_id_match THEN
      NEW.payment_provider := OLD.payment_provider;
    END IF;
  END IF;

  -- PAYMENT_TYPE: Allow customer/agency to change if they own the reservation
  IF (OLD.payment_type IS DISTINCT FROM NEW.payment_type) THEN
    IF NOT user_id_match THEN
      NEW.payment_type := OLD.payment_type;
    END IF;
  END IF;

  -- PRICE: Only admins can change price
  IF (OLD.price IS DISTINCT FROM NEW.price) THEN
    IF NOT is_admin THEN
      NEW.price := OLD.price;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;