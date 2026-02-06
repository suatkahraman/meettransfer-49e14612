
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
  jwt_role text;
BEGIN
  jwt_role := COALESCE(
    current_setting('request.jwt.claim.role', true),
    (auth.jwt() ->> 'role')
  );
  is_service_role := jwt_role = 'service_role';
  
  IF is_service_role OR (auth.uid() IS NULL AND jwt_role IS NULL) THEN
    RETURN NEW;
  END IF;

  is_admin := (SELECT has_role(auth.uid(), 'admin'));
  is_agency := (OLD.agency_user_id IS NOT NULL AND OLD.agency_user_id = auth.uid());

  IF (OLD.payment_link IS DISTINCT FROM NEW.payment_link) THEN
    IF NOT is_admin THEN
      NEW.payment_link := OLD.payment_link;
    END IF;
  END IF;
  
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

  IF (OLD.payment_provider IS DISTINCT FROM NEW.payment_provider) THEN
    IF NOT (is_admin OR is_agency) THEN
      NEW.payment_provider := OLD.payment_provider;
    END IF;
  END IF;

  IF (OLD.price IS DISTINCT FROM NEW.price) THEN
    IF NOT is_admin THEN
      NEW.price := OLD.price;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

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
  is_service_role BOOLEAN;
  jwt_role text;
BEGIN
  jwt_role := COALESCE(
    current_setting('request.jwt.claim.role', true),
    (auth.jwt() ->> 'role')
  );
  is_service_role := jwt_role = 'service_role';
  
  IF is_service_role OR (auth.uid() IS NULL AND jwt_role IS NULL) THEN
    RETURN NEW;
  END IF;

  is_admin := (SELECT has_role(auth.uid(), 'admin'));
  is_customer := (OLD.customer_id IS NOT NULL AND OLD.customer_id = auth.uid());
  is_agency := (OLD.agency_user_id IS NOT NULL AND OLD.agency_user_id = auth.uid());
  user_id_match := is_admin OR is_customer OR is_agency;

  IF (OLD.payment_link IS DISTINCT FROM NEW.payment_link) THEN
    IF NOT is_admin THEN
      NEW.payment_link := OLD.payment_link;
    END IF;
  END IF;
  
  IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    IF NOT is_admin THEN
      IF OLD.payment_status = 'paid' THEN
        NEW.payment_status := OLD.payment_status;
      ELSIF user_id_match THEN
        IF NEW.payment_status NOT IN ('pending', 'pay_on_transfer') THEN
          NEW.payment_status := OLD.payment_status;
        END IF;
      ELSE
        NEW.payment_status := OLD.payment_status;
      END IF;
    END IF;
  END IF;
  
  IF (OLD.payment_provider IS DISTINCT FROM NEW.payment_provider) THEN
    IF NOT user_id_match THEN
      NEW.payment_provider := OLD.payment_provider;
    END IF;
  END IF;

  IF (OLD.payment_type IS DISTINCT FROM NEW.payment_type) THEN
    IF NOT user_id_match THEN
      NEW.payment_type := OLD.payment_type;
    END IF;
  END IF;

  IF (OLD.price IS DISTINCT FROM NEW.price) THEN
    IF NOT is_admin THEN
      NEW.price := OLD.price;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
