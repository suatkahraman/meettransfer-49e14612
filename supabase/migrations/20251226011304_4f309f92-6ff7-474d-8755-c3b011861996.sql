-- Aynı reservation_code ile birden fazla kayıt oluşturulmasını engelle
-- Önce duplicate'ları kontrol et ve varsa temizle
DO $$
DECLARE
  duplicate_record RECORD;
BEGIN
  -- Find duplicates (keep the oldest one, delete newer ones)
  FOR duplicate_record IN (
    SELECT id, reservation_code, created_at,
           ROW_NUMBER() OVER (PARTITION BY reservation_code ORDER BY created_at ASC) as rn
    FROM public.reservations
    WHERE reservation_code IS NOT NULL
  )
  LOOP
    IF duplicate_record.rn > 1 THEN
      DELETE FROM public.reservations WHERE id = duplicate_record.id;
      RAISE NOTICE 'Deleted duplicate reservation: %', duplicate_record.id;
    END IF;
  END LOOP;
END $$;

-- Şimdi unique constraint ekle
ALTER TABLE public.reservations
ADD CONSTRAINT reservations_reservation_code_unique UNIQUE (reservation_code);