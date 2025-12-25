-- Create page_visits table for tracking visitors
CREATE TABLE public.page_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id text NOT NULL,
  page_path text NOT NULL,
  country_code text,
  country_name text,
  city text,
  browser text,
  device text,
  referrer text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  session_start timestamp with time zone NOT NULL DEFAULT now(),
  last_activity timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- Admins can view all visits
CREATE POLICY "Admins can view page visits" 
ON public.page_visits 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow anonymous inserts for tracking (public access)
CREATE POLICY "Anyone can insert page visits" 
ON public.page_visits 
FOR INSERT 
WITH CHECK (true);

-- Allow updates for session tracking
CREATE POLICY "Anyone can update own visits" 
ON public.page_visits 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_page_visits_created_at ON public.page_visits (created_at DESC);
CREATE INDEX idx_page_visits_visitor_id ON public.page_visits (visitor_id);
CREATE INDEX idx_page_visits_last_activity ON public.page_visits (last_activity DESC);