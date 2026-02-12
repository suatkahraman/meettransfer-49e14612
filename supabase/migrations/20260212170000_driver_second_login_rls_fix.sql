-- Driver panel second-login access fix
-- Frontend uses supabase.from('drivers'), so keep DB table name as public.drivers

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  phone text NOT NULL,
  region text,
  commission_rate numeric(5,2) DEFAULT 10.00,
  active boolean DEFAULT true,
  plate_number text,
  vehicle_model text,
  vehicle_color text,
  average_rating numeric(2,1) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS plate_number text;
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS vehicle_model text;
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS vehicle_color text;
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS average_rating numeric(2,1) DEFAULT 0;
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0;
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS drivers_user_id_key ON public.drivers(user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'drivers_user_id_fkey'
      AND conrelid = 'public.drivers'::regclass
  ) THEN
    ALTER TABLE public.drivers
      ADD CONSTRAINT drivers_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.drivers FROM anon;
GRANT SELECT, UPDATE ON public.drivers TO authenticated;

DROP POLICY IF EXISTS "Drivers can view own profile" ON public.drivers;
CREATE POLICY "Drivers can view own profile"
  ON public.drivers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Drivers can update own profile" ON public.drivers;
CREATE POLICY "Drivers can update own profile"
  ON public.drivers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMIT;
