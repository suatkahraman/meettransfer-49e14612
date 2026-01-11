import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VehiclePrice {
  vehicleType: string;
  price: number | null;
  currency: string;
}

interface SendVehiclePricesRequest {
  customerEmail: string;
  pickup: string;
  dropoff: string;
  pickupDate: string;
  pickupTime: string;
  passengers: number;
  vehiclePrices: VehiclePrice[];
  selectedVehicle: string;
  selectedPrice: number;
  language?: string;
}

const vehicleLabels: Record<string, { name: string; description: string; icon: string }> = {
  "mercedes-vito": { 
    name: "Mercedes Vito", 
    description: "Comfortable minivan for up to 6 passengers",
    icon: "🚐"
  },
  "vip-mercedes": { 
    name: "VIP Mercedes V-Class", 
    description: "Luxury VIP transfer with premium amenities",
    icon: "✨"
  },
  "maybach": { 
    name: "Maybach Minivan", 
    description: "Ultra-luxury experience with Maybach comfort",
    icon: "👑"
  },
  "minibus": { 
    name: "Mercedes Sprinter Minibus", 
    description: "Spacious minibus for groups up to 12 passengers",
    icon: "🚌"
  },
};

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    TRY: "₺",
    AED: "د.إ",
    AUD: "A$",
  };
  return symbols[currency] || currency;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const requestData: SendVehiclePricesRequest = await req.json();

    console.log("Sending vehicle prices email to:", requestData.customerEmail);

    const {
      customerEmail,
      pickup,
      dropoff,
      pickupDate,
      pickupTime,
      passengers,
      vehiclePrices,
      selectedVehicle,
      selectedPrice,
    } = requestData;

    // Validate email
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format date
    const formattedDate = new Date(pickupDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Get currency from first price
    const currency = vehiclePrices[0]?.currency || "EUR";
    const currencySymbol = getCurrencySymbol(currency);

    // Build vehicle prices HTML
    const vehiclePricesHtml = vehiclePrices
      .filter(vp => vp.price !== null)
      .map(vp => {
        const vehicle = vehicleLabels[vp.vehicleType] || { 
          name: vp.vehicleType, 
          description: "", 
          icon: "🚗" 
        };
        const isSelected = vp.vehicleType === selectedVehicle;
        
        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 16px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 24px;">${vehicle.icon}</span>
                <div>
                  <p style="margin: 0; font-weight: 600; color: #1a365d; font-size: 16px;">
                    ${vehicle.name}
                    ${isSelected ? '<span style="background: #48bb78; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px;">SELECTED</span>' : ''}
                  </p>
                  <p style="margin: 4px 0 0; color: #666; font-size: 13px;">${vehicle.description}</p>
                </div>
              </div>
            </td>
            <td style="padding: 16px; text-align: right; font-size: 18px; font-weight: bold; color: ${isSelected ? '#48bb78' : '#1a365d'};">
              ${currencySymbol}${vp.price}
            </td>
          </tr>
        `;
      })
      .join("");

    const selectedVehicleInfo = vehicleLabels[selectedVehicle] || { name: selectedVehicle, icon: "🚗" };

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Meet Transfer</h1>
        <p style="color: #cbd5e0; margin: 10px 0 0; font-size: 14px;">Your Premium Transfer Service</p>
      </td>
    </tr>
    
    <!-- Main Content -->
    <tr>
      <td style="padding: 30px 20px;">
        <!-- Price Quote Badge -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border-radius: 12px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="color: #ffffff; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Price Quote</p>
              <p style="color: #ffffff; margin: 8px 0 0; font-size: 32px; font-weight: 700;">${currencySymbol}${selectedPrice}</p>
              <p style="color: #c6f6d5; margin: 8px 0 0; font-size: 14px;">${selectedVehicleInfo.icon} ${selectedVehicleInfo.name}</p>
            </td>
          </tr>
        </table>

        <!-- Trip Details -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; border-radius: 12px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 16px; color: #1a365d; font-weight: 600; font-size: 16px;">📍 Transfer Details</p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0;">
                    <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase;">From</p>
                    <p style="margin: 4px 0 0; color: #2d3748; font-size: 14px; font-weight: 500;">${pickup}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase;">To</p>
                    <p style="margin: 4px 0 0; color: #2d3748; font-size: 14px; font-weight: 500;">${dropoff}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%">
                          <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase;">Date</p>
                          <p style="margin: 4px 0 0; color: #2d3748; font-size: 14px; font-weight: 500;">${formattedDate}</p>
                        </td>
                        <td width="25%">
                          <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase;">Time</p>
                          <p style="margin: 4px 0 0; color: #2d3748; font-size: 14px; font-weight: 500;">${pickupTime}</p>
                        </td>
                        <td width="25%">
                          <p style="margin: 0; color: #718096; font-size: 12px; text-transform: uppercase;">Passengers</p>
                          <p style="margin: 4px 0 0; color: #2d3748; font-size: 14px; font-weight: 500;">${passengers} 👤</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- All Vehicle Options -->
        <p style="margin: 0 0 16px; color: #1a365d; font-weight: 600; font-size: 16px;">🚗 All Available Vehicles</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          ${vehiclePricesHtml}
        </table>

        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
          <tr>
            <td style="text-align: center;">
              <a href="https://meet-transfer.com" style="display: inline-block; background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Complete Your Booking
              </a>
            </td>
          </tr>
        </table>

        <!-- Features -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; background-color: #f0fff4; border-radius: 8px;">
          <tr>
            <td style="padding: 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="25%" style="text-align: center; padding: 8px;">
                    <p style="margin: 0; font-size: 20px;">✈️</p>
                    <p style="margin: 4px 0 0; color: #2d3748; font-size: 11px;">Flight Tracking</p>
                  </td>
                  <td width="25%" style="text-align: center; padding: 8px;">
                    <p style="margin: 0; font-size: 20px;">⏰</p>
                    <p style="margin: 4px 0 0; color: #2d3748; font-size: 11px;">60 Min Free Wait</p>
                  </td>
                  <td width="25%" style="text-align: center; padding: 8px;">
                    <p style="margin: 0; font-size: 20px;">👨‍✈️</p>
                    <p style="margin: 4px 0 0; color: #2d3748; font-size: 11px;">Pro Drivers</p>
                  </td>
                  <td width="25%" style="text-align: center; padding: 8px;">
                    <p style="margin: 0; font-size: 20px;">💳</p>
                    <p style="margin: 4px 0 0; color: #2d3748; font-size: 11px;">Pay at Arrival</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Special Offer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; background: linear-gradient(135deg, #faf089 0%, #f6e05e 100%); border-radius: 8px;">
          <tr>
            <td style="padding: 16px; text-align: center;">
              <p style="margin: 0; font-size: 16px;">🎁 <strong>Round-Trip Discount!</strong></p>
              <p style="margin: 8px 0 0; color: #744210; font-size: 14px;">Book a return transfer and get <strong>40% OFF</strong> with code: <code style="background: #fff; padding: 2px 6px; border-radius: 4px;">MEET40RETURN</code></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #1a365d; padding: 20px; text-align: center;">
        <p style="color: #cbd5e0; margin: 0; font-size: 12px;">
          Need help? Contact us via WhatsApp or email
        </p>
        <p style="color: #4299e1; margin: 8px 0 0; font-size: 12px;">
          📧 info@meettransfer.app | 📱 +90 532 252 91 27
        </p>
        <p style="color: #718096; margin: 16px 0 0; font-size: 11px;">
          © ${new Date().getFullYear()} Meet Transfer. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const plainText = `
Meet Transfer - Your Price Quote

Selected Vehicle: ${selectedVehicleInfo.name}
Price: ${currencySymbol}${selectedPrice}

Transfer Details:
From: ${pickup}
To: ${dropoff}
Date: ${formattedDate}
Time: ${pickupTime}
Passengers: ${passengers}

All Available Vehicles:
${vehiclePrices
  .filter(vp => vp.price !== null)
  .map(vp => {
    const vehicle = vehicleLabels[vp.vehicleType] || { name: vp.vehicleType };
    return `- ${vehicle.name}: ${currencySymbol}${vp.price}`;
  })
  .join("\n")}

Book now at: https://meet-transfer.com

🎁 Special Offer: Book a round-trip and get 40% OFF your return transfer!
Use code: MEET40RETURN

Need help? Contact us:
📧 info@meettransfer.app
📱 +90 532 252 91 27
    `.trim();

    const { error: emailError } = await resend.emails.send({
      from: "Meet Transfer <noreply@mail.meettransfer.app>",
      to: [customerEmail],
      reply_to: "info@meettransfer.app",
      subject: `Your Transfer Quote: ${pickup} → ${dropoff}`,
      text: plainText,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      throw new Error(emailError.message || "Failed to send email");
    }

    console.log("Vehicle prices email sent successfully to:", customerEmail);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-vehicle-prices-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
