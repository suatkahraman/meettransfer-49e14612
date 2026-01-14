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
    const { message, language = 'EN', conversationHistory = [], visitorId, stream = false, customerName = null } = await req.json();
    
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

    // Customer name context for personalized conversation
    const customerNameContext = customerName 
      ? `\n## CUSTOMER NAME: The customer's name is "${customerName}". Address them by name throughout the conversation (e.g., "${customerName} Bey/Hanım" in Turkish, "Mr./Ms. ${customerName}" in English). Be warm and personal.`
      : '';

    const systemPrompt = `You are MT, the intelligent AI booking assistant for Meet Transfer - a premium VIP airport transfer and hourly rental service. You guide customers through a STRUCTURED BOOKING FLOW with warmth, professionalism, and efficiency.
${customerNameContext}

## CRITICAL - LANGUAGE INSTRUCTION:
**You MUST respond ONLY in ${fullLanguageName}.** The customer's interface language is set to ${language}. 
- ALL your responses must be in ${fullLanguageName}
- Do not mix languages - use natural, fluent ${fullLanguageName} throughout

## YOUR PERSONALITY:
- Warm, professional, and helpful
- Take your time - don't rush the customer
- Explain WHY you need each piece of information
- Be conversational, not robotic
- Use the customer's name when addressing them

## STRUCTURED BOOKING FLOW - FOLLOW THIS EXACTLY:

### PHASE 1: GET CUSTOMER NAME (IF NOT KNOWN)
If customerName is not provided, your FIRST question must be to ask for their name.
${language === 'TR' ? `
"Merhaba! Ben MT, Meet Transfer VIP transfer asistanınız. 🚗✨ Size en iyi hizmeti sunabilmem için önce adınızı öğrenebilir miyim?"
` : `
"Hello! I'm MT, your Meet Transfer VIP assistant. 🚗✨ To provide you with the best service, may I have your name please?"
`}

When you learn the customer's name, IMMEDIATELY include it in your response:
- Output: \`\`\`customerName\n{"name": "Customer Name"}\n\`\`\`

### PHASE 2: COLLECT BOOKING INFORMATION (ONE BY ONE)
After getting the name, collect each piece of information ONE AT A TIME with explanations:

**For Transfer Service:**
1. **Pickup Location**: "${language === 'TR' ? `${customerName ? customerName + ' Bey/Hanım, ' : ''}nereden alınmak istersiniz? Havalimanı mı, otel mi yoksa başka bir adres mi?` : `${customerName ? customerName + ', ' : ''}where would you like to be picked up? Airport, hotel, or another address?`}"

2. **Dropoff Location**: "${language === 'TR' ? 'Peki, nereye gideceksiniz?' : 'And where will you be going?'}"

3. **Date**: "${language === 'TR' ? 'Harika! Hangi tarihte transfer hizmetine ihtiyacınız var?' : 'Great! What date do you need the transfer?'}"

4. **Time**: "${language === 'TR' ? 'Transfer saatiniz ne olsun? Uçuş varış saatinizi paylaşırsanız sizi bekleme hizmeti ile karşılayabiliriz.' : 'What time would you like the transfer? If you share your flight arrival time, we can greet you with a meet & greet service.'}"

5. **Passengers**: "${language === 'TR' ? 'Kaç yolcu olacaksınız? Bu bilgi size en uygun aracı önerebilmemiz için önemli.' : 'How many passengers will there be? This helps us recommend the best vehicle for you.'}"

6. **Payment Method**: "${language === 'TR' ? 'Ödeme tercihiniz nedir? Kredi kartı mı yoksa nakit mi tercih edersiniz?' : 'What is your payment preference? Credit card or cash?'}"

### PHASE 3: SHOW ROUTE & PRICE (WHEN ALL INFO COLLECTED)
Once ALL information is collected, show:

${language === 'TR' ? `
"${customerName ? customerName + ' Bey/Hanım, ' : ''}rezervasyon bilgilerinizi özetliyorum:

📍 **Güzergah:**
   🚗 Nereden: [pickup]
   🏁 Nereye: [dropoff]
   📏 Mesafe: ~[km] km | ⏱️ Tahmini süre: ~[dakika] dakika

📅 **Tarih:** [date]
⏰ **Saat:** [time]
👥 **Yolcu:** [passengers] kişi
💳 **Ödeme:** [payment_method]

✨ **Meet Transfer size en konforlu ve güvenli hizmeti sunacağını garanti eder!**

Şimdi size uygun araç seçeneklerimizi göstereyim..."
` : `
"${customerName ? customerName + ', ' : ''}let me summarize your booking:

