const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// District mapping for known locations
const DISTRICT_MAPPING: Record<string, string> = {
  "alanya": "Alanya",
  "belek": "Belek",
  "side": "Side",
  "kemer": "Kemer",
  "lara": "Lara",
  "kundu": "Kundu",
  "beldibi": "Beldibi",
  "göynük": "Göynük",
  "tekirova": "Tekirova",
  "manavgat": "Manavgat",
  "taksim": "Taksim",
  "sultanahmet": "Sultanahmet",
  "kadikoy": "Kadıköy",
  "besiktas": "Beşiktaş",
  "sisli": "Şişli",
  "levent": "Levent",
  "atasehir": "Ataşehir",
  "bakirkoy": "Bakırköy",
  "bodrum": "Bodrum Merkez",
  "turgutreis": "Turgutreis",
  "yalikavak": "Yalıkavak",
  "gumbet": "Gümbet",
  "bitez": "Bitez",
  "fethiye": "Fethiye",
  "oludeniz": "Ölüdeniz",
  "marmaris": "Marmaris",
  "dalyan": "Dalyan",
  "cesme": "Çeşme",
  "alacati": "Alaçatı",
  "kusadasi": "Kuşadası",
};

function detectDistrict(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [key, value] of Object.entries(DISTRICT_MAPPING)) {
    if (lower.includes(key)) return value;
  }
  return null;
}

// ---- Minimal helpers ----
function analyzeSimple(pickup: string, dropoff: string): { airport: string | null; city: string | null; district: string | null; direction: string; confidence: string } {
  const s = (pickup + " " + dropoff).toLowerCase();

  let airport: string | null = null;
  if (/istanbul airport|\bist\b/i.test(s)) airport = "Istanbul Airport (IST)";
  else if (/sabiha|gokcen|\bsaw\b/i.test(s)) airport = "Sabiha Gokcen Airport (SAW)";
  else if (/antalya.*airport|antalya.*havalimanı|\bayt\b/i.test(s)) airport = "Antalya Airport (AYT)";
  else if (/bodrum|milas|\bbjv\b/i.test(s)) airport = "Bodrum-Milas Airport (BJV)";
  else if (/dalaman|\bdlm\b/i.test(s)) airport = "Dalaman Airport (DLM)";
  else if (/adnan menderes|\badb\b/i.test(s)) airport = "Izmir Adnan Menderes Airport (ADB)";

  const direction = dropoff.toLowerCase().includes("airport") || dropoff.toLowerCase().includes("havalimanı") 
    ? "to_airport" 
    : airport ? "from_airport" : "city_to_city";

  let city: string | null = null;
  if (/istanbul|\bist\b|\bsaw\b/i.test(s)) city = "Istanbul";
  else if (/antalya|\bayt\b|alanya|belek|side|kemer|manavgat/i.test(s)) city = "Antalya";
  else if (/bodrum|\bbjv\b|turgutreis|yalikavak|gumbet/i.test(s)) city = "Bodrum";
  else if (/dalaman|\bdlm\b|fethiye|marmaris|oludeniz/i.test(s)) city = "Dalaman";
  else if (/izmir|\badb\b|cesme|alacati|kusadasi/i.test(s)) city = "Izmir";

  // Detect district from pickup or dropoff
  const district = detectDistrict(pickup) || detectDistrict(dropoff);

  return { airport, city, district, direction, confidence: airport && city ? "high" : city ? "medium" : "low" };
}

async function convertCurrency(amount: number, from: string, to: string): Promise<{ amount: number; rate: number }> {
  if (from === to) return { amount, rate: 1 };
  try {
    const r = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    if (r.ok) {
      const d = await r.json();
      const rate = d.rates?.[to];
      if (rate) return { amount: Math.ceil(amount * rate), rate };
    }
  } catch {}
  return { amount, rate: 1 };
}

async function supabaseQuery(table: string, params: Record<string, string> = {}, method = "GET", body?: unknown) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const headers: Record<string, string> = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": method === "PATCH" ? "return=minimal" : "return=representation",
  };

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (method === "PATCH") return { ok: res.ok };
  return res.json();
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Meet Transfer <noreply@mail.meettransfer.app>",
        to: [to],
        subject,
        html,
      }),
    });
  } catch {}
}

async function sendManualEmail(reservation: Record<string, unknown>, info: { airport: string | null; city: string | null; district: string | null; direction: string; confidence: string }) {
  await sendEmail(
    "sautkahraman@gmail.com",
    `⚠️ Reservation Manuel Fiyat Gerekli: ${reservation.customer_name}`,
    `<p>Pickup: ${reservation.pickup}</p><p>Dropoff: ${reservation.dropoff}</p><p>City: ${info.city}</p><p>Airport: ${info.airport}</p><p>District: ${info.district}</p>`
  );
}

