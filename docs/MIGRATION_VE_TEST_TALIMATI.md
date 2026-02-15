# Migration ve Test Talimatı

## 1. Veritabanı Migration'ı (Türkiye Fiyatları Silme)

Supabase Dashboard'a gidin: **SQL Editor** → Yeni sorgu

`supabase/RUN_MIGRATIONS_MANUEL.sql` dosyasının içeriğini yapıştırıp **Run** ile çalıştırın:

```sql
-- Önce kaç kayıt silineceğini kontrol et
SELECT COUNT(*) AS silinecek_turkiye_kayit
FROM public.region_prices
WHERE (city IS NULL) OR (LOWER(TRIM(city)) NOT IN ('dubai', 'cyprus'));

-- Türkiye bölge fiyatlarını sil
DELETE FROM public.region_prices
WHERE (city IS NULL) OR (LOWER(TRIM(city)) NOT IN ('dubai', 'cyprus'));

-- Doğrulama
SELECT city, COUNT(*) FROM public.region_prices GROUP BY city;
```

**Sonuç:** Sadece Dubai ve Cyprus kayıtları kalmalı.

---

## 2. Tam Migration (db push) – Opsiyonel

Eğer `distance_pricing_rules` tablosu henüz yoksa:

```bash
npx supabase login
npm run db:push
```

Bu komut tüm migration'ları uygular (tablo oluşturma, sütunlar, seed vb.).

---

## 3. Admin Panel KM Fiyat Güncelleme – Tarih Aralığı

**İki tarih arasında fiyat değişikliği:**

1. Admin → Bölge Fiyatları → **KM Hesaplama** sekmesi
2. **Yeni Kural Ekle**
3. Google Places ile şehir/havalimanı seçin
4. **Geçerlilik Başlangıç** (valid_from): örn. 2025-06-01
5. **Geçerlilik Bitiş** (valid_to): örn. 2025-08-31
6. Min/Max KM ve araç fiyatlarını girin
7. **Kaydet**

**Başarı mesajı:** `KM fiyat kuralları kaydedildi (2025-06-01 - 2025-08-31)`

**Backend davranışı:** Rezervasyon/teklif tarihi `pickup_date` gönderildiğinde, `get-all-vehicle-prices` sadece o tarihe uyan kuralları kullanır (valid_from ≤ pickup_date ≤ valid_to).

---

## 4. Doğrulama

```bash
npm run verify:pricing
```

Beklenen:
- Türkiye `region_prices`: 0
- `distance_pricing_rules`: 4+ araç, 0–50 km kuralları mevcut
