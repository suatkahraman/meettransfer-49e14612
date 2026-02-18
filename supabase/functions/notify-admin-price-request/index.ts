import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// District mapping for auto-pricing
const DISTRICT_MAPPING: Record<string, string> = {
  "alanya": "Alanya",
  "belek": "Belek",
  "side": "Side",
  "kemer": "Kemer",
  "lara": "Lara",
  "kundu": "Kundu",
  "manavgat": "Manavgat",
  "taksim": "Taksim",
  "sultanahmet": "Sultanahmet",
  "kadikoy": "Kadıköy",
  "besiktas": "Beşiktaş",
  "bodrum": "Bodrum Merkez",
  "fethiye": "Fethiye",
  "marmaris": "Marmaris",
  "cesme": "Çeşme",
  "kusadasi": "Kuşadası",
};

const TURKEY_INTRACITY_DISCOUNT_CITIES = new Set([
  "Istanbul",
  "Ankara",
  "Antalya",
  "Bodrum",
  "Dalaman",
  "Izmir",
  "Bursa",
]);

const INTRACITY_AIRPORT_DISCOUNT_RATE = 0.1;

function isSameCity(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return normalizeTurkish(a).toLowerCase() === normalizeTurkish(b).toLowerCase();
}

const ISTANBUL_DISTRICTS = new Set(["taksim", "sultanahmet", "kadikoy", "besiktas", "bakirkoy"]);
const ANKARA_DISTRICTS = new Set(["pursaklar", "kecioren", "ulus", "cankaya merkez", "mamak", "yenimahalle merkez"]);
const ANTALYA_DISTRICTS = new Set(["alanya", "belek", "side", "kemer", "lara", "kundu", "manavgat"]);
const BODRUM_DISTRICTS = new Set(["bodrum merkez", "turgutreis"]);
const DALAMAN_DISTRICTS = new Set(["fethiye", "oludeniz", "marmaris", "dalyan"]);
const IZMIR_DISTRICTS = new Set(["cesme", "kusadasi"]);

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
    if (lower.includes(normalizeTurkish(key).toLowerCase())) return value;
  }
  return null;
}

function detectCity(text: string): string | null {
  const s = normalizeTurkish(text).toLowerCase();
  if (/istanbul|\bist\b|\bsaw\b/i.test(s)) return "Istanbul";
  if (/ankara|\besb\b|esenboga/i.test(s)) return "Ankara";
  if (/antalya|\bayt\b|alanya|belek|side|kemer|manavgat/i.test(s)) return "Antalya";
  if (/bodrum|\bbjv\b|turgutreis|yalikavak|gumbet/i.test(s)) return "Bodrum";
  if (/dalaman|\bdlm\b|fethiye|marmaris|oludeniz/i.test(s)) return "Dalaman";
  if (/izmir|\badb\b|cesme|alacati|kusadasi/i.test(s)) return "Izmir";
  if (/bursa/i.test(s)) return "Bursa";
  return null;
}

function applyIntracityAirportDiscount(price: number): number {
  return Math.max(1, Math.ceil(price * (1 - INTRACITY_AIRPORT_DISCOUNT_RATE)));
}

function inferCityFromDistrict(district: string | null): string | null {
  if (!district) return null;
  const normalizedDistrict = normalizeTurkish(district).toLowerCase();
  if (ISTANBUL_DISTRICTS.has(normalizedDistrict)) return "Istanbul";
  if (ANKARA_DISTRICTS.has(normalizedDistrict)) return "Ankara";
  if (ANTALYA_DISTRICTS.has(normalizedDistrict)) return "Antalya";
  if (BODRUM_DISTRICTS.has(normalizedDistrict)) return "Bodrum";
  if (DALAMAN_DISTRICTS.has(normalizedDistrict)) return "Dalaman";
  if (IZMIR_DISTRICTS.has(normalizedDistrict)) return "Izmir";
  return null;
}

