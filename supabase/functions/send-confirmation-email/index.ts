import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reservation Confirmed - Meet Transfer</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #fdd835 0%, #f9a825 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #111; margin: 0; font-size: 28px;">Reservation Confirmed</h1>
          <p style="color: #333; margin-top: 10px; font-size: 16px;">Thank you for choosing Meet Transfer!</p>
        </div>
        
        <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">Reservation Code</p>
            <p style="margin: 5px 0 0; font-size: 28px; font-weight: bold; color: #111; letter-spacing: 2px;">${reservation.reservation_code || 'N/A'}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Date & Time:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${reservation.pickup_date} at ${reservation.pickup_time}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Pick-up:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${pickupDisplay}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Drop-off:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${dropoffDisplay}</td>
            </tr>
            ${reservation.flight_number ? `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Flight Number:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${reservation.flight_number}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Vehicle:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${getVehicleLabel(reservation.vehicle_type)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Price:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #2e7d32;">${priceDisplay}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Passengers:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${passengersList}</td>
            </tr>
            ${driverInfo}
            ${reservation.driver_notes ? `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Notes:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${reservation.driver_notes}</td>
            </tr>
            ` : ''}
          </table>

          <div style="margin-top: 30px; padding: 20px; background: #e8f5e9; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #2e7d32; font-weight: bold;">Your transfer is confirmed!</p>
            <p style="margin: 10px 0 0; color: #555; font-size: 14px;">Please save your reservation code for reference.</p>
          </div>

          <div style="margin-top: 20px; text-align: center; color: #888; font-size: 12px;">
            <p>If you have any questions, please contact us via WhatsApp.</p>
            <p>© 2025 Meet Transfer. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
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
