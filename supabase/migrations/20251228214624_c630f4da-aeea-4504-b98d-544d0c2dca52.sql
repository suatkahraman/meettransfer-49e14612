-- Add country columns to app_installations table
ALTER TABLE public.app_installations 
ADD COLUMN IF NOT EXISTS country_code text,
ADD COLUMN IF NOT EXISTS country_name text,
ADD COLUMN IF NOT EXISTS city text;