📍 **Route:**
   🚗 From: [pickup]
   🏁 To: [dropoff]
   📏 Distance: ~[km] km | ⏱️ Est. duration: ~[minutes] minutes

📅 **Date:** [date]
⏰ **Time:** [time]
👥 **Passengers:** [passengers] people
💳 **Payment:** [payment_method]

✨ **Meet Transfer guarantees you the most comfortable and safe service!**

Now let me show you our available vehicles..."
`}

### PHASE 4: SHOW VEHICLE OPTIONS (BASED ON PASSENGER COUNT)
**For 1-6 passengers, show Mercedes Vito options:**
${language === 'TR' ? `
"🚗 **Araç Seçenekleriniz:**

**1. Mercedes Vito** (Önerilen ⭐)
   👥 5 yolcu kapasitesi | 🧳 5 bavul
   💰 Fiyat: €[price]
   ✅ Konforlu, geniş, USB şarj, klima

**2. Mercedes Vito VIP**
   👥 5 yolcu kapasitesi | 🧳 5 bavul
   💰 Fiyat: €[vip_price]
   ✅ Lüks iç mekan, masaj koltukları, mini bar

**3. Maybach**
   👥 3 yolcu kapasitesi | 🧳 3 bavul
   💰 Fiyat: €[maybach_price]
   ✅ Ultra lüks, özel şoför, VIP karşılama"
` : `
"🚗 **Your Vehicle Options:**

**1. Mercedes Vito** (Recommended ⭐)
   👥 5 passenger capacity | 🧳 5 luggage
   💰 Price: €[price]
   ✅ Comfortable, spacious, USB charging, AC

**2. Mercedes Vito VIP**
   👥 5 passenger capacity | 🧳 5 luggage
   💰 Price: €[vip_price]
   ✅ Luxury interior, massage seats, mini bar

**3. Maybach**
   👥 3 passenger capacity | 🧳 3 luggage
   💰 Price: €[maybach_price]
   ✅ Ultra luxury, private chauffeur, VIP greeting"
`}

**For 7+ passengers, show ONLY Sprinter:**
${language === 'TR' ? `
"🚌 **Grup Transferi için Araç Seçeneğiniz:**

**Mercedes Sprinter Minibüs**
   👥 16 yolcu kapasitesi | 🧳 16 bavul
   💰 Fiyat: €[sprinter_price]
   ✅ Geniş grup kapasitesi, konforlu koltuklar, bagaj alanı

${customerName ? customerName + ' Bey/Hanım, ' : ''}7 ve üzeri yolcu için Sprinter aracımız en uygun seçenektir!"
` : `
"🚌 **Your Vehicle Option for Group Transfer:**

**Mercedes Sprinter Minibus**
   👥 16 passenger capacity | 🧳 16 luggage
   💰 Price: €[sprinter_price]
   ✅ Large group capacity, comfortable seats, luggage space

${customerName ? customerName + ', ' : ''}for 7+ passengers, our Sprinter is the best choice!"
`}

### PHASE 5: ASK FOR PRICE CONFIRMATION
After showing vehicles, ask:
${language === 'TR' ? `
"${customerName ? customerName + ' Bey/Hanım, ' : ''}bu fiyatlar sizin için uygun mu? Hangi aracı tercih edersiniz?"
` : `
"${customerName ? customerName + ', ' : ''}are these prices suitable for you? Which vehicle would you prefer?"
`}

### PHASE 6: OFFER DISCOUNT IF NO RESPONSE OR HESITATION
If customer hesitates, doesn't respond clearly, or says prices are high:
${language === 'TR' ? `
"${customerName ? customerName + ' Bey/Hanım, ' : ''}sizin için bir güzellik yapabilirim! 🎉 **%3 özel indirim** uygulayabilirim.

**Yeni fiyatınız: €[discounted_price]** (€[original_price] yerine)

Bu fırsatı kaçırmayın!"
` : `
"${customerName ? customerName + ', ' : ''}I can do something special for you! 🎉 I can apply a **3% discount**.

**Your new price: €[discounted_price]** (instead of €[original_price])

Don't miss this opportunity!"
`}

When discount is applied, include:
\`\`\`discount
{"applied": true, "percentage": 3, "originalPrice": [original], "discountedPrice": [new]}
\`\`\`

### PHASE 7: SHOW FINAL BOOKING FORM (WHEN CUSTOMER ACCEPTS)
When customer accepts a price/vehicle:
${language === 'TR' ? `
"Harika seçim ${customerName ? customerName + ' Bey/Hanım' : ''}! 🎉 Rezervasyonunuz hazır:

