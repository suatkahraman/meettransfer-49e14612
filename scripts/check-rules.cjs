const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.log('HATA: VITE_SUPABASE_URL ve VITE_SUPABASE_PUBLISHABLE_KEY .env\'de tanımlı olmalı');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('=== Veritabanı Kontrolü (Node.js) ===\n');
  console.log(`URL: ${supabaseUrl}`);

  // distance_pricing_rules
  console.log('Sorgu başlatılıyor...');
  const { data: kmData, error: kmErr } = await supabase
    .from('distance_pricing_rules')
    .select('id, vehicle_type, min_km, max_km, base_price, extra_km_price, region, currency, is_active, pricing_mode');

  if (kmErr) {
    console.log('distance_pricing_rules sorgu hatası:', kmErr.message);
    if (kmErr.code === 'PGRST100') {
       console.log('HATA DETAYI: Sütun bulunamadı olabilir. Migrasyon eksik.');
    }
  } else {
    const kmRules = kmData || [];
    const turkeyRules = kmRules.filter(r => r.region === 'Turkey');
    
    console.log('distance_pricing_rules:');
    console.log(`   Toplam kural: ${kmRules.length}`);
    console.log(`   Türkiye kuralı (region='Turkey'): ${turkeyRules.length}`);
    
    if (kmRules.length > 0) {
      const sample = kmRules.slice(0, 5);
      console.log('   Örnek kurallar:');
      sample.forEach(r => {
        console.log(`     - ${r.vehicle_type} [${r.pricing_mode}]: ${r.pricing_mode === 'fixed' ? r.base_price : `${r.extra_km_price}/km`} (${r.min_km}-${r.max_km} km) Region: ${r.region} Active: ${r.is_active}`);
      });
    } else {
       console.log('   Tablo BOŞ!');
    }
    console.log('');
  }
}

main().catch(e => {
  console.log('Global Error:', e);
  process.exit(1);
});
