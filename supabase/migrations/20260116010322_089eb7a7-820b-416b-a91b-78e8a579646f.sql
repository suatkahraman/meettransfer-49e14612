-- Create blocked_visitors table for blocking specific visitors
CREATE TABLE public.blocked_visitors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id text NOT NULL UNIQUE,
  reason text,
  blocked_by uuid REFERENCES auth.users(id),
  country_code text,
  country_name text,
  city text,
  ip_address text,
  blocked_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_blocked_visitors_visitor_id ON public.blocked_visitors(visitor_id) WHERE is_active = true;
CREATE INDEX idx_blocked_visitors_active ON public.blocked_visitors(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.blocked_visitors ENABLE ROW LEVEL SECURITY;

-- Only admins can manage blocked visitors
CREATE POLICY "Admins can view blocked visitors"
ON public.blocked_visitors
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert blocked visitors"
ON public.blocked_visitors
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update blocked visitors"
ON public.blocked_visitors
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete blocked visitors"
ON public.blocked_visitors
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_blocked_visitors_updated_at
BEFORE UPDATE ON public.blocked_visitors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();