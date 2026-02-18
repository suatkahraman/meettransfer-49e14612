# Admin Panel KM Hesaplama Bölümü - Durum Raporu

Bu rapor, `cursor/admin-panel-km-hesaplama-g-ncellemeleri-7981` branch'inde yapılan ve **yarım kalan** admin panel KM hesaplama güncellemelerini özetler.

---

## 📋 Özet

| Durum | Açıklama |
|-------|----------|
| **Backend** | ✅ Tamamlandı – `distance_pricing_rules` tablosu ve hesaplama mantığı çalışıyor |
| **Migrations** | ✅ Tamamlandı – Tüm SQL migrations mevcut |
| **Admin Panel UI** | ❌ **Eksik** – KM hesaplama yönetim arayüzü yok |

---

## 1. Yapılanlar (Tamamlanan Kısımlar)

### 1.1 Veritabanı (distance_pricing_rules)

**Tablo şeması:**
- `vehicle_type` – Araç tipi
- `base_price` – Sabit taban fiyat (formül: `base_price + (mesafe_km × price_per_km)`)
- `price_per_km` – KM başına birim fiyat
- `min_km`, `max_km` – KM aralığı (0–50, 51–85, 86+)
- `price_amount` – 0–50 km sabit toplam fiyat veya 51–85 km için KM başı çarpan
- `city` – Şehir (NULL = tüm Türkiye)

**Migrations:**
```
supabase/migrations/
├── 20260213000000_distance_pricing_rules_airport_columns.sql  (tablo oluşturma)
├── 20260213100000_distance_pricing_rules_km_columns.sql       (base_price, price_per_km)
├── 20260213110000_distance_pricing_rules_min_max_km.sql       (min_km, max_km)
├── 20260213120000_distance_pricing_rules_seed_turkey.sql      (varsayılan kurallar)
├── 20260213130000_distance_pricing_rules_short_distance.sql   (0-50 km dilimleri)
├── 20260213200000_distance_pricing_rules_price_amount.sql     (price_amount, city)
└── 20260213210000_v289_vehicle_type_canonical.sql             (vehicle_type normalize)
```

### 1.2 Backend Fiyatlandırma Mantığı

**get-all-vehicle-prices** (Edge Function):
- 0–50 km: `price_amount` = toplam sabit fiyat
- 51–85 km: `price_amount` × mesafe_km
- 86+ km: “Lütfen fiyat isteyin” veya intercity fallback

**İlgili dosyalar:**
- `supabase/functions/get-all-vehicle-prices/index.ts`
- `supabase/functions/auto-price-reservation/index.ts`
- `supabase/functions/auto-price-quick-booking/index.ts`

### 1.3 Bölge Fiyatları Sayfası (Kısmen)

**AdminRegionPrices** (`/admin/region-prices`):
- ✅ Havalimanı Transfer Fiyatları (`region_prices`)
- ✅ Şehirler Arası Fiyatlar (`intercity_prices`)
- ✅ Sezonluk Fiyatlar
- ✅ Fiyat Eşleştirme Testi (testPriceMatch)
- ✅ `CITIES_DATA` – 35+ Türkiye şehri ve havalimanı

---

## 2. Eksik / Yarım Kalan Kısımlar

### 2.1 Admin Panel KM Hesaplama Arayüzü

**Eski durum (Git geçmişi):**
- `fa1e285f`: **KmBasedPricesManager** component eklendi, “KM Bazlı” sekmesi vardı
- `61542ef9`: `km_based_prices` → `distance_pricing_rules` geçişi
- **Güncel durum:** `KmBasedPricesManager` ve “KM Bazlı” sekmesi **projede yok**

**Mevcut AdminRegionPrices sekmeleri:**
1. Havalimanı
2. Şehirler Arası
3. Sezonluk

**Eksik olan:**
- “KM Hesaplama” / “KM Bazlı” sekmesi
- `distance_pricing_rules` tablosunu yönetecek UI (CRUD)
- KM aralıkları (0–50, 51–85, 86+) için kural düzenleme

### 2.2 distance_pricing_rules Yönetimi

