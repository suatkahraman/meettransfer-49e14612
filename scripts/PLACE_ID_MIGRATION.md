# Place ID Migration – Adreslerden Google Place ID Dönüşümü

Bu göç betiği, veritabanındaki bölgesel ve şehirler arası fiyat kayıtlarındaki adres metinlerini Google Place ID'lerine dönüştürür. **Fiyat verilerine (price, valid_from, valid_to) dokunulmaz.**

## Adımlar

### 1. Migration'ı çalıştırın (sütunları ekleyin)

```bash
supabase db push
# veya
supabase migration up
```

Bu işlem `pickup_place_id`, `dropoff_place_id`, `pickup_formatted_address`, `dropoff_formatted_address`, `place_id_status` sütunlarını ekler.

### 2. Ortam değişkenlerini ayarlayın

```bash
export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

Google Cloud Console'dan **Geocoding API**'nin etkin olduğundan emin olun.

### 3. Kuru çalıştırma (önerilir)

Veritabanına yazmadan hangi kayıtların işleneceğini görün:

```bash
DRY_RUN=1 npx tsx scripts/migrate-place-ids.ts
```

### 4. Gerçek migration'ı çalıştırın

```bash
npx tsx scripts/migrate-place-ids.ts
```

Script:
- `region_prices`: airport → pickup_place_id, district → dropoff_place_id
- `intercity_prices`: from_city/from_district → pickup_place_id, to_city/to_district → dropoff_place_id

Google bulamayan satırlar `place_id_status` ile işaretlenir:
- `ok` – Her iki konum da bulundu
- `pickup_not_found` – Başlangıç bulunamadı
- `dropoff_not_found` – Varış bulunamadı
- `both_not_found` – İkisi de bulunamadı

### 5. Manuel kontrol

Admin panelde `place_id_status != 'ok'` ile filtreleyerek manuel düzeltme gereken kayıtları listeleyebilirsiniz.

## Sonrası: Fiyatlandırma Motoru

Migration tamamlandıktan sonra fiyatlandırma motorunun Place ID kullanması için:

1. Rezervasyon formunda alınan adresler, Google Maps Autocomplete/Geocoding ile Place ID'ye çevrilmeli.
2. `priceMatching.ts` veya ilgili edge function, eşleştirme yaparken önce Place ID ile arama yapmalı; bulunamazsa mevcut metin tabanlı eşleşmeye düşmeli.

Bu entegrasyon ayrı bir görev olarak yapılacak.
