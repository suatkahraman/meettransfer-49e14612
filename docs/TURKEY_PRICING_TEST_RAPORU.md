# Türkiye Fiyatlandırma Test Raporu

**Tarih:** 2026-02-15  
**Test:** KM hesaplama ve region_prices silme doğrulaması

---

## Test Sonuçları (Canlı Veritabanı)

### 1. region_prices – Türkiye Kayıtları

| Durum | Değer |
|-------|-------|
| Toplam kayıt | 1000 |
| Türkiye kayıtları | **905** |
| Dubai/Cyprus | 0 |
| Sonuç | **Türkiye fiyatları henüz silinmedi** |

Migration `20260215110000_delete_region_prices.sql` henüz uygulanmamış.

### 2. distance_pricing_rules – KM Hesaplama

| Durum | Değer |
|-------|-------|
| Tablo | Schema cache'te bulunamadı |
| Sonuç | **distance_pricing_rules tablosu bu projede yok** veya migration'lar uygulanmamış |

---

## Yapılması Gerekenler

### Adım 1: Migration'ları Uygula

```bash
# Supabase projesini linkle (bir kez)
npx supabase link --project-ref zqykoyugubaeealrspxm

# Migration'ları uygula (distance_pricing_rules + Türkiye region_prices silme)
npm run db:push
# veya
npm run db:deploy
```

**Migration sırası:**
1. `20260213000000_distance_pricing_rules_airport_columns.sql` – tablo oluşturma
2. `20260213100000` – base_price, price_per_km
3. `20260213110000` – min_km, max_km
4. `20260213120000` – Türkiye seed
5. `20260213130000` – 0-50 km kuralları
6. `20260213200000` – price_amount, city
7. `20260213210000` – vehicle_type canonical
8. `20260215100000` – place_id, location_display, valid_from, valid_to
9. `20260215110000` – **Türkiye region_prices silme**

### Adım 2: Doğrulamayı Tekrar Çalıştır

```bash
npx tsx scripts/verify-turkey-pricing.ts
```

**Beklenen sonuç migration sonrası:**
- `region_prices`: Türkiye kayıtları = 0
- `distance_pricing_rules`: 4+ araç tipi, 0-50 km kuralları mevcut

### Adım 3: KM Hesaplama Testi (Manuel)

1. Uygulamayı başlat: `npm run dev`
2. Admin panel → Bölge Fiyatları → **KM Hesaplama** sekmesi
3. Yeni kural ekle: Google Places ile örn. "İstanbul Havalimanı", min 0, max 50, araç fiyatları
4. Rezervasyon formunda test: İstanbul → Taksim, mesafe ~45 km
5. Fiyatların `distance_pricing_rules` üzerinden döndüğünü kontrol et

---

## KM Hesaplama Akışı (get-all-vehicle-prices)

Türkiye için fiyat önceliği:

1. **İntercity** (farklı şehir): `intercity_prices` sabit fiyat varsa kullan
2. **Yoksa**: `distance_pricing_rules` (KM bazlı)
   - 0–50 km: `price_amount` (sabit) veya `base_price + (km × price_per_km)`
   - 51–85 km: KM başı çarpan
   - 86+ km: "Lütfen fiyat isteyin" veya fallback

`region_prices` artık **Türkiye için kullanılmıyor** (İstanbul v2.8.5’te silindi, diğer Türkiye şehirleri bu migration ile silinecek).

---

## Doğrulama Scripti

```bash
npx tsx scripts/verify-turkey-pricing.ts
```

Gereksinim: `.env` içinde `VITE_SUPABASE_URL` ve `VITE_SUPABASE_PUBLISHABLE_KEY` tanımlı olmalı.
