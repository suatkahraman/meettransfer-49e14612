-- Start of insert_more_payments.sql

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

-- End of insert_more_payments.sql

-- Start of insert_additional_payments.sql

-- Ekstra Payment Verileri
INSERT INTO public.reservation_payments (
    id, reservation_id, agency_notes, agency_price_currency, agency_profit, 
    agency_user_id, company_amount, company_amount_try, conversion_date, 
    customer_price, exchange_rate_used, payment_status
) VALUES
(
    '08340e3f-da81-4be8-adad-d7b2c01205f5', 
    '49e47225-51a5-4656-91f9-d1a82bef6d8c', 
    NULL, 
    'TRY', 
    3500, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    3500, 
    NULL, 
    'not_paid'
    ),
(
    'd8d7f42c-2d60-4beb-9198-ebeb1598fde9', 
    'aa5d62ea-f0ad-4119-b520-2be1b8330e76', 
    NULL, 
    'TRY', 
    400, 
    NULL, 
    1600, 
    NULL, 
    NULL, 
    2000, 
    NULL, 
    'not_paid'
    ),
(
    'c11e3855-ea62-4273-9cf2-9e349ab05ffd', 
    'ace93f23-1b81-4c52-a81a-397d6f327b44', 
    NULL, 
    'TRY', 
    2550, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    2550, 
    NULL, 
    'not_paid'
    ),
(
    '46ce708f-56ce-4cbd-a8c2-60938ee49f97', 
    'a7d76b72-df38-40c1-b489-cdc1bc3890ac', 
    NULL, 
    'TRY', 
    1800, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    1800, 
    NULL, 
    'not_paid'
    ),
(
    '254acf4d-3807-4725-9e7c-428298b3f41c', 
    'd451a8ee-740e-4439-9fd2-5babaabeed76', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    50, 
    2509.2, 
    '2026-01-09', 
    50, 
    50.184, 
    'not_paid'
    ),
(
    'e68a49fd-8841-450b-b6ce-7e2c6af2711d', 
    '52502a5c-eb5e-426d-8a66-ef3e7d8788cd', 
    NULL, 
    'USD', 
    0, 
    NULL, 
    48.96, 
    2110.46976, 
    '2026-01-09', 
    48.96, 
    43.106, 
    'not_paid'
    ),
(
    '4d4378ef-2b3e-4099-a49d-655b3b322374', 
    'acf3812d-cc8a-4020-80c5-cf706f289d79', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    55, 
    2760.12, 
    '2026-01-09', 
    55, 
    50.184, 
    'not_paid'
    ),
(
    'e454376a-ede4-4428-932a-274855388112', 
    '0c9aac55-545d-4813-837f-5636a40c1536', 
    NULL, 
    'TRY', 
    1800, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    1800, 
    NULL, 
    'not_paid'
    ),
(
    '78e24fe0-c442-4db8-996c-6f3f3e72cfc9', 
    'ec44da7b-b0a3-468b-b51e-d3fe508f71df', 
    NULL, 
    'TRY', 
    1800, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    1800, 
    NULL, 
    'not_paid'
    ),
(
    '3b03a4f1-026f-415c-ae1d-0e35ae45cd74', 
    'e66f8641-d7e8-409a-83e4-1fa9e6e0c188', 
    NULL, 
    'TRY', 
    1950, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    1950, 
    NULL, 
    'not_paid'
    ),
(
    '2033cd43-0840-451d-b061-4cb22645f2c0', 
    'f772b604-d4ed-417e-a5b4-677777f7e592', 
    NULL, 
    'TRY', 
    1950, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    1950, 
    NULL, 
    'not_paid'
    ),
(
    '328a4754-5a1f-406e-9d1a-8ee5948206ca', 
    '330b1c55-f940-4c58-906b-5c23a5efb177', 
    NULL, 
    'TRY', 
    1950, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    1950, 
    NULL, 
    'not_paid'
    ),
(
    '5c829550-2931-45f1-9de9-da260695e1df', 
    'ea331ab6-23bd-44b3-bef6-9e60b1a08e35', 
    NULL, 
    'TRY', 
    1950, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    1950, 
    NULL, 
    'not_paid'
    ),
