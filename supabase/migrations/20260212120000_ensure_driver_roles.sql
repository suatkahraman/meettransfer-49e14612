-- Surucu emailleri icin driver rolu ve drivers kaydi garantisi
-- camnaz85@gmail.com, fikret.karadag69@gmail.com, miross2148@gmail.com,
-- sadikctn.13@gmail.com, serhat.sahin.00707@gmail.com, info@meettransfer.com

DO $$
DECLARE
  driver_emails text[] := ARRAY[
    'camnaz85@gmail.com',
    'fikret.karadag69@gmail.com',
    'miross2148@gmail.com',
    'sadikctn.13@gmail.com',
    'serhat.sahin.00707@gmail.com',
    'info@meettransfer.com'
  ];
  e text;
  v_user_id uuid;
  v_driver_id uuid;
  v_name text;
  v_phone text;
BEGIN
  FOREACH e IN ARRAY driver_emails
  LOOP
    SELECT id INTO v_user_id FROM auth.users WHERE email = e LIMIT 1;
    IF v_user_id IS NULL THEN
      RAISE NOTICE 'User not found: %', e;
      CONTINUE;
    END IF;

    -- drivers tablosunda var mi kontrol et
    SELECT id, name, phone INTO v_driver_id, v_name, v_phone
    FROM public.drivers WHERE user_id = v_user_id LIMIT 1;

    IF v_driver_id IS NOT NULL THEN
      -- drivers kaydi var - user_roles'a driver ekle (varsa guncelleme yapma)
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_user_id, 'driver')
      ON CONFLICT ON CONSTRAINT user_roles_user_id_role_key DO NOTHING;
      RAISE NOTICE 'Driver role ensured for % (user_id: %, driver_id: %)', e, v_user_id, v_driver_id;
    ELSE
      -- drivers kaydi yok - profiles'dan name/phone al, drivers + user_roles olustur
      SELECT COALESCE(p.full_name, split_part(e, '@', 1), 'Driver'),
             COALESCE(NULLIF(trim(p.phone), ''), '+900000000000')
      INTO v_name, v_phone
      FROM public.profiles p
      WHERE p.id = v_user_id;

      IF v_name IS NULL THEN v_name := split_part(e, '@', 1); END IF;
      IF v_phone IS NULL OR trim(v_phone) = '' THEN v_phone := '+900000000000'; END IF;

      INSERT INTO public.drivers (user_id, name, phone, active)
      SELECT v_user_id, v_name, v_phone, true
      WHERE NOT EXISTS (SELECT 1 FROM public.drivers WHERE user_id = v_user_id);

      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_user_id, 'driver')
      ON CONFLICT ON CONSTRAINT user_roles_user_id_role_key DO NOTHING;
      RAISE NOTICE 'Driver record and role created for % (user_id: %)', e, v_user_id;
    END IF;
  END LOOP;
END $$;
