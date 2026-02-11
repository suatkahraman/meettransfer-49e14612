/**
 * Place ID Migration Script
 *
 * Supabase'taki bölgesel ve şehirler arası fiyatları Google Place ID'leriyle günceller.
 * Mevcut fiyat verilerine (price, valid_from, valid_to) DOKUNMAZ.
 *
 * Gereksinimler:
 *   - GOOGLE_MAPS_API_KEY (Geocoding API etkin)
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Kullanım:
 *   npx tsx scripts/migrate-place-ids.ts
 *   # veya
 *   GOOGLE_MAPS_API_KEY=xxx npx tsx scripts/migrate-place-ids.ts
 *
 * Kuru çalıştırma (veritabanına yazmadan):
 *   DRY_RUN=1 npx tsx scripts/migrate-place-ids.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;
const DRY_RUN = process.env.DRY_RUN === '1';

interface GeocodeResult {
  place_id: string;
  formatted_address: string;
}

async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address?.trim()) return null;
  const key = GOOGLE_MAPS_API_KEY;
  if (!key) {
    console.error('GOOGLE_MAPS_API_KEY eksik');
    return null;
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address.trim())}&key=${key}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) return null;
    const r = data.results[0];
    return { place_id: r.place_id, formatted_address: r.formatted_address };
  } catch (e) {
    console.error(`Geocode error for "${address}":`, e);
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli');
    process.exit(1);
  }
  if (!GOOGLE_MAPS_API_KEY && !DRY_RUN) {
    console.error('GOOGLE_MAPS_API_KEY gerekli (DRY_RUN=1 ile sadece liste için opsiyonel)');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const RATE_LIMIT_MS = 200; // Google 50 QPS limiti; güvenli için 200ms

  console.log('=== Place ID Migration ===');
  if (DRY_RUN) console.log('DRY_RUN: Veritabanına yazılmayacak\n');

  // --- region_prices ---
  const { data: regionPrices, error: rpError } = await supabase
    .from('region_prices')
    .select('id, city, airport, district')
    .eq('is_active', true);

  if (rpError) {
    console.error('region_prices çekme hatası:', rpError);
    process.exit(1);
  }

  console.log(`\n--- region_prices: ${regionPrices?.length ?? 0} kayıt ---`);

  const regionCache = new Map<string, GeocodeResult | null>();
  const regionNotFound: string[] = [];
  let regionUpdated = 0;
  let regionSkipped = 0;

  for (const row of regionPrices || []) {
    const pickupStr = row.airport ? `${row.airport}, ${row.city}` : row.city;
    const dropoffStr = `${row.district}, ${row.city}`;

    let pickupResult = regionCache.get(pickupStr);
    if (pickupResult === undefined) {
      pickupResult = await geocodeAddress(pickupStr);
      regionCache.set(pickupStr, pickupResult);
      await sleep(RATE_LIMIT_MS);
    }

    let dropoffResult = regionCache.get(dropoffStr);
    if (dropoffResult === undefined) {
      dropoffResult = await geocodeAddress(dropoffStr);
      regionCache.set(dropoffStr, dropoffResult);
      await sleep(RATE_LIMIT_MS);
    }

    let status: string | null = 'ok';
    if (!pickupResult && !dropoffResult) status = 'both_not_found';
    else if (!pickupResult) status = 'pickup_not_found';
    else if (!dropoffResult) status = 'dropoff_not_found';

    if (status !== 'ok') {
      regionNotFound.push(`${row.id}: pickup="${pickupStr}" dropoff="${dropoffStr}" -> ${status}`);
    }

    if (!DRY_RUN && (pickupResult || dropoffResult)) {
      const { error } = await supabase
        .from('region_prices')
        .update({
          pickup_place_id: pickupResult?.place_id ?? null,
          dropoff_place_id: dropoffResult?.place_id ?? null,
          pickup_formatted_address: pickupResult?.formatted_address ?? null,
          dropoff_formatted_address: dropoffResult?.formatted_address ?? null,
          place_id_status: status,
        })
        .eq('id', row.id);
      if (error) {
        console.error(`region_prices güncelleme hatası (${row.id}):`, error);
      } else {
        regionUpdated++;
      }
    } else if (DRY_RUN) {
      regionUpdated++;
    } else {
      regionSkipped++;
    }
  }

  console.log(`region_prices: ${regionUpdated} güncellendi, ${regionSkipped} atlandı`);

  // --- intercity_prices ---
  const { data: intercityPrices, error: ipError } = await supabase
    .from('intercity_prices')
    .select('id, from_city, from_district, to_city, to_district')
    .eq('is_active', true);

  if (ipError) {
    console.error('intercity_prices çekme hatası:', ipError);
    process.exit(1);
  }

  console.log(`\n--- intercity_prices: ${intercityPrices?.length ?? 0} kayıt ---`);

  const intercityCache = new Map<string, GeocodeResult | null>();
  const intercityNotFound: string[] = [];
  let intercityUpdated = 0;
  let intercitySkipped = 0;

  for (const row of intercityPrices || []) {
    const pickupStr = row.from_district
      ? `${row.from_district}, ${row.from_city}`
      : row.from_city;
    const dropoffStr = row.to_district
      ? `${row.to_district}, ${row.to_city}`
      : row.to_city;

    let pickupResult = intercityCache.get(pickupStr);
    if (pickupResult === undefined) {
      pickupResult = await geocodeAddress(pickupStr);
      intercityCache.set(pickupStr, pickupResult);
      await sleep(RATE_LIMIT_MS);
    }

    let dropoffResult = intercityCache.get(dropoffStr);
    if (dropoffResult === undefined) {
      dropoffResult = await geocodeAddress(dropoffStr);
      intercityCache.set(dropoffStr, dropoffResult);
      await sleep(RATE_LIMIT_MS);
    }

    let status: string | null = 'ok';
    if (!pickupResult && !dropoffResult) status = 'both_not_found';
    else if (!pickupResult) status = 'pickup_not_found';
    else if (!dropoffResult) status = 'dropoff_not_found';

    if (status !== 'ok') {
      intercityNotFound.push(`${row.id}: pickup="${pickupStr}" dropoff="${dropoffStr}" -> ${status}`);
    }

    if (!DRY_RUN && (pickupResult || dropoffResult)) {
      const { error } = await supabase
        .from('intercity_prices')
        .update({
          pickup_place_id: pickupResult?.place_id ?? null,
          dropoff_place_id: dropoffResult?.place_id ?? null,
          pickup_formatted_address: pickupResult?.formatted_address ?? null,
          dropoff_formatted_address: dropoffResult?.formatted_address ?? null,
          place_id_status: status,
        })
        .eq('id', row.id);
      if (error) {
        console.error(`intercity_prices güncelleme hatası (${row.id}):`, error);
      } else {
        intercityUpdated++;
      }
    } else if (DRY_RUN) {
      intercityUpdated++;
    } else {
      intercitySkipped++;
    }
  }

  console.log(`intercity_prices: ${intercityUpdated} güncellendi, ${intercitySkipped} atlandı`);

  // --- Özet ---
  const allNotFound = [...regionNotFound, ...intercityNotFound];
  if (allNotFound.length > 0) {
    console.log('\n--- MANUEL KONTROL EDİLECEK KAYITLAR (place_id bulunamadı) ---');
    allNotFound.forEach((line) => console.log(line));
    console.log('\nBu kayıtlar place_id_status ile işaretlendi. Admin panelden filtreleyebilirsiniz.');
  }

  console.log('\n=== Tamamlandı ===');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
