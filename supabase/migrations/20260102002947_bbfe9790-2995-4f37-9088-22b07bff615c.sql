-- Create agency_applications table for agency registration requests
CREATE TABLE public.agency_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  comments TEXT,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agency_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application
CREATE POLICY "Anyone can submit agency applications"
ON public.agency_applications
FOR INSERT
WITH CHECK (true);

-- Admins can manage all applications
CREATE POLICY "Admins can manage agency applications"
ON public.agency_applications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for email uniqueness check
CREATE INDEX idx_agency_applications_email ON public.agency_applications(email);
CREATE INDEX idx_agency_applications_status ON public.agency_applications(status);