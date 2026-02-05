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

    const { quick_booking_id }: { quick_booking_id: string } = await req.json();

    const { data: booking, error: bookingErr } = await supabase.from("quick_booking_requests").select("*").eq("id", quick_booking_id).single();

    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found", matched: false }), { status: 404, headers: corsHeaders });
    }

    // Skip agency
    if (booking.agency_id || booking.agency_user_id) {
      return new Response(JSON.stringify({ matched: false, reason: "agency_booking" }), { headers: corsHeaders });
    }

    const { airport, city, district, direction, confidence } = analyzeSimple(booking.pickup, booking.dropoff);

    if (!city && !airport) {
      // Manual price required
      await sendManualEmail(booking, { airport, city, district, direction, confidence });
      return new Response(JSON.stringify({ matched: false, reason: "no_location_match" }), { headers: corsHeaders });
    }

    // Try to find price
    let query = supabase.from("region_prices").select("*").eq("vehicle_type", booking.vehicle_type).eq("is_active", true);
    if (city) query = query.eq("city", city);
    if (airport) query = query.eq("airport", airport);
    if (district) query = query.eq("district", district);

    const { data: prices } = await query.limit(1);
    let bestPrice = prices?.[0] ?? null;

    // Fallback city+airport
    if (!bestPrice && city && airport) {
      const { data: p2 } = await supabase.from("region_prices").select("*").eq("vehicle_type", booking.vehicle_type).eq("city", city).eq("airport", airport).eq("is_active", true).limit(1);
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
    await supabase.from("quick_booking_requests").update({ price: finalPrice, price_currency: finalCurrency, status: "price_sent", return_price: returnPrice }).eq("id", quick_booking_id);

    // Email customer
    if (booking.customer_email) {
      const confirmUrl = `https://meettransfer.app/quick-booking-confirm?token=${booking.confirmation_token}`;
      await resend.emails.send({
        from: "Meet Transfer <noreply@mail.meettransfer.app>",
        to: [booking.customer_email],
        subject: `Your transfer quote – ${finalPrice} ${finalCurrency}`,
        html: `<p>Price: ${finalPrice} ${finalCurrency}</p><a href="${confirmUrl}">Confirm</a>`,
      });
    }

    return new Response(JSON.stringify({ matched: true, price: finalPrice, currency: finalCurrency, returnPrice, totalPrice }), { headers: corsHeaders });
  } catch (e: any) {
    console.error("auto-price-quick-booking error:", e);
    return new Response(JSON.stringify({ error: e.message, matched: false }), { status: 500, headers: corsHeaders });
  }
});

async function sendManualEmail(booking: any, info: { airport: string | null; city: string | null; district: string | null; direction: string; confidence: string }) {
  try {
    await resend.emails.send({
      from: "Meet Transfer <noreply@mail.meettransfer.app>",
      to: "sautkahraman@gmail.com",
      subject: `⚠️ Quick Booking Manuel Fiyat Gerekli: ${booking.customer_name || "Misafir"}`,
      html: `<p>Pickup: ${booking.pickup}</p><p>Dropoff: ${booking.dropoff}</p><p>City: ${info.city}</p><p>Airport: ${info.airport}</p>`,
    });
  } catch {}
}
