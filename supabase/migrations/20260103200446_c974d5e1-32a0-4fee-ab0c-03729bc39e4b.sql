-- Add vehicle_color column to drivers table
ALTER TABLE public.drivers 
ADD COLUMN vehicle_color text DEFAULT NULL;