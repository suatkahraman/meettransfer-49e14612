-- Bu scripti Supabase SQL Editor'de çalıştırarak admin kullanıcısını ekleyebilirsiniz.
-- Önceki olası kayıtları temizle (Çakışmayı önlemek için)

-- 1. Önce kullanıcı rollerini temizle (FK hatası almamak için)
DELETE FROM public.user_roles WHERE user_id = '9f380270-56d1-40e3-abe8-41ea6d3afe5f';

-- 2. Sonra auth.users tablosundan kullanıcıyı sil
DELETE FROM auth.users WHERE id = '9f380270-56d1-40e3-abe8-41ea6d3afe5f';

-- 3. Şimdi kullanıcıyı tekrar ekle
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '9f380270-56d1-40e3-abe8-41ea6d3afe5f',
  'authenticated',
  'authenticated',
  'sautkahraman@gmail.com',
  crypt('TempPass123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Suat Kahraman"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 4. Admin Rolünü Ata
INSERT INTO public.user_roles (user_id, role)
VALUES ('9f380270-56d1-40e3-abe8-41ea6d3afe5f', 'admin');