(
    '87c45878-b04c-4954-9271-d28ae79acea4', 
    '5edbe856-21e8-4dd6-8a31-761afcde5c36', 
    NULL, 
    'TRY', 
    1800, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    1800, 
    NULL, 
    'not_paid'
    ),
(
    '43437948-eef2-434c-a8b0-ea9bdf72ec88', 
    '49242900-8e7c-4846-8970-454fdcd603b3', 
    NULL, 
    'TRY', 
    1800, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    1800, 
    NULL, 
    'not_paid'
    ),
(
    '48936c5f-0e65-4009-ad5c-b8ef13de205a', 
    'eb9172a0-a6b1-460d-8a58-052b22b72881', 
    NULL, 
    'TRY', 
    2650, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    2650, 
    NULL, 
    'not_paid'
    ),
(
    'd61f736c-a4a9-484a-bae8-210976850ef0', 
    'ac29cdc2-8648-4556-8beb-cddf434dc926', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    55, 
    0, 
    '2026-01-22', 
    55, 
    50.668, 
    'not_paid'
    ),
(
    '0736a6ce-fbe7-4a07-b031-8cde36dbfae2', 
    'd1ee608a-9007-41d0-bd86-1c07c9eac561', 
    NULL, 
    'USD', 
    58.96, 
    NULL, 
    0, 
    NULL, 
    '2026-01-30', 
    58.96, 
    43.487, 
    'not_paid'
    ),
(
    '3455fa67-a7db-49f1-893f-1f9b38f3886e', 
    'c1d7aab6-2bfb-4166-b6ca-7c1ae1db6803', 
    NULL, 
    'USD', 
    58.96, 
    NULL, 
    0, 
    NULL, 
    '2026-02-06', 
    58.96, 
    43.615, 
    'not_paid'
    ),
(
    '7a219ef9-6a41-4839-ba57-58cce33c20a5', 
    '9cba4617-d87c-4eac-9203-42eee717f54e', 
    NULL, 
    'TRY', 
    0, 
    NULL, 
    1800, 
    NULL, 
    NULL, 
    1800, 
    NULL, 
    'not_paid'
    ),
(
    '7b1b8db6-a2fe-4dd1-b917-67099961eddb', 
    '264c9dbf-9743-48fb-8872-d8f280418e58', 
    NULL, 
    'TRY', 
    0, 
    NULL, 
    1950, 
    NULL, 
    NULL, 
    1950, 
    NULL, 
    'not_paid'
    ),
(
    'e8edc04b-f68e-40bc-b815-2569314bc82e', 
    'de6b50ed-0b76-4367-ad2a-d142a41163c4', 
    'Quick Booking - Direct Customer', 
    'EUR', 
    0, 
    NULL, 
    42, 
    NULL, 
    '2026-02-06', 
    42, 
    51.439, 
    'not_paid'
    ),
(
    '4275687c-c076-464e-bdd8-b3caa2b83f0d', 
    'f65f6030-8bac-4f2b-afad-c4fe0edb90d0', 
    NULL, 
    'EUR', 
    150, 
    NULL, 
    0, 
    NULL, 
    '2026-02-06', 
    150, 
    51.439, 
    'not_paid'
    ),
(
    'ed97729e-49ef-4cbe-8602-4fe2582ba68b', 
    '077f738b-0f8c-4e6e-a425-135ea82025ab', 
    NULL, 
    'TRY', 
    2600, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    2600, 
    NULL, 
    'not_paid'
    ),
(
    '46d810dc-4cad-4f47-9e9e-bde4e6b356aa', 
    '4f3d8e97-19d4-4942-a6f8-d81848edc562', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    37, 
    NULL, 
    '2026-01-23', 
    37, 
    50.908, 
    'not_paid'
    ),
(
    'daba65ec-ca8c-4449-b475-193695fe85f6', 
    'de8f5958-8565-416b-ad98-67a7e47092ff', 
    NULL, 
    'USD', 
    60, 
    NULL, 
    0, 
    NULL, 
    '2026-01-23', 
    60, 
    43.355, 
    'not_paid'
    ),
(
    'c72f1913-cdfe-4c6e-8a9b-e9aa10d60a71', 
    '48d06b24-7174-4f8f-98ab-e89acdd90b36', 
    NULL, 
    'TRY', 
    1950, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    1950, 
    NULL, 
    'not_paid'
    ),
