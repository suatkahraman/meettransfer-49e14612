-- Update the handle_new_user_role function to make sautkahraman@gmail.com an admin on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'sautkahraman@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer');
  END IF;
  RETURN NEW;
END;
$$;

-- Update existing user if they already exist
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'sautkahraman@gmail.com';

  IF target_user_id IS NOT NULL THEN
    -- Remove existing customer role if present to avoid role confusion
    -- (Though multiple roles are allowed, we want to ensure admin is primary)
    -- We won't delete other roles to be safe, just ensure admin exists.
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;
