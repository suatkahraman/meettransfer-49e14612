// test/testUseCurrency.js
// Terminalden çalıştırmak için: node test/testUseCurrency.js

const { createClient } = require('@supabase/supabase-js');

// Ortam değişkenlerinden veya .env'den alınabilir
env = process.env;
const SUPABASE_URL = env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCurrencyFetch(toCurrency = 'USD') {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('rate, date')
    .eq('from_currency', 'EUR')
    .eq('to_currency', toCurrency)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('DB error:', error);
    return;
  }
  if (!data) {
    console.warn('No data found for', toCurrency);
    return;
  }
  console.log(`EUR -> ${toCurrency} rate:`, data.rate, 'date:', data.date);
}

(async () => {
  await testCurrencyFetch('USD');
  await testCurrencyFetch('TRY');
  await testCurrencyFetch('GBP');
})();
