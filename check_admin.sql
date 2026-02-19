-- Admin Kullanıcısını Kontrol Et

-- 1. auth.users tablosundaki kullanıcılar (Email ve ID)
SELECT id, email, created_at FROM auth.users;

-- 2. user_roles tablosundaki roller (Admin var mı?)
SELECT ur.user_id, u.email, ur.role
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id;

-- 3. Reservations tablosunda kaç kayıt var?
SELECT COUNT(*) FROM public.reservations;

-- 4. Admin kullanıcısı ile Reservations tablosunu okuyabilir mi? (Simülasyon)
-- (Bunu SQL Editor'de doğrudan test edemezsiniz ama mantığını anlayabilirsiniz)
-- Admin kullanıcısı ID'sini buraya yazarak test edebilirsiniz:
-- SET ROLE authenticated;
-- SET request.jwt.claim.sub = 'ADMIN_USER_UUID';
-- SELECT * FROM public.reservations LIMIT 5;
