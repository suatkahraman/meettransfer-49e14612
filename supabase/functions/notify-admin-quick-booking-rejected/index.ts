import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  bookingId: string;
  pickup: string;
  dropoff: string;
  pickupDate: string;
  pickupTime: string;
  vehicleType: string;
  passengers: number;
  price: number;
  priceCurrency: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      bookingId,
      pickup,
      dropoff,
      pickupDate,
      pickupTime,
      vehicleType,
      passengers,
      price,
      priceCurrency,
    }: NotifyRequest = await req.json();

    console.log("Notifying admin about rejected quick booking:", bookingId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all admin users
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      throw rolesError;
    }

    const adminUserIds = adminRoles?.map((r) => r.user_id) || [];
    console.log("Found admin user IDs:", adminUserIds);

    // Create in-app notifications for all admins
    for (const userId of adminUserIds) {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "❌ Quick Booking Rejected",
        message: `Customer rejected price ${priceCurrency === "EUR" ? "€" : priceCurrency}${price} for ${pickup} → ${dropoff} on ${pickupDate}`,
        type: "quick_booking_rejected",
      });
      console.log("Created rejection notification for admin:", userId);
    }

    // Send push notifications to admins
    const { data: pushSubs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", adminUserIds);

    if (pushSubs && pushSubs.length > 0) {
      console.log("Sending push notifications to", pushSubs.length, "admin subscriptions");
      for (const sub of pushSubs) {
        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              subscription: {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              title: "❌ Quick Booking Rejected",
              body: `Customer rejected ${priceCurrency === "EUR" ? "€" : priceCurrency}${price} for ${pickup} → ${dropoff}`,
              url: "/admin/quick-bookings",
            },
          });
        } catch (pushError) {
          console.error("Push notification error:", pushError);
        }
      }
    }

    // Send email notification to admin
    const adminEmail = Deno.env.get("ADMIN");
    if (adminEmail && RESEND_API_KEY) {
      console.log("Sending rejection email notification to admin:", adminEmail);
      
      const vehicleLabels: Record<string, string> = {
        "mercedes-vito": "Mercedes Vito",
        "mercedes-vclass": "VIP Vito",
        maybach: "Maybach Minivan",
        minibus: "Minibus",
      };

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Meet Transfer <noreply@meettransfer.app>",
            to: [adminEmail],
            subject: `❌ Quick Booking Rejected - ${pickup} → ${dropoff}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Booking Rejected</title>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #ef4444; margin: 0; font-size: 28px;">❌ Booking Rejected</h1>
                    <p style="color: #666; margin-top: 10px;">A customer has rejected their quick booking price</p>
                  </div>
                  
                  <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
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
                    
                    <div style="margin-bottom: 12px;">
                      <span style="color: #666;">Vehicle:</span>
                      <strong style="color: #333; margin-left: 8px;">${vehicleLabels[vehicleType] || vehicleType}</strong>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                      <span style="color: #666;">Passengers:</span>
                      <strong style="color: #333; margin-left: 8px;">${passengers}</strong>
                    </div>
                  </div>
                  
                  <div style="background: #ef4444; border-radius: 12px; padding: 24px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 16px;">Rejected Price</p>
                    <p style="margin: 8px 0 0 0; font-size: 36px; font-weight: bold; text-decoration: line-through;">
                      ${priceCurrency === "EUR" ? "€" : priceCurrency === "USD" ? "$" : priceCurrency === "GBP" ? "£" : "₺"}${price}
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 24px;">
                    <a href="https://meettransfer.app/admin/quick-bookings" 
                       style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                      View Quick Bookings
                    </a>
                  </div>
                  
                  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                    The customer may request a new quote with different requirements.
                  </p>
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
          console.log("Admin rejection email sent successfully");
        }
      } catch (emailError) {
        console.error("Email send error:", emailError);
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
    console.error("Error in notify-admin-quick-booking-rejected:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
