-- Create table for storing shared booking links
CREATE TABLE public.shared_booking_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_code VARCHAR(8) NOT NULL UNIQUE,
  booking_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  view_count INTEGER DEFAULT 0
);

-- Create index for fast lookup by short_code
CREATE INDEX idx_shared_booking_links_short_code ON public.shared_booking_links(short_code);

-- Enable RLS
ALTER TABLE public.shared_booking_links ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read shared links (public sharing)
CREATE POLICY "Anyone can view shared booking links"
ON public.shared_booking_links
FOR SELECT
USING (true);

-- Allow anyone to create shared links (no auth required for sharing)
CREATE POLICY "Anyone can create shared booking links"
ON public.shared_booking_links
FOR INSERT
WITH CHECK (true);

-- Allow updates for view count increment
CREATE POLICY "Anyone can update view count"
ON public.shared_booking_links
FOR UPDATE
USING (true)
WITH CHECK (true);