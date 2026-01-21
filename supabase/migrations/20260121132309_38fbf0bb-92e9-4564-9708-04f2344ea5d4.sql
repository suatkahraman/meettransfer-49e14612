-- Add city column to agencies table
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS city text;