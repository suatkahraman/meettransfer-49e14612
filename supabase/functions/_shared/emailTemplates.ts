// Shared email templates for edge functions
import { getVehicleLabel } from "./vehicleConfig.ts";
import { getCurrencySymbol, formatPrice } from "./currencyUtils.ts";

// Supported languages
export type SupportedLanguage = 'en' | 'tr' | 'de' | 'ru' | 'ar';

// Company branding constants
const LOGO_URL = "https://meettransfer.app/images/meet-transfer-logo.png";
const COMPANY_NAME = "Meet Transfer";
const COMPANY_EMAIL = "info@meettransfer.app";
const WHATSAPP_NUMBER = "+15558051101";
const WHATSAPP_URL = "https://wa.me/15558051101";
const WEBSITE_URL = "https://meettransfer.app";

// Social media links
const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/meettransfer",
  facebook: "https://www.facebook.com/share/17w6b51DcX/",
  twitter: "https://x.com/MeetTransfer",
  youtube: "https://www.youtube.com/@meettransfer",
  tripadvisor: "https://www.tripadvisor.com/Attraction_Review-g293974-d9884368-Reviews-Meet_Transfer-Istanbul.html",
};

// Service regions
const SERVICE_REGIONS = [
  { name: "Istanbul", flag: "🏛️" },
  { name: "Antalya", flag: "🏖️" },
  { name: "Bodrum", flag: "⛵" },
  { name: "Dalaman", flag: "🌴" },
  { name: "İzmir", flag: "🌊" },
  { name: "Cappadocia", flag: "🎈" },
  { name: "Bursa", flag: "🏔️" },
  { name: "Dubai", flag: "🏙️" },
  { name: "Cyprus", flag: "🌺" },
];

// Multi-language translations
const TRANSLATIONS: Record<SupportedLanguage, {
  serviceTitle: string;
  needHelp: string;
  whatsappChat: string;
  reviewsOn: string;
  allRightsReserved: string;
  // Customer email specific
  quoteReady: string;
  thankYouBooking: string;
  transferDetails: string;
  from: string;
  to: string;
  date: string;
  time: string;
  vehicle: string;
  returnTransfer: string;
  yourPrice: string;
  outboundTransfer: string;
  totalPrice: string;
  whatsIncluded: string;
  professionalDriver: string;
  flightTracking: string;
  freeWaiting: string;
  meetGreet: string;
  support247: string;
  freeCancellation: string;
  confirmBook: string;
  quoteValid: string;
  samePrice: string;
  off: string;
}> = {
  en: {
    serviceTitle: "We Serve All Major Destinations",
    needHelp: "Need Help? Contact Us 24/7",
    whatsappChat: "WhatsApp Chat",
    reviewsOn: "reviews on TripAdvisor",
    allRightsReserved: "All rights reserved.",
    quoteReady: "Your Transfer Quote is Ready!",
    thankYouBooking: "Thank you for your booking request",
    transferDetails: "Transfer Details",
    from: "From",
    to: "To",
    date: "Date",
    time: "Time",
    vehicle: "Vehicle",
    returnTransfer: "Return Transfer",
    yourPrice: "Your Transfer Price",
    outboundTransfer: "Outbound Transfer",
    totalPrice: "Total Price",
    whatsIncluded: "What's Included",
    professionalDriver: "Professional English-speaking driver",
    flightTracking: "Real-time flight tracking",
    freeWaiting: "60 min free waiting at airport",
    meetGreet: "Meet & greet with name sign",
    support247: "24/7 customer support",
    freeCancellation: "Free cancellation up to 24h before",
    confirmBook: "Confirm & Book Now",
    quoteValid: "This quote is valid for 24 hours",
    samePrice: "Airport transfers are the same price in both directions",
    off: "OFF",
  },
  tr: {
    serviceTitle: "Tüm Önemli Destinasyonlara Hizmet Veriyoruz",
    needHelp: "Yardıma mı İhtiyacınız Var? 7/24 Bize Ulaşın",
    whatsappChat: "WhatsApp Sohbet",
    reviewsOn: "TripAdvisor değerlendirmesi",
    allRightsReserved: "Tüm hakları saklıdır.",
    quoteReady: "Transfer Fiyatınız Hazır!",
    thankYouBooking: "Rezervasyon talebiniz için teşekkür ederiz",
    transferDetails: "Transfer Detayları",
    from: "Alış",
    to: "Bırakış",
    date: "Tarih",
    time: "Saat",
    vehicle: "Araç",
    returnTransfer: "Dönüş Transferi",
    yourPrice: "Transfer Fiyatınız",
    outboundTransfer: "Gidiş Transferi",
    totalPrice: "Toplam Fiyat",
    whatsIncluded: "Dahil Olanlar",
    professionalDriver: "Profesyonel İngilizce konuşan sürücü",
    flightTracking: "Gerçek zamanlı uçuş takibi",
    freeWaiting: "Havalimanında 60 dk ücretsiz bekleme",
    meetGreet: "İsim tabelası ile karşılama",
    support247: "7/24 müşteri desteği",
    freeCancellation: "24 saat öncesine kadar ücretsiz iptal",
    confirmBook: "Onayla ve Rezervasyon Yap",
    quoteValid: "Bu fiyat teklifi 24 saat geçerlidir",
    samePrice: "Havalimanı transferleri her iki yönde aynı fiyattır",
    off: "İNDİRİM",
  },
  de: {
    serviceTitle: "Wir bedienen alle wichtigen Reiseziele",
    needHelp: "Brauchen Sie Hilfe? Kontaktieren Sie uns 24/7",
    whatsappChat: "WhatsApp Chat",
    reviewsOn: "Bewertungen auf TripAdvisor",
    allRightsReserved: "Alle Rechte vorbehalten.",
    quoteReady: "Ihr Transferangebot ist fertig!",
    thankYouBooking: "Vielen Dank für Ihre Buchungsanfrage",
    transferDetails: "Transferdetails",
    from: "Von",
    to: "Nach",
    date: "Datum",
    time: "Uhrzeit",
    vehicle: "Fahrzeug",
    returnTransfer: "Rücktransfer",
    yourPrice: "Ihr Transferpreis",
    outboundTransfer: "Hintransfer",
    totalPrice: "Gesamtpreis",
    whatsIncluded: "Inklusive",
    professionalDriver: "Professioneller englischsprachiger Fahrer",
    flightTracking: "Echtzeit-Flugverfolgung",
    freeWaiting: "60 Min. kostenlose Wartezeit am Flughafen",
    meetGreet: "Begrüßung mit Namensschild",
    support247: "24/7 Kundenservice",
    freeCancellation: "Kostenlose Stornierung bis 24h vorher",
    confirmBook: "Bestätigen & Jetzt Buchen",
    quoteValid: "Dieses Angebot ist 24 Stunden gültig",
    samePrice: "Flughafentransfers kosten in beide Richtungen gleich",
    off: "RABATT",
  },
  ru: {
    serviceTitle: "Мы обслуживаем все основные направления",
    needHelp: "Нужна помощь? Свяжитесь с нами 24/7",
    whatsappChat: "WhatsApp Чат",
    reviewsOn: "отзывов на TripAdvisor",
    allRightsReserved: "Все права защищены.",
    quoteReady: "Ваше предложение по трансферу готово!",
    thankYouBooking: "Спасибо за ваш запрос на бронирование",
    transferDetails: "Детали трансфера",
    from: "Откуда",
    to: "Куда",
    date: "Дата",
    time: "Время",
    vehicle: "Транспорт",
    returnTransfer: "Обратный трансфер",
    yourPrice: "Цена трансфера",
    outboundTransfer: "Трансфер туда",
    totalPrice: "Общая цена",
    whatsIncluded: "Что включено",
    professionalDriver: "Профессиональный англоговорящий водитель",
    flightTracking: "Отслеживание рейса в реальном времени",
    freeWaiting: "60 мин бесплатного ожидания в аэропорту",
    meetGreet: "Встреча с табличкой с именем",
    support247: "Поддержка 24/7",
    freeCancellation: "Бесплатная отмена за 24 часа",
    confirmBook: "Подтвердить и забронировать",
    quoteValid: "Это предложение действительно 24 часа",
    samePrice: "Трансферы из аэропорта стоят одинаково в обе стороны",
    off: "СКИДКА",
  },
  ar: {
    serviceTitle: "نخدم جميع الوجهات الرئيسية",
    needHelp: "هل تحتاج مساعدة؟ تواصل معنا 24/7",
    whatsappChat: "محادثة واتساب",
    reviewsOn: "تقييم على TripAdvisor",
    allRightsReserved: "جميع الحقوق محفوظة.",
    quoteReady: "عرض النقل الخاص بك جاهز!",
    thankYouBooking: "شكراً لطلب الحجز الخاص بك",
    transferDetails: "تفاصيل النقل",
    from: "من",
    to: "إلى",
    date: "التاريخ",
    time: "الوقت",
    vehicle: "المركبة",
    returnTransfer: "رحلة العودة",
    yourPrice: "سعر النقل",
    outboundTransfer: "رحلة الذهاب",
    totalPrice: "السعر الإجمالي",
    whatsIncluded: "ما هو مشمول",
    professionalDriver: "سائق محترف يتحدث الإنجليزية",
    flightTracking: "تتبع الرحلات في الوقت الحقيقي",
    freeWaiting: "60 دقيقة انتظار مجاني في المطار",
    meetGreet: "استقبال بلوحة الاسم",
    support247: "دعم العملاء 24/7",
    freeCancellation: "إلغاء مجاني حتى 24 ساعة قبل",
    confirmBook: "تأكيد والحجز الآن",
    quoteValid: "هذا العرض صالح لمدة 24 ساعة",
    samePrice: "تكلفة النقل من المطار متساوية في كلا الاتجاهين",
    off: "خصم",
  },
};

