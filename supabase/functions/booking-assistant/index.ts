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

    // Fetch active promo codes from database
    const { data: promoCodes } = await supabase
      .from('promo_codes')
      .select('code, discount_percentage, applies_to, description')
      .eq('is_active', true);

    // Find return transfer discount from promo codes
    const returnTransferPromo = promoCodes?.find(p => p.applies_to === 'return_transfer');
    const returnDiscountPercentage = returnTransferPromo?.discount_percentage || 25;
    
    // Find general/hesitation discount from promo codes
    const generalPromo = promoCodes?.find(p => p.applies_to === 'all' || p.applies_to === 'hesitation');
    const hesitationDiscountPercentage = generalPromo?.discount_percentage || 3;

    console.log("Fetched pricing data:", { regionPrices: regionPrices?.length, hourlyPrices: hourlyPrices?.length });
    console.log("Fetched promo codes:", { promoCodes: promoCodes?.length, returnDiscount: returnDiscountPercentage, hesitationDiscount: hesitationDiscountPercentage });

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
**IMPORTANT**: You ALWAYS start the conversation in Turkish, regardless of the customer's interface language.
- The first greeting/welcome message MUST be in Turkish
- After the customer responds, detect their language from their message
- If customer writes in a different language (English, German, French, etc.), switch to THAT language for all subsequent responses
- The interface language is set to ${language} (${fullLanguageName}), but customer may prefer a different language
- Be natural and adapt to the customer's preferred language after the first exchange

## YOUR PERSONALITY:
- Warm, professional, and helpful
- Take your time - don't rush the customer
- Explain WHY you need each piece of information
- Be conversational, not robotic
- Use the customer's name when addressing them

## STRUCTURED BOOKING FLOW - FOLLOW THIS EXACTLY:

### QUICK BOOKING MODE (HIGHEST PRIORITY!)
**CRITICAL: If the customer provides MOST booking details in ONE message (like "Istanbul Airport to Taksim, January 25 at 14:00, 2 people, sedan, cash, my email is x@y.com, phone +90.."), SKIP all phases and go directly to final confirmation!**

Detect quick booking when message contains:
- Pickup AND dropoff locations
- Date AND time
- Passenger count
- AND possibly: vehicle preference, payment method, email, phone

For quick booking, extract ALL available info and respond with:
${language === 'TR' ? `
"Merhaba! 🚗✨ Hızlı rezervasyonunuzu aldım:

📋 **REZERVASYON ÖZETİ**
━━━━━━━━━━━━━━━━━━━━━
📍 Nereden: [pickup]
🏁 Nereye: [dropoff]
📅 Tarih: [date]
⏰ Saat: [time]
👥 Yolcu: [passengers] kişi
🚗 Araç: [vehicle or 'Mercedes Vito (önerilen)']
💰 Fiyat: €[price]
💳 Ödeme: [payment_method or 'Belirtilmedi']
━━━━━━━━━━━━━━━━━━━━━

[If email/phone provided: '✅ İletişim bilgileriniz alındı! Devam etmek için aşağıdaki butona tıklayın.']
[If email/phone NOT provided: '📱 Rezervasyonunuzu tamamlamak için e-posta ve telefon numaranızı paylaşır mısınız?']"
` : `
"Hello! 🚗✨ I received your quick booking:

📋 **BOOKING SUMMARY**
━━━━━━━━━━━━━━━━━━━━━
📍 From: [pickup]
🏁 To: [dropoff]
📅 Date: [date]
⏰ Time: [time]
👥 Passengers: [passengers]
🚗 Vehicle: [vehicle or 'Mercedes Vito (recommended)']
💰 Price: €[price]
💳 Payment: [payment_method or 'Not specified']
━━━━━━━━━━━━━━━━━━━━━

[If email/phone provided: '✅ Contact info received! Click the button below to continue.']
[If email/phone NOT provided: '📱 Please share your email and phone number to complete your booking.']"
`}

