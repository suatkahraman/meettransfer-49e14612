-- Fix infinite recursion issues blocking admin data visibility

-- 1) user_roles: remove admin policies that call has_role(), which queries user_roles and can recurse
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- 2) reservations: add denormalized driver_user_id to avoid joining drivers table inside RLS
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS driver_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_reservations_driver_user_id
ON public.reservations (driver_user_id);

-- Backfill existing rows
UPDATE public.reservations r
SET driver_user_id = d.user_id
FROM public.drivers d
WHERE r.driver_id = d.id
  AND (r.driver_user_id IS NULL OR r.driver_user_id <> d.user_id);

-- Keep driver_user_id in sync whenever driver_id changes
CREATE OR REPLACE FUNCTION public.set_reservation_driver_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.driver_id IS NULL THEN
    NEW.driver_user_id := NULL;
    RETURN NEW;
  END IF;

  SELECT d.user_id
  INTO NEW.driver_user_id
  FROM public.drivers d
  WHERE d.id = NEW.driver_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_reservation_driver_user_id ON public.reservations;
CREATE TRIGGER set_reservation_driver_user_id
BEFORE INSERT OR UPDATE OF driver_id
ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.set_reservation_driver_user_id();

-- 3) reservations: replace driver policies to use driver_user_id (break drivers<->reservations recursion)
DROP POLICY IF EXISTS "Drivers can view assigned reservations" ON public.reservations;
DROP POLICY IF EXISTS "Drivers can update assigned reservations" ON public.reservations;

CREATE POLICY "Drivers can view assigned reservations"
ON public.reservations
AS PERMISSIVE
FOR SELECT
USING (driver_user_id = auth.uid());

CREATE POLICY "Drivers can update assigned reservations"
ON public.reservations
AS PERMISSIVE
FOR UPDATE
USING (driver_user_id = auth.uid())
WITH CHECK (driver_user_id = auth.uid());
