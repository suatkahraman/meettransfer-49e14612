-- Add city column to agency_applications table
ALTER TABLE public.agency_applications 
ADD COLUMN city TEXT;