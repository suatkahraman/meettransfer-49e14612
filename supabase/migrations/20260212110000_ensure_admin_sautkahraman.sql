-- Admin rolü: sautkahraman@gmail.com için user_roles kontrolü
-- Bu kullanıcı auth.users'da varsa admin rolü garanti edilir.
-- Customer, driver, agency rolleri mevcut kayıtlarına göre çalışır.

DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'sautkahraman@gmail.com'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Varsa eski rollerini sil, admin yap
    DELETE FROM public.user_roles WHERE user_id = admin_user_id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT ON CONSTRAINT user_roles_user_id_role_key DO NOTHING;
    RAISE NOTICE 'Admin role ensured for sautkahraman@gmail.com (user_id: %)', admin_user_id;
  ELSE
    RAISE NOTICE 'User sautkahraman@gmail.com not found in auth.users - run setup-initial-admin first';
  END IF;
END $$;
