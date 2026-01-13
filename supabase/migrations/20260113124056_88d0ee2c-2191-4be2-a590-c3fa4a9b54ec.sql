-- Create a public storage bucket for hero videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hero-videos', 
  'hero-videos', 
  true,
  52428800, -- 50MB limit
  ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to hero videos
CREATE POLICY "Public can view hero videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-videos');

-- Only authenticated admins can upload/update/delete
CREATE POLICY "Admins can upload hero videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hero-videos' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update hero videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hero-videos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete hero videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hero-videos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);