// src/pages/api/update-exchange-rates.ts
// Next.js API Route: Kurları frankfurter.app'ten çekip Supabase'a yazar
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const CURRENCIES = ['TRY', 'USD', 'GBP'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const url = `https://api.frankfurter.app/latest?from=EUR&to=${CURRENCIES.join(',')}`;
    const apiRes = await fetch(url);
    if (!apiRes.ok) throw new Error('API error: ' + apiRes.status);
    const data = await apiRes.json();
    const rates = data.rates as Record<string, number>;
    const today = new Date().toISOString().slice(0, 10);
    let errors = [];
    for (const [to_currency, rate] of Object.entries(rates)) {
      const { error } = await supabase.from('exchange_rates').upsert([
        {
          from_currency: 'EUR',
          to_currency,
          rate,
          date: today,
        },
      ], { onConflict: ['from_currency', 'to_currency'] });
      if (error) errors.push(error);
    }
    if (errors.length > 0) return res.status(500).json({ ok: false, errors });
    return res.status(200).json({ ok: true, rates });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
