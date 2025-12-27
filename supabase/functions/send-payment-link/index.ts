import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendPaymentLinkRequest {
  quickBookingId: string;
  reservationId?: string;
  paymentLink: string;
  customerEmail: string;
  customerName?: string;
  pickup: string;
  dropoff: string;
  pickupDate: string;
  pickupTime: string;
  price: number;
  priceCurrency: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      quickBookingId,
      reservationId,
      paymentLink,
      customerEmail,
      customerName,
      pickup,
      dropoff,
      pickupDate,
      pickupTime,
      price,
      priceCurrency,
    }: SendPaymentLinkRequest = await req.json();

    console.log("Sending payment link to customer:", customerEmail);

    if (!customerEmail) {
      throw new Error("Customer email is required");
    }

    if (!paymentLink) {
      throw new Error("Payment link is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update quick booking request with payment link
    const { error: updateError } = await supabase
      .from("quick_booking_requests")
      .update({ payment_link: paymentLink })
      .eq("id", quickBookingId);

    if (updateError) {
      console.error("Error updating quick booking:", updateError);
      throw updateError;
    }

    // Also update the reservation if reservationId is provided
    if (reservationId) {
      const { error: resUpdateError } = await supabase
        .from("reservations")
        .update({ payment_link: paymentLink })
        .eq("id", reservationId);

      if (resUpdateError) {
        console.error("Error updating reservation:", resUpdateError);
        // Don't throw, just log - the quick booking update succeeded
      } else {
        console.log("Reservation payment link updated:", reservationId);
      }
    }

    // Get currency symbol
    const currencySymbol = 
      priceCurrency === "EUR" ? "€" :
      priceCurrency === "USD" ? "$" :
      priceCurrency === "GBP" ? "£" :
      priceCurrency === "AED" ? "د.إ" : "₺";

    // Send email to customer with payment link
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Meet Transfer <noreply@mail.meettransfer.app>",
        to: [customerEmail],
        subject: `Payment Link for Your Transfer - ${pickup} → ${dropoff}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Link</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">💳 Your Payment Link</h1>
                <p style="color: #666; margin-top: 10px;">Complete your payment securely online</p>
              </div>
              
              ${customerName ? `<p style="color: #333; font-size: 16px;">Dear ${customerName},</p>` : ''}
              
              <p style="color: #666; font-size: 15px; line-height: 1.6;">
                Thank you for choosing Meet Transfer! Please use the link below to complete your payment for the following transfer:
              </p>
              
              <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #333; margin: 0 0 16px 0; font-size: 18px;">Transfer Details</h2>
                
                <div style="margin-bottom: 12px;">
                  <span style="color: #666;">From:</span>
                  <strong style="color: #333; margin-left: 8px;">${pickup}</strong>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <span style="color: #666;">To:</span>
                  <strong style="color: #333; margin-left: 8px;">${dropoff}</strong>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <span style="color: #666;">Date:</span>
                  <strong style="color: #333; margin-left: 8px;">${pickupDate}</strong>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <span style="color: #666;">Time:</span>
                  <strong style="color: #333; margin-left: 8px;">${pickupTime}</strong>
                </div>
              </div>
              
              <div style="background: #3b82f6; border-radius: 12px; padding: 24px; text-align: center; color: white; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 16px;">Amount to Pay</p>
                <p style="margin: 8px 0 0 0; font-size: 36px; font-weight: bold;">
                  ${currencySymbol}${price}
                </p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${paymentLink}" 
                   style="display: inline-block; background: #22c55e; color: white; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 18px;">
                  Pay Now
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: #3b82f6; font-size: 14px; text-align: center; word-break: break-all;">
                ${paymentLink}
              </p>
              
              <div style="border-top: 1px solid #eee; margin-top: 32px; padding-top: 24px;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                  This is a secure payment link. Your payment information is protected.<br>
                  If you have any questions, please contact us.
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
      throw new Error("Failed to send payment link email");
    }

    console.log("Payment link email sent successfully to:", customerEmail);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-payment-link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
