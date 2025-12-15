-- Fix ALL infinite recursion issues across all tables

-- 1) agency_reservation_details: policies query reservations which can create loops
DROP POLICY IF EXISTS "Agencies can view own reservation details" ON public.agency_reservation_details;
DROP POLICY IF EXISTS "Agencies can update own reservation details" ON public.agency_reservation_details;
DROP POLICY IF EXISTS "Agencies can insert own reservation details" ON public.agency_reservation_details;

-- Add agency_user_id column to agency_reservation_details to avoid joins
ALTER TABLE public.agency_reservation_details
ADD COLUMN IF NOT EXISTS agency_user_id uuid;

-- Backfill existing rows
UPDATE public.agency_reservation_details ard
SET agency_user_id = a.user_id
FROM public.reservations r
JOIN public.agencies a ON r.agency_id = a.id
WHERE ard.reservation_id = r.id
  AND (ard.agency_user_id IS NULL OR ard.agency_user_id <> a.user_id);

-- Create trigger to keep agency_user_id in sync
CREATE OR REPLACE FUNCTION public.set_agency_reservation_agency_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT a.user_id INTO NEW.agency_user_id
  FROM public.reservations r
  JOIN public.agencies a ON r.agency_id = a.id
  WHERE r.id = NEW.reservation_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_agency_reservation_agency_user_id ON public.agency_reservation_details;
CREATE TRIGGER set_agency_reservation_agency_user_id
BEFORE INSERT OR UPDATE OF reservation_id
ON public.agency_reservation_details
FOR EACH ROW
EXECUTE FUNCTION public.set_agency_reservation_agency_user_id();

-- Create simpler policies using agency_user_id
CREATE POLICY "Agencies can view own reservation details"
ON public.agency_reservation_details
AS PERMISSIVE
FOR SELECT
USING (agency_user_id = auth.uid());

CREATE POLICY "Agencies can update own reservation details"
ON public.agency_reservation_details
AS PERMISSIVE
FOR UPDATE
USING (agency_user_id = auth.uid());

CREATE POLICY "Agencies can insert own reservation details"
ON public.agency_reservation_details
AS PERMISSIVE
FOR INSERT
WITH CHECK (agency_user_id = auth.uid());

-- 2) reservations: Fix Agencies can view policy to use denormalized column
-- Add agency_user_id to reservations table
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS agency_user_id uuid;

-- Backfill
UPDATE public.reservations r
SET agency_user_id = a.user_id
FROM public.agencies a
WHERE r.agency_id = a.id
  AND (r.agency_user_id IS NULL OR r.agency_user_id <> a.user_id);

-- Trigger to keep in sync
CREATE OR REPLACE FUNCTION public.set_reservation_agency_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.agency_id IS NULL THEN
    NEW.agency_user_id := NULL;
    RETURN NEW;
  END IF;

  SELECT a.user_id INTO NEW.agency_user_id
  FROM public.agencies a
  WHERE a.id = NEW.agency_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_reservation_agency_user_id ON public.reservations;
CREATE TRIGGER set_reservation_agency_user_id
BEFORE INSERT OR UPDATE OF agency_id
ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.set_reservation_agency_user_id();

-- Drop old policy and create new one
DROP POLICY IF EXISTS "Agencies can view own reservations" ON public.reservations;

CREATE POLICY "Agencies can view own reservations"
ON public.reservations
AS PERMISSIVE
FOR SELECT
USING (agency_user_id = auth.uid());