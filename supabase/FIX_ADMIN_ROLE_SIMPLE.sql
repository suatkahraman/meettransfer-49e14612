-- Bu sorguyu Supabase Dashboard > SQL Editor kısmında çalıştırın.
-- https://supabase.com/dashboard/project/zqykoyugubaeealrspxm/sql/new

DO $$
DECLARE
  target_email text := 'sautkahraman@gmail.com';
  v_user_id uuid;
  v_role_exists boolean;
BEGIN
  -- 1. Kullanıcı ID'sini bul
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = target_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı: %. Lütfen önce bu e-posta ile kayıt olun.', target_email;
  END IF;

  -- 2. Rol kontrolü (Type casting olmadan, en sade haliyle)
  -- Supabase'de enum karşılaştırmalarında string literal genellikle otomatik cast edilir.
  -- Eğer 'admin'::public.app_role hatası alınıyorsa, cast işlemini kaldırıp veritabanının kendi çözmesini bekleriz.
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_user_id AND role = 'admin'
  ) INTO v_role_exists;

  -- 3. Rol yoksa ekle
  IF NOT v_role_exists THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin');
    RAISE NOTICE 'Kullanıcı % (ID: %) başarıyla admin yapıldı.', target_email, v_user_id;
  ELSE
    RAISE NOTICE 'Kullanıcı % (ID: %) zaten admin yetkisine sahip.', target_email, v_user_id;
  END IF;

END $$;
