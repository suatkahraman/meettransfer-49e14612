import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getVehicleLabel } from "../_shared/vehicleConfig.ts";
import { getCurrencySymbol } from "../_shared/currencyUtils.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback exchange rates
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  'EUR': { 'USD': 1.08, 'TRY': 37.5, 'GBP': 0.85, 'AED': 3.97, 'AUD': 1.65 },
  'USD': { 'EUR': 0.93, 'TRY': 34.5, 'GBP': 0.79, 'AED': 3.67, 'AUD': 1.53 },
  'TRY': { 'EUR': 0.027, 'USD': 0.029, 'GBP': 0.023, 'AED': 0.11, 'AUD': 0.044 },
  'GBP': { 'EUR': 1.18, 'USD': 1.27, 'TRY': 44.1, 'AED': 4.67, 'AUD': 1.94 },
  'AED': { 'EUR': 0.25, 'USD': 0.27, 'TRY': 9.4, 'GBP': 0.21, 'AUD': 0.42 },
  'AUD': { 'EUR': 0.61, 'USD': 0.65, 'TRY': 22.5, 'GBP': 0.52, 'AED': 2.40 },
};

// Convert €3 to target currency
async function convertEuroToTargetCurrency(targetCurrency: string): Promise<number> {
  const discountEuros = 3;
  
  if (targetCurrency === 'EUR') {
    return discountEuros;
  }
  
  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=EUR&to=${targetCurrency}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (response.ok) {
      const data = await response.json();
      const rate = data.rates[targetCurrency];
      if (rate) {
        return Math.round(discountEuros * rate);
      }
    }
  } catch (e) {
    console.error("Currency conversion API error:", e);
  }
  
  // Fallback
  const rate = FALLBACK_RATES['EUR']?.[targetCurrency] || 1;
  console.log(`Using fallback rate for discount: EUR -> ${targetCurrency} = ${rate}`);
  return Math.round(discountEuros * rate);
}

// Multi-language translations for discount email
const DISCOUNT_TRANSLATIONS: Record<string, {
  subject: string;
  title: string;
  message: string;
  originalPrice: string;
  discount: string;
  newPrice: string;
  confirmNow: string;
  validFor: string;
  samePrice: string;
  needHelp: string;
}> = {
  en: {
    subject: "Special Discount Applied! Your New Price",
    title: "Great News! Special Discount Applied",
    message: "We've applied a special discount to your transfer quote. Here's your updated offer:",
    originalPrice: "Original Price",
    discount: "Discount",
    newPrice: "Your New Price",
    confirmNow: "Confirm & Book Now",
    validFor: "This offer is valid for 24 hours",
    samePrice: "Airport transfers are the same price in both directions",
    needHelp: "Need Help? Contact Us 24/7",
  },
  tr: {
    subject: "Özel İndirim Uygulandı! Yeni Fiyatınız",
    title: "Harika Haber! Özel İndirim Uygulandı",
    message: "Transfer teklifinize özel bir indirim uyguladık. İşte güncellenmiş teklifiniz:",
    originalPrice: "Eski Fiyat",
    discount: "İndirim",
    newPrice: "Yeni Fiyatınız",
    confirmNow: "Şimdi Onayla ve Rezerve Et",
    validFor: "Bu teklif 24 saat geçerlidir",
    samePrice: "Havalimanı transferleri her iki yönde de aynı fiyattır",
    needHelp: "Yardıma mı ihtiyacınız var? 7/24 bize ulaşın",
  },
  de: {
    subject: "Sonderrabatt angewendet! Ihr neuer Preis",
    title: "Tolle Neuigkeiten! Sonderrabatt angewendet",
    message: "Wir haben einen Sonderrabatt auf Ihr Transferangebot angewendet. Hier ist Ihr aktualisiertes Angebot:",
    originalPrice: "Ursprünglicher Preis",
    discount: "Rabatt",
    newPrice: "Ihr neuer Preis",
    confirmNow: "Jetzt bestätigen & buchen",
    validFor: "Dieses Angebot gilt für 24 Stunden",
    samePrice: "Flughafentransfers kosten in beide Richtungen gleich viel",
    needHelp: "Brauchen Sie Hilfe? Kontaktieren Sie uns 24/7",
  },
  ru: {
    subject: "Применена специальная скидка! Ваша новая цена",
    title: "Отличные новости! Применена специальная скидка",
    message: "Мы применили специальную скидку к вашему предложению на трансфер. Вот ваше обновленное предложение:",
    originalPrice: "Исходная цена",
    discount: "Скидка",
    newPrice: "Ваша новая цена",
    confirmNow: "Подтвердить и забронировать",
    validFor: "Это предложение действительно 24 часа",
    samePrice: "Трансферы из аэропорта стоят одинаково в обоих направлениях",
    needHelp: "Нужна помощь? Свяжитесь с нами 24/7",
  },
  ar: {
    subject: "تم تطبيق خصم خاص! سعرك الجديد",
    title: "أخبار رائعة! تم تطبيق خصم خاص",
    message: "لقد طبقنا خصمًا خاصًا على عرض النقل الخاص بك. إليك عرضك المحدث:",
    originalPrice: "السعر الأصلي",
    discount: "الخصم",
    newPrice: "سعرك الجديد",
    confirmNow: "تأكيد والحجز الآن",
    validFor: "هذا العرض صالح لمدة 24 ساعة",
    samePrice: "تكلفة النقل من المطار متساوية في كلا الاتجاهين",
    needHelp: "هل تحتاج مساعدة؟ اتصل بنا 24/7",
  },
};

