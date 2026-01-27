-- Add monthly pricing support to region_prices table
-- valid_from and valid_to columns allow seasonal/monthly pricing

ALTER TABLE public.region_prices 
ADD COLUMN IF NOT EXISTS valid_from DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS valid_to DATE DEFAULT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN public.region_prices.valid_from IS 'Start date for seasonal pricing (NULL = always valid)';
COMMENT ON COLUMN public.region_prices.valid_to IS 'End date for seasonal pricing (NULL = no end date)';

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_region_prices_validity 
ON public.region_prices (valid_from, valid_to) 
WHERE is_active = true;

-- Similarly add to intercity_prices table
ALTER TABLE public.intercity_prices 
ADD COLUMN IF NOT EXISTS valid_from DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS valid_to DATE DEFAULT NULL;

COMMENT ON COLUMN public.intercity_prices.valid_from IS 'Start date for seasonal pricing (NULL = always valid)';
COMMENT ON COLUMN public.intercity_prices.valid_to IS 'End date for seasonal pricing (NULL = no end date)';

CREATE INDEX IF NOT EXISTS idx_intercity_prices_validity 
ON public.intercity_prices (valid_from, valid_to) 
WHERE is_active = true;

-- Similarly add to hourly_rental_prices table
ALTER TABLE public.hourly_rental_prices 
ADD COLUMN IF NOT EXISTS valid_from DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS valid_to DATE DEFAULT NULL;

COMMENT ON COLUMN public.hourly_rental_prices.valid_from IS 'Start date for seasonal pricing (NULL = always valid)';
COMMENT ON COLUMN public.hourly_rental_prices.valid_to IS 'End date for seasonal pricing (NULL = no end date)';