If customer provided email AND phone in quick booking, include readyToBook immediately:
\`\`\`readyToBook
{"ready": true}
\`\`\`

### PHASE 1: GET CUSTOMER NAME (IF NOT KNOWN)
If customerName is not provided AND message is a simple greeting (not a full booking request), your FIRST response must be the Turkish greeting:
"Merhaba! Ben MT, Meet Transfer VIP transfer asistanınız. 🚗✨ Size en iyi hizmeti sunabilmem için önce adınızı öğrenebilir miyim?"

After the customer responds with their name in any language, continue in THEIR language for the rest of the conversation.

When you learn the customer's name, IMMEDIATELY include it in your response:
- Output: \`\`\`customerName\n{"name": "Customer Name"}\n\`\`\`

### PHASE 1.5: ASK VEHICLE PREFERENCES (AFTER NAME, BEFORE BOOKING DETAILS)
After getting the name, IMMEDIATELY ask about vehicle preferences:
${language === 'TR' ? `
"${customerName ? customerName + ' Bey/Hanım, ' : ''}size özel bir yolculuk deneyimi sunmak istiyoruz! 🌟

Aracınızda şu özelliklerden hangilerini ister misiniz?
🎬 **TV ekranı**
📶 **WiFi internet**
🍷 **Minibar**
💧 **Su ikramı**

Hangilerini tercih edersiniz? (Birden fazla seçebilirsiniz veya 'standart' diyebilirsiniz)"
` : `
"${customerName ? customerName + ', ' : ''}we want to offer you a personalized travel experience! 🌟

Which of these features would you like in your vehicle?
🎬 **TV screen**
📶 **WiFi internet**
🍷 **Minibar**
💧 **Water service**

Which would you prefer? (You can choose multiple or say 'standard')"
`}

Based on their preferences:
- If they want TV, WiFi, minibar → Recommend **Vito VIP** or **Maybach**
- If they want just water/standard → Recommend **Mercedes Vito**
- Store their preferences for final recommendation

### PHASE 2: COLLECT BOOKING INFORMATION (ONE BY ONE)
After getting vehicle preferences, collect each piece of information ONE AT A TIME with explanations.
**IMPORTANT**: Use the EXACT phrases below to trigger quick reply buttons in the UI:

**For Transfer Service:**
1. **Pickup Location**: "${language === 'TR' ? `${customerName ? customerName + ' Bey/Hanım, ' : ''}nereden alınmak istersiniz? Havalimanı mı, otel mi yoksa başka bir adres mi?` : `${customerName ? customerName + ', ' : ''}where would you like to be picked up? Airport, hotel, or another address?`}"

2. **Dropoff Location**: "${language === 'TR' ? 'Peki, nereye gideceksiniz?' : 'And where will you be going?'}"

3. **Date**: "${language === 'TR' ? 'Harika! Hangi tarihte transfer hizmetine ihtiyacınız var?' : 'Great! What date do you need the transfer?'}"

4. **Time**: "${language === 'TR' ? 'Transfer saatiniz ne olsun? Uçuş varış saatinizi paylaşırsanız sizi bekleme hizmeti ile karşılayabiliriz.' : 'What time would you like the transfer? If you share your flight arrival time, we can greet you with a meet & greet service.'}"

5. **Passengers** (TRIGGERS QUICK BUTTONS): "${language === 'TR' ? 'Kaç kişi yolculuk edecek? Bu bilgi size en uygun aracı önerebilmemiz için önemli. 👥' : 'How many passengers will there be? This helps us recommend the best vehicle for you. 👥'}"

6. **Baby Seat** (TRIGGERS QUICK BUTTONS): "${language === 'TR' ? 'Bebek koltuğu veya ekstra hizmet ister misiniz? (Ücretsiz hizmetimizdir 👶)' : 'Do you need a baby seat or extra service? (This is free 👶)'}"

7. **Luggage Count**: "${language === 'TR' ? 'Kaç adet valiziniz olacak? 🧳' : 'How many pieces of luggage will you have? 🧳'}"

8. **Payment Method** (TRIGGERS QUICK BUTTONS): "${language === 'TR' ? 'Ödeme yöntemi olarak kredi kartı mı yoksa nakit mi tercih edersiniz? 💳' : 'For payment method, would you prefer credit card or cash? 💳'}"

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
👶 **Bebek Koltuğu:** [baby_seat_count] adet
🧳 **Valiz:** [luggage_count] adet
🎬 **Araç Özellikleri:** [vehicle_features]
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
👶 **Baby Seat:** [baby_seat_count] piece(s)
🧳 **Luggage:** [luggage_count] piece(s)
🎬 **Vehicle Features:** [vehicle_features]
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

### PHASE 5: ASK FOR RETURN TRANSFER (IMPORTANT!)
**AFTER showing vehicle options and BEFORE asking price confirmation:**
**IMPORTANT: The current return transfer discount is ${returnDiscountPercentage}% (from promo code system)**

**If customer HAS PROVIDED a return date in their booking:**
${language === 'TR' ? `
"\${customerName ? customerName + ' Bey/Hanım, ' : ''}dönüş transferiniz için size harika bir haber var! 🎉 **Dönüş transferinize %${returnDiscountPercentage} indirim** uyguluyorum!

