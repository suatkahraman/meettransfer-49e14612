-- sautkahraman@gmail.com SADECE admin - tek rol, admin panele giris
-- Tum diger roller (customer, driver, agency) user_roles'dan kaldirilir.
-- get-user-role da bu email icin her zaman admin doner (gerekirse oncelikli kontrol)

DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'sautkahraman@gmail.com'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- user_roles: tum rollerini sil, sadece admin ekle
    DELETE FROM public.user_roles WHERE user_id = admin_user_id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin');

    RAISE NOTICE 'sautkahraman@gmail.com: sadece admin rol (user_id: %)', admin_user_id;
  ELSE
    RAISE NOTICE 'User sautkahraman@gmail.com not found in auth.users - run setup-initial-admin first';
  END IF;
END $$;
