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

  -- 2. Rol kontrolü - Hem text hem uuid uyumluluğu için casting yapıyoruz
  -- user_roles tablosundaki user_id sütunu text mi yoksa uuid mi emin olamadığımız durumlarda
  -- her iki tarafı da text'e çevirerek karşılaştırmak en güvenli yoldur.
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id::text = v_user_id::text 
    AND role::text = 'admin'
  ) INTO v_role_exists;

  -- 3. Rol yoksa ekle
  IF NOT v_role_exists THEN
    -- Insert işleminde de user_id'nin tipine göre davranmak lazım ama
    -- genellikle UUID verisi text sütuna veya UUID sütuna insert edilebilir.
    -- Ancak constraint hatası almamak için önce silmeyi deneyip sonra ekleyelim (temiz kurulum)
    
    -- Varsa sil (idempotency için)
    DELETE FROM public.user_roles 
    WHERE user_id::text = v_user_id::text 
    AND role::text = 'admin';

    -- Ekle
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin');
    
    RAISE NOTICE 'Kullanıcı % (ID: %) başarıyla admin yapıldı.', target_email, v_user_id;
  ELSE
    RAISE NOTICE 'Kullanıcı % (ID: %) zaten admin yetkisine sahip.', target_email, v_user_id;
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Olası diğer hataları yakalayıp detay verelim
  RAISE NOTICE 'Bir hata oluştu: %', SQLERRM;
END $$;