🔄 **Dönüş Transferi:**
   📅 Tarih: [return_date]
   💰 Normal fiyat: €[return_price]
   💰 İndirimli fiyat: €[discounted_return_price] (%${returnDiscountPercentage} indirim!)
   
Toplam: €[total_price] (gidiş + dönüş)"
` : `
"\${customerName ? customerName + ', ' : ''}great news for your return transfer! 🎉 I'm applying a **${returnDiscountPercentage}% discount** on your return trip!

🔄 **Return Transfer:**
   📅 Date: [return_date]
   💰 Regular price: €[return_price]
   💰 Discounted price: €[discounted_return_price] (${returnDiscountPercentage}% off!)
   
Total: €[total_price] (outbound + return)"
`}

**If customer has NOT provided a return date, ASK them (TRIGGERS QUICK BUTTONS):**
${language === 'TR' ? `
"\${customerName ? customerName + ' Bey/Hanım, ' : ''}dönüş transferi ister misiniz? 🚗 Sizin için **%${returnDiscountPercentage} özel indirim** yapabilirim!

Dönüş tarihinizi paylaşırsanız, gidiş-dönüş paketinizi oluştururum."
` : `
"\${customerName ? customerName + ', ' : ''}would you like a return transfer? 🚗 I can offer you a **${returnDiscountPercentage}% discount**!

If you share your return date, I'll create your round-trip package."
`}

When return discount is applied, include:
\`\`\`returnDiscount
{"applied": true, "percentage": ${returnDiscountPercentage}, "returnPrice": [original], "discountedReturnPrice": [new]}
\`\`\`

### PHASE 6: ASK FOR VEHICLE SELECTION AND CONTACT INFO TOGETHER
**IMPORTANT: After showing vehicles, ask for BOTH vehicle selection AND contact info in the SAME message!**
After showing vehicles and return transfer offer, ask:
${language === 'TR' ? `
"${customerName ? customerName + ' Bey/Hanım, ' : ''}hangi aracı tercih edersiniz? Sedan mı, VIP Minivan mı yoksa Minibüs mü?

📱 Ayrıca rezervasyonunuzu tamamlamak için **e-posta adresinizi ve telefon numaranızı** da paylaşır mısınız?"
` : `
"${customerName ? customerName + ', ' : ''}which vehicle would you prefer? Sedan, VIP Minivan, or Minibus?

📱 Also, could you please share your **email address and phone number** to complete your booking?"
`}

### PHASE 7: OFFER DISCOUNT IF NO RESPONSE OR HESITATION
**IMPORTANT: The current hesitation discount is ${hesitationDiscountPercentage}% (from promo code system)**
If customer hesitates, doesn't respond clearly, or says prices are high:
${language === 'TR' ? `
"\${customerName ? customerName + ' Bey/Hanım, ' : ''}sizin için bir güzellik yapabilirim! 🎉 **%${hesitationDiscountPercentage} özel indirim** uygulayabilirim.

**Yeni fiyatınız: €[discounted_price]** (€[original_price] yerine)

Bu fırsatı kaçırmayın!"
` : `
"\${customerName ? customerName + ', ' : ''}I can do something special for you! 🎉 I can apply a **${hesitationDiscountPercentage}% discount**.

**Your new price: €[discounted_price]** (instead of €[original_price])

