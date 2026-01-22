-- First, create a function to generate SHA-256 hash in PostgreSQL
CREATE OR REPLACE FUNCTION generate_sha256_hash(input_text text)
RETURNS text
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN encode(sha256(input_text::bytea), 'hex');
END;
$$;

-- Migrate existing tokens: generate hash for all rows that don't have token_hash yet
UPDATE public.customer_magic_links 
SET token_hash = generate_sha256_hash(token)
WHERE token_hash IS NULL AND token IS NOT NULL;

-- Drop the deprecated plaintext token column (security improvement)
ALTER TABLE public.customer_magic_links DROP COLUMN token;

-- Drop the helper function as it's no longer needed
DROP FUNCTION generate_sha256_hash(text);

-- Add NOT NULL constraint to token_hash now that all rows have values
ALTER TABLE public.customer_magic_links ALTER COLUMN token_hash SET NOT NULL;

-- Add unique constraint on token_hash
ALTER TABLE public.customer_magic_links ADD CONSTRAINT customer_magic_links_token_hash_unique UNIQUE (token_hash);