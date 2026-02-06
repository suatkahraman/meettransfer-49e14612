
-- Drop the incompatible trigger from quick_booking_requests
DROP TRIGGER IF EXISTS protect_payment_fields_trigger ON quick_booking_requests;

-- Create a separate function for quick_booking_requests payment field protection
CREATE OR REPLACE FUNCTION public.protect_quick_booking_payment_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_admin BOOLEAN;
  is_agency BOOLEAN;
  is_service_role BOOLEAN;
BEGIN
  -- Service role (edge functions, triggers) bypasses all protections
  is_service_role := COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role';
  IF is_service_role THEN
    RETURN NEW;
  END IF;

  -- Check if user is admin
  is_admin := (SELECT has_role(auth.uid(), 'admin'));
  
  -- Check if user is the agency who owns this booking
  is_agency := (OLD.agency_user_id IS NOT NULL AND OLD.agency_user_id = auth.uid());

  -- PAYMENT_LINK: Only admins can set payment links
  IF (OLD.payment_link IS DISTINCT FROM NEW.payment_link) THEN
    IF NOT is_admin THEN
      NEW.payment_link := OLD.payment_link;
    END IF;
  END IF;
  
  -- PAYMENT_STATUS: Only admins can change (agencies can set pending)
  IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    IF NOT is_admin THEN
      IF OLD.payment_status = 'paid' THEN
        NEW.payment_status := OLD.payment_status;
      ELSIF is_agency THEN
        IF NEW.payment_status NOT IN ('pending', 'pay_on_transfer') THEN
          NEW.payment_status := OLD.payment_status;
        END IF;
      ELSE
        NEW.payment_status := OLD.payment_status;
      END IF;
    END IF;
  END IF;

  -- PAYMENT_PROVIDER: Allow agency to change if they own the booking
  IF (OLD.payment_provider IS DISTINCT FROM NEW.payment_provider) THEN
    IF NOT (is_admin OR is_agency) THEN
      NEW.payment_provider := OLD.payment_provider;
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

-- Re-attach the correct trigger
CREATE TRIGGER protect_payment_fields_trigger
  BEFORE UPDATE ON quick_booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION protect_quick_booking_payment_fields();
