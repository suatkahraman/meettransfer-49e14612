const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// ---- Minimal helpers ----
function analyzeSimple(pickup: string, dropoff: string): { airport: string | null; city: string | null; district: string | null; direction: string; confidence: string } {
  const s = (pickup + " " + dropoff).toLowerCase();

  let airport: string | null = null;
  if (/istanbul airport|\bist\b/i.test(s)) airport = "Istanbul Airport (IST)";
  else if (/sabiha|gokcen|\bsaw\b/i.test(s)) airport = "Sabiha Gokcen Airport (SAW)";
  else if (/antalya.*airport|\bayt\b/i.test(s)) airport = "Antalya Airport (AYT)";
  else if (/bodrum|milas|\bbjv\b/i.test(s)) airport = "Bodrum-Milas Airport (BJV)";
  else if (/dalaman|\bdlm\b/i.test(s)) airport = "Dalaman Airport (DLM)";
  else if (/adnan menderes|\badb\b/i.test(s)) airport = "Izmir Adnan Menderes Airport (ADB)";

  const direction = dropoff.toLowerCase().includes("airport") ? "to_airport" : airport ? "from_airport" : "city_to_city";

  let city: string | null = null;
  if (/istanbul|\bist\b|\bsaw\b/i.test(s)) city = "Istanbul";
  else if (/antalya|\bayt\b|alanya|belek/i.test(s)) city = "Antalya";
  else if (/bodrum|\bbjv\b/i.test(s)) city = "Bodrum";
  else if (/dalaman|\bdlm\b|fethiye|marmaris/i.test(s)) city = "Dalaman";
  else if (/izmir|\badb\b|cesme/i.test(s)) city = "Izmir";

  const district = pickup.split(",")[0]?.trim() || null;

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
    `<p>Pickup: ${booking.pickup}</p><p>Dropoff: ${booking.dropoff}</p><p>City: ${info.city}</p><p>Airport: ${info.airport}</p>`
  );
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

    // Try to find price - build query params
    const queryParams: Record<string, string> = {
      vehicle_type: `eq.${booking.vehicle_type}`,
      is_active: "eq.true",
      select: "*",
      limit: "1",
    };
    if (city) queryParams.city = `eq.${city}`;
    if (airport) queryParams.airport = `eq.${airport}`;
    if (district) queryParams.district = `eq.${district}`;

    let prices = await supabaseQuery("region_prices", queryParams);
    let bestPrice = prices?.[0] ?? null;

    // Fallback city+airport
    if (!bestPrice && city && airport) {
      const fallbackParams: Record<string, string> = {
        vehicle_type: `eq.${booking.vehicle_type}`,
        city: `eq.${city}`,
        airport: `eq.${airport}`,
        is_active: "eq.true",
        select: "*",
        limit: "1",
      };
      const p2 = await supabaseQuery("region_prices", fallbackParams);
      bestPrice = p2?.[0] ?? null;
    }

    if (!bestPrice) {
      await sendManualEmail(booking, { airport, city, district, direction, confidence });
      return new Response(JSON.stringify({ matched: false, reason: "no_price_found" }), { headers: corsHeaders });
    }

    // Price logic
    const baseCurrency = bestPrice.price_currency || "EUR";
    const customerCurrency = booking.price_currency || baseCurrency;

    let finalPrice = bestPrice.price;
    let finalCurrency = baseCurrency;
    if (customerCurrency !== baseCurrency) {
      const c = await convertCurrency(bestPrice.price, baseCurrency, customerCurrency);
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

    return new Response(JSON.stringify({ matched: true, price: finalPrice, currency: finalCurrency, returnPrice, totalPrice }), { headers: corsHeaders });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Unknown error";
    console.error("auto-price-quick-booking error:", error);
    return new Response(JSON.stringify({ error, matched: false }), { status: 500, headers: corsHeaders });
  }
});