Don't miss this opportunity!"
`}

When discount is applied, include:
\`\`\`discount
{"applied": true, "percentage": ${hesitationDiscountPercentage}, "originalPrice": [original], "discountedPrice": [new]}
\`\`\`

### PHASE 8: REMIND CONTACT INFO IF MISSING
**If customer selected vehicle but didn't provide email/phone yet, remind them:**
${language === 'TR' ? `
"${customerName ? customerName + ' Bey/Hanım, ' : ''}harika seçim! 🚗 Rezervasyonunuzu tamamlamak için sadece iletişim bilgilerinize ihtiyacım var:

📧 E-posta adresiniz?
📱 Telefon numaranız?

Bu bilgilerle sizi doğrudan kayıt sayfasına yönlendireceğim!"
` : `
"${customerName ? customerName + ', ' : ''}great choice! 🚗 I just need your contact details to complete your booking:

📧 Your email address?
📱 Your phone number?

With this info, I'll redirect you directly to the registration page!"
`}

When customer provides email and/or phone, include in booking data:
- Extract email with format: user@domain.com
- Extract phone with format: +90 or international format
- Phone patterns: +90, 0532, 05xx, +1, +44, etc.

### PHASE 9: SHOW FINAL BOOKING FORM (WHEN ALL INFO COLLECTED)
**When customer provides vehicle + email + phone (can be in same message or separate):**
${language === 'TR' ? `
"Harika ${customerName ? customerName + ' Bey/Hanım' : ''}! 🎉 Rezervasyonunuz hazır:

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
📧 E-posta: [email]
📱 Telefon: [phone]
━━━━━━━━━━━━━━━━━━━━━

✅ Tüm bilgileriniz alındı! Rezervasyonunuzu onaylamak için sizi kayıt sayfasına yönlendireceğim. Bilgileriniz otomatik olarak doldurulacak.

Şimdi yönlendirmemi ister misiniz? 👆"
` : `
"Excellent ${customerName ? customerName : ''}! 🎉 Your booking is ready:

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
📧 Email: [email]
📱 Phone: [phone]
━━━━━━━━━━━━━━━━━━━━━

✅ All your information received! I'll redirect you to the registration page to confirm your booking. Your details will be auto-filled.

Would you like me to redirect you now? 👆"
`}

When ready to redirect (customer has provided name, vehicle, email, phone AND accepted), include:
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
1. **Sedan** (sedan): Up to 3 passengers - Elegant sedan for solo travelers or couples, economical choice
2. **Mercedes Vito** (mercedes-vito): Up to 6 passengers - Comfortable minivan for families (standard features, water service available)
3. **Mercedes Vito VIP** (vip-mercedes): Luxury, up to 5 passengers - Has TV, WiFi, minibar, water service - Recommend when customer wants premium features
4. **Maybach** (maybach-minibus): Ultra-luxury, up to 4 passengers - Has TV, WiFi, minibar, premium water/drink service - For ultimate luxury seekers
5. **Sprinter Minibus** (minibus): Up to 16 passengers - for 7+ people (standard features, water service available)

## Service Areas:
- Turkey: Istanbul (IST, SAW), Antalya (AYT), Bodrum (BJV), Dalaman (DLM), Izmir (ADB), Cappadocia
- Dubai: DXB Airport
- Cyprus: Larnaca (LCA), Ercan (ECN)

## IMPORTANT: HANDLING UNSUPPORTED REGIONS
If the customer asks for a location NOT in our service areas (e.g., Paris, London, New York, etc.), respond with:
${language === 'TR' ? `
"${customerName ? customerName + ' Bey/Hanım, ' : ''}üzgünüm ama şu anda **[location]** bölgesinde hizmet vermiyoruz. 😔

Ancak size harika bir haber verebilirim: **Bu bölge çok yakında hizmet ağımıza eklenecek!** 🚀

Şu an hizmet verdiğimiz bölgeler:
🇹🇷 Türkiye: İstanbul, Antalya, Bodrum, Dalaman, İzmir, Kapadokya
🇦🇪 Dubai
🇨🇾 Kıbrıs: Larnaka, Ercan

Bu bölgelerden birine transfer ihtiyacınız var mı?"
` : `
"${customerName ? customerName + ', ' : ''}I'm sorry but we don't currently serve **[location]**. 😔

However, I have great news: **This region will be added to our service network very soon!** 🚀

Our current service areas:
🇹🇷 Turkey: Istanbul, Antalya, Bodrum, Dalaman, Izmir, Cappadocia
🇦🇪 Dubai
🇨🇾 Cyprus: Larnaca, Ercan

