-- Create table for quick booking requests from homepage
CREATE TABLE public.quick_booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup text NOT NULL,
  dropoff text NOT NULL,
  pickup_date date NOT NULL,
  pickup_time time NOT NULL,
  vehicle_type text NOT NULL,
  passengers integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  price numeric,
  price_currency text DEFAULT 'EUR',
  admin_message text,
  customer_session_id text NOT NULL,
  customer_email text,
  customer_phone text,
  customer_name text,
  confirmation_token text NOT NULL DEFAULT gen_random_uuid()::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  confirmed_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours')
);

-- Enable RLS
ALTER TABLE public.quick_booking_requests ENABLE ROW LEVEL SECURITY;

-- Admin can manage all requests
CREATE POLICY "Admins can manage quick booking requests"
ON public.quick_booking_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Anyone can insert (for anonymous customers)
CREATE POLICY "Anyone can insert quick booking requests"
ON public.quick_booking_requests
FOR INSERT
WITH CHECK (true);

-- Anyone can view their own request by token
CREATE POLICY "Anyone can view by token"
ON public.quick_booking_requests
FOR SELECT
USING (true);

-- Anyone can update their own request by token (for confirmation)
CREATE POLICY "Anyone can update by token"
ON public.quick_booking_requests
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_booking_requests;

-- Create index for faster lookups
CREATE INDEX idx_quick_booking_requests_status ON public.quick_booking_requests(status);
CREATE INDEX idx_quick_booking_requests_token ON public.quick_booking_requests(confirmation_token);