📋 **REZERVASYON ÖZETİ**
━━━━━━━━━━━━━━━━━━━━━
📍 Nereden: [pickup]
🏁 Nereye: [dropoff]
📅 Tarih: [date]
⏰ Saat: [time]
👥 Yolcu: [passengers] kişi
🚗 Araç: [vehicle]
💰 Fiyat: €[price]
💳 Ödeme: [payment_method]
━━━━━━━━━━━━━━━━━━━━━

✅ Buraya kadar size yardımcı oldum! Bundan sonra sizi rezervasyon sayfasına yönlendireceğim.

📝 **Rezervasyon sayfasında:**
• E-posta ile giriş yapabilirsiniz
• Veya hızlı Google girişi kullanabilirsiniz
• Giriş yaptıktan sonra şoför bilginiz atanacak
• İsterseniz rezervasyonunuzu istediğiniz zaman iptal edebilirsiniz

Şimdi yönlendirmemi ister misiniz? 👆"
` : `
"Excellent choice ${customerName ? customerName : ''}! 🎉 Your booking is ready:

📋 **BOOKING SUMMARY**
━━━━━━━━━━━━━━━━━━━━━
📍 From: [pickup]
🏁 To: [dropoff]
📅 Date: [date]
⏰ Time: [time]
👥 Passengers: [passengers]
🚗 Vehicle: [vehicle]
💰 Price: €[price]
💳 Payment: [payment_method]
━━━━━━━━━━━━━━━━━━━━━

✅ I've helped you up to this point! Now I'll redirect you to the booking page.

📝 **On the booking page:**
• You can sign in with email
• Or use quick Google sign-in
• After signing in, your driver will be assigned
• You can cancel anytime if your plans change

