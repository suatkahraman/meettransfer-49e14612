-- Bu sorguyu Supabase Dashboard > SQL Editor kısmında çalıştırın.
-- https://supabase.com/dashboard/project/zqykoyugubaeealrspxm/sql/new

DO $$
DECLARE
  -- AŞAĞIDAKİ E-POSTA ADRESİNİ KENDİ E-POSTA ADRESİNİZLE DEĞİŞTİRİN
  target_email text := 'admin@example.com'; 
  
  v_user_id uuid;
BEGIN
  -- 1. Kullanıcı ID'sini bul
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = target_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı: %. Lütfen önce bu e-posta ile kayıt olun.', target_email;
  END IF;

  -- 2. user_roles tablosuna admin rolü ekle
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. Başarılı mesajı
  RAISE NOTICE 'Kullanıcı % (ID: %) başarıyla admin yetkisine sahip oldu.', target_email, v_user_id;
END $$;
