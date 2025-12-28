-- Create table for tracking app installations
CREATE TABLE public.app_installations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id text NOT NULL,
  installed_at timestamp with time zone NOT NULL DEFAULT now(),
  device text,
  browser text,
  platform text
);

-- Enable RLS
ALTER TABLE public.app_installations ENABLE ROW LEVEL SECURITY;

-- Admins can view all installations
CREATE POLICY "Admins can view app installations"
ON public.app_installations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert (for tracking)
CREATE POLICY "Anyone can insert app installations"
ON public.app_installations
FOR INSERT
WITH CHECK (true);

-- Create unique constraint to prevent duplicate tracking
CREATE UNIQUE INDEX idx_app_installations_visitor ON public.app_installations(visitor_id);