(
    'f022d551-e160-4a56-b47e-ce952faa4dd5', 
    'd58f0bf4-7fad-426f-b936-596a202949c8', 
    NULL, 
    'USD', 
    0, 
    NULL, 
    46.64, 
    NULL, 
    NULL, 
    46.64, 
    NULL, 
    'not_paid'
    ),
(
    'e499bb2d-f509-4630-8cec-29cbe33a20ff', 
    '2b3fc694-9834-4d16-a74d-a9493d02d5d1', 
    NULL, 
    'USD', 
    60, 
    NULL, 
    0, 
    NULL, 
    '2026-01-23', 
    60, 
    43.355, 
    'not_paid'
    ),
(
    'f1b5e1e8-4f15-435f-9fa3-35e50c29783e', 
    'ea4510c4-2195-4041-a1ad-edfc137c8baa', 
    NULL, 
    'AUD', 
    100, 
    NULL, 
    0, 
    NULL, 
    '2026-01-23', 
    100, 
    29.764, 
    'not_paid'
    )
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

-- End of insert_additional_payments.sql

-- Start of insert_payments_batch_2.sql

-- Ekstra Payment Verileri (Part 2)
INSERT INTO public.reservation_payments (
    id, reservation_id, agency_notes, agency_price_currency, agency_profit, 
    agency_user_id, company_amount, company_amount_try, conversion_date, 
    customer_price, exchange_rate_used, payment_status
) VALUES
(
    '5e22bba6-ab33-40cc-b96a-b3687f303a2d', 
    'fa9bf294-5999-4578-95d0-45dc8f1561cb', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    35, 
    NULL, 
    '2026-01-23', 
    35, 
    50.908, 
    'not_paid'
    ),
(
    'a96e7c6c-027a-4a54-ae80-3f037fd7d2b0', 
    '7b6625bf-c009-4de3-84de-b7f88d4248bc', 
    NULL, 
    'USD', 
    60, 
    NULL, 
    0, 
    NULL, 
    '2026-01-26', 
    60, 
    43.376, 
    'not_paid'
    ),
(
    '406db1ab-9ff0-4068-9f70-4d8d24e65722', 
    'bbbc64aa-f9ea-42ab-855c-cfe69ef46c2f', 
    NULL, 
    'EUR', 
    296, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    296, 
    NULL, 
    'not_paid'
    ),
(
    '303d025d-c014-46a9-9fd2-41edd92d8752', 
    '0b9159c9-2d21-43be-a6bf-03d6afc08396', 
    NULL, 
    'TRY', 
    2200, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    2200, 
    NULL, 
    'not_paid'
    ),
(
    'e564be1d-bca5-46e7-bd5f-eda5462b2029', 
    '4a763c59-7d45-444d-af3d-8049008fc405', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    59.64, 
    NULL, 
    NULL, 
    59.64, 
    NULL, 
    'not_paid'
    ),
(
    '095d28b0-4396-4302-a921-5fd65da57664', 
    '7c988e95-9e42-4646-8bb4-47e6f7ea2425', 
    NULL, 
    'EUR', 
    59.64, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    59.64, 
    NULL, 
    'not_paid'
    ),
(
    '4d865ddd-c46f-456a-a165-6f1d11424116', 
    '5462b165-e9e1-4347-8700-d24b221c7458', 
    NULL, 
    'AUD', 
    0, 
    NULL, 
    100, 
    NULL, 
    '2026-01-30', 
    100, 
    30.488, 
    'not_paid'
    ),
(
    'e6f85679-cb29-42eb-ba40-00a51dd39003', 
    '60117cfa-097a-498a-8b3c-85e4b9950354', 
    NULL, 
    'TRY', 
    2600, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    2600, 
    NULL, 
    'not_paid'
    ),
(
    '8ecddfe7-7ed3-4130-97cd-f72918c9b348', 
    '5f1db070-cd98-49b7-88b9-d6d21a15a6cd', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    35, 
    NULL, 
    NULL, 
    35, 
    NULL, 
    'not_paid'
    ),
(
    'ee34ba41-1858-40eb-a45c-2f666570af25', 
    '6064c379-0977-41ba-9f46-7bff05f2a900', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    35, 
    NULL, 
    NULL, 
    35, 
    NULL, 
    'not_paid'
    ),
