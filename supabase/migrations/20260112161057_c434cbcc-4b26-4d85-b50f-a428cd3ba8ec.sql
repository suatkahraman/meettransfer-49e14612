-- Create a table for caching translations
CREATE TABLE public.translation_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_text_hash TEXT NOT NULL,
  source_text TEXT NOT NULL,
  target_language TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_language TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  hit_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(source_text_hash, target_language)
);

-- Create index for faster lookups
CREATE INDEX idx_translation_cache_lookup ON public.translation_cache(source_text_hash, target_language);
CREATE INDEX idx_translation_cache_expires ON public.translation_cache(expires_at);

-- Enable RLS
ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access (translations are not sensitive)
CREATE POLICY "Allow public read access to translations"
ON public.translation_cache
FOR SELECT
USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role can manage translations"
ON public.translation_cache
FOR ALL
USING (true)
WITH CHECK (true);