function analyzeLocation(pickup: string, dropoff: string): {
  airport: string | null;
  city: string | null;
  pickupCity: string | null;
  dropoffCity: string | null;
  pickupDistrict: string | null;
  dropoffDistrict: string | null;
  district: string | null;
} {
  const s = normalizeTurkish(pickup + " " + dropoff).toLowerCase();

  let airport: string | null = null;
  // Türkiye - Tüm havalimanları (KM tabanlı bölgesel fiyatlandırma kapsamı)
  if (/istanbul airport|\bist\b/i.test(s)) airport = "Istanbul Airport (IST)";
  else if (/sabiha|gokcen|\bsaw\b/i.test(s)) airport = "Sabiha Gokcen Airport (SAW)";
  else if (/gazipasa|gazipaşa|\bgzp\b|alanya.*airport/i.test(s)) airport = "Gazipasa-Alanya Airport (GZP)";
  else if (/antalya.*airport|antalya.*havalimani|\bayt\b/i.test(s)) airport = "Antalya Airport (AYT)";
  else if (/\bbjv\b|bodrum.*airport|milas.*airport|bodrum.*havalimani|milas.*havalimani/i.test(s)) airport = "Bodrum-Milas Airport (BJV)";
  else if (/\bdlm\b|dalaman.*airport|dalaman.*havalimani/i.test(s)) airport = "Dalaman Airport (DLM)";
  else if (/adnan menderes|\badb\b/i.test(s)) airport = "Izmir Adnan Menderes Airport (ADB)";
  else if (/kayseri|\basr\b|erkilet/i.test(s)) airport = "Kayseri Airport (ASR)";
  else if (/nevsehir|nevşehir|kapadokya|\bnav\b/i.test(s)) airport = "Nevsehir-Kapadokya Airport (NAV)";
  else if (/esenboga|esenboğa|\besb\b|ankara.*airport/i.test(s)) airport = "Ankara Esenboga Airport (ESB)";
  else if (/adana|sakirpasa|\bada\b/i.test(s)) airport = "Adana Sakirpasa Airport (ADA)";
  else if (/gaziantep|\bgzt\b|oguzeli/i.test(s)) airport = "Gaziantep Airport (GZT)";
  else if (/trabzon|\btzx\b/i.test(s)) airport = "Trabzon Airport (TZX)";
  else if (/diyarbakir|diyarbakır|\bdiy\b/i.test(s)) airport = "Diyarbakir Airport (DIY)";
  else if (/van.*(airport|havalimani|havalimanı)|(airport|havalimani|havalimanı).*van|\bvan\b.*havalimani/i.test(s)) airport = "Van Ferit Melen Airport (VAN)";
  else if (/malatya|\bmlx\b/i.test(s)) airport = "Malatya Airport (MLX)";
  else if (/samsun|\bszf\b|carsamba.*airport/i.test(s)) airport = "Samsun Carsamba Airport (SZF)";
  else if (/cengiz topel|\bkco\b|kocaeli.*airport/i.test(s)) airport = "Kocaeli Cengiz Topel Airport (KCO)";
  else if (/tekirdag|tekirdağ|corlu|çorlu|\bteq\b/i.test(s)) airport = "Tekirdag Corlu Airport (TEQ)";
  else if (/edirne|\bedn\b/i.test(s)) airport = "Edirne Airport (EDN)";
  else if (/kars|\bkhv\b|harakani/i.test(s)) airport = "Kars Harakani Airport (KHV)";
  else if (/denizli|cardak|çardak|\bdnz\b|pamukkale.*airport/i.test(s)) airport = "Denizli Cardak Airport (DNZ)";
  else if (/elazig|elazığ|\bezs\b/i.test(s)) airport = "Elazig Airport (EZS)";
  else if (/sivas|\bvas\b|nuri demirag/i.test(s)) airport = "Sivas Nuri Demirag Airport (VAS)";
  else if (/sinop|\bnop\b/i.test(s)) airport = "Sinop Airport (NOP)";
  else if (/kastamonu|\bkfs\b/i.test(s)) airport = "Kastamonu Airport (KFS)";
  else if (/zonguldak|\bonq\b|caycuma|çaycuma/i.test(s)) airport = "Zonguldak Caycuma Airport (ONQ)";
  else if (/sirnak|sırnak|\bnkt\b/i.test(s)) airport = "Sirnak Airport (NKT)";
  else if (/agri|ağrı|\baji\b/i.test(s)) airport = "Agri Airport (AJI)";
  else if (/mardin|\bmqm\b/i.test(s)) airport = "Mardin Airport (MQM)";
  else if (/afyon|zafer|\bkzr\b/i.test(s)) airport = "Afyon Zafer Airport (KZR)";
  else if (/mus.*airport|muş.*havalimani|\bmsr\b/i.test(s)) airport = "Mus Airport (MSR)";
  else if (/erzurum|\berz\b/i.test(s)) airport = "Erzurum Airport (ERZ)";
  else if (/erzincan|\berc\b/i.test(s)) airport = "Erzincan Airport (ERC)";
  else if (/sanliurfa|şanlıurfa|urfa.*airport|\bsfq\b|gap.*airport/i.test(s)) airport = "Sanliurfa GAP Airport (SFQ)";
  else if (/hatay|\bhty\b|antakya.*airport|iskenderun.*airport/i.test(s)) airport = "Hatay Airport (HTY)";
  else if (/balikesir|balıkesir|koca seyit|\bedo\b|bandirma.*airport/i.test(s)) airport = "Balikesir Koca Seyit Airport (EDO)";
  else if (/canakkale|çanakkale|\bckz\b/i.test(s)) airport = "Canakkale Airport (CKZ)";
  else if (/ordu|giresun|\bogu\b/i.test(s)) airport = "Ordu-Giresun Airport (OGU)";
  else if (/rize|artvin|\brzv\b|cayeli/i.test(s)) airport = "Rize-Artvin Airport (RZV)";
  else if (/bursa|yenisehir|\byei\b/i.test(s)) airport = "Bursa Yenisehir Airport (YEI)";

  const pickupCity = detectCity(pickup);
  const dropoffCity = detectCity(dropoff);
  const city = pickupCity || dropoffCity;

  const pickupDistrict = detectDistrict(pickup);
  const dropoffDistrict = detectDistrict(dropoff);
  const district = pickupDistrict || dropoffDistrict;

  return { airport, city, pickupCity, dropoffCity, pickupDistrict, dropoffDistrict, district };
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      pickup, 
      dropoff, 
      passengers, 
      vehicleType, 
      customerName,
      customerSessionId,
      language = 'EN',
      pickupDate,
      pickupTime,
      customerPhone,
      customerEmail,
      babySeatCount,
      luggageCount,
      serviceType = 'airport_transfer',
      hasReturnTrip,
      returnDate,
      returnTime,
      priceCurrency = 'EUR'
    } = await req.json();

    console.log("Price request notification for route:", pickup, "->", dropoff);
    console.log("Additional data:", { pickupDate, pickupTime, customerPhone, customerEmail, passengers, vehicleType });

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================
    // AUTO-PRICING: Try to find price before notifying admin
    // ============================================
    let autoPrice: number | null = null;
    let autoPriceCurrency: string | null = null;
    let returnPrice: number | null = null;
    let autoPriced = false;

    const { airport, city, pickupCity, dropoffCity, pickupDistrict, dropoffDistrict, district } = analyzeLocation(pickup, dropoff);
    const pickupDistrictCity = inferCityFromDistrict(pickupDistrict);
    const dropoffDistrictCity = inferCityFromDistrict(dropoffDistrict);
    const resolvedPickupCity = pickupCity || pickupDistrictCity;
    const resolvedDropoffCity = dropoffCity || dropoffDistrictCity;
    const resolvedCity = resolvedPickupCity || resolvedDropoffCity || city;
    const intracityCity =
      resolvedPickupCity && resolvedDropoffCity && resolvedPickupCity === resolvedDropoffCity
        ? resolvedPickupCity
        : null;
    const fallbackSharedCity =
      !intracityCity && resolvedPickupCity && resolvedDropoffCity && isSameCity(resolvedPickupCity, resolvedDropoffCity)
        ? resolvedPickupCity
        : null;
    console.log("Location analysis:", { airport, city: resolvedCity, pickupCity: resolvedPickupCity, dropoffCity: resolvedDropoffCity, pickupDistrict, dropoffDistrict, district });

    if (resolvedCity || airport) {
      const selectedVehicle = vehicleType || 'mercedes-vito';

      const isTurkeyIntracityAddressTransfer =
        !airport &&
        ((
          !!intracityCity && TURKEY_INTRACITY_DISCOUNT_CITIES.has(intracityCity)
        ) || (
          !!fallbackSharedCity && TURKEY_INTRACITY_DISCOUNT_CITIES.has(fallbackSharedCity)
        ));

      if (isTurkeyIntracityAddressTransfer) {
        const referenceCity = intracityCity || fallbackSharedCity || resolvedCity;
        const districtCandidates = [pickupDistrict, dropoffDistrict].filter(
          (candidate, index, arr): candidate is string => !!candidate && arr.indexOf(candidate) === index,
        );
        let foundPrice: any = null;

        for (const targetDistrict of districtCandidates) {
          const lookupDistricts = [targetDistrict, normalizeTurkish(targetDistrict)];
          for (const lookupDistrict of lookupDistricts) {
            const { data: districtPrices } = await supabase
              .from('region_prices')
              .select('*')
              .eq('is_active', true)
              .eq('vehicle_type', selectedVehicle)
              .ilike('city', referenceCity!)
              .ilike('district', lookupDistrict)
              .not('airport', 'is', null)
              .order('price', { ascending: true })
              .limit(1);
            if (districtPrices && districtPrices[0]) {
              foundPrice = districtPrices[0];
              break;
            }
          }
          if (foundPrice) break;
        }

        if (!foundPrice) {
          const { data: cityAirportPrices } = await supabase
            .from('region_prices')
            .select('*')
            .eq('is_active', true)
            .eq('vehicle_type', selectedVehicle)
            .ilike('city', referenceCity!)
            .not('airport', 'is', null)
            .order('price', { ascending: true })
            .limit(1);
          if (cityAirportPrices && cityAirportPrices[0]) {
            foundPrice = cityAirportPrices[0];
          }
        }

        if (foundPrice) {
            const intracityDiscountedPrice = applyIntracityAirportDiscount(Number(foundPrice.price));
            const baseCurrency = foundPrice.price_currency || "EUR";

            if (priceCurrency !== baseCurrency) {
              const converted = await convertCurrency(intracityDiscountedPrice, baseCurrency, priceCurrency);
              autoPrice = converted.amount;
              autoPriceCurrency = priceCurrency;
            } else {
              autoPrice = intracityDiscountedPrice;
              autoPriceCurrency = baseCurrency;
            }

            if (hasReturnTrip) {
              returnPrice = Math.ceil(autoPrice! * 0.75);
            }

            autoPriced = true;
            console.log("✅ Intracity auto-price found:", {
              city: referenceCity,
              pickupDistrict,
              dropoffDistrict,
              basePrice: foundPrice.price,
              discountedPrice: intracityDiscountedPrice,
              currency: autoPriceCurrency,
            });
        }
      }
      
      // Try to find price with different strategies
      const strategies = autoPriced ? [] : [
        // Strategy 1: District + City + Airport
        district && resolvedCity && airport ? { vehicle_type: `eq.${selectedVehicle}`, city: `eq.${resolvedCity}`, airport: `eq.${airport}`, district: `eq.${district}`, is_active: "eq.true" } : null,
        // Strategy 2: City + Airport
        resolvedCity && airport ? { vehicle_type: `eq.${selectedVehicle}`, city: `eq.${resolvedCity}`, airport: `eq.${airport}`, is_active: "eq.true" } : null,
        // Strategy 3: City only
        resolvedCity ? { vehicle_type: `eq.${selectedVehicle}`, city: `eq.${resolvedCity}`, is_active: "eq.true" } : null,
        // Strategy 4: Airport only
        airport ? { vehicle_type: `eq.${selectedVehicle}`, airport: `eq.${airport}`, is_active: "eq.true" } : null,
      ].filter(Boolean);

      for (const strategy of strategies) {
        if (!strategy) continue;
        
        let query = supabase.from('region_prices').select('*').eq('is_active', true);
        
        if (strategy.vehicle_type) query = query.eq('vehicle_type', selectedVehicle);
        if (strategy.city) query = query.eq('city', resolvedCity);
        if (strategy.airport) query = query.eq('airport', airport);
        if (strategy.district) query = query.eq('district', district);
        
        const { data: prices } = await query.limit(1);
        
        if (prices && prices[0]) {
          const foundPrice = prices[0];
          const baseCurrency = foundPrice.price_currency || "EUR";
          
          // Convert if needed
          if (priceCurrency !== baseCurrency) {
            const converted = await convertCurrency(foundPrice.price, baseCurrency, priceCurrency);
            autoPrice = converted.amount;
            autoPriceCurrency = priceCurrency;
          } else {
            autoPrice = foundPrice.price;
            autoPriceCurrency = baseCurrency;
          }
          
          // Calculate return price with discount
          if (hasReturnTrip) {
            returnPrice = Math.ceil(autoPrice! * 0.75);
          }
          
          autoPriced = true;
          console.log("✅ Auto-price found:", autoPrice, autoPriceCurrency, "from strategy");
          break;
        }
      }
    }

    // If auto-price found AND we have customerSessionId, create/update quick_booking_requests
    let quickBookingId: string | null = null;
    
    if (autoPriced && customerSessionId) {
      // Check if quick booking already exists for this session
      const { data: existingBooking } = await supabase
        .from('quick_booking_requests')
        .select('id')
        .eq('customer_session_id', customerSessionId)
        .eq('pickup', pickup)
        .eq('dropoff', dropoff)
        .maybeSingle();
      
      if (existingBooking) {
        // Update existing
        await supabase
          .from('quick_booking_requests')
          .update({
            price: autoPrice,
            price_currency: autoPriceCurrency,
            return_price: returnPrice,
            status: 'price_sent',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingBooking.id);
        
        quickBookingId = existingBooking.id;
        console.log("✅ Updated existing quick booking with auto-price:", quickBookingId);
      } else {
        // Create new quick booking with price
        const { data: newBooking, error: insertError } = await supabase
          .from('quick_booking_requests')
          .insert({
            customer_session_id: customerSessionId,
            pickup,
            dropoff,
            pickup_date: pickupDate || new Date().toISOString().split('T')[0],
            pickup_time: pickupTime || '10:00',
            passengers: passengers || 1,
            vehicle_type: vehicleType || 'mercedes-vito',
            price: autoPrice,
            price_currency: autoPriceCurrency,
            return_price: returnPrice,
            has_return_trip: hasReturnTrip || false,
            return_date: returnDate || null,
            return_time: returnTime || null,
            status: 'price_sent',
            service_type: serviceType,
            customer_name: customerName || null,
            customer_phone: customerPhone || null,
            customer_email: customerEmail || null,
            baby_seat_count: babySeatCount || 0,
            luggage_count: luggageCount || null,
            language: language || 'EN',
          })
          .select()
          .single();
        
        if (!insertError && newBooking) {
          quickBookingId = newBooking.id;
          console.log("✅ Created quick booking with auto-price:", quickBookingId);
        } else {
          console.error("Failed to create quick booking:", insertError);
        }
      }
      
      // If auto-priced successfully, return early - no need to notify admin
      if (quickBookingId) {
        console.log("✅ Auto-pricing complete, skipping admin notification");
        return new Response(JSON.stringify({ 
          success: true, 
          autoPriced: true,
          price: autoPrice,
          priceCurrency: autoPriceCurrency,
          returnPrice,
          quickBookingId,
          message: "Auto-priced successfully"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ============================================
    // If NO auto-price found, notify admin as before
    // ============================================
    console.log("⚠️ No auto-price found, notifying admin...");

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    // Get admin emails
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found");
      return new Response(JSON.stringify({ success: false, error: "No admins found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin email addresses
    const adminEmails: string[] = [];
    for (const admin of adminRoles) {
      const { data: userData } = await supabase.auth.admin.getUserById(admin.user_id);
      if (userData?.user?.email) {
        adminEmails.push(userData.user.email);
      }
    }

    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(JSON.stringify({ success: false, error: "No admin emails" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vehicleNames: Record<string, string> = {
      'mercedes-vito': 'Mercedes Vito',
      'vip-mercedes': 'Mercedes Vito VIP',
      'maybach-minibus': 'Mercedes Maybach Minivan',
      'minibus': 'Mercedes Sprinter'
    };

    const isTurkish = language === 'TR';
    
    const subject = isTurkish 
      ? `🚨 Acil Fiyat Talebi - ${pickup} → ${dropoff}`
      : `🚨 Urgent Price Request - ${pickup} → ${dropoff}`;

    const adminPanelUrl = 'https://meettransfer.app/admin/quick-bookings';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .route-box { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .route-item { display: flex; align-items: center; margin: 10px 0; }
          .label { color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 16px; font-weight: 600; color: #1e293b; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .cta-button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 ${isTurkish ? 'Acil Fiyat Talebi' : 'Urgent Price Request'}</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>${isTurkish ? 'Dikkat!' : 'Attention!'}</strong> 
              ${isTurkish 
                ? 'Müşteri için bu güzergahta fiyat bulunamadı. Lütfen hemen fiyat girin.' 
                : 'No price found for this route. Please enter a price immediately.'}
            </div>
            
            <div class="route-box">
              <div class="route-item">
                <div>
                  <p class="label">📍 ${isTurkish ? 'Alış Noktası' : 'Pickup'}</p>
                  <p class="value">${pickup}</p>
                </div>
              </div>
              <div style="text-align: center; color: #64748b; margin: 10px 0;">↓</div>
              <div class="route-item">
                <div>
                  <p class="label">🏁 ${isTurkish ? 'Varış Noktası' : 'Dropoff'}</p>
                  <p class="value">${dropoff}</p>
                </div>
              </div>
            </div>
            
            <div class="info-grid">
              <div>
                <p class="label">👥 ${isTurkish ? 'Yolcu Sayısı' : 'Passengers'}</p>
                <p class="value">${passengers || 'Belirtilmedi'}</p>
              </div>
              <div>
                <p class="label">🚗 ${isTurkish ? 'Araç Tipi' : 'Vehicle Type'}</p>
                <p class="value">${vehicleNames[vehicleType] || vehicleType || 'Belirtilmedi'}</p>
              </div>
              ${pickupDate ? `
              <div>
                <p class="label">📅 ${isTurkish ? 'Tarih' : 'Date'}</p>
                <p class="value">${pickupDate}</p>
              </div>
              ` : ''}
              ${pickupTime ? `
              <div>
                <p class="label">🕐 ${isTurkish ? 'Saat' : 'Time'}</p>
                <p class="value">${pickupTime}</p>
              </div>
              ` : ''}
              ${customerName ? `
              <div>
                <p class="label">👤 ${isTurkish ? 'Müşteri' : 'Customer'}</p>
                <p class="value">${customerName}</p>
              </div>
              ` : ''}
              ${customerPhone ? `
              <div>
                <p class="label">📱 ${isTurkish ? 'Telefon' : 'Phone'}</p>
                <p class="value">${customerPhone}</p>
              </div>
              ` : ''}
            </div>
            
            <p style="color: #64748b; margin-top: 20px;">
              ${isTurkish 
                ? 'Müşteri şu anda bekliyor. Fiyatı girdikten sonra AI asistan otomatik olarak müşteriye bildirecek.' 
                : 'Customer is currently waiting. Once you enter the price, the AI assistant will automatically notify them.'}
            </p>
            
            <div style="text-align: center;">
              <a href="${adminPanelUrl}" class="cta-button">
                ${isTurkish ? 'Quick Bookings\'e Git' : 'Go to Quick Bookings'}
              </a>
            </div>
          </div>
          <div class="footer">
            <p>Meet Transfer - VIP Transfer Service</p>
            <p style="color: #94a3b8; font-size: 11px;">Session ID: ${customerSessionId || 'N/A'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Meet Transfer <noreply@mail.meettransfer.app>',
        to: adminEmails,
        subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent:", emailResult);

    // Create notification in database
    for (const admin of adminRoles) {
      await supabase.from('notifications').insert({
        user_id: admin.user_id,
        title: isTurkish ? 'Acil Fiyat Talebi' : 'Urgent Price Request',
        message: isTurkish 
          ? `${pickup} → ${dropoff} güzergahı için fiyat girilmesi gerekiyor.`
          : `Price needed for route: ${pickup} → ${dropoff}`,
        type: 'price_request',
      });
    }

    // Send push notification to admins
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          userIds: adminRoles.map(a => a.user_id),
          title: isTurkish ? '🚨 Acil Fiyat Talebi' : '🚨 Urgent Price Request',
          body: `${pickup} → ${dropoff}`,
          url: adminPanelUrl,
          tag: 'price-request',
        }
      });
      console.log("Push notifications sent to admins");
    } catch (pushErr) {
      console.error("Failed to send push notifications:", pushErr);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      autoPriced: false,
      emailsSent: adminEmails.length,
      notificationsCreated: adminRoles.length,
      quickBookingId: null,
      message: "Admin notified - manual pricing required"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in notify-admin-price-request:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
