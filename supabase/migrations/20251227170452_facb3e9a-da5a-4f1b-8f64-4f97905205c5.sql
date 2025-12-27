-- Add customer_notes column to quick_booking_requests table
ALTER TABLE public.quick_booking_requests 
ADD COLUMN customer_notes text DEFAULT NULL;