async function findBestPrice(vehicleType: string, city: string | null, airport: string | null, district: string | null): Promise<Record<string, unknown> | null> {
  // Strategy 1: Try with district if available
  if (district && city && airport) {
    const prices = await supabaseQuery("region_prices", {
      vehicle_type: `eq.${vehicleType}`,
      city: `eq.${city}`,
      airport: `eq.${airport}`,
      district: `eq.${district}`,
      is_active: "eq.true",
      select: "*",
      limit: "1",
    });
    if (prices?.[0]) return prices[0];
  }

  // Strategy 2: City + Airport without district
  if (city && airport) {
    const prices = await supabaseQuery("region_prices", {
      vehicle_type: `eq.${vehicleType}`,
      city: `eq.${city}`,
      airport: `eq.${airport}`,
      is_active: "eq.true",
      select: "*",
      limit: "1",
    });
    if (prices?.[0]) return prices[0];
  }

  // Strategy 3: City only
  if (city) {
    const prices = await supabaseQuery("region_prices", {
      vehicle_type: `eq.${vehicleType}`,
      city: `eq.${city}`,
      is_active: "eq.true",
      select: "*",
      limit: "1",
    });
    if (prices?.[0]) return prices[0];
  }

  // Strategy 4: Airport only
  if (airport) {
    const prices = await supabaseQuery("region_prices", {
      vehicle_type: `eq.${vehicleType}`,
      airport: `eq.${airport}`,
      is_active: "eq.true",
      select: "*",
      limit: "1",
    });
    if (prices?.[0]) return prices[0];
  }

  return null;
}

// ---- HANDLER ----
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const reservation_id: string = body.reservation_id;

    if (!reservation_id) {
      return new Response(JSON.stringify({ error: "reservation_id required", matched: false }), { status: 400, headers: corsHeaders });
    }

    // Fetch reservation
    const reservations = await supabaseQuery("reservations", {
      id: `eq.${reservation_id}`,
      select: "*",
    });

    const reservation = reservations?.[0];
    if (!reservation) {
      return new Response(JSON.stringify({ error: "Reservation not found", matched: false }), { status: 404, headers: corsHeaders });
    }

    // Skip agency
    if (reservation.agency_id || reservation.agency_user_id) {
      return new Response(JSON.stringify({ matched: false, reason: "agency_reservation" }), { headers: corsHeaders });
    }

    // Skip already priced
    if (reservation.price && reservation.price > 0) {
      return new Response(JSON.stringify({ matched: false, reason: "already_priced" }), { headers: corsHeaders });
    }

    const { airport, city, district, direction, confidence } = analyzeSimple(reservation.pickup, reservation.dropoff);

    if (!city && !airport) {
      await sendManualEmail(reservation, { airport, city, district, direction, confidence });
      return new Response(JSON.stringify({ matched: false, reason: "no_location_match" }), { headers: corsHeaders });
    }

    // Find best price with fallback strategies
    const bestPrice = await findBestPrice(reservation.vehicle_type, city, airport, district);

    if (!bestPrice) {
      await sendManualEmail(reservation, { airport, city, district, direction, confidence });
      return new Response(JSON.stringify({ matched: false, reason: "no_price_found", debug: { city, airport, district, vehicleType: reservation.vehicle_type } }), { headers: corsHeaders });
    }

    const baseCurrency = (bestPrice.price_currency as string) || "EUR";
    const customerCurrency = reservation.price_currency || baseCurrency;

    let finalPrice = bestPrice.price as number;
    let finalCurrency = baseCurrency;
    if (customerCurrency !== baseCurrency) {
      const c = await convertCurrency(finalPrice, baseCurrency, customerCurrency);
      finalPrice = c.amount;
      finalCurrency = customerCurrency;
    }

    // Update reservation
    await supabaseQuery(
      "reservations",
      { id: `eq.${reservation_id}` },
      "PATCH",
      { price: finalPrice, price_currency: finalCurrency, status: "sent_to_driver" }
    );

    // Admin email
    await sendEmail(
      "sautkahraman@gmail.com",
      `🤖 Reservation Otomatik Fiyat: ${reservation.customer_name}`,
      `<p>Price: ${finalPrice} ${finalCurrency}</p><p>Route: ${reservation.pickup} → ${reservation.dropoff}</p><p>Matched: ${city} / ${airport} / ${district}</p>`
    );

    return new Response(JSON.stringify({ matched: true, price: finalPrice, currency: finalCurrency, matchedCity: city, matchedAirport: airport, matchedDistrict: district }), { headers: corsHeaders });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Unknown error";
    console.error("auto-price-reservation error:", error);
    return new Response(JSON.stringify({ error, matched: false }), { status: 500, headers: corsHeaders });
  }
});
