-- Create table for caching Google reviews
CREATE TABLE public.google_reviews_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'en',
  reviews JSONB NOT NULL DEFAULT '[]'::jsonb,
  rating NUMERIC(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_language UNIQUE (language)
);

-- Enable RLS
ALTER TABLE public.google_reviews_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can read cached reviews"
ON public.google_reviews_cache
FOR SELECT
USING (true);

-- Create policy for service role to update cache
CREATE POLICY "Service role can manage cache"
ON public.google_reviews_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_google_reviews_cache_language ON public.google_reviews_cache(language);
CREATE INDEX idx_google_reviews_cache_expires ON public.google_reviews_cache(expires_at);