import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getVehicleLabel, VEHICLE_LABELS } from "../_shared/vehicleConfig.ts";
import { getCurrencySymbol } from "../_shared/currencyUtils.ts";
import { getEmailHeader, getEmailFooter } from "../_shared/emailTemplates.ts";

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

// Helper function to send push notification to a user
async function sendPushNotification(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  url?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: { user_id: userId, title, body, url },
    });
    
    if (error) {
      console.error("Push notification error:", error);
      return false;
    }
    
    console.log("Push notification sent:", data);
    return true;
  } catch (err) {
    console.error("Failed to send push notification:", err);
    return false;
  }
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
    
    // Get discount percentage from database - fallback to default config
    let discountPercent = 25; // Default fallback
    
    if (promo_code) {
      const { data: promoData, error: promoError } = await supabase
        .from('promo_codes')
        .select('discount_percentage')
        .eq('code', promo_code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
      
      if (promoData && !promoError) {
        discountPercent = promoData.discount_percentage;
        console.log(`Using discount from DB: ${discountPercent}% for code ${promo_code}`);
      } else {
        // Fallback to hardcoded config only if DB lookup fails
        const PROMO_CODE_CONFIG: Record<string, number> = {
          'MEET25RETURN': 25,
          'GIDISDONUS': 25,
          'RETURN25': 25,
          'MEET10': 10,
          'WELCOME10': 10,
        };
        discountPercent = PROMO_CODE_CONFIG[promo_code.toUpperCase()] || 25;
        console.log(`Using fallback discount: ${discountPercent}% for code ${promo_code}`);
      }
    }
    
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

      const fromEmail = "Meet Transfer <noreply@mail.meettransfer.app>";

      // Build return trip text for plain text email
      const returnTripText = hasReturnTrip ? `

🔄 Return Transfer:
- From: ${booking.dropoff}
- To: ${booking.pickup}
- Date: ${formattedReturnDate}
- Time: ${return_time}
${promo_code && originalReturnPrice ? `- Original Price: ${currencySymbol}${originalReturnPrice}` : ''}
${promo_code && discountAmount ? `- Discount (${discountPercent}%): -${currencySymbol}${discountAmount}` : ''}
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
                <p style="margin:0 0 5px;color:#2e7d32;font-size:14px;font-weight:bold;">🎉 Discount (${discountPercent}%): -${currencySymbol}${discountAmount}</p>
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
${getEmailHeader(hasReturnTrip ? '🚗 Round Trip Quote' : '🚗 Your Transfer Quote', 'Thank you for your transfer request!')}
<tr>
  <td style="padding:30px 25px;">
    <p style="color:#333;font-size:16px;margin:0 0 25px;line-height:1.6;">We're delighted to provide you with a personalized quote for your upcoming transfer.</p>
    
    ${!hasReturnTrip ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);border-radius:12px;margin:25px 0;">
      <tr>
        <td style="padding:25px;text-align:center;">
          <p style="color:rgba(255,255,255,0.9);margin:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Your Transfer Price</p>
          <p style="color:#fff;margin:10px 0 0;font-size:42px;font-weight:bold;">${currencySymbol}${price}</p>
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- Transfer Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin:20px 0;border:1px solid #e2e8f0;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 15px;color:#1e293b;font-weight:bold;font-size:15px;">${hasReturnTrip ? '➡️ Outbound Transfer' : '📍 Transfer Details'}</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;width:100px;">From</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${booking.pickup}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">To</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${booking.dropoff}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Date</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${pickupDate}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Time</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${booking.pickup_time}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Vehicle</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">🚐 ${vehicleName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Passengers</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">👥 ${booking.passengers}</td>
          </tr>
        </table>
        ${hasReturnTrip ? `<p style="margin:15px 0 0;color:#10b981;font-size:18px;font-weight:bold;">Price: ${currencySymbol}${price}</p>` : ''}
      </td></tr>
    </table>

    ${returnTripHtml}

    <!-- What's Included -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:12px;margin:20px 0;border:1px solid #bfdbfe;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 12px;color:#1e40af;font-weight:bold;font-size:14px;">✨ What's Included</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:4px 0;color:#1e3a8a;font-size:13px;">✓ Professional English-speaking driver</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#1e3a8a;font-size:13px;">✓ Real-time flight tracking</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#1e3a8a;font-size:13px;">✓ 60 min free waiting at airport</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#1e3a8a;font-size:13px;">✓ Meet & greet with name sign</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#1e3a8a;font-size:13px;">✓ 24/7 customer support</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#1e3a8a;font-size:13px;">✓ Free cancellation up to 24h before</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;padding:25px 0;">
          <a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);color:#1a1a2e;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:17px;font-weight:bold;box-shadow:0 4px 15px rgba(251,191,36,0.3);">Confirm & Book Now</a>
        </td>
      </tr>
    </table>

    <p style="text-align:center;color:#94a3b8;font-size:12px;margin:15px 0 0;">⏰ This quote is valid for 24 hours</p>
  </td>
</tr>
${getEmailFooter()}`.trim(),
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

    // Send push notification if customer has an account with push subscription
    let pushSent = false;
    if (toEmail) {
      try {
        // Find user by email in auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (!userError && userData?.users) {
          const matchingUser = userData.users.find(
            (u: any) => u.email?.toLowerCase() === toEmail.toLowerCase()
          );
          
          if (matchingUser) {
            console.log("Found matching user for push notification:", matchingUser.id);
            
            // Check if user has push subscription
            const { data: subscriptions } = await supabase
              .from("push_subscriptions")
              .select("id")
              .eq("user_id", matchingUser.id)
              .limit(1);
            
            if (subscriptions && subscriptions.length > 0) {
              const currencySymbol = getCurrencySymbol(currency);
              const pushTitle = "💰 Fiyat Teklifiniz Hazır!";
              const pushBody = `Transfer fiyatınız: ${currencySymbol}${price}. Hemen onaylayın!`;
              const pushUrl = `/quick-booking-confirm?token=${booking.confirmation_token}`;
              
              pushSent = await sendPushNotification(
                supabase,
                matchingUser.id,
                pushTitle,
                pushBody,
                pushUrl
              );
              
              console.log("Push notification result:", pushSent);
            } else {
              console.log("User has no push subscriptions");
            }
          } else {
            console.log("No matching user found for email:", toEmail);
          }
        }
      } catch (pushErr) {
        console.error("Error sending push notification:", pushErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, confirmUrl, emailSent, toEmail, usedFrom, pushSent }),
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
