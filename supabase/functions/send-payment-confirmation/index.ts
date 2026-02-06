import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Inline email template generators to avoid shared module import issues
function generatePaymentSuccessEmail(data: any, lang: string = 'en'): string {
  const title = lang === 'tr' ? 'Ödeme Başarılı!' : 'Payment Successful!';
  const thanks = lang === 'tr' ? 'Ödemeniz başarıyla alındı.' : 'Your payment has been received.';
  const currencySymbol = ({ EUR: '€', USD: '$', GBP: '£', TRY: '₺' } as Record<string, string>)[data.currency] || data.currency;
  
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:30px;text-align:center;">
  <h1 style="color:#fff;margin:0;font-size:24px;">✅ ${title}</h1>
  <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:14px;">${thanks}</p>
</td></tr>
<tr><td style="padding:30px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:20px;">
    <tr><td style="padding:20px;">
      <p style="margin:0 0 10px;color:#1e293b;font-weight:bold;">Reservation: ${data.reservation_code}</p>
      <p style="margin:5px 0;color:#64748b;font-size:14px;">📍 ${data.pickup} → ${data.dropoff}</p>
      <p style="margin:5px 0;color:#64748b;font-size:14px;">📅 ${data.pickup_date} - ${data.pickup_time}</p>
      <p style="margin:10px 0 0;color:#10b981;font-size:20px;font-weight:bold;">${currencySymbol}${data.price}</p>
    </td></tr>
  </table>
  <p style="text-align:center;color:#64748b;font-size:13px;">Payment via ${data.payment_provider}</p>
</td></tr>
<tr><td style="background:#1e293b;padding:20px;text-align:center;">
  <p style="color:#94a3b8;font-size:12px;margin:0;">Meet Transfer - info@meettransfer.app</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function generateAgencyPaymentSuccessEmail(data: any, lang: string = 'en'): string {
  return generatePaymentSuccessEmail({ ...data, agency_name: data.agency_name }, lang);
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmationRequest {
  reservationId: string;
  paymentProvider: "stripe" | "paypal";
  quickBookingId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reservationId, paymentProvider, quickBookingId }: PaymentConfirmationRequest = await req.json();

    if (!reservationId && !quickBookingId) {
      throw new Error("Reservation ID or Quick Booking ID is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let reservation: any = null;
    let customerEmail: string | null = null;
    let agencyEmail: string | null = null;
    let agencyName: string | null = null;
    let language = 'en';

    // Get reservation details
    if (reservationId) {
      const { data, error: fetchError } = await supabase
        .from("reservations")
        .select("*, agencies(agency_name, user_id)")
        .eq("id", reservationId)
        .single();

      if (fetchError || !data) {
        throw new Error("Reservation not found");
      }
      reservation = data;

      // Get customer email from auth if customer_id exists
      if (reservation.customer_id) {
        const { data: userData } = await supabase.auth.admin.getUserById(reservation.customer_id);
        if (userData?.user?.email) {
          customerEmail = userData.user.email;
        }
      }

      // Try to get email from quick_booking_requests
      if (!customerEmail) {
        const { data: quickBookings } = await supabase
          .from("quick_booking_requests")
          .select("customer_email, language")
          .or(`confirmation_token.eq.${reservation.reservation_code},customer_phone.eq.${reservation.customer_phone}`)
          .limit(1);

        if (quickBookings?.[0]) {
          customerEmail = quickBookings[0].customer_email;
          language = quickBookings[0].language || 'en';
        }
      }

      // Get agency email if this is an agency reservation
      if (reservation.agency_id && reservation.agencies) {
        agencyName = reservation.agencies.agency_name;
        const agencyUserId = reservation.agencies.user_id;
        if (agencyUserId) {
          const { data: agencyUser } = await supabase.auth.admin.getUserById(agencyUserId);
          if (agencyUser?.user?.email) {
            agencyEmail = agencyUser.user.email;
          }
        }
      }
    }

    // If quick booking ID provided, get details from there
    if (quickBookingId && !reservation) {
      const { data: quickBooking, error } = await supabase
        .from("quick_booking_requests")
        .select("*, agencies(agency_name, user_id)")
        .eq("id", quickBookingId)
        .single();

      if (error || !quickBooking) {
        console.log("Quick booking not found:", quickBookingId);
      } else {
        customerEmail = quickBooking.customer_email;
        language = quickBooking.language || 'en';
        
        // Create a reservation-like object for email
        reservation = {
          reservation_code: quickBooking.confirmation_token?.slice(0, 8).toUpperCase() || quickBookingId.slice(0, 8).toUpperCase(),
          id: quickBookingId,
          pickup: quickBooking.pickup,
          dropoff: quickBooking.dropoff,
          pickup_date: quickBooking.pickup_date,
          pickup_time: quickBooking.pickup_time,
          vehicle_type: quickBooking.vehicle_type,
          price: quickBooking.price,
          price_currency: quickBooking.price_currency || 'EUR',
          customer_name: quickBooking.customer_name || 'Customer',
          customer_phone: quickBooking.customer_phone,
          customer_notes: quickBooking.customer_notes,
        };

        // Get agency email if agency reservation
        if (quickBooking.agency_id && quickBooking.agencies) {
          agencyName = quickBooking.agencies.agency_name;
          const agencyUserId = quickBooking.agencies.user_id;
          if (agencyUserId) {
            const { data: agencyUser } = await supabase.auth.admin.getUserById(agencyUserId);
            if (agencyUser?.user?.email) {
              agencyEmail = agencyUser.user.email;
            }
          }
        }
      }
    }

    if (!reservation) {
      throw new Error("No reservation data found");
    }

    console.log("Sending payment confirmation emails for:", reservation.reservation_code || reservation.id);
    console.log("Customer email:", customerEmail || "not found");
    console.log("Agency email:", agencyEmail || "not applicable");
    console.log("Language:", language);

    const emailPromises: Promise<any>[] = [];

    // Send email to customer
    if (RESEND_API_KEY && customerEmail && customerEmail.includes("@")) {
      const customerEmailHtml = generatePaymentSuccessEmail(
        {
          reservation_code: reservation.reservation_code || reservation.id.slice(0, 8).toUpperCase(),
          reservation_id: reservationId || reservation.id,
          pickup: reservation.pickup,
          dropoff: reservation.dropoff,
          pickup_date: reservation.pickup_date,
          pickup_time: reservation.pickup_time,
          vehicle_type: reservation.vehicle_type,
          price: reservation.price,
          currency: reservation.price_currency || 'EUR',
          customer_name: reservation.customer_name,
          customer_phone: reservation.customer_phone,
          customer_notes: reservation.customer_notes,
          payment_provider: paymentProvider,
          passenger_names: reservation.passenger_names,
        },
        language
      );

      const customerSubject = language === 'tr' 
        ? `✅ Ödeme Başarılı - ${reservation.reservation_code || reservation.id.slice(0, 8).toUpperCase()}`
        : `✅ Payment Successful - ${reservation.reservation_code || reservation.id.slice(0, 8).toUpperCase()}`;

      emailPromises.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Meet Transfer <no-reply@mail.meettransfer.app>",
            reply_to: "info@meettransfer.app",
            to: [customerEmail],
            subject: customerSubject,
            html: customerEmailHtml,
          }),
        }).then(async (res) => {
          if (!res.ok) {
            console.error("Customer email send failed:", await res.text());
          } else {
            console.log("Customer payment confirmation email sent to:", customerEmail);
          }
        })
      );
    }

    // Send email to agency if applicable
    if (RESEND_API_KEY && agencyEmail && agencyEmail.includes("@")) {
      const agencyEmailHtml = generateAgencyPaymentSuccessEmail(
        {
          reservation_code: reservation.reservation_code || reservation.id.slice(0, 8).toUpperCase(),
          reservation_id: reservationId || reservation.id,
          pickup: reservation.pickup,
          dropoff: reservation.dropoff,
          pickup_date: reservation.pickup_date,
          pickup_time: reservation.pickup_time,
          vehicle_type: reservation.vehicle_type,
          price: reservation.price,
          currency: reservation.price_currency || 'EUR',
          customer_name: reservation.customer_name,
          customer_phone: reservation.customer_phone,
          agency_name: agencyName || undefined,
          payment_provider: paymentProvider,
        },
        language
      );

      const agencySubject = language === 'tr'
        ? `✅ Rezervasyon Ödemesi Alındı - ${reservation.reservation_code || reservation.id.slice(0, 8).toUpperCase()}`
        : `✅ Reservation Payment Received - ${reservation.reservation_code || reservation.id.slice(0, 8).toUpperCase()}`;

      emailPromises.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Meet Transfer <no-reply@mail.meettransfer.app>",
            reply_to: "info@meettransfer.app",
            to: [agencyEmail],
            subject: agencySubject,
            html: agencyEmailHtml,
          }),
        }).then(async (res) => {
          if (!res.ok) {
            console.error("Agency email send failed:", await res.text());
          } else {
            console.log("Agency payment confirmation email sent to:", agencyEmail);
          }
        })
      );
    }

    // Wait for all emails to be sent
    await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({ 
        success: true,
        customerEmailSent: !!customerEmail,
        agencyEmailSent: !!agencyEmail 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending payment confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
