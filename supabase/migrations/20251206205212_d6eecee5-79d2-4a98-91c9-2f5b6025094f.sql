-- Create a separate table for admin notes with admin-only access
CREATE TABLE public.reservation_admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(reservation_id)
);

-- Enable RLS
ALTER TABLE public.reservation_admin_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can access admin notes
CREATE POLICY "Admins can manage admin notes"
ON public.reservation_admin_notes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing admin_notes data
INSERT INTO public.reservation_admin_notes (reservation_id, notes, created_at, updated_at)
SELECT id, admin_notes, created_at, updated_at
FROM public.reservations
WHERE admin_notes IS NOT NULL AND admin_notes != '';

-- Drop the admin_notes column from reservations table
ALTER TABLE public.reservations DROP COLUMN admin_notes;

-- Add trigger for updated_at
CREATE TRIGGER update_reservation_admin_notes_updated_at
  BEFORE UPDATE ON public.reservation_admin_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();