// Get translation helper
export function getTranslation(lang: string): typeof TRANSLATIONS.en {
  const supportedLang = (lang || 'en').substring(0, 2).toLowerCase() as SupportedLanguage;
  return TRANSLATIONS[supportedLang] || TRANSLATIONS.en;
}

// Professional email header with logo
export function getEmailHeader(title: string, subtitle?: string, lang: string = 'en'): string {
  return `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Meet Transfer</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Logo Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px 20px; text-align: center;">
            <img src="${LOGO_URL}" alt="Meet Transfer" style="max-width: 180px; height: auto; margin-bottom: 15px;" />
            <h1 style="color: #fdd835; margin: 0; font-size: 22px; font-weight: bold;">${title}</h1>
            ${subtitle ? `<p style="color: #94a3b8; margin: 10px 0 0; font-size: 14px;">${subtitle}</p>` : ''}
          </td>
        </tr>
  `;
}

// Professional email footer with contact info, social media, and service regions
export function getEmailFooter(lang: string = 'en'): string {
  const t = getTranslation(lang);
  const serviceRegionsHtml = SERVICE_REGIONS.map(r => 
    `<span style="display: inline-block; margin: 3px 6px; font-size: 12px; color: #64748b;">${r.flag} ${r.name}</span>`
  ).join('');

  return `
        <!-- Service Regions -->
        <tr>
          <td style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px; color: #1e293b; font-size: 13px; font-weight: bold;">✈️ ${t.serviceTitle}</p>
            <div style="line-height: 2;">
              ${serviceRegionsHtml}
            </div>
          </td>
        </tr>

        <!-- Contact Section -->
        <tr>
          <td style="background: #1a1a2e; padding: 25px 20px; text-align: center;">
            <p style="margin: 0 0 15px; color: #fdd835; font-size: 15px; font-weight: bold;">${t.needHelp}</p>
            <div style="margin-bottom: 15px;">
              <a href="${WHATSAPP_URL}" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; margin: 5px;">💬 ${t.whatsappChat}</a>
              <a href="mailto:${COMPANY_EMAIL}" style="display: inline-block; background: #fdd835; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; margin: 5px;">✉️ ${COMPANY_EMAIL}</a>
            </div>
            
            <!-- Social Media Icons -->
            <div style="margin: 20px 0;">
              <a href="${SOCIAL_LINKS.instagram}" style="display: inline-block; width: 38px; height: 38px; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); border-radius: 8px; text-align: center; line-height: 38px; text-decoration: none; color: white; font-size: 18px; margin: 0 4px;" title="Instagram">📷</a>
              <a href="${SOCIAL_LINKS.facebook}" style="display: inline-block; width: 38px; height: 38px; background: #1877f2; border-radius: 8px; text-align: center; line-height: 38px; text-decoration: none; color: white; font-size: 18px; margin: 0 4px;" title="Facebook">📘</a>
              <a href="${SOCIAL_LINKS.twitter}" style="display: inline-block; width: 38px; height: 38px; background: #000; border-radius: 8px; text-align: center; line-height: 38px; text-decoration: none; color: white; font-size: 18px; margin: 0 4px;" title="X (Twitter)">𝕏</a>
              <a href="${SOCIAL_LINKS.youtube}" style="display: inline-block; width: 38px; height: 38px; background: #ff0000; border-radius: 8px; text-align: center; line-height: 38px; text-decoration: none; color: white; font-size: 18px; margin: 0 4px;" title="YouTube">▶️</a>
              <a href="${SOCIAL_LINKS.tripadvisor}" style="display: inline-block; width: 38px; height: 38px; background: #00af87; border-radius: 8px; text-align: center; line-height: 38px; text-decoration: none; color: white; font-size: 18px; margin: 0 4px;" title="TripAdvisor">🦉</a>
            </div>

            <!-- TripAdvisor Rating -->
            <div style="background: rgba(255,255,255,0.1); padding: 12px 20px; border-radius: 8px; display: inline-block; margin-top: 10px;">
              <span style="color: #00af87; font-weight: bold; font-size: 16px;">⭐ 4.7</span>
              <span style="color: #94a3b8; font-size: 13px; margin-left: 8px;">492 ${t.reviewsOn}</span>
            </div>
          </td>
        </tr>

        <!-- Copyright -->
        <tr>
          <td style="background: #0f0f1a; padding: 15px 20px; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 11px;">
              © 2025 ${COMPANY_NAME}. ${t.allRightsReserved}<br/>
              <a href="${WEBSITE_URL}" style="color: #fdd835; text-decoration: none;">meettransfer.app</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Customer email template wrapper
export function customerEmailTemplate(
  title: string,
  subtitle: string | undefined,
  bodyContent: string,
  lang: string = 'en'
): string {
  return `
    ${getEmailHeader(title, subtitle, lang)}
    <tr>
      <td style="padding: 30px 25px;">
        ${bodyContent}
      </td>
    </tr>
    ${getEmailFooter(lang)}
  `;
}

// Generate customer price quote email with language support
export function generateCustomerPriceQuoteEmail(
  booking: {
    pickup: string;
    dropoff: string;
    pickup_date: string;
    pickup_time: string;
    vehicle_type: string;
    has_return_trip?: boolean;
    return_date?: string;
    return_time?: string;
  },
  priceInfo: {
    price: number;
    returnPrice?: number | null;
    totalPrice?: number;
    currency: string;
    discountApplied?: boolean;
    discountPercent?: number;
  },
  confirmUrl: string,
  lang: string = 'en'
): string {
  const t = getTranslation(lang);
  
  const currencySymbols: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'TRY': '₺',
    'GBP': '£',
    'AED': 'د.إ',
  };
  const currencySymbol = currencySymbols[priceInfo.currency] || priceInfo.currency;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const locales: Record<SupportedLanguage, string> = {
      en: 'en-GB',
      tr: 'tr-TR',
      de: 'de-DE',
      ru: 'ru-RU',
      ar: 'ar-SA',
    };
    const locale = locales[(lang?.substring(0, 2) as SupportedLanguage) || 'en'] || 'en-GB';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const vehicleNames: Record<string, string> = {
    'mercedes-vito': 'Mercedes Vito VIP',
    'mercedes-sprinter': 'Mercedes Sprinter VIP',
    'mercedes-maybach': 'Mercedes Maybach',
  };

  let priceHtml = `<p style="font-size: 28px; color: white; font-weight: bold; margin: 10px 0;">${currencySymbol}${priceInfo.price}</p>`;
  
  if (booking.has_return_trip && priceInfo.returnPrice) {
    priceHtml += `
      <p style="margin-top: 15px; color: rgba(255,255,255,0.9); font-size: 13px;">${t.returnTransfer} (${formatDate(booking.return_date || '')} - ${booking.return_time}):</p>
      ${priceInfo.discountApplied 
        ? `<p style="font-size: 20px; color: #a7f3d0; font-weight: bold;"><span style="text-decoration: line-through; color: rgba(255,255,255,0.5);">${currencySymbol}${priceInfo.price}</span> ${currencySymbol}${priceInfo.returnPrice} <span style="font-size: 12px; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">${priceInfo.discountPercent}% ${t.off}</span></p>`
        : `<p style="font-size: 20px; color: white; font-weight: bold;">${currencySymbol}${priceInfo.returnPrice}</p>`
      }
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3);">
        <p style="color: rgba(255,255,255,0.9); font-size: 13px;">${t.totalPrice}:</p>
        <p style="font-size: 28px; color: white; font-weight: bold;">${currencySymbol}${priceInfo.totalPrice}</p>
      </div>
    `;
  }

  return `
