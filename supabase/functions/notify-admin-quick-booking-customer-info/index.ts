import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  reservationId: string;
  reservationCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickup: string;
  dropoff: string;
  pickupDate: string;
  pickupTime: string;
  vehicleType: string;
  price: number;
  priceCurrency: string;
  paymentMethod: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      reservationId,
      reservationCode,
      customerName,
      customerEmail,
      customerPhone,
      pickup,
      dropoff,
      pickupDate,
      pickupTime,
      vehicleType,
      price,
      priceCurrency,
      paymentMethod,
    }: NotifyRequest = await req.json();

    console.log("Notifying admin about customer info completion:", reservationCode);

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
        reservation_id: reservationId,
        title: "✅ Quick Booking Complete",
        message: `${customerName} completed reservation ${reservationCode} - ${pickup} → ${dropoff}`,
        type: "quick_booking_complete",
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
              title: "✅ Quick Booking Complete",
              body: `${customerName} - ${reservationCode} ready for driver assignment`,
              url: "/admin/reservations",
            },
          });
        } catch (pushError) {
          console.error("Push notification error:", pushError);
        }
      }
    }

    // Send email notification to admin
    // NOTE: We intentionally do NOT log raw env values here (they may contain sensitive data).
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

      const vehicleLabels: Record<string, string> = {
        "mercedes-vito": "Mercedes Vito",
        "mercedes-vclass": "VIP Vito",
        maybach: "Maybach Minivan",
        minibus: "Minibus",
      };

      const currencySymbols: Record<string, string> = {
        TRY: "₺",
        EUR: "€",
        USD: "$",
        GBP: "£",
      };

      const paymentLabels: Record<string, string> = {
        cash: "💵 Cash to Driver",
        payment_link: "💳 Online Payment",
      };

      try {
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
              subject: `✅ Quick Booking Complete - ${reservationCode} - ${customerName}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Quick Booking Complete</title>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
                  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <h1 style="color: #22c55e; margin: 0; font-size: 28px;">✅ Quick Booking Complete</h1>
                      <p style="color: #666; margin-top: 10px;">Customer has completed all information - ready for driver assignment</p>
                    </div>

                    <div style="background: #22c55e; border-radius: 12px; padding: 16px; text-align: center; color: white; margin-bottom: 24px;">
                      <p style="margin: 0; font-size: 14px;">Reservation Code</p>
                      <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">${reservationCode}</p>
                    </div>

                    <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                      <h2 style="color: #166534; margin: 0 0 16px 0; font-size: 18px;">👤 Customer Information</h2>

                      <div style="margin-bottom: 12px;">
                        <span style="color: #666;">Name:</span>
                        <strong style="color: #333; margin-left: 8px;">${customerName}</strong>
                      </div>

                      <div style="margin-bottom: 12px;">
                        <span style="color: #666;">Email:</span>
                        <strong style="color: #333; margin-left: 8px;">${customerEmail}</strong>
                      </div>

                      <div style="margin-bottom: 12px;">
                        <span style="color: #666;">Phone:</span>
                        <strong style="color: #333; margin-left: 8px;">${customerPhone}</strong>
                      </div>
                    </div>

                    <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                      <h2 style="color: #333; margin: 0 0 16px 0; font-size: 18px;">🚗 Transfer Details</h2>

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
                        <span style="color: #666;">Payment:</span>
                        <strong style="color: #333; margin-left: 8px;">${paymentLabels[paymentMethod] || paymentMethod}</strong>
                      </div>
                    </div>

                    <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 12px; padding: 24px; text-align: center; color: white;">
                      <p style="margin: 0; font-size: 16px;">Total Price</p>
                      <p style="margin: 8px 0 0 0; font-size: 36px; font-weight: bold;">
                        ${currencySymbols[priceCurrency] || priceCurrency}${price}
                      </p>
                    </div>

                    <div style="text-align: center; margin-top: 24px;">
                      <a href="https://meettransfer.app/admin/reservations"
                         style="display: inline-block; background: #22c55e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-right: 8px;">
                        Assign Driver
                      </a>
                    </div>

                    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                      This reservation is now in your main reservations list and ready for driver assignment.
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
    console.error("Error in notify-admin-quick-booking-customer-info:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
