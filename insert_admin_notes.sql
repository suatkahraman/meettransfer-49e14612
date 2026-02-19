
-- 0. Enum ve Fonksiyon Kontrolü (Gerekli Fix)
DO $$ 
BEGIN
    -- Enum yoksa oluştur
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'driver', 'customer', 'agency');
    END IF;
END $$;

-- has_role fonksiyonunu oluştur/güncelle (Fix: text casting for operator compatibility)
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

-- 1. Tablo Kontrolü
DO $$ 
BEGIN
    -- Tablo yoksa oluştur
    CREATE TABLE IF NOT EXISTS public.reservation_admin_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reservation_id UUID NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Foreign Key (reservation_id -> reservations) kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reservation_admin_notes_reservation_id_fkey'
    ) THEN
        ALTER TABLE public.reservation_admin_notes 
        ADD CONSTRAINT reservation_admin_notes_reservation_id_fkey 
        FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. RLS Aktif Et
ALTER TABLE public.reservation_admin_notes ENABLE ROW LEVEL SECURITY;

-- 3. Politikalar (Policies)
-- Önce eski politikayı sil (varsa)
DROP POLICY IF EXISTS "Admins can manage reservation admin notes" ON public.reservation_admin_notes;

-- Yeni politikayı oluştur
CREATE POLICY "Admins can manage reservation admin notes"
ON public.reservation_admin_notes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Verileri Ekle (ON CONFLICT id ile güncelle)
INSERT INTO public.reservation_admin_notes (
    id, reservation_id, notes, created_at, updated_at
)
SELECT 
    v.id::uuid, 
    v.reservation_id::uuid, 
    v.notes, 
    v.created_at::timestamptz, 
    v.updated_at::timestamptz