Şu anda `distance_pricing_rules` yalnızca:
- Migrations ile seed ediliyor
- Edge function’lar tarafından okunuyor

**Olması gereken:**
- Admin panelde kuralların listelenmesi
- Yeni kural ekleme (araç tipi, KM aralığı, fiyat)
- Mevcut kuralların düzenlenmesi/silinmesi
- Hesaplama testi (ör. 45 km girildiğinde fiyat önizlemesi)

---

## 3. Önerilen Tamamlama Adımları

1. **AdminRegionPrices’e “KM Hesaplama” sekmesi eklenmesi**
   - `TabsList` içine 4. sekme
   - Yeni component: `DistancePricingRulesManager` (veya benzeri)

2. **DistancePricingRulesManager component**
   - `distance_pricing_rules` tablosundan SELECT
   - Araç tipi, min_km, max_km, price_amount, base_price, price_per_km, city filtreleri
   - INSERT / UPDATE / DELETE (Supabase)
   - Test hesaplayıcı: km + araç tipi → önizleme fiyatı

3. **Route / navigasyon**
   - Mevcut `/admin/region-prices` içinde sekme olarak kalabilir
   - Veya ayrı sayfa: `/admin/distance-pricing-rules` (tercihe bağlı)

---

## 4. İlgili Git Commit’leri

| Commit | Açıklama |
|--------|----------|
| `fa1e285f` | feat: add KM-based regional pricing to admin panel (KmBasedPricesManager) |
| `1b185232` | Revert "Admin panel bölgesel fiyatlandırma" |
| `61542ef9` | feat: replace km_based_prices with tiered distance_pricing_rules system |
| `6a2d4cf0` | Bölgesel fiyatlandırma: Türkiye havalimanları KM tabanlı fiyat hesaplaması |
| `931a85ab` | feat(v2.8.8): distance_pricing_rules 0-50 fixed, 51-85 per-km, 86+ top tier |

---

## 5. Dosya Referansları

| Dosya | Açıklama |
|-------|----------|
| `src/pages/admin/AdminRegionPrices.tsx` | Bölge fiyatları – KM sekmesi eklenebilir |
| `supabase/functions/get-all-vehicle-prices/index.ts` | Backend KM hesaplama |
| `src/lib/priceMatching.ts` | Test eşleştirme – distance_pricing_rules entegrasyonu |
| `supabase/migrations/*distance_pricing*` | Tablo ve seed migrations |

---

## 6. Güncelleme (2026-02-15) – KM Hesaplama Bölümü Tamamlandı

Aşağıdaki özellikler eklendi:

1. **Google Places ile Şehir/Havalimanı Seçimi**  
   - Admin KM Hesaplama formunda Google Places Autocomplete  
   - Seçilen yerden otomatik şehir (locality) çıkarımı  

2. **Tüm Araç Tipleri**  
   - Standart Sedan, Mercedes Vito, VIP Mercedes, Maybach, Sprinter  
   - Her araç için fiyat girişi  

3. **Tarih Aralığı**  
   - `valid_from` ve `valid_to` (opsiyonel)  
   - Sezonluk fiyatlandırma için kullanılabilir  

4. **KM Aralığı**  
   - Min KM ve Max KM  
   - İki değer arası mesafe için kural tanımı  

5. **Havalimanı Baz Fiyat**  
   - `airport_extra_fee` alanı düzenlenebilir  
   - Havalimanı transferi işaretlenebilir  

**Yeni/Değişen Dosyalar:**
- `src/components/admin/DistancePricingRulesManager.tsx` – Yeni component
- `src/pages/admin/AdminRegionPrices.tsx` – KM Hesaplama sekmesi eklendi
- `supabase/migrations/20260215100000_distance_pricing_rules_place_and_dates.sql` – `place_id`, `location_display`, `valid_from`, `valid_to` sütunları
- `src/components/ui/lazy-google-places-autocomplete.tsx` – PlaceDetails için `city`, `country` alanları eklendi

---

*Rapor oluşturulma: 2026-02-15*
*Güncelleme: 2026-02-15*
