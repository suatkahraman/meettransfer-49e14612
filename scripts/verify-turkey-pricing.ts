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

  console.log(`URL: ${supabaseUrl}`);

  // 1. region_prices - Türkiye kayıtları kontrolü
  const { data: regionData, error: regionErr } = await supabase
    .from('region_prices')
    .select('id, city');

  if (regionErr) {
    console.error('region_prices sorgu hatası:', regionErr.message);
  } else {
    // ... (existing logic)
  }

  // 2. distance_pricing_rules - KM hesaplama kuralları
  const { data: kmData, error: kmErr } = await supabase
    .from('distance_pricing_rules')
    .select('id, vehicle_type, min_km, max_km, base_price, extra_km_price, region, currency, is_active, pricing_mode');

  if (kmErr) {
    console.error('distance_pricing_rules sorgu hatası:', kmErr.message);
  } else {
    const kmRules = kmData || [];
    const vehicleTypes = [...new Set(kmRules.map(r => r.vehicle_type))];
    const turkeyRules = kmRules.filter(r => r.region === 'Turkey');
    
    console.log('2. distance_pricing_rules (KM Hesaplama):');
    console.log(`   Toplam kural: ${kmRules.length}`);
    console.log(`   Türkiye kuralı (region='Turkey'): ${turkeyRules.length}`);
    console.log(`   Araç tipleri: ${vehicleTypes.join(', ')}`);
    
    if (kmRules.length > 0) {
      const sample = kmRules.slice(0, 5);
      console.log('   Örnek kurallar:');
      sample.forEach(r => {
        console.log(`     - ${r.vehicle_type} [${r.pricing_mode}]: ${r.pricing_mode === 'fixed' ? r.base_price : `${r.extra_km_price}/km`} (${r.min_km}-${r.max_km} km) Region: ${r.region} Active: ${r.is_active}`);
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