FROM (VALUES
('b0f48fe6-398f-4fa0-8d2e-5c7ad1cffbee', 'f772b604-d4ed-417e-a5b4-677777f7e592', 'Karsilama 150 lira  

Referans: Khalil 20 jan', '2026-01-17T07:55:38.27995+00:00', '2026-01-19T19:42:44.059801+00:00'),
('38fa9343-20e2-4753-97b4-2b61f0945ebe', 'd11ec772-0cd8-4786-b6f4-bd12ec287a99', 'OTELDEN - IST ', '2025-12-11T16:57:39.714011+00:00', '2025-12-13T12:54:27.267334+00:00'),
('e36b35e1-4f15-4fe3-9239-e54e248d4a98', 'b2dc2688-16fc-42fe-bf60-aee5b03036c9', 'UÇUŞ KODU YOK MUSTAFA DAN İSTERİZ RENK TRAVEL', '2025-12-11T17:07:27.319184+00:00', '2025-12-13T16:25:09.127135+00:00'),
('d2ff8747-9909-44a5-9690-a2e3d6aed659', '330b1c55-f940-4c58-906b-5c23a5efb177', 'Karşılama SR25 ', '2026-01-17T20:49:39.088917+00:00', '2026-01-19T19:44:01.281491+00:00'),
('fe053ac9-2c02-4465-ae60-3ed8ccb4c6f2', 'ea331ab6-23bd-44b3-bef6-9e60b1a08e35', '150 karsilama  

İnes 12 jan ', '2026-01-17T07:50:30.253367+00:00', '2026-01-19T19:50:56.115314+00:00'),
('114243d5-aa44-420e-9631-b715a9edc673', 'b33596ae-0d80-4a25-ae4d-d3f69865e6f2', 'Thy business class kapısıNA BIRAKILMALI MUTLAKA', '2025-12-24T13:54:43.774586+00:00', '2025-12-24T14:06:17.738873+00:00'),
('7160e097-8472-4ae8-85ab-4755c7255285', '0c9aac55-545d-4813-837f-5636a40c1536', 'İnes 12 jan ', '2026-01-19T19:51:39.127051+00:00', '2026-01-19T19:51:39.127051+00:00'),
('31024825-620d-4bfe-bd3b-b73ca3b04e7e', 'a7d76b72-df38-40c1-b489-cdc1bc3890ac', 'Khalil 13 jan ', '2026-01-19T19:54:08.250989+00:00', '2026-01-19T19:54:08.250989+00:00'),
('a29bf108-a59b-4b8f-9f0f-c88785a3ccae', '5edbe856-21e8-4dd6-8a31-761afcde5c36', 'Lounge Vip giriş kapısına bırakılacak', '2026-01-19T08:58:38.125704+00:00', '2026-01-20T18:00:11.308985+00:00'),
('286f9b73-945e-492e-b30b-1708cadc2453', 'b93db7ae-83f8-4819-9898-bcc83d39f80a', '2 HOTEL 2 PAX AVRASYA PORT HOTEL', '2025-12-17T17:34:51.856613+00:00', '2025-12-27T13:39:17.576706+00:00'),
('a90b7536-83a2-4c8c-a46a-8514f4bda750', '0b2d625f-69b3-4920-a479-822858fed7e8', 'OTELDEN HAVALİMANI DÖNÜŞ  RENK TRAVEL', '2025-12-11T17:02:06.281364+00:00', '2025-12-17T11:21:08.459214+00:00'),
('672379a0-e220-4a37-bb53-17979fd36e57', 'eb9172a0-a6b1-460d-8a58-052b22b72881', 'KHALİL 20 JAN KARŞILAMA 150', '2026-01-20T17:59:31.881756+00:00', '2026-01-21T12:45:53.602872+00:00'),
('032eb275-f8ba-4a0e-b343-5d4508c776e1', 'b247c29d-3dfb-44a5-a79b-0cc6df29dd4f', 'Bir gün önceki tur dönüşü bu otele bırakacağız', '2025-12-18T09:35:00.007996+00:00', '2025-12-28T09:54:49.455079+00:00'),
('54ac5d94-c5c9-48e8-b72d-f867d674c4cc', '264c9dbf-9743-48fb-8872-d8f280418e58', 'Karşılama bizde', '2026-01-23T10:50:54.486148+00:00', '2026-01-23T10:50:54.486148+00:00'),
('37837484-09f9-48c4-9e75-89b31c2fc4ec', '51263d91-0149-4cb8-9ca5-9ee49efccf0d', 'Ramada Resort by Wyndham Pamukkale Thermal Tur dan sonra bu otele bırakacağız', '2025-12-18T10:28:09.073888+00:00', '2025-12-28T11:28:03.744952+00:00'),
('50f8767f-b516-4c78-9911-70fbb5882a12', '077f738b-0f8c-4e6e-a425-135ea82025ab', '2 ayrı hotel  Tulip city Taksim', '2026-01-23T20:09:07.088079+00:00', '2026-01-23T20:09:07.088079+00:00'),
('c78ca955-d6cb-47bb-892a-557744fc672d', '9cc840bf-bf97-444c-a705-10f6505f8c1f', ' Efes Tur Rehber li rehber için 110 euro ödeme alınacak dönüşte DoubleTree by Hilton Airport izmir hotel', '2025-12-18T09:28:25.494065+00:00', '2025-12-28T11:34:09.021005+00:00'),
('dc5b7825-8c01-482c-8330-249fdcb9f6e8', 'aab0f704-25dd-4602-8251-7f2b6cd9ab31', 'Nakit olabilir olursa değiştirirm', '2025-12-18T09:38:56.428093+00:00', '2025-12-28T17:29:28.363072+00:00'),
('4eb5ad39-6ffe-42ee-be02-2ef519ce23f1', '8048e99b-e351-43d9-b2ad-6a14e6568e5c', 'Full Yapılı Maybach ikramlı', '2025-12-29T21:30:28.806296+00:00', '2025-12-30T00:51:00.618274+00:00'),
('ee3347f4-2295-407f-bd37-2ce7b0d68d26', '92df2825-4fef-4918-b8e1-1937f4547b82', '60 usd nakit alındı', '2025-12-10T07:44:24.423901+00:00', '2025-12-19T12:05:55.198442+00:00'),
('65f3687f-553c-4417-91e5-114b45d0cf4d', '48d06b24-7174-4f8f-98ab-e89acdd90b36', 'Karşılama bizde', '2026-01-25T08:05:21.961059+00:00', '2026-01-25T08:07:08.29822+00:00'),
('cde9576b-e6d5-45b9-8359-cb9de8c574dc', 'f30c3d88-3f71-459a-9309-cdf0f035d38e', '40 usd nakit alındı', '2025-12-10T07:46:18.263284+00:00', '2025-12-19T12:06:41.276869+00:00'),
('2681aa93-3bdb-45e3-a5cc-a32c96eea76e', 'e81fceca-7b5f-4a5e-946d-ae52df10ba15', 'S1 KULE', '2026-01-02T19:31:52.49926+00:00', '2026-01-03T17:35:41.318758+00:00'),
('70b0e402-a1aa-4c11-90e1-4ad032852478', 'e07de24a-af57-4f12-9b01-dd4a2dede96f', '50 euro nakit alındı', '2025-12-10T07:48:43.00636+00:00', '2025-12-19T12:07:23.845168+00:00'),
('f6bb1941-90b2-4607-b71d-f00ddcb96097', 'ddd5a392-7eed-4bc6-b455-36755d352ce6', '60 usd nakit ', '2025-12-10T07:52:36.017866+00:00', '2025-12-19T12:07:54.455394+00:00'),
('d511db35-dca1-4fdd-ad60-dcd1ace03589', 'f9f618ac-0f39-4826-ad95-3a19e5c9803d', '50 Euro nakit', '2025-12-10T08:07:05.476681+00:00', '2025-12-19T12:08:41.224371+00:00'),
('e7bb50d5-d1eb-4c4a-b13f-be90b1753da1', '94794154-ae1c-41b0-a96d-e642e3463f9f', '60 usd nakit ', '2025-12-10T08:00:33.400379+00:00', '2025-12-19T12:09:27.633582+00:00'),
('05b7d3f7-69b9-40d8-95dd-abece7b9fa11', '7a5ad36c-3259-4b42-bb63-503ac9963d9b', '65 USD NAKİT ', '2025-12-10T08:05:10.636133+00:00', '2025-12-19T12:09:54.830046+00:00'),
('9d0a700f-b2fc-4a3b-af29-fe3abf356187', 'ead28df5-8301-48eb-b16a-d50b6ee11d60', 'Viator', '2025-12-10T08:02:43.320838+00:00', '2025-12-19T12:14:05.408252+00:00'),
('3b23d733-392d-449c-87b1-7b34eecf7fb2', '1d6b5f4d-dc0f-4544-9b87-7353304aa7f6', 'RENK TRAVEL', '2025-12-10T07:54:33.452992+00:00', '2025-12-12T07:59:51.973813+00:00'),
('9199d9fc-7caf-4e81-ae65-f24d0ef98aef', '8370a47e-2f09-45c2-84d7-64dfd43b2961', 'RENK TRAVEL KARŞILAMA MUSTAFA', '2025-12-09T09:33:44.061836+00:00', '2025-12-12T08:01:04.103466+00:00'),
('bfec44fe-6a2d-4068-be7c-5531a1ff17da', '55a25eed-4d38-4738-b372-5d8ba3c72c2b', 'Khalil 6 jan reservasyon kodu 
+ karşılama üçreti 150lira', '2026-01-06T17:49:24.161246+00:00', '2026-01-07T08:09:24.501257+00:00'),
('e5be5584-05b5-4a4a-ba89-8bf56b5a9453', 'd1ee608a-9007-41d0-bd86-1c07c9eac561', 'Jack Ismail in doğum günü süpriz hazırlığı yapacağız', '2026-01-08T19:36:04.079399+00:00', '2026-01-08T19:42:37.552394+00:00'),
('25978b73-243f-45c4-86d4-1ff40d1007ad', 'c427805b-8f0d-4beb-8b41-a84f8e2c62ee', '5 tane de EL valizi var ', '2026-01-08T23:01:58.786134+00:00', '2026-01-10T12:56:04.457421+00:00'),
('96222bb8-e858-4c8b-8419-33bf14ef539e', '9e8f6109-5cd9-4263-bdb1-85ee5890923f', 'Ucuz pembe şarap alacağız.', '2026-01-11T20:03:49.215274+00:00', '2026-01-11T20:03:49.215274+00:00'),
('810a59e6-29dc-479c-a230-9fa5be2b647b', 'a6b140c0-1494-4b95-b386-d7ddf1cc5f66', 'Hotel ismi ve uçak kodu eksik...', '2026-01-11T20:07:18.919943+00:00', '2026-01-11T20:07:18.919943+00:00'),
('788301ab-101d-4722-82ef-81770b7dce61', '0b9159c9-2d21-43be-a6bf-03d6afc08396', 'Marcus hornung hampton by hilton şişli', '2026-01-26T16:59:21.395457+00:00', '2026-01-26T17:00:55.470442+00:00'),
('c4391119-b8f8-4ba6-8ac9-b67930695c7b', '4a763c59-7d45-444d-af3d-8049008fc405', 'Uçuş kodunu 1 gün önceden isteyeceğiz', '2026-01-31T11:04:08.109962+00:00', '2026-01-31T11:04:08.109962+00:00'),
('f2f33c5e-1129-4df2-acda-1af71682934c', '7c988e95-9e42-4646-8bb4-47e6f7ea2425', 'Dönüş saati 1 gün önce soracağız', '2026-01-31T11:08:00.653737+00:00', '2026-01-31T11:08:00.653737+00:00'),
('e9b88d59-f679-41fc-87ce-b375a363c6c2', '9f2cda2f-a6b4-45e2-9471-b6a1ac6be3de', 'KOD YOK ALIŞ SAATİNİ MUSTAFA SORARIZ RENK TRAVEL', '2025-12-11T17:10:50.174632+00:00', '2025-12-20T12:12:54.366341+00:00'),
('f1d3d060-7d88-4586-a0cd-393688fe7478', 'b90dda4f-34d6-454c-9f53-8f04893fbad8', '2 HOTEL 2 PAX AVRASYA HOTEL', '2025-12-17T17:35:48.469031+00:00', '2025-12-20T16:45:06.005783+00:00'),
('f2664263-07f0-4904-bc5c-a274a14bba96', '360392c6-a960-4ad8-8c34-b8e9a3680d0f', 'İstanbul aktarma geliyor ', '2025-12-18T09:10:12.682382+00:00', '2025-12-23T12:37:34.411734+00:00'),
('ac20b17b-e89d-46b7-8c73-4cfd627bf55e', '5f1db070-cd98-49b7-88b9-d6d21a15a6cd', 'Acenta sahibi önemli', '2026-02-03T16:20:15.330429+00:00', '2026-02-03T16:20:15.330429+00:00'),
('4fdeed3c-5bbc-4223-bfbd-10f05bef77e6', 'e66f8641-d7e8-409a-83e4-1fa9e6e0c188', 'Khalil 20 jan 

Karsilama 150', '2026-01-17T18:16:55.957005+00:00', '2026-01-18T16:52:10.701687+00:00'),
('847ac79f-3ac6-40ba-ba7f-e6d70b205d6f', '6064c379-0977-41ba-9f46-7bff05f2a900', 'Acenta sahibi önemli', '2026-02-03T16:22:21.566714+00:00', '2026-02-03T16:22:21.566714+00:00'),
('e67e7bef-b804-42c8-a9bc-c3f9896faa49', 'af61965c-25bf-49bd-993b-091a9e523506', 'İkitelli Osb den paket alıp hemen dönüş sabiha', '2026-02-04T18:16:46.505562+00:00', '2026-02-04T18:16:46.505562+00:00'),
('f99fe7b1-2512-44d2-988f-78f6a2d74525', 'a7dfd7d4-1878-456b-9bf1-8990df9ce2f5', 'Valiz yok Çabuk cıkacak ucak inince araç yakın olsun
Ödeme yapılmış karşı olduğu için extra 20 usd ', '2026-02-08T07:10:00.997803+00:00', '2026-02-08T07:11:43.006839+00:00'),
('e33bcbbf-079a-45de-b661-55aaf4c36278', '60117cfa-097a-498a-8b3c-85e4b9950354', 'Karşılama bizde Tümer yolladı', '2026-02-08T16:20:55.64118+00:00', '2026-02-08T16:20:55.64118+00:00'),
('9c31e229-c224-42fe-acad-2a024a2a5b43', 'd72b1462-f791-4431-9c57-a8d5866820bf', 'Kod: Khalil 10 fev', '2026-02-13T16:51:33.618892+00:00', '2026-02-13T16:51:33.618892+00:00'),
('b37b789d-03d9-47c3-a476-392c795f242a', '1e5f2ff4-1543-451e-b586-893a44ddd13a', 'Muhammad olan bizim tanıdık onu yol üzeri metrobüse bırakalım', '2026-02-14T16:23:49.15868+00:00', '2026-02-14T16:23:49.15868+00:00'),
('3da50a0e-5f01-41b2-8c5a-0c90a92def5f', 'f1c6b440-e536-420d-bad3-88ac5187339a', 'This distance is being miscalculated; we are working to resolve this issue. The final price is 155 Euros sorry. ', '2026-02-15T20:42:40.601961+00:00', '2026-02-15T20:43:04.254951+00:00')
) AS v(id, reservation_id, notes, created_at, updated_at)
WHERE EXISTS (
    SELECT 1 FROM public.reservations r WHERE r.id::text = v.reservation_id::text
)
ON CONFLICT (id) DO UPDATE SET
  notes = EXCLUDED.notes,
  updated_at = now();
