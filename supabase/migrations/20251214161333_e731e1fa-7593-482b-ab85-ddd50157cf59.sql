-- Add explicit SELECT policy for reservation_templates to restrict viewing to admins only
CREATE POLICY "Admins can view templates"
ON public.reservation_templates
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));