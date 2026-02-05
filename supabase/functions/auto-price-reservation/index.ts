import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// ---- HANDLER ----
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const reservation_id: string = body.reservation_id;

    if (!reservation_id) {
      return new Response(JSON.stringify({ error: "reservation_id required", matched: false }), { status: 400, headers: corsHeaders });
    }

    const { data: reservation, error: resErr } = await supabase.from("reservations").select("*").eq("id", reservation_id).single();

    if (resErr || !reservation) {
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

    // Try to find price
    let query = supabase.from("region_prices").select("*").eq("vehicle_type", reservation.vehicle_type).eq("is_active", true);
    if (city) query = query.eq("city", city);
    if (airport) query = query.eq("airport", airport);
    if (district) query = query.eq("district", district);

    const { data: prices } = await query.limit(1);
    let bestPrice = prices?.[0] ?? null;

    if (!bestPrice && city && airport) {
      const { data: p2 } = await supabase.from("region_prices").select("*").eq("vehicle_type", reservation.vehicle_type).eq("city", city).eq("airport", airport).eq("is_active", true).limit(1);
      bestPrice = p2?.[0] ?? null;
    }

    if (!bestPrice) {
      await sendManualEmail(reservation, { airport, city, district, direction, confidence });
      return new Response(JSON.stringify({ matched: false, reason: "no_price_found" }), { headers: corsHeaders });
    }

    const baseCurrency = bestPrice.price_currency || "EUR";
    const customerCurrency = reservation.price_currency || baseCurrency;

    let finalPrice = bestPrice.price;
    let finalCurrency = baseCurrency;
    if (customerCurrency !== baseCurrency) {
      const c = await convertCurrency(bestPrice.price, baseCurrency, customerCurrency);
      finalPrice = c.amount;
      finalCurrency = customerCurrency;
    }

    // Update reservation
    await supabase.from("reservations").update({ price: finalPrice, price_currency: finalCurrency, status: "sent_to_driver" }).eq("id", reservation_id);

    // Admin email
    try {
      await resend.emails.send({
        from: "Meet Transfer <noreply@mail.meettransfer.app>",
        to: "sautkahraman@gmail.com",
        subject: `🤖 Reservation Otomatik Fiyat: ${reservation.customer_name}`,
        html: `<p>Price: ${finalPrice} ${finalCurrency}</p><p>Route: ${reservation.pickup} → ${reservation.dropoff}</p>`,
      });
    } catch {}

    return new Response(JSON.stringify({ matched: true, price: finalPrice, currency: finalCurrency, matchedCity: city, matchedAirport: airport }), { headers: corsHeaders });
  } catch (e: any) {
    console.error("auto-price-reservation error:", e);
    return new Response(JSON.stringify({ error: e.message, matched: false }), { status: 500, headers: corsHeaders });
  }
});

async function sendManualEmail(reservation: any, info: { airport: string | null; city: string | null; district: string | null; direction: string; confidence: string }) {
  try {
    await resend.emails.send({
      from: "Meet Transfer <noreply@mail.meettransfer.app>",
      to: "sautkahraman@gmail.com",
      subject: `⚠️ Reservation Manuel Fiyat Gerekli: ${reservation.customer_name}`,
      html: `<p>Pickup: ${reservation.pickup}</p><p>Dropoff: ${reservation.dropoff}</p><p>City: ${info.city}</p><p>Airport: ${info.airport}</p>`,
    });
  } catch {}
}
