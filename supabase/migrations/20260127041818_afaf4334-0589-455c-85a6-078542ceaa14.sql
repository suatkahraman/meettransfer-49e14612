-- Drop the existing check constraint and add a more flexible one
ALTER TABLE public.hourly_rental_prices 
DROP CONSTRAINT IF EXISTS hourly_rental_prices_duration_type_check;

-- Add new constraint that allows 1h-24h and day options
ALTER TABLE public.hourly_rental_prices 
ADD CONSTRAINT hourly_rental_prices_duration_type_check 
CHECK (duration_type IN (
  '1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h', '10h', 
  '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h',
  '21h', '22h', '23h', '24h',
  '1d', '2d', '3d', '4d', '5d',
  'daily', 'custom'
));