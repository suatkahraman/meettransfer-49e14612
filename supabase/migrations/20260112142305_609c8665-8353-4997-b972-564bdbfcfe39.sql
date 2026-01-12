-- Add service_type column to quick_booking_requests table
ALTER TABLE public.quick_booking_requests 
ADD COLUMN service_type text NOT NULL DEFAULT 'transfer';

-- Add duration_hours column for hourly rentals
ALTER TABLE public.quick_booking_requests 
ADD COLUMN duration_hours integer NULL;

-- Add city column for hourly rentals (pickup city)
ALTER TABLE public.quick_booking_requests 
ADD COLUMN city text NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.quick_booking_requests.service_type IS 'Type of service: transfer or hourly';
COMMENT ON COLUMN public.quick_booking_requests.duration_hours IS 'Duration in hours for hourly rental bookings';
COMMENT ON COLUMN public.quick_booking_requests.city IS 'City for hourly rental bookings';