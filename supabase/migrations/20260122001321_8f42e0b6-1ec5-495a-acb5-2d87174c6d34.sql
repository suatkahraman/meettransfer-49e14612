-- Add token_hash column for secure token storage
ALTER TABLE public.customer_magic_links 
ADD COLUMN token_hash text;

-- Create index on token_hash for efficient lookups
CREATE INDEX idx_customer_magic_links_token_hash ON public.customer_magic_links(token_hash);

-- Comment explaining the security improvement
COMMENT ON COLUMN public.customer_magic_links.token_hash IS 'SHA-256 hash of the magic link token. Raw tokens should never be stored, only hashed versions for comparison.';
COMMENT ON COLUMN public.customer_magic_links.token IS 'DEPRECATED: Will be removed after migration. Use token_hash instead.';