${getEmailHeader(`🚗 ${t.quoteReady}`, t.thankYouBooking, lang)}
<tr>
  <td style="padding:30px 25px;">
    <!-- Transfer Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:20px;border:1px solid #e2e8f0;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 15px;color:#1e293b;font-weight:bold;font-size:15px;">📍 ${t.transferDetails}</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;width:100px;">${t.from}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${booking.pickup}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.to}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${booking.dropoff}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.date}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${formatDate(booking.pickup_date)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.time}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${booking.pickup_time}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.vehicle}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">🚐 ${vehicleNames[booking.vehicle_type] || booking.vehicle_type}</td>
          </tr>
        </table>
      </td></tr>
    </table>
    
    <!-- Price Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);border-radius:12px;margin:25px 0;">
      <tr>
        <td style="padding:25px;text-align:center;">
          <p style="color:rgba(255,255,255,0.9);margin:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">${booking.has_return_trip ? t.outboundTransfer : t.yourPrice}</p>
          ${priceHtml}
        </td>
      </tr>
    </table>

    <!-- What's Included -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:12px;margin:20px 0;border:1px solid #bfdbfe;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 12px;color:#1e40af;font-weight:bold;font-size:14px;">✨ ${t.whatsIncluded}</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:4px 0;color:#1e3a8a;font-size:13px;">✓ ${t.professionalDriver}</td></tr>
          <tr><td style="padding:4px 0;color:#1e3a8a;font-size:13px;">✓ ${t.flightTracking}</td></tr>
          <tr><td style="padding:4px 0;color:#1e3a8a;font-size:13px;">✓ ${t.freeWaiting}</td></tr>
          <tr><td style="padding:4px 0;color:#1e3a8a;font-size:13px;">✓ ${t.meetGreet}</td></tr>
          <tr><td style="padding:4px 0;color:#1e3a8a;font-size:13px;">✓ ${t.support247}</td></tr>
          <tr><td style="padding:4px 0;color:#1e3a8a;font-size:13px;">✓ ${t.freeCancellation}</td></tr>
        </table>
      </td></tr>
    </table>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;padding:25px 0;">
          <a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);color:#1a1a2e;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:17px;font-weight:bold;box-shadow:0 4px 15px rgba(251,191,36,0.3);">${t.confirmBook}</a>
        </td>
      </tr>
    </table>

    <p style="text-align:center;color:#94a3b8;font-size:12px;margin:15px 0 0;">⏰ ${t.quoteValid}</p>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin:8px 0 0;">↔️ ${t.samePrice}</p>
  </td>
