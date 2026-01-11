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

    const systemPrompt = `You are a friendly AI booking assistant for Meet Transfer, a premium airport transfer service. Your role is to help customers book transfers by understanding their needs and extracting booking information.

## CRITICAL - LANGUAGE INSTRUCTION:
**You MUST respond ONLY in ${fullLanguageName}.** The customer's interface language is set to ${language}. 
- ALL your responses must be in ${fullLanguageName}
- Do not mix languages
- Use natural, fluent ${fullLanguageName} throughout your response
- Greet the customer appropriately in ${fullLanguageName}

## Your Capabilities:
- Understand transfer requests in any language (but ALWAYS respond in ${fullLanguageName})
- Extract booking details: pickup location, dropoff location, date, time, passengers, vehicle preference
- Provide price estimates based on available pricing data
- Answer questions about services, vehicles, and destinations
- Remember previous messages in the conversation
- Handle hourly/chauffeur rentals as well as airport transfers

## Vehicle Types Available:
1. **Mercedes Vito** (mercedes-vito): Standard comfortable transfer, up to 5 passengers
2. **Mercedes Vito VIP** (vip-mercedes): Luxury interior with extra amenities, up to 5 passengers  
3. **Maybach** (maybach-minibus): Ultra-luxury executive class, up to 3 passengers
4. **Sprinter Minibus** (minibus): Large groups, up to 16 passengers

## Service Areas:
- Turkey: Istanbul (IST, SAW airports), Antalya (AYT), Bodrum (BJV), Dalaman (DLM), Izmir (ADB), Cappadocia (NAV, ASR)
- Dubai: DXB Airport
- Cyprus: Larnaca (LCA), Ercan (ECN)

## Hourly Rental Service:
- Available durations: 4 hours (half day), 8 hours (full day), 9+ hours (custom)
- Cities: Istanbul, Antalya, Bodrum, Cappadocia, Dubai
- Customer can book a chauffeur with vehicle for city tours, shopping, business meetings, etc.

## Current Date Context:
- Today: ${todayStr}
- Tomorrow: ${tomorrowStr}
- When user says "yarın" or "tomorrow", use: ${tomorrowStr}
- When user says "bugün" or "today", use: ${todayStr}

## Current Pricing Data:
${pricingContext}

## Response Format:
When you understand a booking request, include a JSON block at the end of your response with extracted details:

\`\`\`booking
{
  "pickup": "extracted pickup location or null",
  "dropoff": "extracted dropoff location or null",
  "date": "YYYY-MM-DD format or null",
  "time": "HH:MM format or null",
  "passengers": number or null,
  "vehicleType": "mercedes-vito|vip-mercedes|maybach-minibus|minibus or null",
  "estimatedPrice": number or null,
  "currency": "EUR|USD|TRY or null",
  "isComplete": true if ALL required fields are present (pickup, dropoff, date, time, passengers)
}
\`\`\`

## CRITICAL - isComplete Rules:
Set isComplete to TRUE **ONLY** when ALL of these are present:
- pickup (not null)
- dropoff (not null)  
- date (not null, in YYYY-MM-DD format)
- time (not null, in HH:MM format)
- passengers (not null, must be a number >= 1)

If ANY of these is missing or null, isComplete MUST be false.

## Important Rules:
1. Be conversational and helpful - ALWAYS in ${fullLanguageName}
2. Ask clarifying questions if information is missing
3. Provide price estimates when you have enough information
4. Always include the booking JSON when you detect transfer intent
5. For hourly rentals, extract city and duration instead of dropoff
6. When isComplete is true, tell the user their reservation is being created automatically!

## Example Interaction:
User: "Yarın 15:00'te İstanbul Havalimanı'ndan Taksim'e 4 kişiyiz"
Assistant: "Harika! 🚗 Yarın 15:00'te İstanbul Havalimanı'ndan Taksim'e 4 kişilik bir transfer için rezervasyonunuzu oluşturuyorum!

4 kişi için Mercedes Vito VIP öneriyorum - geniş, konforlu ve bagaj için bol alan. Fiyatınız yaklaşık **€65** olacaktır.

Rezervasyonunuz oluşturuluyor... ✅

\`\`\`booking
{
  "pickup": "İstanbul Havalimanı",
  "dropoff": "Taksim",
  "date": "${tomorrowStr}",
  "time": "15:00",
  "passengers": 4,
  "vehicleType": "vip-mercedes",
  "estimatedPrice": 65,
  "currency": "EUR",
  "isComplete": true
}
\`\`\`"`;

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
