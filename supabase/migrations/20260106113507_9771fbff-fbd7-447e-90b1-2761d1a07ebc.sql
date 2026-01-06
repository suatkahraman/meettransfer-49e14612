-- Enable pg_net extension for HTTP calls from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to call auto-price edge function
CREATE OR REPLACE FUNCTION public.trigger_auto_price_quick_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  -- Get Supabase URL and service role key from vault or env
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- If settings not available, use hardcoded project URL
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://zqykoyugubaeealrspxm.supabase.co';
  END IF;
  
  -- Only trigger for new pending bookings without agency
  IF NEW.status = 'pending' AND NEW.agency_id IS NULL THEN
    -- Use pg_net to make async HTTP call to edge function
    PERFORM extensions.http_post(
      url := supabase_url || '/functions/v1/auto-price-quick-booking',
      body := jsonb_build_object('quick_booking_id', NEW.id)::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(service_role_key, current_setting('request.jwt', true))
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Auto-price trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on quick_booking_requests table
DROP TRIGGER IF EXISTS trigger_auto_price_on_quick_booking ON public.quick_booking_requests;

CREATE TRIGGER trigger_auto_price_on_quick_booking
  AFTER INSERT ON public.quick_booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_price_quick_booking();