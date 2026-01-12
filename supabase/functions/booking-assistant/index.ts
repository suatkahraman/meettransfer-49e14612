import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language = 'EN', conversationHistory = [], visitorId } = await req.json();
    
    if (!message || typeof message !== 'string') {
      console.error("Invalid message format");
      return new Response(JSON.stringify({ error: "Invalid request: message must be a string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client to fetch pricing data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch sample prices from database to give AI context
    const { data: regionPrices } = await supabase
      .from('region_prices')
      .select('city, district, airport, price, price_currency, vehicle_type')
      .eq('is_active', true)
      .limit(50);

    const { data: hourlyPrices } = await supabase
      .from('hourly_rental_prices')
      .select('city, duration_type, price, price_currency, vehicle_type')
      .eq('is_active', true)
      .limit(30);

    console.log("Fetched pricing data:", { regionPrices: regionPrices?.length, hourlyPrices: hourlyPrices?.length });

    // Build pricing context
    const pricingContext = buildPricingContext(regionPrices || [], hourlyPrices || []);

    // Get today's date for context
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Map language code to full language name for clearer instructions
    const languageNames: Record<string, string> = {
      'EN': 'English',
      'DE': 'German (Deutsch)',
      'FR': 'French (Français)',
      'RU': 'Russian (Русский)',
      'IT': 'Italian (Italiano)',
      'ES': 'Spanish (Español)',
      'AR': 'Arabic (العربية)',
      'TR': 'Turkish (Türkçe)',
      'UK': 'Ukrainian (Українська)',
      'JA': 'Japanese (日本語)'
    };
    
    const fullLanguageName = languageNames[language] || 'English';

    const systemPrompt = `You are a HIGHLY INTELLIGENT AI booking assistant for Meet Transfer, a premium airport transfer and hourly rental service. Your PRIMARY goal is to EXTRACT ALL BOOKING INFORMATION from the user's message in ONE GO and complete bookings efficiently.

## CRITICAL - LANGUAGE INSTRUCTION:
**You MUST respond ONLY in ${fullLanguageName}.** The customer's interface language is set to ${language}. 
- ALL your responses must be in ${fullLanguageName}
- Do not mix languages - use natural, fluent ${fullLanguageName} throughout

## TWO SERVICE TYPES:
1. **Airport Transfer (transfer)** - Point A to Point B (default)
2. **Hourly Rental (hourly)** - Vehicle + driver for X hours in a city

## DETECTING SERVICE TYPE:
Hourly rental keywords: "saatlik", "hourly", "X saat", "X hours", "kiralama", "rental", "şehir turu", "city tour", "gün boyu", "full day", "yarım gün", "half day"
Transfer keywords: "transfer", "havalimanı", "airport", "nereden nereye", "from to", no duration mentioned

## SUPER IMPORTANT - INTELLIGENT EXTRACTION:
You are an expert at understanding natural language. When a user sends a message, you MUST:
1. **Detect service type first** - Is it transfer or hourly rental?
2. **Extract ALL information present** - even if not perfectly formatted
3. **Use smart defaults** when information is implied:
   - If passenger count not mentioned, assume 1 person
   - If vehicle not mentioned, choose based on passenger count (1-5: mercedes-vito, 6+: minibus)
4. **Understand Turkish date/time expressions**:
   - "yarın" = tomorrow = ${tomorrowStr}
   - "bugün" = today = ${todayStr}
   - "15:00'te", "saat 15", "15.00" = 15:00
   - "öğleden sonra 3" = 15:00
   - "akşam 7" = 19:00
   - "sabah 8" = 08:00
5. **Understand duration expressions for hourly rental**:
   - "4 saat", "4 saatlik" = 4 hours
   - "yarım gün", "half day" = 4 hours
   - "tam gün", "full day" = 8 hours
   - "gün boyu" = 8 hours
6. **Understand location aliases**:
   - "İstanbul Havalimanı", "IST", "istanbul airport" = Istanbul Airport (IST)
   - "Sabiha Gökçen", "SAW" = Sabiha Gökçen Airport
   - "Bakırköy meydan", "Bakırköy meydanı", "bakırköy" = Bakırköy
   - "Taksim meydan", "taksim" = Taksim
7. **Set isComplete: true when ALL required fields are present**

## Required Fields by Service Type:
**Transfer**: pickup, dropoff, date, time, passengers
**Hourly Rental**: city, durationHours, date, time, passengers

## Vehicle Types:
1. **Mercedes Vito** (mercedes-vito): Up to 5 passengers - DEFAULT for 1-5 people
2. **Mercedes Vito VIP** (vip-mercedes): Luxury, up to 5 passengers
3. **Maybach** (maybach-minibus): Ultra-luxury, up to 3 passengers
4. **Sprinter Minibus** (minibus): Up to 16 passengers - for 6+ people

## Service Areas:
- Turkey: Istanbul (IST, SAW), Antalya (AYT), Bodrum (BJV), Dalaman (DLM), Izmir (ADB), Cappadocia
- Dubai: DXB Airport
- Cyprus: Larnaca (LCA), Ercan (ECN)

## Current Date Context:
- Today: ${todayStr}
- Tomorrow: ${tomorrowStr}

## Current Pricing Data:
${pricingContext}

## RESPONSE FORMAT FOR TRANSFER - ALWAYS include booking JSON:
\`\`\`booking
{
  "serviceType": "transfer",
  "pickup": "extracted or null",
  "dropoff": "extracted or null",
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null",
  "passengers": number (default 1 if not mentioned),
  "vehicleType": "mercedes-vito|vip-mercedes|maybach-minibus|minibus",
  "estimatedPrice": number from pricing data,
  "currency": "EUR",
  "isComplete": true ONLY when pickup, dropoff, date, time, passengers are ALL present
}
\`\`\`

## RESPONSE FORMAT FOR HOURLY RENTAL - ALWAYS include booking JSON:
\`\`\`booking
{
  "serviceType": "hourly",
  "city": "city name",
  "durationHours": number (4, 6, 8, etc.),
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null",
  "passengers": number (default 1 if not mentioned),
  "vehicleType": "mercedes-vito|vip-mercedes|maybach-minibus|minibus",
  "estimatedPrice": number from hourly pricing data,
  "currency": "EUR",
  "isComplete": true ONLY when city, durationHours, date, time, passengers are ALL present
}
\`\`\`

## isComplete Rules:
**Transfer**: TRUE when ALL present: pickup, dropoff, date (YYYY-MM-DD), time (HH:MM), passengers (>=1)
**Hourly**: TRUE when ALL present: city, durationHours, date (YYYY-MM-DD), time (HH:MM), passengers (>=1)

## When isComplete is TRUE for Transfer:
"📍 Nereden: [pickup]
📍 Nereye: [dropoff]
📅 Tarih: [date]
⏰ Saat: [time]
👥 Yolcu: [passengers]
🚗 Araç: [vehicle]
💰 **Fiyat: €[price]**

✅ Rezervasyonunuz onaya hazır!"

## When isComplete is TRUE for Hourly Rental:
"🏙️ Şehir: [city]
⏱️ Süre: [durationHours] saat
📅 Tarih: [date]
⏰ Başlangıç: [time]
👥 Yolcu: [passengers]
🚗 Araç: [vehicle]
💰 **Fiyat: €[price]**

✅ Saatlik kiralama rezervasyonunuz onaya hazır!"

## EXAMPLES:

### Transfer Example:
User: "İstanbul Havalimanı'ndan Bakırköy'e yarın saat 14:00'te 2 kişi transfer istiyorum"

\`\`\`booking
{
  "serviceType": "transfer",
  "pickup": "İstanbul Havalimanı",
  "dropoff": "Bakırköy",
  "date": "${tomorrowStr}",
  "time": "14:00",
  "passengers": 2,
  "vehicleType": "mercedes-vito",
  "estimatedPrice": 45,
  "currency": "EUR",
  "isComplete": true
}
\`\`\`

### Hourly Rental Example:
User: "İstanbul'da yarın 10:00'da 6 saatlik araç kiralama istiyorum"

Response:
"Harika! 🚗 Saatlik kiralama için bilgilerinizi hazırladım:

🏙️ Şehir: İstanbul
⏱️ Süre: 6 saat
📅 Tarih: ${tomorrowStr}
⏰ Başlangıç: 10:00
👥 Yolcu: 1 kişi
🚗 Araç: Mercedes Vito

💰 **Fiyat: €150**

✅ Saatlik kiralama rezervasyonunuz onaya hazır! Aşağıdaki butona tıklayarak onaylayabilirsiniz.

\`\`\`booking
{
  "serviceType": "hourly",
  "city": "İstanbul",
  "durationHours": 6,
  "date": "${tomorrowStr}",
  "time": "10:00",
  "passengers": 1,
  "vehicleType": "mercedes-vito",
  "estimatedPrice": 150,
  "currency": "EUR",
  "isComplete": true
}
\`\`\`"

WRONG - DO NOT ask clarifying questions if all info is already in the message!`;

    // Build messages array with conversation history
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message },
    ];

    console.log("Sending request to AI gateway with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Üzgünüm, şu anda yanıt veremiyorum.";

    // Parse booking data from response
    const bookingData = extractBookingData(aiResponse);

    console.log("AI Response received, booking data:", bookingData);

    // If booking is complete, create a quick_booking_request
    let quickBookingId = null;
    let confirmationToken = null;

    if (bookingData?.isComplete && bookingData.pickup && bookingData.dropoff && bookingData.date && bookingData.time && bookingData.passengers) {
      console.log("Creating quick booking request...");
      
      const sessionId = visitorId || `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: quickBooking, error: qbError } = await supabase
        .from('quick_booking_requests')
        .insert({
          pickup: bookingData.pickup,
          dropoff: bookingData.dropoff,
          pickup_date: bookingData.date,
          pickup_time: bookingData.time,
          passengers: bookingData.passengers,
          vehicle_type: bookingData.vehicleType || 'mercedes-vito',
          price: bookingData.estimatedPrice || null,
          price_currency: bookingData.currency || 'EUR',
          customer_session_id: sessionId,
          status: 'pending',
          language: language
        })
        .select('id, confirmation_token')
        .single();

      if (qbError) {
        console.error("Failed to create quick booking:", qbError);
      } else {
        quickBookingId = quickBooking.id;
        confirmationToken = quickBooking.confirmation_token;
        console.log("Quick booking created:", quickBookingId);
      }
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      bookingData,
      quickBookingId,
      confirmationToken
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Booking assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildPricingContext(regionPrices: any[], hourlyPrices: any[]): string {
  const lines: string[] = [];
  
  // Group region prices by city
  const byCity: Record<string, any[]> = {};
  regionPrices.forEach(p => {
    if (!byCity[p.city]) byCity[p.city] = [];
    byCity[p.city].push(p);
  });

  lines.push("### Transfer Prices (Airport ⇄ District):");
  Object.entries(byCity).forEach(([city, prices]) => {
    const sample = prices.slice(0, 5);
    sample.forEach(p => {
      lines.push(`- ${p.airport || city} → ${p.district}: ${p.price} ${p.price_currency} (${p.vehicle_type})`);
    });
  });

  lines.push("\n### Hourly Rental Prices:");
  hourlyPrices.slice(0, 10).forEach(p => {
    lines.push(`- ${p.city} ${p.duration_type}: ${p.price} ${p.price_currency} (${p.vehicle_type})`);
  });

  return lines.join("\n");
}

function extractBookingData(response: string): any | null {
  try {
    // Look for ```booking JSON block
    const bookingMatch = response.match(/```booking\s*([\s\S]*?)```/);
    if (bookingMatch) {
      return JSON.parse(bookingMatch[1].trim());
    }
    
    // Also try plain JSON block
    const jsonMatch = response.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (parsed.pickup !== undefined || parsed.dropoff !== undefined) {
        return parsed;
      }
    }
    
    return null;
  } catch (e) {
    console.error("Failed to parse booking data:", e);
    return null;
  }
}
