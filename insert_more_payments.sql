
-- 1. Enum ve Fonksiyon Kontrolü
DO $$ 
BEGIN
    -- Enum yoksa oluştur
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'driver', 'customer', 'agency');
    END IF;
END $$;

-- has_role fonksiyonunu oluştur/güncelle
-- user_id nin tipini TEXT olarak değiştirip içeride UUID'ye cast ediyoruz.
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
    WHERE user_id::text = _user_id::text
      AND role::text = _role::text
  );
$$;

-- 2. Tablo ve Constraint Kontrolü
DO $$ 
BEGIN
    -- Tablo yoksa oluştur
    CREATE TABLE IF NOT EXISTS public.reservation_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reservation_id UUID NOT NULL,
        agency_notes TEXT,
        agency_price_currency TEXT DEFAULT 'TRY',
        agency_profit NUMERIC DEFAULT 0,
        agency_user_id UUID,
        company_amount NUMERIC DEFAULT 0,
        company_amount_try NUMERIC DEFAULT 0,
        conversion_date DATE,
        customer_price NUMERIC DEFAULT 0,
        exchange_rate_used NUMERIC DEFAULT 0,
        payment_status TEXT DEFAULT 'not_paid',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Foreign Key (reservation_id -> reservations) kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reservation_payments_reservation_id_fkey'
    ) THEN
        ALTER TABLE public.reservation_payments 
        ADD CONSTRAINT reservation_payments_reservation_id_fkey 
        FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. RLS Aktif Et
ALTER TABLE public.reservation_payments ENABLE ROW LEVEL SECURITY;

-- 4. Politikalar (Policies)
-- Önce eski politikayı sil (varsa) ki çakışma olmasın
DROP POLICY IF EXISTS "Admins can manage reservation payments" ON public.reservation_payments;

-- Yeni politikayı oluştur
CREATE POLICY "Admins can manage reservation payments"
ON public.reservation_payments
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Verileri Ekle (ON CONFLICT id ile güncelle)
INSERT INTO public.reservation_payments (
    id, reservation_id, agency_notes, agency_price_currency, agency_profit, 
    agency_user_id, company_amount, company_amount_try, conversion_date, 
    customer_price, exchange_rate_used, payment_status
) VALUES
('70ef7c1d-a5a8-429d-964b-5ec25027477d', '92df2825-4fef-4918-b8e1-1937f4547b82', NULL, 'TRY', 900, NULL, 1600, 0, NULL, 2500, 0, 'not_paid'),
('8118016f-099c-497e-9e52-c2e08a51cdf4', 'f30c3d88-3f71-459a-9309-cdf0f035d38e', NULL, 'TRY', 290, NULL, 1400, 0, NULL, 1690, 0, 'not_paid'),
('6346056f-1ffd-4518-888f-4e50a6308040', 'e07de24a-af57-4f12-9b01-dd4a2dede96f', NULL, 'TRY', 480, NULL, 2000, 0, NULL, 2480, 0, 'not_paid'),
('deeb2b53-9099-4163-976f-694e538e4874', 'ddd5a392-7eed-4bc6-b455-36755d352ce6', NULL, 'TRY', 1000, NULL, 1500, 0, NULL, 2500, 0, 'not_paid'),
('40ac7bc6-87cb-4826-bc57-1a7241590ea2', 'f9f618ac-0f39-4826-ad95-3a19e5c9803d', NULL, 'TRY', 650, NULL, 1800, 0, NULL, 2450, 0, 'not_paid'),
('f4bf306c-8d37-43fe-a61f-178ce402c275', '0a095073-ae47-425e-a3ef-0cb9bb4deb18', NULL, 'TRY', 300, NULL, 1700, 0, NULL, 2000, 0, 'not_paid'),
('cfd5ffe9-7215-4ab3-8eeb-6364e71e12c0', 'b33596ae-0d80-4a25-ae4d-d3f69865e6f2', NULL, 'TRY', 1800, NULL, 0, 0, NULL, 1800, 0, 'not_paid'),
('57158163-c84b-4784-9a71-acfa67ebaa7e', 'c2c7c2a8-b3b8-4eeb-a53a-dc55e370868b', NULL, 'TRY', 600, NULL, 1400, 0, NULL, 2000, 0, 'not_paid'),
('8de09ac4-e841-4b3f-b030-029ccac7735f', 'd4c29112-1706-4664-a720-a48ed6587b7c', NULL, 'TRY', 200, NULL, 1000, 0, NULL, 1200, 0, 'not_paid'),
('95436f80-45c9-4145-a106-ac292f735eab', '8048e99b-e351-43d9-b2ad-6a14e6568e5c', NULL, 'TRY', 3250, NULL, 0, 0, NULL, 3250, 0, 'not_paid'),
('32c17f00-1ceb-42fc-92d1-4e418c3f9e51', '7bcde444-1b2d-4b78-b540-d13d4cb0d39d', NULL, 'TRY', 2800, NULL, 0, 0, NULL, 2800, 0, 'not_paid'),
('e9527257-2ffe-422e-b492-31cec3c43618', '56208120-1818-43c7-b037-2c36a6a54666', NULL, 'TRY', 1800, NULL, 0, 0, NULL, 1800, 0, 'not_paid'),
('72aeb1aa-090b-4541-a079-c1978b4387d5', '93e19337-fbcc-4e17-8055-220ae3842327', NULL, 'TRY', 200, NULL, 1700, 0, NULL, 1900, 0, 'not_paid'),
('afe18210-ed23-4f6a-bf8b-05dc8634ce6a', 'eb8d9a72-aec9-4dc0-8259-b15c284c5e1d', NULL, 'USD', 99.82, NULL, 0, 0, '2026-01-23', 99.82, 43.355, 'not_paid'),
('a259df4d-04f0-4d30-a0f2-023a9c41366c', 'b1c8a3d1-523f-41c0-b3d6-dd435cc8e1d5', NULL, 'TRY', 500, NULL, 1700, 0, NULL, 2200, 0, 'not_paid'),
('86e2f20d-fcfa-4e14-b036-18e5572eb57d', '55a25eed-4d38-4738-b372-5d8ba3c72c2b', NULL, 'TRY', 750, NULL, 1900, 0, NULL, 2650, 0, 'not_paid'),
('f0eaa604-4bc3-415a-916d-8de4fd265554', '86fb81bc-d3d2-4397-8215-12a09dfc284b', NULL, 'TRY', 400, NULL, 1500, 0, NULL, 1900, 0, 'not_paid'),
('eb78a64d-74f0-4305-8c28-316414b5732f', '6c4fd9be-15c5-4a74-b037-7b49d9988cdb', NULL, 'TRY', 700, NULL, 0, 0, NULL, 700, 0, 'not_paid')
ON CONFLICT (id) DO UPDATE SET
  agency_notes = EXCLUDED.agency_notes,
  agency_price_currency = EXCLUDED.agency_price_currency,
  agency_profit = EXCLUDED.agency_profit,
  agency_user_id = EXCLUDED.agency_user_id,
  company_amount = EXCLUDED.company_amount,
  company_amount_try = EXCLUDED.company_amount_try,
  conversion_date = EXCLUDED.conversion_date,
  customer_price = EXCLUDED.customer_price,
  exchange_rate_used = EXCLUDED.exchange_rate_used,
  payment_status = EXCLUDED.payment_status,
  updated_at = now();
