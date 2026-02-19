-- Bu sorguyu Supabase Dashboard > SQL Editor kısmında çalıştırın.
-- https://supabase.com/dashboard/project/zqykoyugubaeealrspxm/sql/new

DO $$
DECLARE
  target_email text := 'sautkahraman@gmail.com';
  v_user_id uuid;
BEGIN
  -- 1. Kullanıcı ID'sini bul
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = target_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı: %. Lütfen önce bu e-posta ile kayıt olun.', target_email;
  END IF;

  -- 2. Admin rolünü ekle (Doğrudan string olarak, type casting olmadan)
  -- Supabase bazen tür dönüşümlerini (casting) otomatik yapabilir veya enum public şemasında olmayabilir.
  -- Bu yüzden en güvenli yol, değerin kendisini göndermektir.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Kullanıcı % (ID: %) için admin yetkisi tanımlandı.', target_email, v_user_id;
END $$;
