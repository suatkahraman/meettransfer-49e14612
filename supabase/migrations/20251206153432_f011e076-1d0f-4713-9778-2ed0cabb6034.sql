-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'driver', 'customer');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create drivers table
CREATE TABLE public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    region TEXT,
    commission_rate NUMERIC(5,2) DEFAULT 10.00,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Drivers can view themselves
CREATE POLICY "Drivers can view own profile"
ON public.drivers FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all drivers
CREATE POLICY "Admins can manage drivers"
ON public.drivers FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create reservations table
CREATE TABLE public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    pickup TEXT NOT NULL,
    dropoff TEXT NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time TIME NOT NULL,
    flight_number TEXT,
    vehicle_type TEXT NOT NULL,
    price NUMERIC(10,2),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'no-cash', 'invoice')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'active', 'completed', 'cancelled')),
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    driver_cash BOOLEAN DEFAULT false,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Customers can view own reservations
CREATE POLICY "Customers can view own reservations"
ON public.reservations FOR SELECT
USING (auth.uid() = customer_id);

-- Customers can create reservations
CREATE POLICY "Customers can create reservations"
ON public.reservations FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Drivers can view assigned reservations
CREATE POLICY "Drivers can view assigned reservations"
ON public.reservations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.drivers 
        WHERE drivers.user_id = auth.uid() 
        AND drivers.id = reservations.driver_id
    )
);

-- Drivers can update assigned reservations
CREATE POLICY "Drivers can update assigned reservations"
ON public.reservations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.drivers 
        WHERE drivers.user_id = auth.uid() 
        AND drivers.id = reservations.driver_id
    )
);

-- Admins can manage all reservations
CREATE POLICY "Admins can manage reservations"
ON public.reservations FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on drivers
CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for updated_at on reservations
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Function to assign default customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

-- Trigger to assign customer role on new user
CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_role();