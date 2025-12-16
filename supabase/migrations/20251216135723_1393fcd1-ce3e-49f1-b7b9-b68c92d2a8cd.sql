-- Add flight tracking fields to reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS flight_arrival_time TIME WITHOUT TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS last_notified_arrival_time TIME WITHOUT TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS flight_status TEXT NULL,
ADD COLUMN IF NOT EXISTS flight_last_checked TIMESTAMP WITH TIME ZONE NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.reservations.flight_arrival_time IS 'Auto-fetched arrival time from flight API (actual > estimated > scheduled)';
COMMENT ON COLUMN public.reservations.last_notified_arrival_time IS 'Last notified arrival time to prevent duplicate notifications';
COMMENT ON COLUMN public.reservations.flight_status IS 'Current flight status (scheduled, active, landed, cancelled, delayed)';
COMMENT ON COLUMN public.reservations.flight_last_checked IS 'Timestamp of last flight status check';