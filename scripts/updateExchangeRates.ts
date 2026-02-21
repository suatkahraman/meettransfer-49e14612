// scripts/updateExchangeRates.ts
// frankfurter.app ile EUR bazlı TRY, USD, GBP kurlarını çekip Supabase'a yazar
// Çalıştırmak için: npx ts-node scripts/updateExchangeRates.ts

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CURRENCIES = ['TRY', 'USD', 'GBP'];

async function fetchRates() {
  const url = `https://api.frankfurter.app/latest?from=EUR&to=${CURRENCIES.join(',')}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('API error: ' + res.status);
  const data = await res.json();
  return data.rates as Record<string, number>;
}

async function upsertRates(rates: Record<string, number>) {
  const today = new Date().toISOString().slice(0, 10);
  for (const [to_currency, rate] of Object.entries(rates)) {
    const { error } = await supabase.from('exchange_rates').upsert([
      {
        from_currency: 'EUR',
        to_currency,
        rate,
        date: today,
      },
    ], { onConflict: ['from_currency', 'to_currency'] });
    if (error) console.error('DB error:', error);
    else console.log(`EUR -> ${to_currency}: ${rate} (upserted)`);
  }
}

(async () => {
  try {
    const rates = await fetchRates();
    await upsertRates(rates);
  } catch (e) {
    console.error('Kur güncelleme hatası:', e);
  }
})();
