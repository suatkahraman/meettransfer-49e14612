import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getEmailHeader, getEmailFooter, getTranslation } from "../_shared/emailTemplates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VehiclePrice {
  vehicleType: string;
  price: number | null;
  currency: string;
}

interface SendVehiclePricesRequest {
  customerEmail: string;
  pickup: string;
  dropoff: string;
  pickupDate: string;
  pickupTime: string;
  passengers: number;
  vehiclePrices: VehiclePrice[];
  selectedVehicle: string;
  selectedPrice: number;
  language?: string;
}

// Multi-language vehicle labels
const vehicleLabelsI18n: Record<string, Record<string, { name: string; description: string; icon: string }>> = {
  en: {
    "mercedes-vito": { 
      name: "Mercedes Vito", 
      description: "Comfortable minivan for up to 6 passengers",
      icon: "🚐"
    },
    "vip-mercedes": { 
      name: "VIP Mercedes V-Class", 
      description: "Luxury VIP transfer with premium amenities",
      icon: "✨"
    },
    "maybach": { 
      name: "Mercedes Maybach Minivan", 
      description: "Ultra-luxury experience with Maybach comfort",
      icon: "👑"
    },
    "minibus": { 
      name: "Mercedes Sprinter Minibus", 
      description: "Spacious minibus for groups up to 12 passengers",
      icon: "🚌"
    },
  },
  tr: {
    "mercedes-vito": { 
      name: "Mercedes Vito", 
      description: "6 yolcuya kadar konforlu minivan",
      icon: "🚐"
    },
    "vip-mercedes": { 
      name: "VIP Mercedes V-Class", 
      description: "Premium olanaklarla lüks VIP transfer",
      icon: "✨"
    },
    "maybach": { 
      name: "Mercedes Maybach Minivan", 
      description: "Maybach konforu ile ultra lüks deneyim",
      icon: "👑"
    },
    "minibus": { 
      name: "Mercedes Sprinter Minibüs", 
      description: "12 kişiye kadar gruplar için ferah minibüs",
      icon: "🚌"
    },
  },
  de: {
    "mercedes-vito": { 
      name: "Mercedes Vito", 
      description: "Komfortabler Minivan für bis zu 6 Passagiere",
      icon: "🚐"
    },
    "vip-mercedes": { 
      name: "VIP Mercedes V-Klasse", 
      description: "Luxuriöser VIP-Transfer mit Premium-Ausstattung",
      icon: "✨"
    },
    "maybach": { 
      name: "Mercedes Maybach Minivan", 
      description: "Ultra-Luxus-Erlebnis mit Maybach-Komfort",
      icon: "👑"
    },
    "minibus": { 
      name: "Mercedes Sprinter Minibus", 
      description: "Geräumiger Minibus für Gruppen bis 12 Personen",
      icon: "🚌"
    },
  },
  ru: {
    "mercedes-vito": { 
      name: "Mercedes Vito", 
      description: "Комфортабельный минивэн до 6 пассажиров",
      icon: "🚐"
    },
    "vip-mercedes": { 
      name: "VIP Mercedes V-Class", 
      description: "Люксовый VIP трансфер с премиум удобствами",
      icon: "✨"
    },
    "maybach": { 
      name: "Mercedes Maybach Minivan", 
      description: "Ультра-люкс с комфортом Maybach",
      icon: "👑"
    },
    "minibus": { 
      name: "Mercedes Sprinter Minibus", 
      description: "Просторный минибус для групп до 12 человек",
      icon: "🚌"
    },
  },
  ar: {
    "mercedes-vito": { 
      name: "مرسيدس فيتو", 
      description: "ميني فان مريحة لـ 6 ركاب",
      icon: "🚐"
    },
    "vip-mercedes": { 
      name: "مرسيدس V-Class VIP", 
      description: "نقل VIP فاخر مع وسائل راحة متميزة",
      icon: "✨"
    },
    "maybach": { 
      name: "مرسيدس مايباخ ميني فان", 
      description: "تجربة فائقة الفخامة مع راحة مايباخ",
      icon: "👑"
    },
    "minibus": { 
      name: "ميني باص مرسيدس سبرينتر", 
      description: "ميني باص واسع للمجموعات حتى 12 راكب",
      icon: "🚌"
    },
  },
};