(
    '0469ced9-8edc-4cf7-ab05-220238b56acd', 
    'd0ad988c-fe1e-4e23-b3eb-86b14494ced5', 
    NULL, 
    'TRY', 
    1600, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    1600, 
    NULL, 
    'not_paid'
    ),
(
    '095499cd-4504-4c87-b0db-02d351a2db64', 
    '8dcd4295-af57-471d-b8eb-68e2bdf3b30f', 
    'Quick Booking - Direct Customer', 
    'EUR', 
    0, 
    NULL, 
    70, 
    NULL, 
    '2026-01-30', 
    70, 
    51.832, 
    'not_paid'
    ),
(
    '695d8ea1-88a5-4674-a0cb-f700bab2a769', 
    '9b8ca162-7a34-4e11-8443-8b42eda24788', 
    'Quick Booking - Return Trip', 
    'EUR', 
    0, 
    NULL, 
    70, 
    NULL, 
    '2026-02-03', 
    70, 
    51.325, 
    'not_paid'
    ),
(
    '237e1f46-b681-41f9-9bbf-ba2ec7205ddb', 
    'af61965c-25bf-49bd-993b-091a9e523506', 
    NULL, 
    'TRY', 
    0, 
    NULL, 
    1, 
    NULL, 
    NULL, 
    1, 
    NULL, 
    'not_paid'
    ),
(
    'e852f9ec-f174-4923-8938-df8f74a085f8', 
    'bcaf2715-2e8b-460d-92d5-de4a72c1d27b', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    450, 
    NULL, 
    '2026-02-11', 
    450, 
    51.935, 
    'not_paid'
    )
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

-- End of insert_payments_batch_2.sql

-- Start of insert_payments_batch_3.sql

-- Ekstra Payment Verileri (Part 3)
INSERT INTO public.reservation_payments (
    id, reservation_id, agency_notes, agency_price_currency, agency_profit, 
    agency_user_id, company_amount, company_amount_try, conversion_date, 
    customer_price, exchange_rate_used, payment_status
) VALUES
(
    '831eb12a-42c8-4f16-bc84-fed088e4c4a6', 
    'a7dfd7d4-1878-456b-9bf1-8990df9ce2f5', 
    NULL, 
    'USD', 
    66.64, 
    NULL, 
    0, 
    NULL, 
    '2026-02-11', 
    66.64, 
    43.643, 
    'not_paid'
    ),
(
    '7867d337-37ab-4898-b75d-e3aa98937ba9', 
    'b66eebb7-f054-45fb-b932-d66195271d0a', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    45, 
    NULL, 
    NULL, 
    45, 
    NULL, 
    'not_paid'
    ),
(
    '39d274aa-d181-4c67-8f61-dbd00e153f8b', 
    '085231aa-c4b7-435d-ba10-6a8cbac81eac', 
    NULL, 
    'TRY', 
    2200, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    2200, 
    NULL, 
    'not_paid'
    ),
(
    'eed08dc2-e244-4489-83b3-e0526df29748', 
    '78ba364e-127d-4faf-9ce1-9df79d2d5955', 
    NULL, 
    'TRY', 
    1050, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    1050, 
    NULL, 
    'not_paid'
    ),
(
    '1879d704-66d2-4c1c-948f-c43f46f13f97', 
    'd967ebc6-e027-4a77-b083-fb864bb43dcf', 
    NULL, 
    'TRY', 
    0, 
    NULL, 
    2200, 
    NULL, 
    NULL, 
    2200, 
    NULL, 
    'not_paid'
    ),
(
    '24576bff-b09a-44f1-bd63-5eabc03b8018', 
    'd72b1462-f791-4431-9c57-a8d5866820bf', 
    NULL, 
    'TRY', 
    0, 
    NULL, 
    2200, 
    NULL, 
    NULL, 
    2200, 
    NULL, 
    'not_paid'
    ),
(
    'a0ff39cf-58e0-4183-9fb4-0937c2ae39a1', 
    '5a1828d9-8570-4a50-8195-4900b1a4db60', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    42, 
    NULL, 
    NULL, 
    42, 
    NULL, 
    'not_paid'
    ),
(
    '6ad09340-9914-41e5-af5c-ca6659575516', 
    'c2a54ad5-d541-46dc-bca6-711adee06259', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    37, 
    NULL, 
    NULL, 
    37, 
    NULL, 
    'not_paid'
    ),