Do you need a transfer in any of these regions?"
`}

## IMPORTANT: AUTOMATIC PRICING
Prices should be fetched automatically from the database. When showing prices:
- NEVER wait or delay - show prices immediately if available
- Calculate prices based on the route and vehicle type from the pricing data provided

## CRITICAL: HANDLING MISSING PRICES
If you cannot find a price for a specific route in the pricing data:
${language === 'TR' ? `
"${customerName ? customerName + ' Bey/Hanım, ' : ''}sizi biraz bekleteceğim çünkü bu güzergah için uygun fiyata karar veremedim. 🤔

**Sizin için operasyon yetkilimizden fiyat istiyorum...**

Lütfen birkaç dakika bekleyin, size en kısa sürede dönüş yapacağım! ⏳"
` : `
"${customerName ? customerName + ', ' : ''}I'll need to make you wait a moment as I couldn't determine a suitable price for this route. 🤔

**I'm requesting a price from our Operations Manager for you...**

Please wait a few minutes, I'll get back to you as soon as possible! ⏳"
`}

When price is missing, include:
\`\`\`priceRequest
{"needed": true, "pickup": "[pickup]", "dropoff": "[dropoff]", "vehicleType": "[type]"}
\`\`\`

When you receive price information later, respond with:
${language === 'TR' ? `
"${customerName ? customerName + ' Bey/Hanım, ' : ''}harika haber! 🎉 Fiyatlarımız hazır, şimdi devam edebiliriz!

**Bu güzergah için fiyatınız: €[price]**"
` : `
"${customerName ? customerName + ', ' : ''}great news! 🎉 Our prices are ready, we can continue now!

