# Fiyat Hesaplama - Uçtan Uca Debug Raporu

## Eklenen Log Noktaları

### 1. Frontend - Mesafe Oluşumu

#### LivePriceCalculator.tsx
- **raw_distance_from_google**: Google Directions API'den gelen ham mesafe
  - `meters`: Google'ın `leg.distance.value` değeri (METRE cinsinden)
  - `km`: `meters / 1000` (kilometre)
  - `unit`: "Google API: distance.value = METERS"
- **final_sent_distance**: Backend'e gönderilen son değer (KM)
- **Body sent to backend**: Backend'e giden tam body (distance_km dahil)
- **Uyarı**: Koordinat yoksa `"distance_km NOT sent, Turkey pricing will fail"`

#### BookingPage.tsx
- Aynı log yapısı (raw_distance_from_google, final_sent_distance, Body)
- Koordinat yoksa uyarı verir

**Birim Açıklaması**: Google Directions API `leg.distance.value` değerini **METRE** olarak döner. `distanceKm = value / 1000` ile KM'ye çevriliyor ve backend'e `distance_km` olarak gönderiliyor.

---

### 2. Backend - Hesaplama Mantığı (get-all-vehicle-prices/index.ts)

#### Gelen distance_km
```
[get-all-vehicle-prices DEBUG] Turkey branch - incoming distance_km: <raw> | parsed distanceKm: <number> | isDubai: false
```

#### Kural Eşleşmesi
```
[get-all-vehicle-prices DEBUG] Turkey - distance_pricing_rules matched: EVET/HAYIR | rule_ids: {...} | vehiclePriceMap: {...}
```
- **EVET**: Tabloda mesafeye uygun (min_km ≤ distance ≤ max_km) en az bir kural bulundu
- **rule_ids**: Hangi kural ID'sinin hangi araç türüne eşlendiği
- **vehiclePriceMap**: Araç türü → hesaplanan fiyat

#### Hesaplanan Fiyat
```
[get-all-vehicle-prices DEBUG] Turkey - vehicle: mercedes-vito | basePrice: 85 | airportFee: 5 | total_price: 90 | exchange_rate: N/A (fiyat EUR)
```

---

### 3. Hata Yakalama

| debug_reason | Sebep | Mesaj |
|--------------|-------|-------|
| **MESAFE_GECERSIZ** | distance_km null, 0 veya frontend'den gönderilmedi | "Mesafe geçersiz veya gönderilmedi" |
| **VERITABANI_HATASI** | distance_pricing_rules sorgusu başarısız | "Veritabanı hatası" |
| **KURAL_YOK** | Tabloda min_km/max_km aralığına uyan kural yok | "Bu mesafeye uygun kural bulunamadı" |
| **FIYAT_0_veya_ESLESME_YOK** | Kural var ama araç türü eşleşmesi yok veya fiyat 0 | "Araç türü eşleşmesi yok veya hesaplanan fiyat 0" |

---

## Adım Adım Veri Akışı – Nerede Bozulabilir?

### Akış Özeti

```
[1] Kullanıcı konum seçer (Google Places Autocomplete)
       ↓
[2] PlaceDetails'tan lat/lng alınır (geometry.location)
       ↓
[3] getDirections(pickupCoords, dropoffCoords) çağrılır
       ↓
[4] Google Directions API → distance.value (METRE)
       ↓
[5] distanceKm = distance.value / 1000
       ↓
[6] body.distance_km = distanceKm → Backend'e gönderilir
       ↓
[7] Backend: distance_pricing_rules'tan uygun satır bulunur (min_km ≤ distanceKm ≤ max_km)
       ↓
[8] Fiyat = base_price + (distanceKm × price_per_km) + airportFee
```

---

### Olası Bozulma Noktaları

