-- Create a function to automatically link OAuth accounts with existing email/password accounts
-- This will be triggered when a new identity is created (e.g., Google login)
CREATE OR REPLACE FUNCTION public.handle_identity_linking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_user_id uuid;
  identity_email text;
BEGIN
  -- Get the email from the new identity
  identity_email := NEW.identity_data->>'email';
  
  -- If no email in identity, skip
  IF identity_email IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if there's an existing user with this email but different id
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = identity_email
    AND id != NEW.user_id
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- If an existing user is found, we need to handle the merge
  -- In Supabase, we can update the identity to point to the existing user
  IF existing_user_id IS NOT NULL THEN
    -- Update the identity to point to the existing user
    UPDATE auth.identities
    SET user_id = existing_user_id
    WHERE id = NEW.id;
    
    -- Update the NEW record for the trigger return
    NEW.user_id := existing_user_id;
    
    -- Delete the orphaned new user account that was created
    -- This is the account that was just created by OAuth but should be merged
    DELETE FROM auth.users 
    WHERE id != existing_user_id 
      AND email = identity_email
      AND id NOT IN (SELECT DISTINCT user_id FROM auth.identities WHERE user_id IS NOT NULL);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.identities to auto-link accounts
-- Note: This trigger runs AFTER insert to handle the linking
DROP TRIGGER IF EXISTS on_identity_created ON auth.identities;
CREATE TRIGGER on_identity_created
  AFTER INSERT ON auth.identities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_identity_linking();