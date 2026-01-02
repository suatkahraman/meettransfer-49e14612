-- Add currency field to agencies table
ALTER TABLE public.agencies
ADD COLUMN currency text NOT NULL DEFAULT 'EUR';