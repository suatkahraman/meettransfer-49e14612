-- Create visitor_interactions table for detailed analytics
CREATE TABLE IF NOT EXISTS public.visitor_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id text NOT NULL,
  page_path text NOT NULL,
  scroll_depths integer[] DEFAULT '{}',
  max_scroll_depth integer DEFAULT 0,
  click_count integer DEFAULT 0,
  click_heatmap jsonb DEFAULT '[]',
  form_interactions jsonb DEFAULT '{}',
  active_time_ms integer DEFAULT 0,
  idle_time_ms integer DEFAULT 0,
  engagement_score integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for fast visitor queries
CREATE INDEX IF NOT EXISTS idx_visitor_interactions_visitor_id ON public.visitor_interactions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_interactions_created_at ON public.visitor_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_interactions_page_path ON public.visitor_interactions(page_path);

-- Enable RLS
ALTER TABLE public.visitor_interactions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role can manage visitor_interactions"
ON public.visitor_interactions
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.visitor_interactions IS 'Stores detailed visitor interaction analytics including scroll depth, clicks, and form interactions';