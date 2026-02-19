
CREATE OR REPLACE FUNCTION public.trigger_auto_price_quick_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  -- Get Supabase URL and service role key
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://lzwwxuxwlssxutwiuxtf.supabase.co';
  END IF;
  
  -- Only trigger for new pending bookings without agency
  IF NEW.status = 'pending' AND NEW.agency_id IS NULL THEN
    -- Use pg_net (net.http_post) instead of non-existent extensions.http_post
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/auto-price-quick-booking',
      body := jsonb_build_object('quick_booking_id', NEW.id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(service_role_key, current_setting('request.jwt', true))
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Auto-price trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;