</tr>
${getEmailFooter(lang)}
  `;
}

interface BookingDetails {
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  vehicle_type: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  has_return_trip?: boolean;
  return_date?: string;
  return_time?: string;
}

interface TransferMatchInfo {
  airport?: string | null;
  city?: string | null;
  district?: string | null;
  direction: string;
  confidence: string;
  additionalReason?: string;
}

interface PriceInfo {
  price: number;
  currency: string;
  returnPrice?: number | null;
  totalPrice?: number;
  exchangeRate?: number;
  baseCurrency?: string;
  basePrice?: number;
  discountApplied?: boolean;
  discountPercent?: number;
}

// Admin notification for auto-priced booking
export function autoPriceSuccessEmail(
  booking: BookingDetails,
  matchInfo: TransferMatchInfo,
  priceInfo: PriceInfo,
  type: 'quick_booking' | 'reservation'
): string {
  const vehicleName = getVehicleLabel(booking.vehicle_type);
  const symbol = getCurrencySymbol(priceInfo.currency);
  const typeLabel = type === 'quick_booking' ? 'Quick Booking' : 'Rezervasyon';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🤖 ${typeLabel} Otomatik Fiyat</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #10b981;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Müşteri Bilgileri</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Müşteri:</strong> ${booking.customer_name || 'Henüz girilmedi'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${booking.customer_email || 'Henüz girilmedi'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Telefon:</strong> ${booking.customer_phone || 'Henüz girilmedi'}</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Transfer Detayları</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Alış:</strong> ${booking.pickup}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Bırakış:</strong> ${booking.dropoff}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Tarih:</strong> ${booking.pickup_date}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Saat:</strong> ${booking.pickup_time}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Araç:</strong> ${vehicleName}</p>
          ${booking.has_return_trip ? `<p style="margin: 5px 0; color: #666;"><strong>Dönüş:</strong> ${booking.return_date} - ${booking.return_time}</p>` : ''}
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Eşleştirme Bilgisi</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Şehir:</strong> ${matchInfo.city || 'N/A'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>İlçe:</strong> ${matchInfo.district || 'N/A'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Havalimanı:</strong> ${matchInfo.airport || 'N/A'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Yön:</strong> ${matchInfo.direction} (${matchInfo.confidence})</p>
        </div>
        
        <div style="text-align: center; margin: 20px 0; padding: 20px; background: #10b981; border-radius: 8px;">
          ${priceInfo.exchangeRate && priceInfo.exchangeRate !== 1 ? `<p style="font-size: 12px; color: #d1fae5; margin-bottom: 10px;">Baz Fiyat: ${priceInfo.basePrice} ${priceInfo.baseCurrency} | Kur: ${priceInfo.exchangeRate.toFixed(2)}</p>` : ''}
          <p style="font-size: 14px; color: white; margin-bottom: 5px;">Gidiş Fiyatı</p>
          <p style="font-size: 28px; font-weight: bold; color: white; margin: 0;">${symbol}${priceInfo.price}</p>
          ${booking.has_return_trip && priceInfo.returnPrice ? `
            <p style="font-size: 14px; color: #d1fae5; margin-top: 15px; margin-bottom: 5px;">Dönüş Fiyatı</p>
            <p style="font-size: 22px; font-weight: bold; color: white; margin: 0;">${symbol}${priceInfo.returnPrice}</p>
            <p style="font-size: 18px; color: #d1fae5; margin-top: 10px;">Toplam: ${symbol}${priceInfo.totalPrice}</p>
          ` : ''}
          ${priceInfo.discountApplied ? `<p style="color: #d1fae5; font-size: 14px; margin-top: 5px;">🎫 %${priceInfo.discountPercent} İndirim Uygulandı</p>` : ''}
        </div>
        
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
          Bu bildirim otomatik fiyat sistemi tarafından gönderilmiştir.
        </p>
      </div>
    </div>
  `;
}

