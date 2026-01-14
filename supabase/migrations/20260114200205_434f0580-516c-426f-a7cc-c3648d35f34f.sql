-- Add created_via_ai column to track AI assistant bookings
ALTER TABLE public.quick_booking_requests 
ADD COLUMN created_via_ai BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.quick_booking_requests.created_via_ai IS 'Indicates if the booking was created through the AI assistant';