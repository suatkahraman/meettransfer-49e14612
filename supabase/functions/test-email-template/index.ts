import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { 
  generateCustomerPriceQuoteEmail, 
  generateDriverAssignedEmail,
  generatePaymentRequestEmail,
  generatePaymentConfirmedEmail,
  generatePriceSetEmail,
  generatePaymentSuccessEmail,
  generateAgencyPaymentSuccessEmail
} from "../_shared/emailTemplates.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  language?: string;
  adminEmail?: string;
  template?: 'price_quote' | 'driver_assigned' | 'payment_request' | 'payment_confirmed' | 'price_set' | 'payment_success' | 'agency_payment_success';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      language = 'en', 
      adminEmail = 'sautkahraman@gmail.com',
      template = 'price_quote'
    }: TestEmailRequest = await req.json();

    console.log(`📧 Testing ${template} template in language: ${language}`);

    // Sample booking data for test
    const sampleBooking = {
      pickup: "Sarıgerme, Ortaca, Muğla, Turkey",
      dropoff: "Dalaman Airport (DLM), Muğla, Turkey",
      pickup_date: "2025-01-15",
      pickup_time: "14:30",
      vehicle_type: "mercedes-vito",
      has_return_trip: true,
      return_date: "2025-01-22",
      return_time: "10:00",
    };

    // For driver_assigned - simple data
    const driverAssignedData = {
      reservation_code: "MT-2025-ABC123",
      pickup: "Sarıgerme, Ortaca, Muğla, Turkey",
      dropoff: "Dalaman Airport (DLM), Muğla, Turkey",
      pickup_date: "2025-01-15",
      pickup_time: "14:30",
      driver_name: "Ahmet Yılmaz",
      driver_plate: "48 ABC 123",
    };

    // For payment_request - with payment link
    const paymentRequestData = {
      reservation_code: "MT-2025-ABC123",
      pickup: "Sarıgerme, Ortaca, Muğla, Turkey",
      dropoff: "Dalaman Airport (DLM), Muğla, Turkey",
      pickup_date: "2025-01-15",
      pickup_time: "14:30",
      vehicle_type: "mercedes-vito",
      price: 85,
      currency: "EUR",
      payment_link: "https://meettransfer.app/pay/test-payment-link",
    };

    // For payment_confirmed
    const paymentConfirmedData = {
      reservation_code: "MT-2025-ABC123",
      pickup: "Sarıgerme, Ortaca, Muğla, Turkey",
      dropoff: "Dalaman Airport (DLM), Muğla, Turkey",
      pickup_date: "2025-01-15",
      pickup_time: "14:30",
      vehicle_type: "mercedes-vito",
      price: 85,
      currency: "EUR",
      reservation_id: "test-reservation-id",
    };

    // For price_set
    const priceSetData = {
      reservation_code: "MT-2025-ABC123",
      reservation_id: "test-reservation-id",
      pickup: "Sarıgerme, Ortaca, Muğla, Turkey",
      dropoff: "Dalaman Airport (DLM), Muğla, Turkey",
      pickup_date: "2025-01-15",
      pickup_time: "14:30",
      vehicle_type: "mercedes-vito",
      price: 85,
      currency: "EUR",
      payment_type: "cash",
      passenger_cash_amount: 85,
      passenger_cash_currency: "EUR",
    };

    // For payment_success (customer)
    const paymentSuccessData = {
      reservation_code: "MT-2025-ABC123",
      reservation_id: "test-reservation-id",
      pickup: "Sarıgerme, Ortaca, Muğla, Turkey",
      dropoff: "Dalaman Airport (DLM), Muğla, Turkey",
      pickup_date: "2025-01-15",
      pickup_time: "14:30",
      vehicle_type: "mercedes-vito",
      price: 85,
      currency: "EUR",
      customer_name: "John Doe",
      customer_phone: "+90 555 123 4567",
      passenger_names: ["John Doe", "Jane Doe"],
      customer_notes: "Please bring a baby seat",
      payment_provider: "stripe" as const,
    };

    // For agency_payment_success
    const agencyPaymentSuccessData = {
      reservation_code: "MT-2025-ABC123",
      reservation_id: "test-reservation-id",
      pickup: "Sarıgerme, Ortaca, Muğla, Turkey",
      dropoff: "Dalaman Airport (DLM), Muğla, Turkey",
      pickup_date: "2025-01-15",
      pickup_time: "14:30",
      vehicle_type: "mercedes-vito",
      price: 85,
      currency: "EUR",
      customer_name: "John Doe",
      customer_phone: "+90 555 123 4567",
      agency_name: "Premium Travel Agency",
      payment_provider: "paypal" as const,
    };

    let emailHtml: string;
    let emailSubject: string;

    switch (template) {
      case 'driver_assigned':
        emailHtml = generateDriverAssignedEmail(driverAssignedData, language);
        emailSubject = getSubjectByTemplate('driver_assigned', language);
        break;
      
      case 'payment_request':
        emailHtml = generatePaymentRequestEmail(paymentRequestData, language);
        emailSubject = getSubjectByTemplate('payment_request', language);
        break;
      
      case 'payment_confirmed':
        emailHtml = generatePaymentConfirmedEmail(paymentConfirmedData, language);
        emailSubject = getSubjectByTemplate('payment_confirmed', language);
        break;
      
      case 'price_set':
        emailHtml = generatePriceSetEmail(priceSetData, language);
        emailSubject = getSubjectByTemplate('price_set', language);
        break;
      
      case 'payment_success':
        emailHtml = generatePaymentSuccessEmail(paymentSuccessData, language);
        emailSubject = getSubjectByTemplate('payment_success', language);
        break;
      
      case 'agency_payment_success':
        emailHtml = generateAgencyPaymentSuccessEmail(agencyPaymentSuccessData, language);
        emailSubject = getSubjectByTemplate('agency_payment_success', language);
        break;
      
      case 'price_quote':
      default:
        const samplePriceInfo = {
          price: 85,
          returnPrice: 60,
          totalPrice: 145,
          currency: 'EUR',
          discountApplied: true,
          discountPercent: 30,
        };
        const confirmUrl = "https://meettransfer.app/quick-booking-confirm?token=test-token";
        emailHtml = generateCustomerPriceQuoteEmail(sampleBooking, samplePriceInfo, confirmUrl, language);
        emailSubject = getSubjectByTemplate('price_quote', language);
        break;
    }

    const { error: emailError, data } = await resend.emails.send({
      from: "Meet Transfer <noreply@mail.meettransfer.app>",
      to: [adminEmail],
      subject: `[TEST] ${emailSubject}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("❌ Email send error:", emailError);
      throw emailError;
    }

    console.log(`✅ Test email (${template}) sent successfully to: ${adminEmail} in language: ${language}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test email (${template}) sent to ${adminEmail} in language: ${language}`,
        emailId: data?.id,
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Test email error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getSubjectByTemplate(template: string, lang: string): string {
  const subjects: Record<string, Record<string, string>> = {
    price_quote: {
      en: "Your Transfer Quote - Meet Transfer",
      tr: "Transfer Teklifiniz - Meet Transfer",
      de: "Ihr Transferangebot - Meet Transfer",
      ru: "Ваше предложение по трансферу - Meet Transfer",
      ar: "عرض النقل الخاص بك - Meet Transfer",
    },
    driver_assigned: {
      en: "Driver Assigned - Meet Transfer",
      tr: "Şoförünüz Atandı - Meet Transfer",
      de: "Fahrer zugewiesen - Meet Transfer",
      ru: "Водитель назначен - Meet Transfer",
      ar: "تم تعيين السائق - Meet Transfer",
    },
    payment_request: {
      en: "Payment Required - Meet Transfer",
      tr: "Ödeme Gerekli - Meet Transfer",
      de: "Zahlung erforderlich - Meet Transfer",
      ru: "Требуется оплата - Meet Transfer",
      ar: "مطلوب الدفع - Meet Transfer",
    },
    payment_confirmed: {
      en: "Payment Confirmed - Meet Transfer",
      tr: "Ödeme Onaylandı - Meet Transfer",
      de: "Zahlung bestätigt - Meet Transfer",
      ru: "Оплата подтверждена - Meet Transfer",
      ar: "تم تأكيد الدفع - Meet Transfer",
    },
    price_set: {
      en: "Your Transfer Price is Ready - Meet Transfer",
      tr: "Transfer Fiyatınız Hazır - Meet Transfer",
      de: "Ihr Transferpreis ist bereit - Meet Transfer",
      ru: "Ваша цена трансфера готова - Meet Transfer",
      ar: "سعر النقل جاهز - Meet Transfer",
    },
    payment_success: {
      en: "Payment Successful! Your Transfer is Confirmed - Meet Transfer",
      tr: "Ödeme Başarılı! Transferiniz Onaylandı - Meet Transfer",
      de: "Zahlung erfolgreich! Ihr Transfer ist bestätigt - Meet Transfer",
      ru: "Оплата успешна! Ваш трансфер подтвержден - Meet Transfer",
      ar: "الدفع ناجح! تم تأكيد النقل الخاص بك - Meet Transfer",
    },
    agency_payment_success: {
      en: "Customer Payment Received - Meet Transfer",
      tr: "Müşteri Ödemesi Alındı - Meet Transfer",
      de: "Kundenzahlung erhalten - Meet Transfer",
      ru: "Получен платеж от клиента - Meet Transfer",
      ar: "تم استلام دفع العميل - Meet Transfer",
    },
  };

  const langKey = lang.substring(0, 2);
  return subjects[template]?.[langKey] || subjects[template]?.['en'] || "Meet Transfer";
}

serve(handler);