// Admin notification for manual pricing required
export function manualPriceRequiredEmail(
  booking: BookingDetails,
  matchInfo: TransferMatchInfo,
  type: 'quick_booking' | 'reservation'
): string {
  const vehicleName = getVehicleLabel(booking.vehicle_type);
  const typeLabel = type === 'quick_booking' ? 'Quick Booking' : 'Rezervasyon';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Manuel Fiyat Gerekli</h1>
        <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">${typeLabel} - Otomatik fiyat eşleştirilemedi</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Müşteri Bilgileri</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Müşteri:</strong> ${booking.customer_name || 'Henüz girilmedi'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${booking.customer_email || 'Henüz girilmedi'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Telefon:</strong> ${booking.customer_phone || 'Henüz girilmedi'}</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Transfer Detayları</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Alış:</strong> ${booking.pickup}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Bırakış:</strong> ${booking.dropoff}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Tarih:</strong> ${booking.pickup_date}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Saat:</strong> ${booking.pickup_time}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Araç:</strong> ${vehicleName}</p>
          ${booking.has_return_trip ? `<p style="margin: 5px 0; color: #666;"><strong>Dönüş:</strong> ${booking.return_date} - ${booking.return_time}</p>` : ''}
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ef4444;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Eşleşme Sonucu</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Bulunan Havalimanı:</strong> ${matchInfo.airport || 'Bulunamadı'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Bulunan Şehir:</strong> ${matchInfo.city || 'Bulunamadı'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Bulunan İlçe:</strong> ${matchInfo.district || 'Bulunamadı'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Yön:</strong> ${matchInfo.direction}</p>
          ${matchInfo.additionalReason ? `
            <div style="margin-top: 10px; padding: 10px; background: #fef2f2; border-radius: 6px; border: 1px solid #fca5a5;">
              <p style="margin: 0; color: #b91c1c; font-weight: bold;">⚠️ ${matchInfo.additionalReason}</p>
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin: 20px 0; padding: 20px; background: #fef3c7; border-radius: 8px; border: 2px solid #f59e0b;">
          <p style="font-size: 16px; color: #92400e; margin: 0; font-weight: bold;">
            🔧 Lütfen admin panelinden manuel fiyat girin
          </p>
        </div>
        
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
          Bu bildirim otomatik fiyat sistemi tarafından gönderilmiştir.
        </p>
      </div>
    </div>
  `;
}

// Extended translations for customer notification emails
const NOTIFICATION_TRANSLATIONS: Record<SupportedLanguage, {
  // Driver assigned
  driverAssigned: string;
  driverAssignedSubtitle: string;
  driverInfo: string;
  driverName: string;
  plateNumber: string;
  yourTransferReady: string;
  // Payment request
  paymentRequired: string;
  paymentRequiredSubtitle: string;
  payNow: string;
  copyPaymentLink: string;
  securePayment: string;
  // Payment confirmed
  paymentConfirmed: string;
  paymentConfirmedSubtitle: string;
  paymentReceived: string;
  status: string;
  paid: string;
  bookingConfirmed: string;
  viewReservations: string;
  thankYouChoosing: string;
  // Price set
  priceReady: string;
  priceReadySubtitle: string;
  reviewAccept: string;
  viewAcceptPrice: string;
  cashPayment: string;
  cashToDriver: string;
  pleasePayCash: string;
  onlinePayment: string;
}> = {
  en: {
    driverAssigned: "Your Driver is Assigned!",
    driverAssignedSubtitle: "Your transfer is ready",
    driverInfo: "Your Driver Information",
    driverName: "Driver Name",
    plateNumber: "Vehicle Plate Number",
    yourTransferReady: "Your transfer is ready! Your driver will meet you at the pickup location.",
    paymentRequired: "Payment Required",
    paymentRequiredSubtitle: "Complete your booking",
    payNow: "Pay Now",
    copyPaymentLink: "Or copy this link to your browser",
    securePayment: "Click the button above or copy the link to complete your secure payment.",
    paymentConfirmed: "Payment Confirmed!",
    paymentConfirmedSubtitle: "Thank you for your payment",
    paymentReceived: "Payment Received",
    status: "Status",
    paid: "PAID",
    bookingConfirmed: "Your booking is confirmed! We will assign a driver and notify you before pickup.",
    viewReservations: "View My Reservations",
    thankYouChoosing: "Thank you for choosing Meet Transfer!",
    priceReady: "Your Transfer Price is Ready",
    priceReadySubtitle: "Please review and accept your booking",
    reviewAccept: "Review and accept your transfer price",
    viewAcceptPrice: "View Reservation & Accept Price",
    cashPayment: "Cash Payment to Driver",
    cashToDriver: "Cash to Driver",
    pleasePayCash: "Please pay this amount in cash to your driver at the end of the transfer.",
    onlinePayment: "Online Payment",
  },
  tr: {
    driverAssigned: "Şoförünüz Atandı!",
    driverAssignedSubtitle: "Transferiniz hazır",
    driverInfo: "Şoför Bilgileri",
    driverName: "Şoför Adı",
    plateNumber: "Araç Plakası",
    yourTransferReady: "Transferiniz hazır! Şoförünüz sizi alış noktasında karşılayacak.",
    paymentRequired: "Ödeme Gerekli",
    paymentRequiredSubtitle: "Rezervasyonunuzu tamamlayın",
    payNow: "Şimdi Öde",
    copyPaymentLink: "Veya bu linki tarayıcınıza kopyalayın",
    securePayment: "Güvenli ödemenizi tamamlamak için yukarıdaki butona tıklayın veya linki kopyalayın.",
    paymentConfirmed: "Ödeme Onaylandı!",
    paymentConfirmedSubtitle: "Ödemeniz için teşekkürler",
    paymentReceived: "Ödeme Alındı",
    status: "Durum",
    paid: "ÖDENDİ",
    bookingConfirmed: "Rezervasyonunuz onaylandı! Şoför atayacağız ve alış öncesi sizi bilgilendireceğiz.",
    viewReservations: "Rezervasyonlarımı Görüntüle",
    thankYouChoosing: "Meet Transfer'i tercih ettiğiniz için teşekkürler!",
    priceReady: "Transfer Fiyatınız Hazır",
    priceReadySubtitle: "Lütfen inceleyin ve onaylayın",
    reviewAccept: "Transfer fiyatınızı inceleyin ve onaylayın",
    viewAcceptPrice: "Rezervasyonu Görüntüle ve Fiyatı Kabul Et",
    cashPayment: "Şoföre Nakit Ödeme",
    cashToDriver: "Şoföre Nakit",
    pleasePayCash: "Lütfen bu tutarı transfer sonunda şoförünüze nakit olarak ödeyin.",
    onlinePayment: "Online Ödeme",
  },
  de: {
    driverAssigned: "Ihr Fahrer wurde zugewiesen!",
    driverAssignedSubtitle: "Ihr Transfer ist bereit",
    driverInfo: "Ihre Fahrerinformationen",
    driverName: "Fahrername",
    plateNumber: "Fahrzeugkennzeichen",
    yourTransferReady: "Ihr Transfer ist bereit! Ihr Fahrer wird Sie am Abholort treffen.",
    paymentRequired: "Zahlung erforderlich",
    paymentRequiredSubtitle: "Schließen Sie Ihre Buchung ab",
    payNow: "Jetzt bezahlen",
    copyPaymentLink: "Oder kopieren Sie diesen Link in Ihren Browser",
    securePayment: "Klicken Sie auf die Schaltfläche oben oder kopieren Sie den Link, um Ihre sichere Zahlung abzuschließen.",
    paymentConfirmed: "Zahlung bestätigt!",
    paymentConfirmedSubtitle: "Vielen Dank für Ihre Zahlung",
    paymentReceived: "Zahlung erhalten",
    status: "Status",
    paid: "BEZAHLT",
    bookingConfirmed: "Ihre Buchung ist bestätigt! Wir werden einen Fahrer zuweisen und Sie vor der Abholung benachrichtigen.",
    viewReservations: "Meine Reservierungen anzeigen",
    thankYouChoosing: "Vielen Dank, dass Sie Meet Transfer gewählt haben!",
    priceReady: "Ihr Transferpreis ist fertig",
    priceReadySubtitle: "Bitte überprüfen und akzeptieren Sie Ihre Buchung",
    reviewAccept: "Überprüfen und akzeptieren Sie Ihren Transferpreis",
    viewAcceptPrice: "Reservierung anzeigen & Preis akzeptieren",
    cashPayment: "Barzahlung an den Fahrer",
    cashToDriver: "Bar an den Fahrer",
    pleasePayCash: "Bitte zahlen Sie diesen Betrag am Ende des Transfers bar an Ihren Fahrer.",
    onlinePayment: "Online-Zahlung",
  },
  ru: {
    driverAssigned: "Ваш водитель назначен!",
    driverAssignedSubtitle: "Ваш трансфер готов",
    driverInfo: "Информация о вашем водителе",
    driverName: "Имя водителя",
    plateNumber: "Номер автомобиля",
    yourTransferReady: "Ваш трансфер готов! Ваш водитель встретит вас в месте отправления.",
    paymentRequired: "Требуется оплата",
    paymentRequiredSubtitle: "Завершите бронирование",
    payNow: "Оплатить сейчас",
    copyPaymentLink: "Или скопируйте эту ссылку в браузер",
    securePayment: "Нажмите кнопку выше или скопируйте ссылку для безопасной оплаты.",
    paymentConfirmed: "Оплата подтверждена!",
    paymentConfirmedSubtitle: "Спасибо за оплату",
    paymentReceived: "Оплата получена",
    status: "Статус",
    paid: "ОПЛАЧЕНО",
    bookingConfirmed: "Ваше бронирование подтверждено! Мы назначим водителя и уведомим вас перед посадкой.",
    viewReservations: "Просмотр моих бронирований",
    thankYouChoosing: "Спасибо, что выбрали Meet Transfer!",
    priceReady: "Ваша цена трансфера готова",
    priceReadySubtitle: "Пожалуйста, проверьте и подтвердите бронирование",
    reviewAccept: "Проверьте и примите цену трансфера",
    viewAcceptPrice: "Просмотреть бронирование и принять цену",
    cashPayment: "Оплата наличными водителю",
    cashToDriver: "Наличные водителю",
    pleasePayCash: "Пожалуйста, оплатите эту сумму наличными вашему водителю в конце трансфера.",
    onlinePayment: "Онлайн-оплата",
  },
  ar: {
    driverAssigned: "تم تعيين سائقك!",
    driverAssignedSubtitle: "نقلك جاهز",
    driverInfo: "معلومات سائقك",
    driverName: "اسم السائق",
    plateNumber: "رقم لوحة المركبة",
    yourTransferReady: "نقلك جاهز! سائقك سيقابلك في موقع الاستلام.",
    paymentRequired: "الدفع مطلوب",
    paymentRequiredSubtitle: "أكمل حجزك",
    payNow: "ادفع الآن",
    copyPaymentLink: "أو انسخ هذا الرابط في متصفحك",
    securePayment: "انقر على الزر أعلاه أو انسخ الرابط لإكمال الدفع الآمن.",
    paymentConfirmed: "تم تأكيد الدفع!",
    paymentConfirmedSubtitle: "شكراً لك على الدفع",
    paymentReceived: "تم استلام الدفع",
    status: "الحالة",
    paid: "مدفوع",
    bookingConfirmed: "تم تأكيد حجزك! سنقوم بتعيين سائق وإبلاغك قبل الاستلام.",
    viewReservations: "عرض حجوزاتي",
    thankYouChoosing: "شكراً لاختيارك Meet Transfer!",
    priceReady: "سعر النقل جاهز",
    priceReadySubtitle: "يرجى المراجعة وقبول حجزك",
    reviewAccept: "راجع واقبل سعر النقل",
    viewAcceptPrice: "عرض الحجز وقبول السعر",
    cashPayment: "الدفع نقداً للسائق",
    cashToDriver: "نقداً للسائق",
    pleasePayCash: "يرجى دفع هذا المبلغ نقداً لسائقك في نهاية النقل.",
    onlinePayment: "الدفع عبر الإنترنت",
  },
};

// Get notification translation helper
export function getNotificationTranslation(lang: string): typeof NOTIFICATION_TRANSLATIONS.en {
  const supportedLang = (lang || 'en').substring(0, 2).toLowerCase() as SupportedLanguage;
  return NOTIFICATION_TRANSLATIONS[supportedLang] || NOTIFICATION_TRANSLATIONS.en;
}

// Driver Assigned Customer Email
export function generateDriverAssignedEmail(
  data: {
    reservation_code: string;
    pickup: string;
    dropoff: string;
    pickup_date: string;
    pickup_time: string;
    driver_name?: string;
    driver_plate?: string;
  },
  lang: string = 'en'
): string {
  const t = getTranslation(lang);
  const nt = getNotificationTranslation(lang);

  return `
${getEmailHeader(`🚗 ${nt.driverAssigned}`, nt.driverAssignedSubtitle, lang)}
<tr>
  <td style="padding:30px 25px;">
    <div style="background:#111;padding:15px;border-radius:8px;margin-bottom:25px;text-align:center;">
      <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Reservation Code</p>
      <p style="margin:5px 0 0;font-size:26px;font-weight:bold;color:#4caf50;letter-spacing:3px;">${data.reservation_code}</p>
    </div>

    <div style="background:#e8f5e9;padding:25px;border-radius:12px;margin-bottom:25px;border:2px solid #4caf50;">
      <h2 style="margin:0 0 20px 0;color:#2e7d32;font-size:18px;text-align:center;">${nt.driverInfo}</h2>
      
      <div style="background:#fff;padding:15px;border-radius:8px;margin-bottom:15px;">
        <p style="margin:0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${nt.driverName}</p>
        <p style="margin:5px 0 0;font-size:20px;font-weight:bold;color:#111;">${data.driver_name || 'TBA'}</p>
      </div>
      
      <div style="background:#fff;padding:15px;border-radius:8px;">
        <p style="margin:0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${nt.plateNumber}</p>
        <p style="margin:5px 0 0;font-size:20px;font-weight:bold;color:#111;">${data.driver_plate || 'TBA'}</p>
      </div>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:20px;border:1px solid #e2e8f0;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 15px;color:#1e293b;font-weight:bold;font-size:15px;">📍 ${t.transferDetails}</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;width:100px;">${t.date} & ${t.time}</td>
            <td style="padding:8px 0;color:#d32f2f;font-size:14px;font-weight:bold;">${data.pickup_date} - ${data.pickup_time}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.from}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${data.pickup}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.to}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${data.dropoff}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <div style="background:#eff6ff;padding:15px;border-radius:8px;text-align:center;">
      <p style="margin:0;color:#1e40af;font-size:14px;">${nt.yourTransferReady}</p>
    </div>
  </td>
</tr>
${getEmailFooter(lang)}
  `;
}

// Payment Request Customer Email
export function generatePaymentRequestEmail(
  data: {
    reservation_code: string;
    pickup: string;
    dropoff: string;
    pickup_date: string;
    pickup_time: string;
    vehicle_type: string;
    price: number;
    currency: string;
    payment_link: string;
  },
  lang: string = 'en'
): string {
  const t = getTranslation(lang);
  const nt = getNotificationTranslation(lang);
  
  const currencySymbols: Record<string, string> = { 'EUR': '€', 'USD': '$', 'TRY': '₺', 'GBP': '£', 'AED': 'د.إ' };
  const symbol = currencySymbols[data.currency] || data.currency;
  const paymentUrl = data.payment_link?.startsWith('http') ? data.payment_link : 'https://' + data.payment_link;

  const vehicleNames: Record<string, string> = {
    'mercedes-vito': 'Mercedes Vito VIP',
    'mercedes-sprinter': 'Mercedes Sprinter VIP',
    'mercedes-maybach': 'Mercedes Maybach',
  };

  return `
${getEmailHeader(`💳 ${nt.paymentRequired}`, nt.paymentRequiredSubtitle, lang)}
<tr>
  <td style="padding:30px 25px;">
    <div style="background:#111;padding:15px;border-radius:8px;margin-bottom:25px;text-align:center;">
      <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Reservation Code</p>
      <p style="margin:5px 0 0;font-size:26px;font-weight:bold;color:#2196f3;letter-spacing:3px;">${data.reservation_code}</p>
    </div>

    <div style="background:#e3f2fd;padding:20px;border-radius:12px;text-align:center;margin-bottom:25px;border:2px solid #2196f3;">
      <p style="margin:0;color:#666;font-size:14px;">${t.totalPrice}</p>
      <p style="margin:10px 0 0;font-size:36px;font-weight:bold;color:#1565c0;">${symbol}${data.price}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:25px;border:1px solid #e2e8f0;">
      <tr><td style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;width:120px;">${t.date} & ${t.time}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${data.pickup_date} - ${data.pickup_time}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.from}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${data.pickup}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.to}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${data.dropoff}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.vehicle}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${vehicleNames[data.vehicle_type] || data.vehicle_type}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;padding:25px 0;">
          <a href="${paymentUrl}" style="display:inline-block;background:linear-gradient(135deg, #4caf50 0%, #388e3c 100%);color:#fff;text-decoration:none;padding:18px 50px;border-radius:10px;font-size:18px;font-weight:bold;">👉 ${nt.payNow}</a>
        </td>
      </tr>
    </table>

    <p style="text-align:center;color:#666;font-size:13px;">
      ${nt.copyPaymentLink}:<br/>
      <a href="${paymentUrl}" style="color:#2196f3;word-break:break-all;">${paymentUrl}</a>
    </p>
    <p style="text-align:center;color:#888;font-size:12px;">${nt.securePayment}</p>
  </td>
</tr>
${getEmailFooter(lang)}
  `;
}

// Payment Confirmed Customer Email  
export function generatePaymentConfirmedEmail(
  data: {
    reservation_code: string;
    pickup: string;
    dropoff: string;
    pickup_date: string;
    pickup_time: string;
    vehicle_type: string;
    price: number;
    currency: string;
    reservation_id: string;
  },
  lang: string = 'en'
): string {
  const t = getTranslation(lang);
  const nt = getNotificationTranslation(lang);
  
  const currencySymbols: Record<string, string> = { 'EUR': '€', 'USD': '$', 'TRY': '₺', 'GBP': '£', 'AED': 'د.إ' };
  const symbol = currencySymbols[data.currency] || data.currency;

  const vehicleNames: Record<string, string> = {
    'mercedes-vito': 'Mercedes Vito VIP',
    'mercedes-sprinter': 'Mercedes Sprinter VIP',
    'mercedes-maybach': 'Mercedes Maybach',
  };

  return `
${getEmailHeader(`✅ ${nt.paymentConfirmed}`, nt.paymentConfirmedSubtitle, lang)}
<tr>
  <td style="padding:30px 25px;">
    <div style="background:#111;padding:15px;border-radius:8px;margin-bottom:25px;text-align:center;">
      <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Reservation Code</p>
      <p style="margin:5px 0 0;font-size:26px;font-weight:bold;color:#4caf50;letter-spacing:3px;">${data.reservation_code}</p>
    </div>

    <div style="background:#e8f5e9;padding:20px;border-radius:12px;text-align:center;margin-bottom:25px;border:2px solid #4caf50;">
      <p style="margin:0;color:#2e7d32;font-size:16px;font-weight:bold;">✓ ${nt.paymentReceived}</p>
      <p style="margin:10px 0 0;font-size:28px;font-weight:bold;color:#1b5e20;">${symbol}${data.price}</p>
      <p style="margin:10px 0 0;color:#388e3c;font-size:14px;">${nt.status}: <strong>${nt.paid}</strong></p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:25px;border:1px solid #e2e8f0;">
      <tr><td style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;width:120px;">${t.date} & ${t.time}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${data.pickup_date} - ${data.pickup_time}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.from}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${data.pickup}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.to}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${data.dropoff}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.vehicle}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${vehicleNames[data.vehicle_type] || data.vehicle_type}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <div style="background:#f5f5f5;padding:15px;border-radius:8px;text-align:center;margin-bottom:20px;">
      <p style="margin:0;color:#666;font-size:14px;">${nt.bookingConfirmed}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;padding:20px 0;">
          <a href="https://meettransfer.app/customer/reservations" style="display:inline-block;background:linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);color:#1a1a2e;text-decoration:none;padding:14px 30px;border-radius:8px;font-size:16px;font-weight:bold;">${nt.viewReservations}</a>
        </td>
      </tr>
    </table>

    <p style="text-align:center;color:#4caf50;font-size:14px;font-weight:bold;">${nt.thankYouChoosing}</p>
  </td>
</tr>
${getEmailFooter(lang)}
  `;
}

// Price Set Customer Email
export function generatePriceSetEmail(
  data: {
    reservation_code: string;
    reservation_id: string;
    pickup: string;
    dropoff: string;
    pickup_date: string;
    pickup_time: string;
    vehicle_type: string;
    price: number;
    currency: string;
    payment_type: string;
    passenger_cash_amount?: number;
    passenger_cash_currency?: string;
  },
  lang: string = 'en'
): string {
  const t = getTranslation(lang);
  const nt = getNotificationTranslation(lang);
  
  const currencySymbols: Record<string, string> = { 'EUR': '€', 'USD': '$', 'TRY': '₺', 'GBP': '£', 'AED': 'د.إ' };
  const symbol = currencySymbols[data.currency] || data.currency;
  
  const vehicleNames: Record<string, string> = {
    'mercedes-vito': 'Mercedes Vito VIP',
    'mercedes-sprinter': 'Mercedes Sprinter VIP',
    'mercedes-maybach': 'Mercedes Maybach',
  };

  let cashSection = '';
  if (data.passenger_cash_amount) {
    const cashSymbol = currencySymbols[data.passenger_cash_currency || 'EUR'] || data.passenger_cash_currency;
    cashSection = `
    <div style="background:#fff8e1;padding:20px;border-radius:12px;text-align:center;margin-bottom:25px;border:2px solid #ffb300;">
      <p style="margin:0;color:#f57c00;font-size:12px;text-transform:uppercase;letter-spacing:1px;">💵 ${nt.cashPayment}</p>
      <p style="margin:10px 0 0;font-size:32px;font-weight:bold;color:#e65100;">${cashSymbol}${data.passenger_cash_amount}</p>
      <p style="margin:8px 0 0;color:#ef6c00;font-size:13px;">${nt.pleasePayCash}</p>
    </div>`;
  } else if (data.payment_type === 'cash') {
    cashSection = `
    <div style="background:#fff8e1;padding:15px;border-radius:8px;text-align:center;margin-bottom:25px;border:2px solid #ffb300;">
      <p style="margin:0;color:#f57c00;font-size:14px;font-weight:bold;">💵 ${nt.cashPayment}</p>
      <p style="margin:8px 0 0;color:#e65100;font-size:13px;">${nt.pleasePayCash}</p>
    </div>`;
  }

  return `
${getEmailHeader(`💰 ${nt.priceReady}`, nt.priceReadySubtitle, lang)}
<tr>
  <td style="padding:30px 25px;">
    <div style="background:#111;padding:15px;border-radius:8px;margin-bottom:25px;text-align:center;">
      <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Reservation Code</p>
      <p style="margin:5px 0 0;font-size:26px;font-weight:bold;color:#fdd835;letter-spacing:3px;">${data.reservation_code}</p>
    </div>

    <div style="background:#fffde7;padding:20px;border-radius:12px;text-align:center;margin-bottom:25px;border:2px solid #fdd835;">
      <p style="margin:0;color:#666;font-size:14px;">${t.yourPrice}</p>
      <p style="margin:10px 0 0;font-size:36px;font-weight:bold;color:#111;">${symbol}${data.price}</p>
    </div>

    ${cashSection}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:25px;border:1px solid #e2e8f0;">
      <tr><td style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;width:120px;">${t.date} & ${t.time}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${data.pickup_date} - ${data.pickup_time}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.from}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${data.pickup}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.to}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${data.dropoff}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">${t.vehicle}</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${vehicleNames[data.vehicle_type] || data.vehicle_type}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Payment</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${data.payment_type === 'cash' ? '💵 ' + nt.cashToDriver : '💳 ' + nt.onlinePayment}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;padding:25px 0;">
          <a href="https://meettransfer.app/customer/reservation/${data.reservation_id}" style="display:inline-block;background:linear-gradient(135deg, #4caf50 0%, #388e3c 100%);color:#fff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:bold;">${nt.viewAcceptPrice}</a>
        </td>
      </tr>
    </table>

    <p style="text-align:center;color:#888;font-size:13px;">${nt.reviewAccept}</p>
  </td>
</tr>
${getEmailFooter(lang)}
  `;
}
