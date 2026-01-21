import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmationRequest {
  reservationId: string;
  paymentProvider: "stripe" | "paypal";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reservationId, paymentProvider }: PaymentConfirmationRequest = await req.json();

    if (!reservationId) {
      throw new Error("Reservation ID is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get reservation details
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", reservationId)
      .single();

    if (fetchError || !reservation) {
      throw new Error("Reservation not found");
    }

    // Get customer email from quick booking if available
    let customerEmail = reservation.customer_phone; // Fallback
    const { data: quickBooking } = await supabase
      .from("quick_booking_requests")
      .select("customer_email")
      .eq("id", reservationId)
      .single();

    if (quickBooking?.customer_email) {
      customerEmail = quickBooking.customer_email;
    }

    // Try to get email from agency details
    const { data: agencyDetails } = await supabase
      .from("agency_reservation_details")
      .select("*")
      .eq("reservation_id", reservationId)
      .single();

    console.log("Sending payment confirmation for reservation:", reservationId);

    // Get currency symbol
    const currencySymbol = 
      reservation.price_currency === "EUR" ? "€" :
      reservation.price_currency === "USD" ? "$" :
      reservation.price_currency === "GBP" ? "£" :
      reservation.price_currency === "AED" ? "د.إ" :
      reservation.price_currency === "AUD" ? "A$" : "₺";

    // Send confirmation email
    if (RESEND_API_KEY && customerEmail && customerEmail.includes("@")) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Meet Transfer <noreply@mail.meettransfer.app>",
          to: [customerEmail],
          subject: `Payment Confirmed - ${reservation.reservation_code || reservation.id.slice(0, 8)}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Payment Confirmed</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #22c55e; margin: 0; font-size: 28px;">✓ Payment Confirmed</h1>
                  <p style="color: #666; margin-top: 10px;">Thank you for your payment!</p>
                </div>
                
                <p style="color: #333; font-size: 16px;">Dear ${reservation.customer_name},</p>
                
                <p style="color: #666; font-size: 15px; line-height: 1.6;">
                  Your payment has been successfully processed via ${paymentProvider === 'stripe' ? 'Credit Card' : 'PayPal'}. 
                  Your transfer is now confirmed!
                </p>
                
                <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <h2 style="color: #166534; margin: 0 0 16px 0; font-size: 18px;">Booking Confirmed</h2>
                  
                  <div style="margin-bottom: 12px;">
                    <span style="color: #666;">Reservation Code:</span>
                    <strong style="color: #333; margin-left: 8px; font-size: 18px;">${reservation.reservation_code || reservation.id.slice(0, 8).toUpperCase()}</strong>
                  </div>
                  
                  <div style="margin-bottom: 12px;">
                    <span style="color: #666;">Amount Paid:</span>
                    <strong style="color: #22c55e; margin-left: 8px; font-size: 20px;">${currencySymbol}${reservation.price}</strong>
                  </div>
                </div>
                
                <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <h3 style="color: #333; margin: 0 0 16px 0; font-size: 16px;">Transfer Details</h3>
                  
                  <div style="margin-bottom: 12px;">
                    <span style="color: #666;">From:</span>
                    <strong style="color: #333; margin-left: 8px;">${reservation.pickup}</strong>
                  </div>
                  
                  <div style="margin-bottom: 12px;">
                    <span style="color: #666;">To:</span>
                    <strong style="color: #333; margin-left: 8px;">${reservation.dropoff}</strong>
                  </div>
                  
                  <div style="margin-bottom: 12px;">
                    <span style="color: #666;">Date:</span>
                    <strong style="color: #333; margin-left: 8px;">${reservation.pickup_date}</strong>
                  </div>
                  
                  <div style="margin-bottom: 12px;">
                    <span style="color: #666;">Time:</span>
                    <strong style="color: #333; margin-left: 8px;">${reservation.pickup_time}</strong>
                  </div>
                </div>
                
                <p style="color: #666; font-size: 14px; text-align: center; margin-top: 24px;">
                  Your driver details will be sent closer to your pickup time.
                </p>
                
                <div style="border-top: 1px solid #eee; margin-top: 32px; padding-top: 24px;">
                  <p style="color: #999; font-size: 12px; text-align: center;">
                    If you have any questions, please contact us.<br>
                    Thank you for choosing Meet Transfer!
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.text();
        console.error("Email send failed:", errorData);
      } else {
        console.log("Payment confirmation email sent to:", customerEmail);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
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
