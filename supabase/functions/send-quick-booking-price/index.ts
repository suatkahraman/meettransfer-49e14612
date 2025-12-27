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

    const { quick_booking_id, price, currency, customer_email }: SendPriceRequest =
      await req.json();

    console.log("Sending price notification for quick booking:", quick_booking_id);

    // Fetch the quick booking request details
    const { data: booking, error: bookingError } = await supabase
      .from("quick_booking_requests")
      .select("*")
      .eq("id", quick_booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", bookingError);
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Build confirmation link
    const baseUrl = "https://meettransfer.app";
    const confirmUrl = `${baseUrl}/quick-booking-confirm?token=${booking.confirmation_token}`;

    // Format currency symbol
    const currencySymbol =
      currency === "EUR"
        ? "€"
        : currency === "USD"
          ? "$"
          : currency === "GBP"
            ? "£"
            : currency === "TRY"
              ? "₺"
              : currency === "AED"
                ? "د.إ"
                : currency === "AUD"
                  ? "A$"
                  : currency;

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
      maybach: "Maybach Minivan",
      minibus: "Mercedes Sprinter Minibus",
    };

    const vehicleName = vehicleLabels[booking.vehicle_type] || booking.vehicle_type;

    const toEmail = customer_email ?? booking.customer_email ?? null;
    let emailSent = false;
    let usedFrom: string | null = null;

    if (toEmail) {
      console.log("Sending email to:", toEmail);

      const fromEmail = "Meet Transfer <info@meettransfer.app>";

      try {
        const emailResponse = await resend.emails.send({
          from: fromEmail,
          to: [toEmail],
          reply_to: "info@meettransfer.app",
          subject: `Transfer Quote - ${pickupDate}`,
          text: `
Meet Transfer - Your Transfer Quote

Price: ${currencySymbol}${price}

Transfer Details:
- From: ${booking.pickup}
- To: ${booking.dropoff}
- Date: ${pickupDate}
- Time: ${booking.pickup_time}
- Vehicle: ${vehicleName}
- Passengers: ${booking.passengers}

To confirm your booking, please visit:
${confirmUrl}

What's included:
- Professional English-speaking driver
- Flight tracking
- Free waiting time at airport
- 24/7 customer support

Questions? Reply to this email or contact us via WhatsApp.

Best regards,
Meet Transfer Team
          `.trim(),
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <tr>
      <td style="background-color:#1a365d;padding:20px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">Meet Transfer</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:30px 20px;">
        <p style="color:#333;font-size:16px;margin:0 0 20px;">Thank you for your transfer request. Here is your quote:</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#48bb78;border-radius:8px;margin:20px 0;">
          <tr>
            <td style="padding:20px;text-align:center;">
              <p style="color:#fff;margin:0;font-size:14px;">Your Price</p>
              <p style="color:#fff;margin:5px 0 0;font-size:36px;font-weight:bold;">${currencySymbol}${price}</p>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7fafc;border-radius:8px;margin:20px 0;">
          <tr><td style="padding:15px;">
            <p style="margin:0 0 10px;color:#1a365d;font-weight:bold;">Transfer Details</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>From:</strong> ${booking.pickup}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>To:</strong> ${booking.dropoff}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Date:</strong> ${pickupDate}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Time:</strong> ${booking.pickup_time}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Vehicle:</strong> ${vehicleName}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Passengers:</strong> ${booking.passengers}</p>
          </td></tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:center;padding:20px 0;">
              <a href="${confirmUrl}" style="display:inline-block;background-color:#1a365d;color:#ffffff;text-decoration:none;padding:14px 30px;border-radius:6px;font-size:16px;font-weight:bold;">Confirm Booking</a>
            </td>
          </tr>
        </table>

        <p style="color:#666;font-size:13px;margin:20px 0 0;">
          Professional driver • Flight tracking • Free waiting time • 24/7 support
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#f0f0f0;padding:15px;text-align:center;">
        <p style="color:#666;margin:0;font-size:12px;">Meet Transfer | info@meettransfer.app</p>
      </td>
    </tr>
  </table>
</body>
</html>
          `.trim(),
        });

        if ((emailResponse as any)?.error) throw (emailResponse as any).error;
        usedFrom = fromEmail;
        emailSent = true;
        console.log("Email sent successfully:", emailResponse);
      } catch (emailErr) {
        console.error("Failed to send email:", emailErr);
      }
    } else {
      console.log("No customer email available; skipping email send for quick booking:", quick_booking_id);
    }

    return new Response(
      JSON.stringify({ success: true, confirmUrl, emailSent, toEmail, usedFrom }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-quick-booking-price function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
