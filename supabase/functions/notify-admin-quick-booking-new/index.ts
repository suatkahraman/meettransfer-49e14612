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
  priceCurrency?: string;
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
      priceCurrency,
    }: NotifyRequest = await req.json();

    console.log("Notifying admin about new quick booking request:", bookingId);
    console.log("Request details - passengers:", passengers, "currency:", priceCurrency);

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

    // Vehicle labels
    const vehicleLabels: Record<string, string> = {
      "mercedes-vito": "Mercedes Vito",
      "mercedes-vclass": "VIP Vito",
      maybach: "Maybach Minivan",
      minibus: "Minibus",
    };
    
    // Build notification message with all details
    const currencyInfo = priceCurrency ? `\n💰 Preferred: ${priceCurrency}` : "";
    const notificationMessage = `${pickup} → ${dropoff}\n📅 ${pickupDate} ${pickupTime}\n🚗 ${vehicleLabels[vehicleType] || vehicleType}\n👥 ${passengers} passengers${currencyInfo}`;

    // Create in-app notifications for all admins
    for (const userId of adminUserIds) {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "📥 New Quick Booking Request",
        message: notificationMessage,
        type: "quick_booking_new",
      });
      console.log("Created notification for admin:", userId);
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
              title: "📥 New Quick Booking Request",
              body: `${pickup} → ${dropoff} | ${passengers} pax | ${pickupDate}`,
              url: "/admin/quick-bookings",
            },
          });
        } catch (pushError) {
          console.error("Push notification error:", pushError);
        }
      }
    }

    // Send WhatsApp notification to admin
    try {
      const whatsAppMessage = `📥 *Yeni Hızlı Rezervasyon*\n\n📍 ${pickup} → ${dropoff}\n📅 ${pickupDate} saat ${pickupTime}\n🚗 ${vehicleLabels[vehicleType] || vehicleType}\n👥 ${passengers} yolcu${priceCurrency ? `\n💰 Para birimi: ${priceCurrency}` : ""}\n\n⏳ Fiyat belirlemek için panele gidin:\nhttps://meettransfer.app/admin/quick-bookings`;

      await supabase.functions.invoke("send-whatsapp-admin", {
        body: {
          title: "Yeni Quick Booking",
          message: whatsAppMessage,
        },
      });
      console.log("WhatsApp notification sent to admin");
    } catch (whatsappError) {
      console.error("WhatsApp notification error:", whatsappError);
    }

    // Send email notification to admin
    const adminEmailRaw = Deno.env.get("ADMIN");
    const adminEmails = Array.from(
      new Set(
        (adminEmailRaw?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []).map((e) =>
          e.trim().toLowerCase()
        )
      )
    );

    const maskEmail = (email: string) => {
      const [local = "", domain = ""] = email.split("@");
      const maskedLocal = local.length <= 2 ? `${local[0] ?? "*"}*` : `${local.slice(0, 2)}***`;
      return `${maskedLocal}@${domain}`;
    };

    if (adminEmails.length > 0 && RESEND_API_KEY) {
      console.log("Sending email notification to admin:", adminEmails.map(maskEmail));

      try {
        const currencyHtml = priceCurrency
          ? `<div style="margin-bottom: 12px;">
               <span style="color: #666;">Preferred Currency:</span>
               <strong style="color: #16a34a; margin-left: 8px;">${priceCurrency}</strong>
             </div>`
          : "";

        const primaryFrom = "Meet Transfer <noreply@mail.meettransfer.app>";
        const fallbackFrom = "Meet Transfer <onboarding@resend.dev>";

        const sendEmail = async (from: string) => {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from,
              to: adminEmails,
              subject: `📥 New Quick Booking Request - ${pickup} → ${dropoff}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>New Quick Booking Request</title>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
                  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">📥 New Quick Booking Request</h1>
                      <p style="color: #666; margin-top: 10px;">A customer has submitted a new quick booking request</p>
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

                      ${currencyHtml}
                    </div>

                    <div style="background: #3b82f6; border-radius: 12px; padding: 24px; text-align: center; color: white;">
                      <p style="margin: 0; font-size: 16px;">⏳ Awaiting Your Price Quote</p>
                      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">
                        Please set a price for this booking
                      </p>
                    </div>

                    <div style="text-align: center; margin-top: 24px;">
                      <a href="https://meettransfer.app/admin/quick-bookings"
                         style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                        Set Price Now
                      </a>
                    </div>

                    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                      The customer is waiting for your price quote.
                    </p>
                  </div>
                </body>
                </html>
              `,
            }),
          });

          const text = await res.text();
          return { ok: res.ok, status: res.status, text };
        };

        const primary = await sendEmail(primaryFrom);
        if (!primary.ok) {
          console.error("Email send failed (primary from):", primary.status, primary.text);
          const fallback = await sendEmail(fallbackFrom);
          if (!fallback.ok) {
            console.error("Email send failed (fallback from):", fallback.status, fallback.text);
          } else {
            console.log("Admin email sent successfully (fallback).");
          }
        } else {
          console.log("Admin email sent successfully.");
        }
      } catch (emailError) {
        console.error("Email send error:", emailError);
      }
    } else {
      console.log("Skipping email - missing RESEND_API_KEY or no valid ADMIN email(s).");
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-admin-quick-booking-new:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});