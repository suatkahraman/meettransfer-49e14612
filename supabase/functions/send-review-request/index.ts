import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReviewRequestPayload {
  reservationId: string;
  customerEmail?: string;
  customerName?: string;
  driverName?: string;
  reservationCode?: string;
  pickupDate?: string;
  pickup?: string;
  dropoff?: string;
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

    const { reservationId } = payload;

    if (!reservationId) {
      console.error("Missing reservationId");
      return new Response(
        JSON.stringify({ error: "Missing reservationId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client to fetch reservation and customer data
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch reservation data
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        *,
        drivers (name)
      `)
      .eq('id', reservationId)
      .maybeSingle();

    if (reservationError || !reservation) {
      console.error("Reservation not found:", reservationError);
      return new Response(
        JSON.stringify({ error: "Reservation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to get customer email
    let customerEmail = payload.customerEmail || '';
    
    if (!customerEmail && reservation.customer_id) {
      // Try to get email from auth.users using service role
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(reservation.customer_id);
      if (!userError && userData?.user?.email) {
        customerEmail = userData.user.email;
      }
    }

    if (!customerEmail) {
      console.log("No customer email found, skipping review request");
      return new Response(
        JSON.stringify({ success: false, message: "No customer email available" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerName = payload.customerName || reservation.customer_name || "Valued Customer";
    const driverName = payload.driverName || reservation.drivers?.name || "Your driver";
    const reservationCode = payload.reservationCode || reservation.reservation_code || reservationId.slice(0, 8).toUpperCase();
    const pickupDate = payload.pickupDate || reservation.pickup_date;
    const pickup = payload.pickup || reservation.pickup;
    const dropoff = payload.dropoff || reservation.dropoff;
    const pickupPlaceName = payload.pickupPlaceName || reservation.pickup_place_name;
    const dropoffPlaceName = payload.dropoffPlaceName || reservation.dropoff_place_name;

    const reviewUrl = `https://meettransfer.app/customer/review/${reservationId}`;

    // Format route display with place names
    const pickupDisplay = formatLocation(pickupPlaceName, pickup);
    const dropoffDisplay = formatLocation(dropoffPlaceName, dropoff);
    const routeDisplay = `${pickupDisplay} → ${dropoffDisplay}`;

    // Format date
    const formattedDate = new Date(pickupDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log("Sending review request email to:", customerEmail);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Meet Transfer <noreply@mail.meettransfer.app>",
        reply_to: "info@meettransfer.app",
        to: [customerEmail],
        subject: "⭐ How was your Meet Transfer experience?",
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
              
              <!-- Success Banner -->
              <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 20px 30px; text-align: center;">
                <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">
                  ✅ Your transfer has been completed!
                </p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #111111; margin: 0 0 20px; font-size: 24px; text-align: center;">
                  How was your journey?
                </h2>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                  Dear ${customerName},
                </p>
                
                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                  Thank you for choosing Meet Transfer! We hope you had a pleasant and comfortable journey. Your feedback is incredibly valuable to us - it helps us maintain excellence and recognize our drivers.
                </p>
                
                <!-- Reservation Details -->
                <div style="background-color: #f8f8f8; border-radius: 12px; padding: 24px; margin: 0 0 30px; border-left: 4px solid #fdd835;">
                  <h3 style="color: #111111; margin: 0 0 15px; font-size: 16px; font-weight: 600;">📋 Transfer Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px 0; color: #888888; font-size: 14px; width: 40%; vertical-align: top;">Reservation:</td>
                      <td style="padding: 10px 0; color: #111111; font-size: 14px; font-weight: 700; background-color: #fdd835; border-radius: 4px; padding-left: 8px; padding-right: 8px; display: inline-block;">${reservationCode}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Date:</td>
                      <td style="padding: 10px 0; color: #111111; font-size: 14px;">${formattedDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Driver:</td>
                      <td style="padding: 10px 0; color: #111111; font-size: 14px; font-weight: 600;">👤 ${driverName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Route:</td>
                      <td style="padding: 10px 0; color: #111111; font-size: 14px;">📍 ${routeDisplay}</td>
                    </tr>
                  </table>
                </div>
                
                <!-- Star Rating Preview -->
                <div style="text-align: center; margin: 30px 0;">
                  <p style="color: #666666; font-size: 14px; margin: 0 0 15px;">Rate your experience:</p>
                  <div style="font-size: 36px; letter-spacing: 8px;">⭐⭐⭐⭐⭐</div>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${reviewUrl}" style="display: inline-block; background: linear-gradient(135deg, #fdd835 0%, #fbc02d 100%); color: #111111; text-decoration: none; padding: 18px 50px; border-radius: 30px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(253, 216, 53, 0.5); transition: all 0.3s ease;">
                    Rate Your Driver Now
                  </a>
                </div>
                
                <p style="color: #888888; font-size: 14px; text-align: center; margin: 30px 0 0;">
                  Your feedback helps us maintain the highest standards of service and rewards our best drivers. It only takes 30 seconds! 🙏
                </p>
              </div>
              
              <!-- Why Rate Section -->
              <div style="background-color: #f8f8f8; padding: 25px 30px; border-top: 1px solid #eeeeee;">
                <h3 style="color: #111111; margin: 0 0 15px; font-size: 14px; font-weight: 600; text-align: center;">Why your rating matters:</h3>
                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; text-align: center;">
                  <div style="flex: 1; min-width: 120px;">
                    <p style="font-size: 20px; margin: 0;">🏆</p>
                    <p style="color: #666666; font-size: 12px; margin: 5px 0 0;">Rewards top drivers</p>
                  </div>
                  <div style="flex: 1; min-width: 120px;">
                    <p style="font-size: 20px; margin: 0;">📈</p>
                    <p style="color: #666666; font-size: 12px; margin: 5px 0 0;">Improves our service</p>
                  </div>
                  <div style="flex: 1; min-width: 120px;">
                    <p style="font-size: 20px; margin: 0;">🤝</p>
                    <p style="color: #666666; font-size: 12px; margin: 5px 0 0;">Helps other travelers</p>
                  </div>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #111111; padding: 25px 30px; text-align: center;">
                <p style="color: #888888; font-size: 13px; margin: 0;">
                  © ${new Date().getFullYear()} Meet Transfer. All rights reserved.
                </p>
                <p style="color: #666666; font-size: 12px; margin: 10px 0 0;">
                  Istanbul, Turkey | +90 532 174 83 90
                </p>
                <p style="color: #fdd835; font-size: 11px; margin: 10px 0 0;">
                  <a href="https://meettransfer.app" style="color: #fdd835; text-decoration: none;">meettransfer.app</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Failed to send email:", emailData);
      return new Response(
        JSON.stringify({ success: false, error: emailData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Review request email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
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