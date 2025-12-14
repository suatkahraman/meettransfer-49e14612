-- Create driver_reviews table
CREATE TABLE public.driver_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL UNIQUE,
  driver_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.driver_reviews 
  ADD CONSTRAINT driver_reviews_reservation_id_fkey 
  FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;

ALTER TABLE public.driver_reviews 
  ADD CONSTRAINT driver_reviews_driver_id_fkey 
  FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.driver_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin can view all reviews
CREATE POLICY "Admins can manage all reviews"
ON public.driver_reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Drivers can view their own reviews
CREATE POLICY "Drivers can view own reviews"
ON public.driver_reviews
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.drivers 
  WHERE drivers.id = driver_reviews.driver_id 
  AND drivers.user_id = auth.uid()
));

-- Customers can view their submitted reviews
CREATE POLICY "Customers can view own reviews"
ON public.driver_reviews
FOR SELECT
USING (auth.uid() = customer_id);

-- Customers can insert reviews for their own reservations
CREATE POLICY "Customers can create reviews for own reservations"
ON public.driver_reviews
FOR INSERT
WITH CHECK (
  auth.uid() = customer_id 
  AND EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE reservations.id = driver_reviews.reservation_id 
    AND reservations.customer_id = auth.uid()
    AND reservations.status = 'completed'
  )
);

-- Create index for faster driver rating queries
CREATE INDEX idx_driver_reviews_driver_id ON public.driver_reviews(driver_id);
CREATE INDEX idx_driver_reviews_reservation_id ON public.driver_reviews(reservation_id);

-- Add average_rating and total_reviews columns to drivers table for caching
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT 0;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Create function to update driver rating stats
CREATE OR REPLACE FUNCTION public.update_driver_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.drivers
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.driver_reviews
      WHERE driver_id = NEW.driver_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.driver_reviews
      WHERE driver_id = NEW.driver_id
    )
  WHERE id = NEW.driver_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-update driver stats on new review
CREATE TRIGGER on_driver_review_created
  AFTER INSERT ON public.driver_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_rating_stats();

-- Enable realtime for driver_reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_reviews;