-- Driver panel giriş: user_roles RLS yumuşatma
-- Kullanıcı kendi rolünü kesin okuyabilsin (auth.uid() = user_id)
-- Mevcut policy'ler recursion riski taşıyorsa bu basit policy devreye girer.

DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role"
ON public.user_roles
AS PERMISSIVE
FOR SELECT
USING (auth.uid() = user_id);
