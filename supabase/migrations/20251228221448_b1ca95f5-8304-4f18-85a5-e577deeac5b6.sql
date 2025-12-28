-- Add user_id column to app_installations to track which user installed
ALTER TABLE public.app_installations
ADD COLUMN IF NOT EXISTS user_id uuid;