// Email-specific translations
const emailTexts: Record<string, {
  yourPriceQuote: string;
  selectedVehicle: string;
  transferDetails: string;
  from: string;
  to: string;
  date: string;
  time: string;
  passengers: string;
  allVehicles: string;
  selected: string;
  completeBooking: string;
  flightTracking: string;
  freeWait: string;
  proDrivers: string;
  payAtArrival: string;
  freeCancellation: string;
  roundTripDiscount: string;
  bookReturn: string;
  offReturn: string;
  useCode: string;
  needHelp: string;
  subject: string;
}> = {
  en: {
    yourPriceQuote: "Your Price Quote",
    selectedVehicle: "Selected Vehicle",
    transferDetails: "Transfer Details",
    from: "From",
    to: "To",
    date: "Date",
    time: "Time",
    passengers: "Passengers",
    allVehicles: "All Available Vehicles",
    selected: "SELECTED",
    completeBooking: "Complete Your Booking",
    flightTracking: "Flight Tracking",
    freeWait: "60 Min Free Wait",
    proDrivers: "Pro Drivers",
    payAtArrival: "Pay at Arrival",
    freeCancellation: "Free Cancellation 24h Before",
    roundTripDiscount: "Round-Trip Discount!",
    bookReturn: "Book a return transfer and get",
    offReturn: "OFF",
    useCode: "with code",
    needHelp: "Need help? Contact us via WhatsApp or email",
    subject: "Your Transfer Quote",
  },
  tr: {
    yourPriceQuote: "Fiyat Teklifiniz",
    selectedVehicle: "Seçilen Araç",
    transferDetails: "Transfer Detayları",
    from: "Alış",
    to: "Bırakış",
    date: "Tarih",
    time: "Saat",
    passengers: "Yolcular",
    allVehicles: "Tüm Mevcut Araçlar",
    selected: "SEÇİLDİ",
    completeBooking: "Rezervasyonu Tamamla",
    flightTracking: "Uçuş Takibi",
    freeWait: "60 Dk Ücretsiz Bekleme",
    proDrivers: "Profesyonel Sürücüler",
    payAtArrival: "Varışta Ödeme",
    freeCancellation: "24 Saat Önce Ücretsiz İptal",
    roundTripDiscount: "Gidiş-Dönüş İndirimi!",
    bookReturn: "Dönüş transferi rezerve edin ve",
    offReturn: "indirim kazanın",
    useCode: "kod ile",
    needHelp: "Yardıma mı ihtiyacınız var? WhatsApp veya email ile bize ulaşın",
    subject: "Transfer Fiyat Teklifiniz",
  },
  de: {
    yourPriceQuote: "Ihr Preisangebot",
    selectedVehicle: "Ausgewähltes Fahrzeug",
    transferDetails: "Transferdetails",
    from: "Von",
    to: "Nach",
    date: "Datum",
    time: "Uhrzeit",
    passengers: "Passagiere",
    allVehicles: "Alle verfügbaren Fahrzeuge",
    selected: "AUSGEWÄHLT",
    completeBooking: "Buchung abschließen",
    flightTracking: "Flugverfolgung",
    freeWait: "60 Min Gratis Wartezeit",
    proDrivers: "Profi-Fahrer",
    payAtArrival: "Zahlung bei Ankunft",
    freeCancellation: "Kostenlose Stornierung 24h vorher",
    roundTripDiscount: "Hin- und Rückfahrt Rabatt!",
    bookReturn: "Buchen Sie eine Rückfahrt und erhalten Sie",
    offReturn: "Rabatt",
    useCode: "mit Code",
    needHelp: "Brauchen Sie Hilfe? Kontaktieren Sie uns per WhatsApp oder E-Mail",
    subject: "Ihr Transferangebot",
  },
  ru: {
    yourPriceQuote: "Ваше ценовое предложение",
    selectedVehicle: "Выбранный транспорт",
    transferDetails: "Детали трансфера",
    from: "Откуда",
    to: "Куда",
    date: "Дата",
    time: "Время",
    passengers: "Пассажиры",
    allVehicles: "Все доступные автомобили",
    selected: "ВЫБРАНО",
    completeBooking: "Завершить бронирование",
    flightTracking: "Отслеживание рейса",
    freeWait: "60 мин бесплатного ожидания",
    proDrivers: "Профи-водители",
    payAtArrival: "Оплата по прибытии",
    freeCancellation: "Бесплатная отмена за 24ч",
    roundTripDiscount: "Скидка на туда-обратно!",
    bookReturn: "Забронируйте обратный трансфер и получите",
    offReturn: "скидку",
    useCode: "с кодом",
    needHelp: "Нужна помощь? Свяжитесь с нами через WhatsApp или email",
    subject: "Ваше предложение по трансферу",
  },
  ar: {
    yourPriceQuote: "عرض السعر الخاص بك",
    selectedVehicle: "المركبة المختارة",
    transferDetails: "تفاصيل النقل",
    from: "من",
    to: "إلى",
    date: "التاريخ",
    time: "الوقت",
    passengers: "الركاب",
    allVehicles: "جميع المركبات المتاحة",
    selected: "مختار",
    completeBooking: "أكمل حجزك",
    flightTracking: "تتبع الرحلة",
    freeWait: "60 دقيقة انتظار مجاني",
    proDrivers: "سائقون محترفون",
    payAtArrival: "الدفع عند الوصول",
    freeCancellation: "إلغاء مجاني قبل 24 ساعة",
    roundTripDiscount: "خصم ذهاب وعودة!",
    bookReturn: "احجز رحلة العودة واحصل على",
    offReturn: "خصم",
    useCode: "باستخدام الرمز",
    needHelp: "هل تحتاج مساعدة؟ تواصل معنا عبر واتساب أو البريد الإلكتروني",
    subject: "عرض النقل الخاص بك",
  },
};

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    TRY: "₺",
    AED: "د.إ",
    AUD: "A$",
  };
  return symbols[currency] || currency;
};

