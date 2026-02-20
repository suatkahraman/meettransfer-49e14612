-- Eksik tabloları ve kolonları oluşturma scripti
-- Bu dosya, Edge Function'larda kullanılan ancak veritabanında eksik olabilecek tabloları oluşturur.

-- 1. agency_applications tablosu
CREATE TABLE IF NOT EXISTS public.agency_applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    agency_name text NOT NULL,
    contact_name text,
    email text NOT NULL,
    phone text,
    password_hash text,
    status text DEFAULT 'pending'::text,
    comments text,
    currency text DEFAULT 'EUR'::text,
    reviewed_at timestamp with time zone,
    reviewed_by uuid
);

-- 2. agencies tablosu
CREATE TABLE IF NOT EXISTS public.agencies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    agency_name text NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    balance numeric DEFAULT 0,
    currency text DEFAULT 'EUR'::text,
    comments text
);

-- 3. agency_reservation_details tablosu
CREATE TABLE IF NOT EXISTS public.agency_reservation_details (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    reservation_id uuid, -- public.reservations(id) referansı sonradan eklenebilir
    company_amount numeric,
    company_amount_try numeric,
    agency_price_currency text DEFAULT 'TRY'::text,
    exchange_rate_used numeric,
    conversion_date date
);

-- 4. user_roles tablosu
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    role text NOT NULL CHECK (role IN ('admin', 'agency', 'customer', 'driver'))
);

-- 5. audit_logs tablosu
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    user_email text,
    action text,
    table_name text,
    record_id text,
    new_data jsonb,
    ip_address text,
    user_agent text
);

-- 6. quick_booking_requests tablosu
CREATE TABLE IF NOT EXISTS public.quick_booking_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    payment_link text,
    customer_email text,
    customer_name text,
    pickup_location text,
    dropoff_location text,
    pickup_date date,
    pickup_time time,
    price numeric,
    currency text
);

-- 7. distance_pricing_rules tablosu (Daha önce bahsedilmişti)
CREATE TABLE IF NOT EXISTS public.distance_pricing_rules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    min_km numeric,
    max_km numeric,
    vehicle_type text,
    price numeric,
    currency text DEFAULT 'EUR'::text
);

-- Mevcut tablolara eksik kolonları ekleme işlemi
DO $$
BEGIN
    -- reservations tablosuna payment_link ekle
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'payment_link') THEN
            ALTER TABLE public.reservations ADD COLUMN payment_link text;
        END IF;
    END IF;

    -- quick_booking_requests tablosuna payment_link ekle (tablo zaten varsa)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quick_booking_requests') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quick_booking_requests' AND column_name = 'payment_link') THEN
            ALTER TABLE public.quick_booking_requests ADD COLUMN payment_link text;
        END IF;
    END IF;
END $$;