(
    '05d72ee2-c900-4f11-ad29-b8c407f63846', 
    '38d33240-7b5e-4216-ae4f-42c42019a79c', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    45, 
    NULL, 
    NULL, 
    45, 
    NULL, 
    'not_paid'
    ),
(
    '22350734-49d5-4153-a987-3726a8afdf00', 
    '1e5f2ff4-1543-451e-b586-893a44ddd13a', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    50, 
    NULL, 
    '2026-02-13', 
    50, 
    51.884, 
    'not_paid'
    ),
(
    '671b96f9-3228-490c-bd1f-538866d0a44a', 
    '8d9f0a45-52fd-4152-a35e-f0f637a76efe', 
    'Quick Booking - Direct Customer', 
    'EUR', 
    0, 
    NULL, 
    41, 
    NULL, 
    '2026-02-13', 
    41, 
    51.884, 
    'not_paid'
    ),
(
    'd0c50461-be12-4f7e-8b71-d7f7728a9b3f', 
    'cfb70132-f46d-498b-b965-4bf5840078e4', 
    NULL, 
    'EUR', 
    0, 
    NULL, 
    31, 
    NULL, 
    '2026-02-13', 
    31, 
    51.884, 
    'not_paid'
    ),
(
    'cf56f69c-9a0c-4295-bf05-5d0aa806d489', 
    'cd002c0a-da0d-45ea-adc2-75395cbcc08e', 
    'Quick Booking - Direct Customer', 
    'EUR', 
    0, 
    NULL, 
    92, 
    NULL, 
    NULL, 
    92, 
    NULL, 
    'not_paid'
    ),
(
    '6a5c08ca-fb4a-48c4-9e68-f12ac775baae', 
    '40fc3249-9fcf-4709-8344-00edb6382317', 
    'Quick Booking - Direct Customer', 
    'EUR', 
    0, 
    NULL, 
    92, 
    NULL, 
    NULL, 
    92, 
    NULL, 
    'not_paid'
    ),
(
    'ed895286-afac-4f02-bb38-19bd84c512fc', 
    '238c7359-cdac-44f0-be41-765b6291e91e', 
    'Quick Booking - Direct Customer', 
    'EUR', 
    0, 
    NULL, 
    50, 
    NULL, 
    NULL, 
    50, 
    NULL, 
    'not_paid'
    ),
(
    '6d0c50a3-e79c-4f3a-b408-5bd936395075', 
    '513c68f8-bae7-4ecb-b627-f8c3b758e0e3', 
    'Quick Booking - Direct Customer', 
    'EUR', 
    0, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    0, 
    NULL, 
    'not_paid'
    ),
(
    'a7cd1671-809b-4dee-8d6b-72fb0d7afc06', 
    'a72bed92-717e-4f20-b372-8445e4ef4521', 
    'Quick Booking - Return Trip', 
    'EUR', 
    0, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    0, 
    NULL, 
    'not_paid'
    ),
(
    '6c4a8037-e579-4c3d-a117-2807ca2caef8', 
    'be0d9268-e001-4686-b7be-19ba3335b50c', 
    'Quick Booking - Direct Customer', 
    'EUR', 
    0, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    0, 
    NULL, 
    'not_paid'
    ),
(
    '24a0ac08-33aa-447c-84af-02878668c8c9', 
    'f26223b1-4a2a-4c97-afc4-a35622e177dd', 
    'Quick Booking - Return Trip', 
    'EUR', 
    0, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    0, 
    NULL, 
    'not_paid'
    ),
(
    '68a6534f-9d6a-4f7e-ac82-cea71b623425', 
    '5f837b41-2d32-49d3-9a18-d92b0fa57ed4', 
    'Quick Booking - Direct Customer', 
    'EUR', 
    0, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    0, 
    NULL, 
    'not_paid'
    ),
(
    '145dbfdd-b459-41b8-9fee-b19fafab539c', 
    '76185184-6856-4050-8d25-8139416583a8', 
    'Quick Booking - Return Trip', 
    'EUR', 
    0, 
    NULL, 
    0, 
    NULL, 
    NULL, 
    0, 
    NULL, 
    'not_paid'
    )
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

-- End of insert_payments_batch_3.sql