const getLocale = (lang: string): string => {
  const locales: Record<string, string> = {
    en: 'en-GB',
    tr: 'tr-TR',
    de: 'de-DE',
    ru: 'ru-RU',
    ar: 'ar-SA',
  };
  return locales[lang] || 'en-GB';
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client to fetch active promo code
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const resend = new Resend(resendApiKey);
    const requestData: SendVehiclePricesRequest = await req.json();

    console.log("Sending vehicle prices email to:", requestData.customerEmail, "Language:", requestData.language);

    const {
      customerEmail,
      pickup,
      dropoff,
      pickupDate,
      pickupTime,
      passengers,
      vehiclePrices,
      selectedVehicle,
      selectedPrice,
      language = 'en',
    } = requestData;

    // Get language code (first 2 chars)
    const lang = (language || 'en').substring(0, 2).toLowerCase();
    const t = emailTexts[lang] || emailTexts.en;
    const vehicleLabels = vehicleLabelsI18n[lang] || vehicleLabelsI18n.en;

    // Validate email
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format date based on language
    const formattedDate = new Date(pickupDate).toLocaleDateString(getLocale(lang), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Get currency from first price
    const currency = vehiclePrices[0]?.currency || "EUR";
    const currencySymbol = getCurrencySymbol(currency);

    // Build vehicle prices HTML
    const vehiclePricesHtml = vehiclePrices
      .filter(vp => vp.price !== null)
      .map(vp => {
        const vehicle = vehicleLabels[vp.vehicleType] || vehicleLabelsI18n.en[vp.vehicleType] || { 
          name: vp.vehicleType, 
          description: "", 
          icon: "🚗" 
        };
        const isSelected = vp.vehicleType === selectedVehicle;
        
        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 16px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 24px;">${vehicle.icon}</span>
                <div>
                  <p style="margin: 0; font-weight: 600; color: #1a365d; font-size: 16px;">
                    ${vehicle.name}
                    ${isSelected ? `<span style="background: #48bb78; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px;">${t.selected}</span>` : ''}
                  </p>
                  <p style="margin: 4px 0 0; color: #666; font-size: 13px;">${vehicle.description}</p>
                </div>
              </div>
            </td>
            <td style="padding: 16px; text-align: right; font-size: 18px; font-weight: bold; color: ${isSelected ? '#48bb78' : '#1a365d'};">
              ${currencySymbol}${vp.price}
            </td>
          </tr>
        `;
      })
      .join("");

    const selectedVehicleInfo = vehicleLabels[selectedVehicle] || vehicleLabelsI18n.en[selectedVehicle] || { name: selectedVehicle, icon: "🚗" };

    const emailHtml = `
${getEmailHeader(`💰 ${t.yourPriceQuote}`, undefined, lang)}
<tr>
  <td style="padding: 30px 20px;">
    <!-- Price Quote Badge -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <p style="color: #ffffff; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">${t.yourPriceQuote}</p>
          <p style="color: #ffffff; margin: 8px 0 0; font-size: 32px; font-weight: 700;">${currencySymbol}${selectedPrice}</p>
          <p style="color: #c6f6d5; margin: 8px 0 0; font-size: 14px;">${selectedVehicleInfo.icon} ${selectedVehicleInfo.name}</p>
        </td>
      </tr>
    </table>

    <!-- Trip Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 16px; color: #1a365d; font-weight: 600; font-size: 16px;">📍 ${t.transferDetails}</p>
          
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 8px 0;">
                <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase;">${t.from}</p>
                <p style="margin: 4px 0 0; color: #2d3748; font-size: 14px; font-weight: 500;">${pickup}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase;">${t.to}</p>
                <p style="margin: 4px 0 0; color: #2d3748; font-size: 14px; font-weight: 500;">${dropoff}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%">
                      <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase;">${t.date}</p>
                      <p style="margin: 4px 0 0; color: #2d3748; font-size: 14px; font-weight: 500;">${formattedDate}</p>
                    </td>
                    <td width="25%">
                      <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase;">${t.time}</p>
                      <p style="margin: 4px 0 0; color: #2d3748; font-size: 14px; font-weight: 500;">${pickupTime}</p>
                    </td>
                    <td width="25%">
                      <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase;">${t.passengers}</p>
                      <p style="margin: 4px 0 0; color: #2d3748; font-size: 14px; font-weight: 500;">${passengers} 👤</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- All Vehicle Options -->
    <p style="margin: 0 0 16px; color: #1a365d; font-weight: 600; font-size: 16px;">🚗 ${t.allVehicles}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      ${vehiclePricesHtml}
    </table>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
      <tr>
        <td style="text-align: center;">
          <a href="https://meet-transfer.com" style="display: inline-block; background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            ${t.completeBooking}
          </a>
        </td>
      </tr>
    </table>

    <!-- Features -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; background-color: #f0fff4; border-radius: 8px;">
      <tr>
        <td style="padding: 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="20%" style="text-align: center; padding: 8px;">
                <p style="margin: 0; font-size: 20px;">✈️</p>
                <p style="margin: 4px 0 0; color: #2d3748; font-size: 11px;">${t.flightTracking}</p>
              </td>
              <td width="20%" style="text-align: center; padding: 8px;">
                <p style="margin: 0; font-size: 20px;">⏰</p>
                <p style="margin: 4px 0 0; color: #2d3748; font-size: 11px;">${t.freeWait}</p>
              </td>
              <td width="20%" style="text-align: center; padding: 8px;">
                <p style="margin: 0; font-size: 20px;">👨‍✈️</p>
                <p style="margin: 4px 0 0; color: #2d3748; font-size: 11px;">${t.proDrivers}</p>
              </td>
              <td width="20%" style="text-align: center; padding: 8px;">
                <p style="margin: 0; font-size: 20px;">💳</p>
                <p style="margin: 4px 0 0; color: #2d3748; font-size: 11px;">${t.payAtArrival}</p>
              </td>
              <td width="20%" style="text-align: center; padding: 8px;">
                <p style="margin: 0; font-size: 20px;">✅</p>
                <p style="margin: 4px 0 0; color: #2d3748; font-size: 11px;">${t.freeCancellation}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

  </td>
</tr>
${getEmailFooter(lang)}
    `.trim();

    const plainText = `
${t.yourPriceQuote} - Meet Transfer

${t.selectedVehicle}: ${selectedVehicleInfo.name}
${t.yourPriceQuote}: ${currencySymbol}${selectedPrice}

${t.transferDetails}:
${t.from}: ${pickup}
${t.to}: ${dropoff}
${t.date}: ${formattedDate}
${t.time}: ${pickupTime}
${t.passengers}: ${passengers}

${t.allVehicles}:
${vehiclePrices
  .filter(vp => vp.price !== null)
  .map(vp => {
    const vehicle = vehicleLabels[vp.vehicleType] || vehicleLabelsI18n.en[vp.vehicleType] || { name: vp.vehicleType };
    return `- ${vehicle.name}: ${currencySymbol}${vp.price}`;
  })
  .join("\n")}

${t.completeBooking}: https://meet-transfer.com

${t.needHelp}:
📧 info@meettransfer.app
📱 WhatsApp: +1 (555) 805-1101
📞 Emergency: +90 532 174 83 90
    `.trim();

    const { error: emailError } = await resend.emails.send({
      from: "Meet Transfer <noreply@mail.meettransfer.app>",
      to: [customerEmail],
      reply_to: "info@meettransfer.app",
      subject: `${t.subject}: ${pickup} → ${dropoff}`,
      text: plainText,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      throw new Error(emailError.message || "Failed to send email");
    }

    console.log("Vehicle prices email sent successfully to:", customerEmail, "in language:", lang);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-vehicle-prices-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});