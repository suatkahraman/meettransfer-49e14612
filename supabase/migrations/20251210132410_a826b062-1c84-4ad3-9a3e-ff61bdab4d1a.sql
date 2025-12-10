-- Create agencies table
CREATE TABLE public.agencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_name TEXT NOT NULL,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Admin only policies for agencies
CREATE POLICY "Admins can manage agencies"
ON public.agencies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add agency_id to reservations table
ALTER TABLE public.reservations 
ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;

-- Create index for agency lookups
CREATE INDEX idx_reservations_agency_id ON public.reservations(agency_id);

-- Add trigger for updated_at on agencies
CREATE TRIGGER update_agencies_updated_at
BEFORE UPDATE ON public.agencies
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for agencies
ALTER PUBLICATION supabase_realtime ADD TABLE public.agencies;