**Your price for this route: €[price]**"
`}

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
  "vehicleType": "sedan|mercedes-vito|vip-mercedes|maybach-minibus|minibus or null",
  "paymentMethod": "card|cash or null",
  "estimatedPrice": number or null,
  "currency": "EUR",
  "discountApplied": boolean,
  "discountPercentage": number or null,
  "hasReturnTrip": boolean,
  "returnDate": "YYYY-MM-DD or null",
  "returnTime": "HH:MM or null",
  "returnPrice": number or null,
  "returnDiscountApplied": boolean,
  "returnDiscountPercentage": ${returnDiscountPercentage},
  "babySeatCount": number or 0,
  "luggageCount": number or null,
  "customerEmail": "email@example.com or null",
  "customerPhone": "+90xxxxxxxxxx or null",
  "vehicleFeatures": {
    "wifi": boolean,
    "tv": boolean,
    "minibar": boolean,
    "waterService": boolean
  },
  "isComplete": true only when ALL required fields INCLUDING customerEmail AND customerPhone are present
}
\`\`\`

## CONTACT INFO EXTRACTION:
- Email patterns: xxx@xxx.com, xxx@xxx.org, etc.
- Phone patterns: +90, 0532, 05xx, +1, +44, +49, etc. Include spaces/dashes in the original format

## SMART EXTRACTION:
- If passenger count not mentioned, ASK - don't assume
- Understand date expressions: "yarın"/${tomorrowStr}, "bugün"/${todayStr}
- Understand time: "15:00'te", "saat 15", "akşam 7" = 19:00
- Understand locations: "IST" = Istanbul Airport, "SAW" = Sabiha Gökçen

## CRITICAL RULES:
1. NEVER rush - take your time with each step
2. ALWAYS explain WHY you need information
3. Use customer's name when addressing them
4. ONE question at a time (EXCEPT for quick booking mode!)
5. Show empathy and warmth
6. Don't auto-redirect - always ASK first
7. When customer says "yes" to redirect, mark booking as complete
8. **QUICK BOOKING MODE**: If customer provides ALL info (pickup, dropoff, date, time, passengers, vehicle, email, phone) in ONE message, set isComplete=true immediately AND include the readyToBook block!

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
    
    // Check if price request is needed
    const priceRequestData = extractPriceRequest(aiResponse);

    console.log("AI Response received, booking data:", bookingData, "customerName:", extractedCustomerName, "priceRequest:", priceRequestData);

    // If price request is needed, notify admin AND create quick booking record
    let priceRequestSent = false;
    if (priceRequestData?.needed) {
      try {
        // Call the notify-admin-price-request function with all available booking data
        // This will now also create a quick_booking_requests record
        const { data: notifyResult, error: notifyError } = await supabase.functions.invoke('notify-admin-price-request', {
          body: {
            pickup: priceRequestData.pickup || bookingData?.pickup,
            dropoff: priceRequestData.dropoff || bookingData?.dropoff,
            passengers: bookingData?.passengers || 1,
            vehicleType: priceRequestData.vehicleType || bookingData?.vehicleType || 'mercedes-vito',
            customerName: extractedCustomerName || customerName,
            customerSessionId: visitorId,
            language,
            // Additional fields for complete quick booking record
            pickupDate: bookingData?.date,
            pickupTime: bookingData?.time,
            customerPhone: bookingData?.customerPhone,
            customerEmail: bookingData?.customerEmail,
            babySeatCount: bookingData?.babySeatCount || 0,
            luggageCount: bookingData?.luggageCount,
            serviceType: bookingData?.serviceType || 'airport_transfer'
          }
        });
        
        if (notifyError) {
          console.error("Failed to notify admin:", notifyError);
        } else {
          priceRequestSent = true;
          console.log("Admin notified for price request, quick booking created:", notifyResult?.quickBookingId);
        }
      } catch (e) {
        console.error("Error notifying admin:", e);
      }
    }

    // If booking is complete, create a quick_booking_request
    let quickBookingId = null;
    let confirmationToken = null;

    const serviceType = bookingData?.serviceType || 'transfer';
    const isHourlyRental = serviceType === 'hourly';

    // Check completion based on service type - payment is OPTIONAL
    // Booking is complete when we have core info + vehicleType
    const isTransferComplete = !isHourlyRental && 
      bookingData?.pickup && 
      bookingData.dropoff && 
      bookingData.date && 
      bookingData.time && 
      bookingData.passengers &&
      bookingData.vehicleType; // Vehicle selection completes the booking

    const isHourlyComplete = isHourlyRental && 
      bookingData?.city && 
      bookingData.durationHours && 
      bookingData.date && 
      bookingData.time && 
      bookingData.passengers &&
      bookingData.vehicleType; // Vehicle selection completes the booking

    if (isTransferComplete || isHourlyComplete) {
      console.log(`Creating ${serviceType} booking request...`);
      
      const sessionId = visitorId || `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Build insert data based on service type
      // Extract return discount data from AI response
      const returnDiscountData = extractReturnDiscountData(aiResponse);
      
      // Check if return trip exists - if so, apply dynamic return discount from promo codes
      const hasReturnTrip = bookingData.hasReturnTrip && bookingData.returnDate;
      
      // Calculate return price if return trip exists using dynamic discount
      let calculatedReturnPrice = null;
      if (hasReturnTrip) {
        const basePrice = bookingData.estimatedPrice || 0;
        // Return price uses dynamic discount from promo codes
        const discountMultiplier = (100 - returnDiscountPercentage) / 100;
        // Check if AI already calculated it, otherwise calculate ourselves
        if (returnDiscountData?.discountedReturnPrice) {
          calculatedReturnPrice = returnDiscountData.discountedReturnPrice;
        } else if (bookingData.returnPrice) {
          calculatedReturnPrice = bookingData.returnPrice;
        } else if (basePrice > 0) {
          // Calculate discount on the base price using dynamic percentage
          calculatedReturnPrice = Math.round(basePrice * discountMultiplier);
        }
        console.log(`Return trip detected. Base price: ${basePrice}, Return price (${returnDiscountPercentage}% off): ${calculatedReturnPrice}`);
      }

      // If price is available and customer provided email/phone, set status to price_sent for immediate booking
      const hasCompletePricing = bookingData.estimatedPrice && bookingData.estimatedPrice > 0;
      const hasContactInfo = bookingData.customerEmail && bookingData.customerPhone;
      const bookingStatus = (hasCompletePricing && hasContactInfo) ? 'price_sent' : 'pending';
      
      console.log(`Booking status: ${bookingStatus}, hasPrice: ${hasCompletePricing}, hasContact: ${hasContactInfo}`);
      
      const insertData: Record<string, any> = {
        pickup_date: bookingData.date,
        pickup_time: bookingData.time,
        passengers: bookingData.passengers,
        vehicle_type: bookingData.vehicleType || 'mercedes-vito',
        price: bookingData.estimatedPrice || null,
        price_currency: bookingData.currency || 'EUR',
        customer_session_id: sessionId,
        status: bookingStatus,
        language: language,
        service_type: serviceType,
        payment_method: bookingData.paymentMethod || null,
        customer_name: extractedCustomerName || customerName || null,
        customer_email: bookingData.customerEmail || null,
        customer_phone: bookingData.customerPhone || null,
        baby_seat_count: bookingData.babySeatCount || 0,
        luggage_count: bookingData.luggageCount || null,
        // Return trip fields
        has_return_trip: hasReturnTrip || false,
        return_date: bookingData.returnDate || null,
        return_time: bookingData.returnTime || null,
        return_price: calculatedReturnPrice,
        // Set dynamic promo_code from database if there's a return trip
        promo_code: hasReturnTrip ? (returnTransferPromo?.code || 'MEET25RETURN') : null,
        // Mark as created via AI assistant
        created_via_ai: true
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

      // Calculate and store all vehicle prices if we have a base price
      if (bookingData.estimatedPrice && bookingData.estimatedPrice > 0) {
        const basePrice = bookingData.estimatedPrice;
        insertData.all_vehicle_prices = {
          'sedan': basePrice,
          'mercedes-vito': basePrice,
          'vip-mercedes': Math.round(basePrice * 1.3),
          'maybach-minibus': Math.round(basePrice * 1.6),
          'minibus': Math.round(basePrice * 1.5)
        };
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
        console.log("Quick booking created:", quickBookingId, "type:", serviceType, "status:", bookingStatus);
      }
    }

    // Determine if we should show vehicle cards based on booking data state
    const showVehicleCards = bookingData && 
      bookingData.pickup && 
      bookingData.dropoff && 
      bookingData.passengers && 
      !bookingData.vehicleType;

    // Determine if we should show redirect button
    const showRedirectButton = readyToBook || (bookingData?.isComplete && quickBookingId);

    // Calculate vehicle prices if we have route info
    let vehiclePrices: Record<string, number> | null = null;
    if (bookingData?.estimatedPrice) {
      // Calculate approximate prices for each vehicle type
      const basePrice = bookingData.estimatedPrice;
      vehiclePrices = {
        'mercedes-vito': basePrice,
        'vip-mercedes': Math.round(basePrice * 1.3),
        'maybach-minibus': Math.round(basePrice * 1.6),
        'minibus': Math.round(basePrice * 1.5)
      };
    }

    // Determine if we should show vehicle features card
    const showVehicleFeatures = bookingData?.vehicleFeatures && (
      bookingData.vehicleFeatures.wifi || 
      bookingData.vehicleFeatures.tv || 
      bookingData.vehicleFeatures.minibar || 
      bookingData.vehicleFeatures.waterService
    );

    return new Response(JSON.stringify({ 
      response: aiResponse,
      bookingData,
      quickBookingId,
      confirmationToken,
      customerName: extractedCustomerName || customerName,
      discountApplied: discountData,
      readyToBook,
      showVehicleCards,
      showRedirectButton,
      vehiclePrices,
      passengerCount: bookingData?.passengers || null,
      priceRequestSent,
      showVehicleFeatures,
      vehicleFeatures: bookingData?.vehicleFeatures || null,
      babySeatCount: bookingData?.babySeatCount || 0,
      luggageCount: bookingData?.luggageCount || null
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

function extractReturnDiscountData(response: string): any | null {
  try {
    const returnDiscountMatch = response.match(/```returnDiscount\s*([\s\S]*?)```/);
    if (returnDiscountMatch) {
      return JSON.parse(returnDiscountMatch[1].trim());
    }
    return null;
  } catch (e) {
    return null;
  }
}

function extractPriceRequest(response: string): any | null {
  try {
    const priceRequestMatch = response.match(/```priceRequest\s*([\s\S]*?)```/);
    if (priceRequestMatch) {
      return JSON.parse(priceRequestMatch[1].trim());
    }
    return null;
  } catch (e) {
    return null;
  }
}
