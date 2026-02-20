-- Row Level Security (RLS) Politikaları
-- Bu dosya, tabloların güvenliğini sağlamak için kimlerin hangi verilere erişebileceğini tanımlar.

-- Not: UUID karşılaştırma hatalarını önlemek için auth.uid() fonksiyonu kullanıldığında doğrudan UUID karşılaştırması yapıyoruz.
-- Eğer user_id kolonları TEXT ise auth.uid()::text, UUID ise auth.uid() kullanılmalıdır.
-- Varsayım: Veritabanındaki user_id kolonları UUID tipindedir (Supabase standartı).

-- 1. agency_applications Tablosu Politikaları
ALTER TABLE public.agency_applications ENABLE ROW LEVEL SECURITY;

-- Herkes başvuru oluşturabilir (anonim kullanıcılar dahil)
CREATE POLICY "Herkes başvuru yapabilir"
ON public.agency_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Sadece adminler başvuruları görebilir
CREATE POLICY "Sadece adminler başvuruları görebilir"
ON public.agency_applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);

-- Sadece adminler güncelleme yapabilir (Onaylama işlemi için)
CREATE POLICY "Sadece adminler güncelleyebilir"
ON public.agency_applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);

-- 2. agencies Tablosu Politikaları
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Adminler tüm acenteleri görebilir
CREATE POLICY "Adminler tüm acenteleri görebilir"
ON public.agencies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);

-- Acenteler kendi bilgilerini görebilir
CREATE POLICY "Acenteler kendi bilgilerini görebilir"
ON public.agencies
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- 3. agency_reservation_details Tablosu Politikaları
ALTER TABLE public.agency_reservation_details ENABLE ROW LEVEL SECURITY;

-- Adminler tüm detayları görebilir
CREATE POLICY "Adminler rezervasyon detaylarını görebilir"
ON public.agency_reservation_details
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);

-- 4. user_roles Tablosu Politikaları
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Herkes kendi rolünü okuyabilir
CREATE POLICY "Kullanıcılar kendi rollerini okuyabilir"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Sadece adminler rol atayabilir/değiştirebilir
CREATE POLICY "Sadece adminler rol yönetebilir"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 5. audit_logs Tablosu Politikaları
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Sadece adminler logları görebilir
CREATE POLICY "Sadece adminler logları görebilir"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);

-- Sistem (Service Role) log yazabilir
CREATE POLICY "Log kaydı oluşturulabilir"
ON public.audit_logs
FOR INSERT
TO authenticated, service_role
WITH CHECK (true);

-- 6. quick_booking_requests Tablosu Politikaları
ALTER TABLE public.quick_booking_requests ENABLE ROW LEVEL SECURITY;

-- Herkes hızlı rezervasyon isteği oluşturabilir
CREATE POLICY "Herkes hızlı rezervasyon isteği oluşturabilir"
ON public.quick_booking_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Sadece adminler istekleri görebilir
CREATE POLICY "Sadece adminler istekleri görebilir"
ON public.quick_booking_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);

-- 7. distance_pricing_rules Tablosu Politikaları
ALTER TABLE public.distance_pricing_rules ENABLE ROW LEVEL SECURITY;

-- Herkes fiyat kurallarını okuyabilir (Fiyat hesaplama için)
CREATE POLICY "Herkes fiyat kurallarını okuyabilir"
ON public.distance_pricing_rules
FOR SELECT
TO anon, authenticated
USING (true);

-- Sadece adminler kural ekleyip değiştirebilir
CREATE POLICY "Sadece adminler kural yönetebilir"
ON public.distance_pricing_rules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);
