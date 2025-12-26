import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendPriceRequest {
  quick_booking_id: string;
  price: number;
  currency: string;
  customer_email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { quick_booking_id, price, currency, customer_email }: SendPriceRequest = await req.json();

    console.log("Sending price notification for quick booking:", quick_booking_id);

    // Fetch the quick booking request details
    const { data: booking, error: bookingError } = await supabase
      .from("quick_booking_requests")
      .select("*")
      .eq("id", quick_booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", bookingError);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate the confirmation link
    const confirmUrl = `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")?.replace("https://", "https://")}/quick-booking-confirm?token=${booking.confirmation_token}`;
    
    // Use a more reliable URL construction
    const baseUrl = "https://meettransfer.lovable.app"; // You may want to make this configurable
    const finalConfirmUrl = `${baseUrl}/quick-booking-confirm?token=${booking.confirmation_token}`;

    // Format currency symbol
    const currencySymbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "TRY" ? "₺" : currency;

    // Format date
    const pickupDate = new Date(booking.pickup_date).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Vehicle type labels
    const vehicleLabels: Record<string, string> = {
      "mercedes-vito": "Mercedes Vito",
      "mercedes-vclass": "VIP Mercedes V-Class",
      "maybach": "Maybach Minivan",
      "minibus": "Mercedes Sprinter Minibus",
    };

    const vehicleName = vehicleLabels[booking.vehicle_type] || booking.vehicle_type;

    // If customer email is provided, send email
    if (customer_email) {
      console.log("Sending email to:", customer_email);

      const emailResponse = await resend.emails.send({
        from: "Meet Transfer <noreply@meettransfer.app>",
        to: [customer_email],
        subject: `Your Transfer Quote: ${currencySymbol}${price} - Meet Transfer`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Transfer Quote</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Meet Transfer</h1>
                <p style="color: #cbd5e0; margin: 10px 0 0 0; font-size: 14px;">Premium Airport Transfer Service</p>
              </div>

              <!-- Content -->
              <div style="padding: 30px 20px;">
                <h2 style="color: #1a365d; margin: 0 0 20px 0; font-size: 24px;">Your Price Quote</h2>
                
                <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                  Thank you for your transfer request! We're pleased to offer you the following quote:
                </p>

                <!-- Price Box -->
                <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
                  <p style="color: rgba(255,255,255,0.9); margin: 0 0 5px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Transfer Price</p>
                  <p style="color: #ffffff; margin: 0; font-size: 48px; font-weight: bold;">${currencySymbol}${price}</p>
                </div>

                <!-- Transfer Details -->
                <div style="background-color: #f7fafc; border-radius: 12px; padding: 20px; margin: 25px 0;">
                  <h3 style="color: #1a365d; margin: 0 0 15px 0; font-size: 18px;">Transfer Details</h3>
                  
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px 0; color: #718096; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Pick-up</td>
                      <td style="padding: 10px 0; color: #2d3748; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px solid #e2e8f0;">${booking.pickup}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #718096; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Drop-off</td>
                      <td style="padding: 10px 0; color: #2d3748; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px solid #e2e8f0;">${booking.dropoff}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #718096; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Date</td>
                      <td style="padding: 10px 0; color: #2d3748; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px solid #e2e8f0;">${pickupDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #718096; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Time</td>
                      <td style="padding: 10px 0; color: #2d3748; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px solid #e2e8f0;">${booking.pickup_time}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #718096; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Vehicle</td>
                      <td style="padding: 10px 0; color: #2d3748; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px solid #e2e8f0;">${vehicleName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #718096; font-size: 14px;">Passengers</td>
                      <td style="padding: 10px 0; color: #2d3748; font-size: 14px; font-weight: 500; text-align: right;">${booking.passengers}</td>
                    </tr>
                  </table>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${finalConfirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    ✓ Confirm Booking
                  </a>
                </div>

                <p style="color: #718096; font-size: 14px; text-align: center; margin: 20px 0;">
                  Or copy this link: <a href="${finalConfirmUrl}" style="color: #2c5282;">${finalConfirmUrl}</a>
                </p>

                <!-- Features -->
                <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
                  <p style="color: #4a5568; font-size: 14px; margin: 5px 0;">✓ Professional English-speaking drivers</p>
                  <p style="color: #4a5568; font-size: 14px; margin: 5px 0;">✓ Flight tracking included</p>
                  <p style="color: #4a5568; font-size: 14px; margin: 5px 0;">✓ Free waiting time at airport</p>
                  <p style="color: #4a5568; font-size: 14px; margin: 5px 0;">✓ 24/7 customer support</p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #1a365d; padding: 20px; text-align: center;">
                <p style="color: #cbd5e0; margin: 0; font-size: 12px;">
                  © ${new Date().getFullYear()} Meet Transfer. All rights reserved.
                </p>
                <p style="color: #cbd5e0; margin: 10px 0 0 0; font-size: 12px;">
                  Questions? Contact us via WhatsApp or email
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log("Email sent successfully:", emailResponse);
    }

    return new Response(
      JSON.stringify({ success: true, confirmUrl: finalConfirmUrl }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-quick-booking-price function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
