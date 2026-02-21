// Supabase RLS ve policy test scripti (CommonJS)
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lzwwxuxwlssxutwiuxtf.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6d3d4dXh3bHNzeHV0d2l1eHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDU4NTcsImV4cCI6MjA4MDYyMTg1N30.YvtNwfY8pXTAoFiVR_s1ilyxJQHTK0KlyWONoW581NM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testTable(table, filter = {}) {
  const { data, error } = await supabase.from(table).select('*').match(filter);
  if (error) {
    console.log(`[${table}] ERROR:`, error.message);
  } else {
    console.log(`[${table}] Veri sayısı:`, data.length);
    if (data.length > 0) {
      console.log(`[${table}] İlk veri:`, data[0]);
    }
  }
}

async function main() {
  console.log('Supabase RLS ve policy test başlıyor...');
  await testTable('profiles');
  await testTable('reservations');
  await testTable('agencies');
  await testTable('agency_payments');
  await testTable('drivers');
  console.log('Test tamamlandı. Her tablo için veri sayısı ve ilk veri gösterildi. Eğer hata varsa policy/RLS sorunu olabilir.');
}

main();
