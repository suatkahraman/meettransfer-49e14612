import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getVehicleLabel, VEHICLE_LABELS } from "../_shared/vehicleConfig.ts";
import { getCurrencySymbol } from "../_shared/currencyUtils.ts";

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
  // Return trip info (optional)
  return_price?: number; // Discounted price (if promo applied)
  original_return_price?: number; // Original price before discount
  return_date?: string;
  return_time?: string;
  promo_code?: string;
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

    const { 
      quick_booking_id, 
      price, 
      currency, 
      customer_email,
      return_price,
      original_return_price,
      return_date,
      return_time,
      promo_code
    }: SendPriceRequest = await req.json();

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

    // Format currency symbol using shared utility
    const currencySymbol = getCurrencySymbol(currency);

    // Format date
    const pickupDate = new Date(booking.pickup_date).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Format return date if exists
    const formattedReturnDate = return_date 
      ? new Date(return_date).toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

    // Vehicle type label using shared utility
    const vehicleName = getVehicleLabel(booking.vehicle_type);

    // Calculate discount if promo code exists
    const hasReturnTrip = return_price !== undefined && return_date && return_time;
    // Use original_return_price if provided, otherwise calculate from discounted price
    const originalReturnPrice = hasReturnTrip && promo_code && original_return_price !== undefined
      ? original_return_price
      : null;
    const discountAmount = originalReturnPrice && return_price !== undefined
      ? originalReturnPrice - return_price
      : null;

    // Calculate total
    const totalPrice = hasReturnTrip ? price + return_price : price;

    const toEmail = customer_email ?? booking.customer_email ?? null;
    let emailSent = false;
    let usedFrom: string | null = null;

    if (toEmail) {
      console.log("Sending email to:", toEmail);

      const fromEmail = "Meet Transfer <info@meettransfer.app>";

      // Build return trip text for plain text email
      const returnTripText = hasReturnTrip ? `

🔄 Return Transfer:
- From: ${booking.dropoff}
- To: ${booking.pickup}
- Date: ${formattedReturnDate}
- Time: ${return_time}
${promo_code && originalReturnPrice ? `- Original Price: ${currencySymbol}${originalReturnPrice}` : ''}
${promo_code && discountAmount ? `- Discount (30%): -${currencySymbol}${discountAmount}` : ''}
- Price: ${currencySymbol}${return_price}
${promo_code ? `- Promo Code: ${promo_code} ✓` : ''}

Total: ${currencySymbol}${totalPrice}
${promo_code && discountAmount ? `You save: ${currencySymbol}${discountAmount}` : ''}
` : '';

      // Build return trip HTML
      const returnTripHtml = hasReturnTrip ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#e8f5e9;border-radius:8px;margin:20px 0;">
          <tr><td style="padding:15px;">
            <p style="margin:0 0 10px;color:#2e7d32;font-weight:bold;">🔄 Return Transfer</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>From:</strong> ${booking.dropoff}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>To:</strong> ${booking.pickup}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Date:</strong> ${formattedReturnDate}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Time:</strong> ${return_time}</p>
            ${promo_code && originalReturnPrice ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:6px;margin:10px 0;border:1px dashed #2e7d32;">
              <tr><td style="padding:12px;">
                <p style="margin:0 0 5px;color:#666;font-size:13px;text-decoration:line-through;">Original: ${currencySymbol}${originalReturnPrice}</p>
                <p style="margin:0 0 5px;color:#2e7d32;font-size:14px;font-weight:bold;">🎉 Discount (30%): -${currencySymbol}${discountAmount}</p>
                <p style="margin:0;color:#1a365d;font-size:16px;font-weight:bold;">Final Price: ${currencySymbol}${return_price}</p>
                <p style="margin:8px 0 0;color:#2e7d32;font-size:12px;background-color:#e8f5e9;padding:4px 8px;border-radius:4px;display:inline-block;">✓ Promo Code: ${promo_code}</p>
              </td></tr>
            </table>
            ` : `<p style="margin:5px 0;color:#333;font-size:14px;"><strong>Price:</strong> ${currencySymbol}${return_price}</p>`}
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a365d;border-radius:8px;margin:20px 0;">
          <tr><td style="padding:15px;text-align:center;">
            <p style="margin:0;color:#fff;font-size:24px;font-weight:bold;">Total: ${currencySymbol}${totalPrice}</p>
            ${promo_code && discountAmount ? `<p style="margin:8px 0 0;color:#48bb78;font-size:14px;">🎉 You save ${currencySymbol}${discountAmount} with promo code!</p>` : ''}
          </td></tr>
        </table>
      ` : '';

      try {
        const emailResponse = await resend.emails.send({
          from: fromEmail,
          to: [toEmail],
          reply_to: "info@meettransfer.app",
          subject: hasReturnTrip 
            ? `Transfer Quote (Round Trip) - ${pickupDate}` 
            : `Transfer Quote - ${pickupDate}`,
          text: `
Meet Transfer - Your Transfer Quote

${hasReturnTrip ? '➡️ Outbound Transfer:' : 'Transfer Details:'}
- From: ${booking.pickup}
- To: ${booking.dropoff}
- Date: ${pickupDate}
- Time: ${booking.pickup_time}
- Vehicle: ${vehicleName}
- Passengers: ${booking.passengers}
- Price: ${currencySymbol}${price}
${returnTripText}
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
        ${hasReturnTrip ? '<p style="color:#48bb78;margin:5px 0 0;font-size:14px;">Round Trip Quote</p>' : ''}
      </td>
    </tr>
    <tr>
      <td style="padding:30px 20px;">
        <p style="color:#333;font-size:16px;margin:0 0 20px;">Thank you for your transfer request. Here is your quote:</p>
        
        ${!hasReturnTrip ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#48bb78;border-radius:8px;margin:20px 0;">
          <tr>
            <td style="padding:20px;text-align:center;">
              <p style="color:#fff;margin:0;font-size:14px;">Your Price</p>
              <p style="color:#fff;margin:5px 0 0;font-size:36px;font-weight:bold;">${currencySymbol}${price}</p>
            </td>
          </tr>
        </table>
        ` : ''}

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7fafc;border-radius:8px;margin:20px 0;">
          <tr><td style="padding:15px;">
            <p style="margin:0 0 10px;color:#1a365d;font-weight:bold;">${hasReturnTrip ? '➡️ Outbound Transfer' : 'Transfer Details'}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>From:</strong> ${booking.pickup}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>To:</strong> ${booking.dropoff}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Date:</strong> ${pickupDate}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Time:</strong> ${booking.pickup_time}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Vehicle:</strong> ${vehicleName}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Passengers:</strong> ${booking.passengers}</p>
            ${hasReturnTrip ? `<p style="margin:10px 0 0;color:#1a365d;font-size:16px;font-weight:bold;">Price: ${currencySymbol}${price}</p>` : ''}
          </td></tr>
        </table>

        ${returnTripHtml}

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
      <td style="background-color:#1a365d;padding:25px;text-align:center;">
        <p style="color:#fff;margin:0 0 15px;font-size:14px;font-weight:bold;">Need Help? Contact Us</p>
        <div>
          <a href="https://wa.me/15558051101" style="display:inline-block;background:#25D366;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:13px;margin:5px;">💬 WhatsApp Chat</a>
          <a href="mailto:info@meettransfer.app" style="display:inline-block;background:#48bb78;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:13px;margin:5px;">✉️ info@meettransfer.app</a>
        </div>
        <div style="margin-top:15px;">
          <a href="https://www.instagram.com/meettransfer" style="display:inline-block;width:32px;height:32px;background:linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);border-radius:6px;text-align:center;line-height:32px;text-decoration:none;color:white;font-size:16px;margin:0 4px;" title="Instagram">📷</a>
          <a href="https://www.facebook.com/share/17w6b51DcX/" style="display:inline-block;width:32px;height:32px;background:#1877f2;border-radius:6px;text-align:center;line-height:32px;text-decoration:none;color:white;font-size:16px;margin:0 4px;" title="Facebook">📘</a>
          <a href="https://x.com/MeetTransfer" style="display:inline-block;width:32px;height:32px;background:#000;border-radius:6px;text-align:center;line-height:32px;text-decoration:none;color:white;font-size:16px;margin:0 4px;" title="X (Twitter)">𝕏</a>
          <a href="https://www.youtube.com/@meettransfer" style="display:inline-block;width:32px;height:32px;background:#ff0000;border-radius:6px;text-align:center;line-height:32px;text-decoration:none;color:white;font-size:16px;margin:0 4px;" title="YouTube">▶️</a>
        </div>
        <p style="color:#94a3b8;margin:15px 0 0;font-size:11px;">© 2025 Meet Transfer. All rights reserved.</p>
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