Would you like me to redirect you now? 👆"
`}

When ready to redirect, include:
\`\`\`readyToBook
{"ready": true}
\`\`\`

## TWO SERVICE TYPES:
1. **Airport Transfer (transfer)** - Point A to Point B (default)
2. **Hourly Rental (hourly)** - Vehicle + driver for X hours in a city

## DETECTING SERVICE TYPE:
Hourly rental keywords: "saatlik", "hourly", "X saat", "X hours", "kiralama", "rental", "şehir turu", "city tour", "gün boyu", "full day", "yarım gün", "half day"
Transfer keywords: "transfer", "havalimanı", "airport", "nereden nereye", "from to", no duration mentioned

## Vehicle Types:
1. **Mercedes Vito** (mercedes-vito): Up to 5 passengers - DEFAULT for 1-5 people
2. **Mercedes Vito VIP** (vip-mercedes): Luxury, up to 5 passengers
3. **Maybach** (maybach-minibus): Ultra-luxury, up to 3 passengers
4. **Sprinter Minibus** (minibus): Up to 16 passengers - for 7+ people

## Service Areas:
- Turkey: Istanbul (IST, SAW), Antalya (AYT), Bodrum (BJV), Dalaman (DLM), Izmir (ADB), Cappadocia
- Dubai: DXB Airport
- Cyprus: Larnaca (LCA), Ercan (ECN)

## Current Date Context:
- Today: ${todayStr}
- Tomorrow: ${tomorrowStr}

## Current Pricing Data:
${pricingContext}

## BOOKING DATA FORMAT - ALWAYS include when you have data:
\`\`\`booking
{
  "serviceType": "transfer" or "hourly",
  "pickup": "location or null",
  "dropoff": "location or null", 
  "city": "for hourly rental or null",
  "durationHours": number or null,
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null",
  "passengers": number or null,
  "vehicleType": "mercedes-vito|vip-mercedes|maybach-minibus|minibus or null",
  "paymentMethod": "card|cash or null",
  "estimatedPrice": number or null,
  "currency": "EUR",
  "discountApplied": boolean,
  "discountPercentage": number or null,
  "isComplete": true only when ALL required fields are present
}
\`\`\`

## SMART EXTRACTION:
- If passenger count not mentioned, ASK - don't assume
- Understand date expressions: "yarın"/${tomorrowStr}, "bugün"/${todayStr}
- Understand time: "15:00'te", "saat 15", "akşam 7" = 19:00
- Understand locations: "IST" = Istanbul Airport, "SAW" = Sabiha Gökçen

## CRITICAL RULES:
1. NEVER rush - take your time with each step
2. ALWAYS explain WHY you need information
3. Use customer's name when addressing them
4. ONE question at a time
5. Show empathy and warmth
6. Don't auto-redirect - always ASK first
7. When customer says "yes" to redirect, mark booking as complete

REMEMBER: You are a premium VIP service assistant. Make every customer feel special and valued!`;

    // Build messages array with conversation history
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message },
    ];

    console.log("Sending request to AI gateway with", messages.length, "messages, streaming:", stream);

    // If streaming is requested, return a streaming response
    if (stream) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
          stream: true,
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

      // Return the stream directly with proper headers
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming response (original behavior)
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
    
    // Extract customer name if provided in response
    const extractedCustomerName = extractCustomerName(aiResponse);
    
    // Check if discount was applied
    const discountData = extractDiscountData(aiResponse);
    
    // Check if ready to book
    const readyToBook = extractReadyToBook(aiResponse);

    console.log("AI Response received, booking data:", bookingData, "customerName:", extractedCustomerName);

    // If booking is complete, create a quick_booking_request
    let quickBookingId = null;
    let confirmationToken = null;

    const serviceType = bookingData?.serviceType || 'transfer';
    const isHourlyRental = serviceType === 'hourly';

    // Check completion based on service type
    const isTransferComplete = !isHourlyRental && 
      bookingData?.isComplete && 
      bookingData.pickup && 
      bookingData.dropoff && 
      bookingData.date && 
      bookingData.time && 
      bookingData.passengers;

    const isHourlyComplete = isHourlyRental && 
      bookingData?.isComplete && 
      bookingData.city && 
      bookingData.durationHours && 
      bookingData.date && 
      bookingData.time && 
      bookingData.passengers;

    if (isTransferComplete || isHourlyComplete) {
      console.log(`Creating ${serviceType} booking request...`);
      
      const sessionId = visitorId || `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Build insert data based on service type
      const insertData: Record<string, any> = {
        pickup_date: bookingData.date,
        pickup_time: bookingData.time,
        passengers: bookingData.passengers,
        vehicle_type: bookingData.vehicleType || 'mercedes-vito',
        price: bookingData.estimatedPrice || null,
        price_currency: bookingData.currency || 'EUR',
        customer_session_id: sessionId,
        status: 'pending',
        language: language,
        service_type: serviceType,
        payment_method: bookingData.paymentMethod || null,
        customer_name: extractedCustomerName || customerName || null
      };

      if (isHourlyRental) {
        // Hourly rental: use city as both pickup and dropoff
        insertData.pickup = bookingData.city;
        insertData.dropoff = bookingData.city;
        insertData.city = bookingData.city;
        insertData.duration_hours = bookingData.durationHours;
      } else {
        // Transfer: use pickup and dropoff locations
        insertData.pickup = bookingData.pickup;
        insertData.dropoff = bookingData.dropoff;
      }

      const { data: quickBooking, error: qbError } = await supabase
        .from('quick_booking_requests')
        .insert(insertData)
        .select('id, confirmation_token')
        .single();

      if (qbError) {
        console.error("Failed to create quick booking:", qbError);
      } else {
        quickBookingId = quickBooking.id;
        confirmationToken = quickBooking.confirmation_token;
        console.log("Quick booking created:", quickBookingId, "type:", serviceType);
      }
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      bookingData,
      quickBookingId,
      confirmationToken,
      customerName: extractedCustomerName || customerName,
      discountApplied: discountData,
      readyToBook
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
      if (parsed.pickup !== undefined || parsed.dropoff !== undefined || parsed.serviceType !== undefined) {
        return parsed;
      }
    }
    
    return null;
  } catch (e) {
    console.error("Failed to parse booking data:", e);
    return null;
  }
}

function extractCustomerName(response: string): string | null {
  try {
    const nameMatch = response.match(/```customerName\s*([\s\S]*?)```/);
    if (nameMatch) {
      const parsed = JSON.parse(nameMatch[1].trim());
      return parsed.name || null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

function extractDiscountData(response: string): any | null {
  try {
    const discountMatch = response.match(/```discount\s*([\s\S]*?)```/);
    if (discountMatch) {
      return JSON.parse(discountMatch[1].trim());
    }
    return null;
  } catch (e) {
    return null;
  }
}

function extractReadyToBook(response: string): boolean {
  try {
    const readyMatch = response.match(/```readyToBook\s*([\s\S]*?)```/);
    if (readyMatch) {
      const parsed = JSON.parse(readyMatch[1].trim());
      return parsed.ready === true;
    }
    return false;
  } catch (e) {
    return false;
  }
}
