import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEmailHeader, getEmailFooter } from "../_shared/emailTemplates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  reservation_id: string;
}

const currencySymbols: Record<string, string> = {
  'TRY': '₺',
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
  'AED': 'د.إ',
  'AUD': 'A$',
};

const vehicleTypeLabels: Record<string, string> = {
  'mercedes-vito': 'Mercedes Vito',
  'mercedes-vclass': 'Mercedes Vip Vito',
  'maybach': 'Maybach',
  'minibus': 'Minibus',
};

const getVehicleLabel = (vehicleType: string): string => {
  return vehicleTypeLabels[vehicleType] || vehicleType.replace(/-/g, ' ');
};

// Helper function to format location display (place_name + address)
const formatLocation = (placeName: string | null, address: string): string => {
  if (!placeName || placeName === address) {
    return address;
  }
  // Check if address already contains the place name to avoid duplication
  if (address.toLowerCase().includes(placeName.toLowerCase())) {
    return address;
  }
  return `${placeName}<br/><span style="color: #888; font-size: 12px;">${address}</span>`;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reservation_id }: ConfirmationEmailRequest = await req.json();

    if (!reservation_id) {
      throw new Error("reservation_id is required");
    }

    console.log("Sending confirmation email for reservation:", reservation_id);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch reservation with driver details including place names
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select(`
        *,
        drivers (name, phone, plate_number, vehicle_model)
      `)
      .eq("id", reservation_id)
      .single();

    if (fetchError || !reservation) {
      throw new Error("Reservation not found: " + fetchError?.message);
    }

    // Get customer email from auth.users via profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", reservation.customer_id)
      .single();

    if (profileError || !profile) {
      console.log("Profile not found, cannot send email");
      return new Response(
        JSON.stringify({ success: false, message: "Customer profile not found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(reservation.customer_id);

    if (userError || !user?.email) {
      console.log("User email not found:", userError?.message);
      return new Response(
        JSON.stringify({ success: false, message: "Customer email not found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const customerEmail = user.email;
    const currencySymbol = currencySymbols[reservation.price_currency || 'TRY'] || reservation.price_currency || '';
    const priceDisplay = reservation.price ? `${currencySymbol}${reservation.price}` : 'To be confirmed';

    // Format passengers list
    const passengersList = reservation.passenger_names && reservation.passenger_names.length > 0
      ? reservation.passenger_names.map((name: string, i: number) => `${i + 1}. ${name}`).join('<br>')
      : reservation.customer_name;

    // Format location displays with place_name + address
    const pickupDisplay = formatLocation(reservation.pickup_place_name, reservation.pickup);
    const dropoffDisplay = formatLocation(reservation.dropoff_place_name, reservation.dropoff);

    // Driver info
    const driverInfo = reservation.drivers
      ? `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Driver Name:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${reservation.drivers.name}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Vehicle:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${reservation.drivers.vehicle_model || '-'} ${reservation.drivers.plate_number ? `(${reservation.drivers.plate_number})` : ''}</td>
        </tr>
      `
      : `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Driver:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">Will be assigned soon</td>
        </tr>
      `;

    const emailHtml = `
${getEmailHeader('✅ Reservation Confirmed', `Thank you for choosing Meet Transfer!`)}
<tr>
  <td style="padding:30px 25px;">
    <!-- Reservation Code -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);border-radius:12px;margin-bottom:25px;">
      <tr>
        <td style="padding:25px;text-align:center;">
          <p style="color:#94a3b8;margin:0;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Reservation Code</p>
          <p style="color:#fdd835;margin:10px 0 0;font-size:32px;font-weight:bold;letter-spacing:4px;">${reservation.reservation_code || 'N/A'}</p>
        </td>
      </tr>
    </table>

    <!-- Transfer Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:20px;border:1px solid #e2e8f0;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 15px;color:#1e293b;font-weight:bold;font-size:15px;">📍 Transfer Details</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;width:120px;">Date & Time</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${reservation.pickup_date} at ${reservation.pickup_time}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Pick-up</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${pickupDisplay}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Drop-off</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">${dropoffDisplay}</td>
          </tr>
          ${reservation.flight_number ? `
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Flight</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">✈️ ${reservation.flight_number}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Vehicle</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">🚐 ${getVehicleLabel(reservation.vehicle_type)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Passengers</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:500;">👥 ${passengersList}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Price</td>
            <td style="padding:8px 0;color:#10b981;font-size:16px;font-weight:bold;">${priceDisplay}</td>
          </tr>
          ${reservation.driver_notes ? `
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Notes</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${reservation.driver_notes}</td>
          </tr>
          ` : ''}
        </table>
      </td></tr>
    </table>

    ${reservation.drivers ? `
    <!-- Driver Info -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:12px;margin-bottom:20px;border:1px solid #bfdbfe;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 12px;color:#1e40af;font-weight:bold;font-size:14px;">🚗 Your Driver</p>
        <p style="margin:5px 0;color:#1e3a8a;font-size:14px;"><strong>Name:</strong> ${reservation.drivers.name}</p>
        <p style="margin:5px 0;color:#1e3a8a;font-size:14px;"><strong>Vehicle:</strong> ${reservation.drivers.vehicle_model || '-'} ${reservation.drivers.plate_number ? `(${reservation.drivers.plate_number})` : ''}</p>
      </td></tr>
    </table>
    ` : `
    <!-- Driver Pending -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:12px;margin-bottom:20px;border:1px solid #fbbf24;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="margin:0;color:#92400e;font-size:14px;">🚗 Driver will be assigned soon. We'll notify you!</p>
      </td></tr>
    </table>
    `}

    <!-- Confirmation Banner -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:25px;text-align:center;">
          <p style="color:#fff;margin:0;font-size:18px;font-weight:bold;">✅ Your transfer is confirmed!</p>
          <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:14px;">Please save your reservation code for reference.</p>
        </td>
      </tr>
    </table>

    <!-- What's Included -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 12px;color:#166534;font-weight:bold;font-size:14px;">✨ What's Included</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:4px 0;color:#15803d;font-size:13px;">✓ Professional English-speaking driver</td></tr>
          <tr><td style="padding:4px 0;color:#15803d;font-size:13px;">✓ Real-time flight tracking</td></tr>
          <tr><td style="padding:4px 0;color:#15803d;font-size:13px;">✓ 60 min free waiting at airport</td></tr>
          <tr><td style="padding:4px 0;color:#15803d;font-size:13px;">✓ Meet & greet with name sign</td></tr>
          <tr><td style="padding:4px 0;color:#15803d;font-size:13px;">✓ 24/7 customer support</td></tr>
        </table>
      </td></tr>
    </table>
  </td>
</tr>
${getEmailFooter()}
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Meet Transfer <noreply@mail.meettransfer.app>",
        reply_to: "info@meettransfer.app",
        to: [customerEmail],
        subject: `Reservation Confirmed - ${reservation.reservation_code || 'Meet Transfer'}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
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