#### Nokta 1: Koordinat Alınamıyor
- **Sebep**: Google Places Autocomplete `geometry` dönmüyor veya `onPlaceSelected` tam PlaceDetails almıyor.
- **Sonuç**: `pickupCoords` veya `dropoffCoords` null → getDirections çağrılmaz → `distance_km` gönderilmez.
- **Log**: `"[LivePriceCalculator DEBUG] No coords - pickupCoords: false dropoffCoords: false"`

#### Nokta 2: Manuel Adres Girişi
- **Sebep**: Kullanıcı adresi yazıyor, dropdown'dan seçmiyor.
- **Sonuç**: PlaceDetails yok → koordinat yok → mesafe hesaplanamaz.
- **Çözüm**: Sadece Autocomplete'ten seçilen adreslerde mesafe hesaplanır.

#### Nokta 3: getDirections Başarısız
- **Sebep**: Google Maps yüklenmemiş, API hatası veya rota bulunamıyor.
- **Sonuç**: `dir === null` → `distance_km` gönderilmez.
- **Log**: `"getDirections returned null - no distance"`

#### Nokta 4: Birim Yanlışlığı (Önceki Risk)
- **Durum**: Google `value`'yu metre veriyor; `distanceKm = value/1000` ile KM'ye çevriliyor.
- **Log**: `raw_distance_from_google` ile hem metre hem KM kontrol edilebilir.

#### Nokta 5: Backend – distance_km Eksik
- **Sebep**: Frontend `distance_km` göndermiyor (Nokta 1–3).
- **Sonuç**: `distanceKm === null` → `MESAFE_GECERSIZ`.
- **Log**: `"incoming distance_km: undefined | parsed distanceKm: null"`

#### Nokta 6: Backend – Kural Bulunamıyor
- **Sebep**: `distance_pricing_rules` tablosunda `min_km`–`max_km` aralığına uyan satır yok.
- **Örnek**: Mesafe 150 km, tüm kurallar max_km=100.
- **Sonuç**: `KURAL_YOK`, `vehiclePriceMap` boş.

#### Nokta 7: Araç Türü Eşleşmesi
- **Sebep**: Tablo `vehicle_type` değerleri (ör. `mercedes-vito`) frontend `dbAliases` ile eşleşmiyor.
- **Sonuç**: `FIYAT_0_veya_ESLESME_YOK`.

---

## Test Adımları

1. Tarayıcıda DevTools → Console'u açın.
2. **LivePriceCalculator** veya **BookingPage** üzerinden:
   - Her iki konumu da **dropdown'dan seçin** (manuel yazmayın).
   - "Get Instant Prices" / fiyat hesaplama tetikleyin.
3. Console loglarını kontrol edin:
   - `raw_distance_from_google` → metre + km değerleri
   - `final_sent_distance` → backend'e giden KM
   - `Body sent to backend` → `distance_km` var mı?
4. Backend logları (Supabase Edge Functions logs):
   - `incoming distance_km` ve `parsed distanceKm`
   - `distance_pricing_rules matched: EVET/HAYIR`
   - `rule_ids`, `vehiclePriceMap`
5. Fiyat 0/null ise `debug_reason` ve `message` değerlerine bakın.

---

## Özet: Veri Nerede Bozuluyor?

| Senaryo | Muhtemel Neden | Çözüm |
|---------|----------------|-------|
| Her zaman "Fiyat hesaplanamadı" | distance_km hiç gönderilmiyor | Konumları Autocomplete'ten seçin; koordinat ve getDirections akışını kontrol edin |
| Bazen çalışıyor bazen çalışmıyor | Koordinat bazen null (manuel giriş vs.) | Sadece dropdown seçimine izin verin veya geocoding ile koordinat üretin |
| Mesafe var fakat fiyat yok | Kural yok veya araç eşleşmesi yok | `distance_pricing_rules` min_km/max_km ve vehicle_type değerlerini kontrol edin |
| Veritabanı hatası | Supabase bağlantı/izin sorunu | RLS, service role key ve tablo erişimini kontrol edin |
