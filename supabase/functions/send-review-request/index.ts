import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReviewRequestPayload {
  reservationId: string;
  customerEmail: string;
  customerName: string;
  driverName: string;
  reservationCode: string;
  pickupDate: string;
  pickup: string;
  dropoff: string;
  pickupPlaceName?: string;
  dropoffPlaceName?: string;
}

// Helper function to format location display (place_name + address)
const formatLocation = (placeName: string | null | undefined, address: string): string => {
  if (!placeName || placeName === address) {
    return address;
  }
  // Check if address already contains the place name to avoid duplication
  if (address.toLowerCase().includes(placeName.toLowerCase())) {
    return address;
  }
  return `${placeName} (${address})`;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-review-request function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ReviewRequestPayload = await req.json();
    console.log("Received payload:", payload);

    const {
      reservationId,
      customerEmail,
      customerName,
      driverName,
      reservationCode,
      pickupDate,
      pickup,
      dropoff,
      pickupPlaceName,
      dropoffPlaceName,
    } = payload;

    if (!customerEmail || !reservationId) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reviewUrl = `https://meettransfer.app/customer/review/${reservationId}`;

    // Format route display with place names
    const pickupDisplay = formatLocation(pickupPlaceName, pickup);
    const dropoffDisplay = formatLocation(dropoffPlaceName, dropoff);
    const routeDisplay = `${pickupDisplay} → ${dropoffDisplay}`;

    console.log("Sending review request email to:", customerEmail);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Meet Transfer <info@meettransfer.app>",
        reply_to: "info@meettransfer.app",
        to: [customerEmail],
        subject: "How was your Meet Transfer experience?",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Rate Your Driver</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #111111 0%, #333333 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #fdd835; margin: 0; font-size: 28px; font-weight: bold;">Meet Transfer</h1>
                <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your Journey, Our Priority</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #111111; margin: 0 0 20px; font-size: 24px; text-align: center;">
                  How was your transfer experience?
                </h2>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                  Dear ${customerName || "Valued Customer"},
                </p>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                  Thank you for choosing Meet Transfer! We hope you had a pleasant journey. We'd love to hear your feedback about your recent transfer.
                </p>
                
                <!-- Reservation Details -->
                <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                  <h3 style="color: #111111; margin: 0 0 15px; font-size: 16px; font-weight: 600;">Transfer Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #888888; font-size: 14px; width: 40%;">Reservation Code:</td>
                      <td style="padding: 8px 0; color: #111111; font-size: 14px; font-weight: 600;">${reservationCode}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #888888; font-size: 14px;">Date:</td>
                      <td style="padding: 8px 0; color: #111111; font-size: 14px;">${pickupDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #888888; font-size: 14px;">Driver:</td>
                      <td style="padding: 8px 0; color: #111111; font-size: 14px; font-weight: 600;">${driverName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #888888; font-size: 14px;">Route:</td>
                      <td style="padding: 8px 0; color: #111111; font-size: 14px;">${routeDisplay}</td>
                    </tr>
                  </table>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${reviewUrl}" style="display: inline-block; background-color: #fdd835; color: #111111; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 12px rgba(253, 216, 53, 0.4);">
                    ⭐ Rate Your Driver
                  </a>
                </div>
                
                <p style="color: #888888; font-size: 14px; text-align: center; margin: 30px 0 0;">
                  Your feedback helps us maintain the highest standards of service.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8f8f8; padding: 25px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="color: #888888; font-size: 13px; margin: 0;">
                  © ${new Date().getFullYear()} Meet Transfer. All rights reserved.
                </p>
                <p style="color: #aaaaaa; font-size: 12px; margin: 10px 0 0;">
                  Istanbul, Turkey | +90 532 174 83 90
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-review-request function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