function getTranslation(lang: string) {
  const shortLang = lang?.substring(0, 2) || 'en';
  return DISCOUNT_TRANSLATIONS[shortLang] || DISCOUNT_TRANSLATIONS.en;
}

function generateDiscountEmail(
  booking: any,
  originalPrice: number,
  discountAmount: number,
  newPrice: number,
  currency: string,
  confirmUrl: string,
  lang: string = 'en'
): string {
  const t = getTranslation(lang);
  const currencySymbol = getCurrencySymbol(currency);
  const vehicleLabel = getVehicleLabel(booking.vehicle_type);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; text-align: center;">
              <img src="https://meettransfer.app/images/meet-transfer-logo.png" alt="Meet Transfer" style="height: 50px; margin-bottom: 15px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">🎉 ${t.title}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                ${t.message}
              </p>
              
              <!-- Transfer Details -->
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #64748b; font-size: 14px;">📍 From</span><br>
                      <span style="color: #1e293b; font-weight: 500;">${booking.pickup}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #64748b; font-size: 14px;">📍 To</span><br>
                      <span style="color: #1e293b; font-weight: 500;">${booking.dropoff}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #64748b; font-size: 14px;">📅 Date & Time</span><br>
                      <span style="color: #1e293b; font-weight: 500;">${formatDate(booking.pickup_date)} - ${booking.pickup_time}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #64748b; font-size: 14px;">🚗 Vehicle</span><br>
                      <span style="color: #1e293b; font-weight: 500;">${vehicleLabel}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Price Comparison -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; margin-bottom: 15px;">
                  <span style="color: rgba(255,255,255,0.8); font-size: 14px;">${t.originalPrice}</span><br>
                  <span style="color: rgba(255,255,255,0.9); font-size: 20px; text-decoration: line-through;">${currencySymbol}${originalPrice}</span>
                </div>
                <div style="background: rgba(255,255,255,0.2); border-radius: 20px; padding: 5px 15px; display: inline-block; margin: 0 15px;">
                  <span style="color: #ffffff; font-weight: 600;">-${currencySymbol}${discountAmount}</span>
                </div>
                <div style="margin-top: 20px;">
                  <span style="color: rgba(255,255,255,0.9); font-size: 14px;">${t.newPrice}</span><br>
                  <span style="color: #ffffff; font-size: 36px; font-weight: 700;">${currencySymbol}${newPrice}</span>
                </div>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 25px 0;">
                <a href="${confirmUrl}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);">
                  ${t.confirmNow} →
                </a>
              </div>
              
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 20px 0 0 0;">
                ${t.validFor}<br>
                ${t.samePrice}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 25px; text-align: center;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 15px 0;">${t.needHelp}</p>
              <a href="https://wa.me/15558051101" style="background-color: #25d366; color: #ffffff; text-decoration: none; padding: 10px 25px; border-radius: 6px; font-weight: 500; display: inline-block;">
                💬 WhatsApp Chat
              </a>
              <p style="color: #64748b; font-size: 12px; margin: 15px 0 0 0;">
                📧 info@meettransfer.app | 📞 +90 850 308 3215
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { reservation_id, quick_booking_id } = await req.json();
    
    if (!reservation_id && !quick_booking_id) {
      return new Response(
        JSON.stringify({ error: 'reservation_id or quick_booking_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing auto discount for reservation: ${reservation_id}, quick_booking: ${quick_booking_id}`);

    // Check how many times the price was rejected for this booking
    const { data: rejectionHistory, error: historyError } = await supabase
      .from('price_history')
      .select('*')
      .eq(reservation_id ? 'reservation_id' : 'quick_booking_id', reservation_id || quick_booking_id)
      .eq('action', 'rejected')
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching rejection history:', historyError);
      throw historyError;
    }

    const rejectionCount = rejectionHistory?.length || 0;
    console.log(`Rejection count: ${rejectionCount}`);

    // If already rejected once (this is the second rejection), don't apply discount
    if (rejectionCount > 1) {
      console.log('Already applied discount once, no more discounts');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Maximum discounts already applied',
          can_reject_again: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current booking details
    let currentPrice: number;
    let currentCurrency: string;
    let bookingType: 'reservation' | 'quick_booking';
    let booking: any;
    let confirmUrl: string;

    if (reservation_id) {
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservation_id)
        .single();

      if (resError || !reservation?.price) {
        throw new Error('Reservation not found or no price set');
      }

      currentPrice = reservation.price;
      currentCurrency = reservation.price_currency || 'EUR';
      bookingType = 'reservation';
      booking = reservation;
      // For reservations, we don't have confirmation token - would need different handling
      confirmUrl = `https://meettransfer.app/customer`;
    } else {
      const { data: quickBooking, error: qbError } = await supabase
        .from('quick_booking_requests')
        .select('*')
        .eq('id', quick_booking_id)
        .single();

      if (qbError || !quickBooking?.price) {
        throw new Error('Quick booking not found or no price set');
      }

      currentPrice = quickBooking.price;
      currentCurrency = quickBooking.price_currency || 'EUR';
      bookingType = 'quick_booking';
      booking = quickBooking;
      confirmUrl = `https://meettransfer.app/quick-booking-confirm?token=${quickBooking.confirmation_token}`;
    }

    console.log(`Current price: ${currentPrice} ${currentCurrency}`);

    // Calculate discount in target currency (€3 equivalent)
    const discountAmount = await convertEuroToTargetCurrency(currentCurrency);
    const newPrice = Math.max(currentPrice - discountAmount, 1); // Ensure price doesn't go below 1

    console.log(`Discount: ${discountAmount} ${currentCurrency}, New price: ${newPrice}`);

    // Update the booking with new price and reset status
    if (bookingType === 'reservation') {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ 
          price: newPrice,
          status: 'waiting_for_customer_approval',
          discount_amount: discountAmount,
        })
        .eq('id', reservation_id);

      if (updateError) throw updateError;

      // Record in price history
      await supabase.from('price_history').insert({
        reservation_id: reservation_id,
        price: newPrice,
        price_currency: currentCurrency,
        action: 'auto_discount',
        customer_note: `Otomatik indirim: €3 = ${discountAmount} ${currentCurrency}`,
      });

      // Notify admins
      await supabase.functions.invoke('create-notification', {
        body: {
          type: 'auto_discount_applied',
          title: 'Auto Discount Applied',
          message: `Customer rejected price. Auto discount of €3 (${discountAmount} ${currentCurrency}) applied. New price: ${newPrice} ${currentCurrency}`,
          notify_admins: true,
          reservation_id: reservation_id,
          send_push: true,
        }
      });
    } else {
      const { error: updateError } = await supabase
        .from('quick_booking_requests')
        .update({ 
          price: newPrice,
          status: 'price_sent',
        })
        .eq('id', quick_booking_id);

      if (updateError) throw updateError;

      // Record in price history
      await supabase.from('price_history').insert({
        quick_booking_id: quick_booking_id,
        price: newPrice,
        price_currency: currentCurrency,
        action: 'auto_discount',
        customer_note: `Otomatik indirim: €3 = ${discountAmount} ${currentCurrency}`,
      });

      // Notify admins
      await supabase.functions.invoke('create-notification', {
        body: {
          type: 'auto_discount_applied',
          title: 'Auto Discount Applied (Quick Booking)',
          message: `Customer rejected price. Auto discount of €3 (${discountAmount} ${currentCurrency}) applied. New price: ${newPrice} ${currentCurrency}`,
          notify_admins: true,
          send_push: true,
        }
      });
    }

    // Send email to customer with discounted price
    let emailSent = false;
    const customerEmail = booking.customer_email;
    
    if (customerEmail) {
      try {
        const customerLang = booking.language || 'en';
        const t = getTranslation(customerLang);
        const currencySymbol = getCurrencySymbol(currentCurrency);
        
        const emailSubject = `${t.subject}: ${currencySymbol}${newPrice} - Meet Transfer`;
        
        const emailHtml = generateDiscountEmail(
          booking,
          currentPrice,
          discountAmount,
          newPrice,
          currentCurrency,
          confirmUrl,
          customerLang
        );

        console.log(`📧 Sending discount email to: ${customerEmail} in language: ${customerLang}`);

        const { error: emailError } = await resend.emails.send({
          from: "Meet Transfer <noreply@mail.meettransfer.app>",
          to: [customerEmail],
          subject: emailSubject,
          html: emailHtml,
        });

        if (!emailError) {
          emailSent = true;
          console.log(`✅ Discount email sent successfully to: ${customerEmail}`);
        } else {
          console.error("❌ Email send error:", emailError);
        }
      } catch (emailErr) {
        console.error("❌ Failed to send discount email:", emailErr);
      }
    } else {
      console.log("⚠️ No customer email found, skipping email notification");
    }

    console.log('Auto discount applied successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        original_price: currentPrice,
        discount_amount: discountAmount,
        new_price: newPrice,
        currency: currentCurrency,
        email_sent: emailSent,
        can_reject_again: false, // After discount applied, no more rejections allowed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error applying auto discount:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
