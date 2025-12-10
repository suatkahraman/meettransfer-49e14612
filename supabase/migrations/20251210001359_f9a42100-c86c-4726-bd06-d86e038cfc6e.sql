-- Add reservation_code column to reservations table
ALTER TABLE public.reservations 
ADD COLUMN reservation_code TEXT UNIQUE;

-- Create function to generate unique reservation code
CREATE OR REPLACE FUNCTION public.generate_reservation_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate MT + 6 random digits
    new_code := 'MT' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.reservations WHERE reservation_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Create trigger to auto-generate reservation code on insert
CREATE OR REPLACE FUNCTION public.set_reservation_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reservation_code IS NULL THEN
    NEW.reservation_code := generate_reservation_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_reservation_code
BEFORE INSERT ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.set_reservation_code();

-- Generate codes for existing reservations that don't have one
UPDATE public.reservations 
SET reservation_code = generate_reservation_code() 
WHERE reservation_code IS NULL;