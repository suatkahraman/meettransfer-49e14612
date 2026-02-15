/**
 * Türkiye fiyatlandırma doğrulama scripti
 * 
 * Kontrol eder:
 * 1. region_prices: Türkiye kayıtları silinmiş mi? (Dubai, Cyprus kalmalı)
 * 2. distance_pricing_rules: KM hesaplama için kurallar mevcut mu?
 * 
 * Kullanım: npx tsx scripts/verify-turkey-pricing.ts
 * Gereken: .env'de VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

const TURKEY_CITIES = [
  'istanbul', 'antalya', 'alanya', 'bodrum', 'dalaman', 'izmir', 'cappadocia',
  'bursa', 'aydin', 'mugla', 'denizli', 'adana', 'ankara', 'trabzon', 'gaziantep',
  'diyarbakir', 'van', 'malatya', 'samsun', 'kocaeli', 'tekirdag', 'edirne',
  'kars', 'elazig', 'sivas', 'sinop', 'kastamonu', 'zonguldak', 'sirnak',
  'agri', 'mardin', 'afyon', 'mus', 'erzurum', 'erzincan', 'sanliurfa',
  'hatay', 'balikesir', 'canakkale', 'ordu', 'rize'
];

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('HATA: VITE_SUPABASE_URL ve VITE_SUPABASE_PUBLISHABLE_KEY (veya VITE_SUPABASE_ANON_KEY) .env\'de tanımlı olmalı');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('=== Türkiye Fiyatlandırma Doğrulaması ===\n');

  // 1. region_prices - Türkiye kayıtları kontrolü
  const { data: regionData, error: regionErr } = await supabase
    .from('region_prices')
    .select('id, city');

  if (regionErr) {
    console.error('region_prices sorgu hatası:', regionErr.message);
  } else {
    const cities = (regionData || []).map(r => (r.city || '').trim().toLowerCase());
    const turkeyCount = cities.filter(c => c && TURKEY_CITIES.some(t => c.includes(t) || t.includes(c))).length;
    const dubaiCyprusCount = cities.filter(c => c === 'dubai' || c === 'cyprus').length;
    const otherCount = regionData!.length - turkeyCount - dubaiCyprusCount;

    console.log('1. region_prices tablosu:');
    console.log(`   Toplam kayıt: ${regionData!.length}`);
    console.log(`   Türkiye kayıtları: ${turkeyCount} ${turkeyCount === 0 ? '✓ (silinmiş olmalı)' : '✗ HATA - silinmeli!'}`);
    console.log(`   Dubai/Cyprus: ${dubaiCyprusCount}`);
    console.log(`   Diğer/NULL: ${otherCount}`);
    if (regionData!.length > 0) {
      const cityCounts: Record<string, number> = {};
      cities.forEach(c => { cityCounts[c] = (cityCounts[c] || 0) + 1; });
      console.log('   Şehir dağılımı:', Object.entries(cityCounts).slice(0, 10).map(([k, v]) => `${k}:${v}`).join(', '));
    }
    console.log('');
  }

  // 2. distance_pricing_rules - KM hesaplama kuralları
  const { data: kmData, error: kmErr } = await supabase
    .from('distance_pricing_rules')
    .select('id, vehicle_type, min_km, max_km, price_amount, base_price, price_per_km, city');

  if (kmErr) {
    console.error('distance_pricing_rules sorgu hatası:', kmErr.message);
  } else {
    const kmRules = kmData || [];
    const vehicleTypes = [...new Set(kmRules.map(r => r.vehicle_type))];
    const has0to50 = kmRules.some(r => (r.min_km ?? 0) <= 50 && (r.max_km ?? 999) >= 50);

    console.log('2. distance_pricing_rules (KM Hesaplama):');
    console.log(`   Toplam kural: ${kmRules.length}`);
    console.log(`   Araç tipleri: ${vehicleTypes.join(', ')}`);
    console.log(`   0-50 km kuralı: ${has0to50 ? '✓ Var' : '✗ Eksik!'}`);
    if (kmRules.length > 0) {
      const sample = kmRules.slice(0, 4);
      console.log('   Örnek kurallar:');
      sample.forEach(r => {
        console.log(`     - ${r.vehicle_type}: ${r.price_amount != null ? `€${r.price_amount}` : `base ${r.base_price} + ${r.price_per_km}/km`} (${r.min_km}-${r.max_km ?? '∞'} km)`);
      });
    }
    console.log('');
  }

  console.log('=== Doğrulama tamamlandı ===');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
