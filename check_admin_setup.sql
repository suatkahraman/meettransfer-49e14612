-- Admin Paneli Sorun Giderme Scripti
-- Bu script tabloların varlığını, veri sayılarını ve RLS politikalarını kontrol eder.

DO $$
DECLARE
    table_list text[] := ARRAY['reservations', 'drivers', 'agencies', 'agency_reservation_details', 'user_roles', 'profiles'];
    t text;
    count_rows integer;
BEGIN
    RAISE NOTICE '--- TABLO KONTROLLERİ ---';
    FOREACH t IN ARRAY table_list
    LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('SELECT count(*) FROM %I', t) INTO count_rows;
            RAISE NOTICE 'Tablo MEVCUT: % (Satır sayısı: %)', t, count_rows;
        ELSE
            RAISE NOTICE 'Tablo EKSİK: %', t;
        END IF;
    END LOOP;
    
    RAISE NOTICE '-------------------------';
END $$;

-- RLS Politikalarını Listele (Reservations)
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'reservations';

-- Admin Rolü Kontrolü (Örnek bir admin ID'si ile)
-- Not: Buradaki ID sizin kendi user ID'niz olmalı.
SELECT * FROM public.user_roles;
