# Uçtan Uca Test Raporu: Intercity/Intracity Öncelik Hiyerarşisi

## Yapılan Değişiklikler

### 1. Öncelik Hiyerarşisi (Türkiye)

| Rota Tipi | Öncelik 1 | Öncelik 2 |
|-----------|-----------|-----------|
| **Intercity** (Farklı şehir: Istanbul → Ankara) | `intercity_prices` (sabit fiyat) | `distance_pricing_rules` (KM hesabı) |
| **Intracity** (Aynı şehir: Taksim → Kadıköy) | - | `distance_pricing_rules` **SADECE** |

### 2. Şehir İçi Sabit Fiyat Kısıtlaması

- **Intracity** sorgularda `intercity_prices` tablosuna **ASLA** bakılmaz
- Log: `"Intracity - sabit fiyat tablosuna BAKILMAZ, sadece KM hesabı"`
- Sadece `distance_pricing_rules` + Base Price + (KM × per_km) kullanılır

### 3. Intercity Sabit Fiyat

- `intercity_prices` tablosunda `from_city` / `to_city` eşleşmesi aranır
- Her iki yön denlenir (Istanbul→Ankara ve Ankara→Istanbul)
- Eşleşme varsa sabit fiyat kullanılır; yoksa KM hesabına düşer

---

## Test Senaryoları

### Senaryo A: Şehir İçi (Intracity) – Sabit Fiyat ATLANMALI
**Girdi:** Taksim, Istanbul → Kadıköy, Istanbul  
**Beklenen:** 
- `intercity_prices` tablosuna SORGU YAPILMAZ
- `distance_pricing_rules` ile KM hesabı (örn: 15 km × 0.8€ + 20€ base)
- Log: "Intracity - sabit fiyat tablosuna BAKILMAZ"

### Senaryo B: Şehirler Arası (Intercity) – Sabit Fiyat VAR
**Girdi:** Istanbul → Ankara (`intercity_prices`'da kayıt var)  
**Beklenen:**
- `intercity_prices` sorgulanır
- Eşleşme bulunursa sabit fiyat döner
- Log: "Intercity FIXED prices (city_to_city) found: N"
- `priceSource: "intercity_prices"`

### Senaryo C: Şehirler Arası (Intercity) – Sabit Fiyat YOK
**Girdi:** Trabzon → Van (`intercity_prices`'da kayıt yok)  
**Beklenen:**
- `intercity_prices` sorgulanır, sonuç boş
- Otomatik olarak `distance_pricing_rules` ile KM hesabı
- `priceSource: "distance_pricing_rules"`

### Senaryo D: Havalimanı Transferi
**Girdi:** Istanbul Airport (IST) → Taksim  
**Beklenen:**
- `airport` set → `airportFee = 5€` eklenir
- KM hesabı + 5€ (intracity/intercity ayrımı havalimanı için geçerli; mesafe ile hesaplanır)

---

## Doğrulama Adımları

1. **LivePriceCalculator veya BookingPage** ile aynı şehir girişi yapın (örn: Taksim → Kadıköy)
2. **DevTools Console** ve **Supabase Edge Function Logs** üzerinden kontrol edin:
   - "Intracity - sabit fiyat tablosuna BAKILMAZ" logu görünmeli
   - `priceSource: "distance_pricing_rules"`
3. Farklı şehir girişi yapın (örn: Istanbul → Ankara)
   - Intercity sabit fiyat varsa: `priceSource: "intercity_prices"`
   - Yoksa: KM hesabı, `priceSource: "distance_pricing_rules"`

---

## Sürüm

- **v2.7.3** (build 18)
- Değişiklik: Intercity/Intracity öncelik hiyerarşisi, şehir içi sabit fiyat atlama
