// Shared email templates for edge functions
import { getVehicleLabel } from "./vehicleConfig.ts";
import { getCurrencySymbol, formatPrice } from "./currencyUtils.ts";

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

// Base email styles
const baseStyles = `
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
    .header-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .header-warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; }
    .card { background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
    .card-title { margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold; }
    .info-row { margin: 5px 0; color: #666; font-size: 14px; }
    .price-box { text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .price-success { background: #10b981; }
    .price-text { color: white; font-size: 28px; font-weight: bold; margin: 0; }
    .footer { color: #999; font-size: 12px; text-align: center; margin-top: 20px; }
  </style>
`;

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
