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
  // Turkey
  "alanya": "Alanya", "belek": "Belek", "side": "Side", "kemer": "Kemer",
  "lara": "Lara", "kundu": "Kundu", "beldibi": "Beldibi", "göynük": "Göynük",
  "tekirova": "Tekirova", "manavgat": "Manavgat", "taksim": "Taksim",
  "sultanahmet": "Sultanahmet", "kadikoy": "Kadıköy", "besiktas": "Beşiktaş",
  "sisli": "Şişli", "levent": "Levent", "atasehir": "Ataşehir",
  "bakirkoy": "Bakırköy", "bodrum": "Bodrum Merkez", "turgutreis": "Turgutreis",
  "yalikavak": "Yalıkavak", "gumbet": "Gümbet", "bitez": "Bitez",
  "fethiye": "Fethiye", "oludeniz": "Ölüdeniz", "marmaris": "Marmaris",
  "dalyan": "Dalyan", "cesme": "Çeşme", "alacati": "Alaçatı", "kusadasi": "Kuşadası",
  // Dubai
  "downtown": "Downtown", "dubai marina": "Dubai Marina", "marina": "Dubai Marina",
  "palm jumeirah": "Palm Jumeirah", "palm": "Palm Jumeirah",
  "deira": "Deira", "business bay": "Business Bay",
  "jbr": "JBR", "jumeirah beach": "JBR",
  "jumeirah": "Jumeirah", "bur dubai": "Bur Dubai",
  "al barsha": "Al Barsha", "silicon oasis": "Dubai Silicon Oasis",
};

function normalizeTurkish(text: string): string {
  return text
    .replace(/İ/g, 'I').replace(/ı/g, 'i')
    .replace(/Ş/g, 'S').replace(/ş/g, 's')
    .replace(/Ç/g, 'C').replace(/ç/g, 'c')
    .replace(/Ö/g, 'O').replace(/ö/g, 'o')
    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g');
}

function detectDistrict(text: string): string | null {
  const lower = normalizeTurkish(text).toLowerCase();
  for (const [key, value] of Object.entries(DISTRICT_MAPPING)) {
    if (lower.includes(key)) return value;
  }
  return null;
}

// ---- Minimal helpers ----
function analyzeSimple(pickup: string, dropoff: string): { airport: string | null; city: string | null; district: string | null; direction: string; confidence: string } {
  const s = normalizeTurkish(pickup + " " + dropoff).toLowerCase();

  let airport: string | null = null;
  if (/istanbul airport|\bist\b/i.test(s)) airport = "Istanbul Airport (IST)";
  else if (/sabiha|gokcen|\bsaw\b/i.test(s)) airport = "Sabiha Gokcen Airport (SAW)";
  else if (/antalya.*airport|antalya.*havalimanı|\bayt\b/i.test(s)) airport = "Antalya Airport (AYT)";
  else if (/bodrum|milas|\bbjv\b/i.test(s)) airport = "Bodrum-Milas Airport (BJV)";
  else if (/dalaman|\bdlm\b/i.test(s)) airport = "Dalaman Airport (DLM)";
  else if (/adnan menderes|\badb\b/i.test(s)) airport = "Izmir Adnan Menderes Airport (ADB)";

  const direction = normalizeTurkish(dropoff).toLowerCase().includes("airport") || normalizeTurkish(dropoff).toLowerCase().includes("havalimani") 
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

async function sendManualEmail(booking: Record<string, unknown>, info: { airport: string | null; city: string | null; district: string | null; direction: string; confidence: string }) {
  await sendEmail(
    "sautkahraman@gmail.com",
    `⚠️ Quick Booking Manuel Fiyat Gerekli: ${booking.customer_name || "Misafir"}`,
    `<p>Pickup: ${booking.pickup}</p><p>Dropoff: ${booking.dropoff}</p><p>City: ${info.city}</p><p>Airport: ${info.airport}</p><p>District: ${info.district}</p>`
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
    const { quick_booking_id }: { quick_booking_id: string } = await req.json();

    // Fetch booking
    const bookings = await supabaseQuery("quick_booking_requests", {
      id: `eq.${quick_booking_id}`,
      select: "*",
    });

    const booking = bookings?.[0];
    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking not found", matched: false }), { status: 404, headers: corsHeaders });
    }

    // Skip agency
    if (booking.agency_id || booking.agency_user_id) {
      return new Response(JSON.stringify({ matched: false, reason: "agency_booking" }), { headers: corsHeaders });
    }

    const { airport, city, district, direction, confidence } = analyzeSimple(booking.pickup, booking.dropoff);

    if (!city && !airport) {
      await sendManualEmail(booking, { airport, city, district, direction, confidence });
      return new Response(JSON.stringify({ matched: false, reason: "no_location_match" }), { headers: corsHeaders });
    }

    // Find best price with fallback strategies
    const bestPrice = await findBestPrice(booking.vehicle_type, city, airport, district);

    if (!bestPrice) {
      await sendManualEmail(booking, { airport, city, district, direction, confidence });
      return new Response(JSON.stringify({ matched: false, reason: "no_price_found", debug: { city, airport, district, vehicleType: booking.vehicle_type } }), { headers: corsHeaders });
    }

    // Price logic
    const baseCurrency = (bestPrice.price_currency as string) || "EUR";
    const customerCurrency = booking.price_currency || baseCurrency;

    let finalPrice = bestPrice.price as number;
    let finalCurrency = baseCurrency;
    if (customerCurrency !== baseCurrency) {
      const c = await convertCurrency(finalPrice, baseCurrency, customerCurrency);
      finalPrice = c.amount;
      finalCurrency = customerCurrency;
    }

    // Return discount
    let returnPrice: number | null = null;
    if (booking.has_return_trip) {
      returnPrice = Math.ceil(finalPrice * 0.75);
    }
    const totalPrice = finalPrice + (returnPrice ?? 0);

    // Update booking
    await supabaseQuery(
      "quick_booking_requests",
      { id: `eq.${quick_booking_id}` },
      "PATCH",
      { price: finalPrice, price_currency: finalCurrency, status: "price_sent", return_price: returnPrice }
    );

    // Email customer
    if (booking.customer_email) {
      const confirmUrl = `https://meettransfer.app/quick-booking-confirm?token=${booking.confirmation_token}`;
      await sendEmail(
        booking.customer_email,
        `Your transfer quote – ${finalPrice} ${finalCurrency}`,
        `<p>Price: ${finalPrice} ${finalCurrency}</p><a href="${confirmUrl}">Confirm</a>`
      );
    }

    return new Response(JSON.stringify({ matched: true, price: finalPrice, currency: finalCurrency, returnPrice, totalPrice, matchedCity: city, matchedAirport: airport, matchedDistrict: district }), { headers: corsHeaders });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Unknown error";
    console.error("auto-price-quick-booking error:", error);
    return new Response(JSON.stringify({ error, matched: false }), { status: 500, headers: corsHeaders });
  }
});
