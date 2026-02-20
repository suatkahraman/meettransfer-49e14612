-- Admin Kullanıcı Ayarlama Scripti (Güncellenmiş Versiyon)
-- 1. Belirtilen kullanıcıya 'admin' rolü verir (app_role enum tipi kullanılarak).
-- 2. user_id kolonu boş olan kritik kayıtlara bu admin kullanıcısını atar.

DO $$
DECLARE
  -- Hedef Admin Kullanıcı Bilgileri
  target_user_id uuid := '9f380270-56d1-40e3-abe8-41ea6d3afe5f';
  target_email text := 'sautkahraman@gmail.com';
BEGIN
  -- 1. ADIM: Kullanıcıya Admin Rolü Ver
  -- user_roles tablosunda kayıt yoksa ekle, varsa güncelle
  -- Not: 'admin' değerini app_role enum tipine cast ediyoruz ('admin'::app_role)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (target_user_id, 'admin'::app_role);
      RAISE NOTICE 'Admin rolü başarıyla eklendi: % (ID: %)', target_email, target_user_id;
  ELSE
      UPDATE public.user_roles
      SET role = 'admin'::app_role
      WHERE user_id = target_user_id;
      RAISE NOTICE 'Kullanıcı rolü admin olarak güncellendi: % (ID: %)', target_email, target_user_id;
  END IF;

  -- 2. ADIM: Boş user_id Alanlarını Doldur
  -- Bu adım, yetim kalmış kayıtların admin kullanıcısına bağlanmasını sağlar.

  -- a. agencies tablosundaki boş user_id'leri güncelle
  UPDATE public.agencies
  SET user_id = target_user_id
  WHERE user_id IS NULL;
  RAISE NOTICE 'agencies tablosunda boş user_id alanları güncellendi.';

  -- b. audit_logs tablosundaki boş user_id'leri güncelle
  UPDATE public.audit_logs
  SET user_id = target_user_id, user_email = target_email
  WHERE user_id IS NULL;
  RAISE NOTICE 'audit_logs tablosunda boş user_id alanları güncellendi.';

  -- c. profiles tablosu (eğer varsa)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
      -- Eğer bu ID ile profil yoksa oluştur
      INSERT INTO public.profiles (id, email, full_name, role)
      VALUES (target_user_id, target_email, 'Admin User', 'admin'::app_role)
      ON CONFLICT (id) DO UPDATE
      SET role = 'admin'::app_role;
      RAISE NOTICE 'profiles tablosu güncellendi.';
  END IF;

END $$;
