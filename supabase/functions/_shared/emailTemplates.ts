// Shared email templates for edge functions
import { getVehicleLabel } from "./vehicleConfig.ts";
import { getCurrencySymbol, formatPrice } from "./currencyUtils.ts";

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

// Professional email header with logo
export function getEmailHeader(title: string, subtitle?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
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
export function getEmailFooter(): string {
  const serviceRegionsHtml = SERVICE_REGIONS.map(r => 
    `<span style="display: inline-block; margin: 3px 6px; font-size: 12px; color: #64748b;">${r.flag} ${r.name}</span>`
  ).join('');

  return `
        <!-- Service Regions -->
        <tr>
          <td style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px; color: #1e293b; font-size: 13px; font-weight: bold;">✈️ We Serve All Major Destinations</p>
            <div style="line-height: 2;">
              ${serviceRegionsHtml}
            </div>
          </td>
        </tr>

        <!-- Contact Section -->
        <tr>
          <td style="background: #1a1a2e; padding: 25px 20px; text-align: center;">
            <p style="margin: 0 0 15px; color: #fdd835; font-size: 15px; font-weight: bold;">Need Help? Contact Us 24/7</p>
            <div style="margin-bottom: 15px;">
              <a href="${WHATSAPP_URL}" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; margin: 5px;">💬 WhatsApp Chat</a>
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
              <span style="color: #94a3b8; font-size: 13px; margin-left: 8px;">492 reviews on TripAdvisor</span>
            </div>
          </td>
        </tr>

        <!-- Copyright -->
        <tr>
          <td style="background: #0f0f1a; padding: 15px 20px; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 11px;">
              © 2025 ${COMPANY_NAME}. All rights reserved.<br/>
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
  bodyContent: string
): string {
  return `
    ${getEmailHeader(title, subtitle)}
    <tr>
      <td style="padding: 30px 25px;">
        ${bodyContent}
      </td>
    </tr>
    ${getEmailFooter()}
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
