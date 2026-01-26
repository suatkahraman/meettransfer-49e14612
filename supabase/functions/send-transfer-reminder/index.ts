import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to format location display
const formatLocation = (placeName: string | null | undefined, address: string): string => {
  if (!placeName || placeName === address) {
    return address;
  }
  if (address.toLowerCase().includes(placeName.toLowerCase())) {
    return address;
  }
  return `${placeName} (${address})`;
};

const getVehicleLabel = (vehicleType: string): string => {
  const labels: Record<string, string> = {
    'vito': 'Mercedes Vito VIP',
    'vito_vip': 'Mercedes Vito VIP',
    'sprinter': 'Mercedes Sprinter VIP',
    'sprinter_vip': 'Mercedes Sprinter VIP',
    'maybach': 'Mercedes Maybach Minivan',
    'maybach-minibus': 'Mercedes Maybach Minivan',
    'mercedes-maybach': 'Mercedes Maybach Minivan',
  };
  return labels[vehicleType] || vehicleType;
};

const sendCustomerReminderEmail = async (reservation: any, customerEmail: string) => {
  const pickupDisplay = formatLocation(reservation.pickup_place_name, reservation.pickup);
  const dropoffDisplay = formatLocation(reservation.dropoff_place_name, reservation.dropoff);
  
  const formattedDate = new Date(reservation.pickup_date).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const driverInfo = reservation.drivers ? `
    <tr>
      <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Driver:</td>
      <td style="padding: 10px 0; color: #111111; font-size: 14px; font-weight: 600;">👤 ${reservation.drivers.name}</td>
    </tr>
    ${reservation.drivers.phone ? `
    <tr>
      <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Driver Phone:</td>
      <td style="padding: 10px 0; color: #111111; font-size: 14px;">📱 ${reservation.drivers.phone}</td>
    </tr>
    ` : ''}
    ${reservation.drivers.vehicle_model ? `
    <tr>
      <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Vehicle:</td>
      <td style="padding: 10px 0; color: #111111; font-size: 14px;">🚗 ${reservation.drivers.vehicle_model}${reservation.drivers.plate_number ? ` (${reservation.drivers.plate_number})` : ''}</td>
    </tr>
    ` : ''}
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transfer Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #111111 0%, #333333 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #fdd835; margin: 0; font-size: 28px; font-weight: bold;">Meet Transfer</h1>
          <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your Journey, Our Priority</p>
        </div>
        
        <!-- Reminder Banner -->
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); padding: 20px 30px; text-align: center;">
          <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">
            ⏰ Your transfer is tomorrow!
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #111111; margin: 0 0 20px; font-size: 24px; text-align: center;">
            Transfer Reminder
          </h2>
          
          <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
            Dear ${reservation.customer_name},
          </p>
          
          <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
            This is a friendly reminder that your transfer is scheduled for <strong>tomorrow</strong>. Please make sure you're ready at the pickup location on time.
          </p>
          
          <!-- Reservation Code -->
          <div style="text-align: center; margin: 25px 0;">
            <span style="background-color: #fdd835; color: #111111; padding: 12px 24px; border-radius: 8px; font-size: 20px; font-weight: bold; display: inline-block;">
              ${reservation.reservation_code || reservation.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          
          <!-- Transfer Details -->
          <div style="background-color: #f8f8f8; border-radius: 12px; padding: 24px; margin: 0 0 30px; border-left: 4px solid #3B82F6;">
            <h3 style="color: #111111; margin: 0 0 15px; font-size: 16px; font-weight: 600;">📋 Transfer Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; width: 40%; vertical-align: top;">Date:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px; font-weight: 600;">📅 ${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Time:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px; font-weight: 600;">🕐 ${reservation.pickup_time}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Pickup:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px;">📍 ${pickupDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Dropoff:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px;">🏁 ${dropoffDisplay}</td>
              </tr>
              ${reservation.flight_number ? `
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Flight:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px;">✈️ ${reservation.flight_number}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Vehicle:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px;">🚐 ${getVehicleLabel(reservation.vehicle_type)}</td>
              </tr>
              ${driverInfo}
            </table>
          </div>
          
          <!-- Important Notes -->
          <div style="background-color: #FEF3C7; border-radius: 12px; padding: 20px; margin: 0 0 30px; border-left: 4px solid #F59E0B;">
            <h3 style="color: #92400E; margin: 0 0 10px; font-size: 14px; font-weight: 600;">⚠️ Important Reminders</h3>
            <ul style="color: #92400E; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Please be ready at the pickup location 5 minutes before the scheduled time</li>
              <li>Have your reservation code ready for the driver</li>
              <li>Keep your phone accessible in case the driver needs to contact you</li>
              ${reservation.flight_number ? '<li>If your flight is delayed, our driver will be notified automatically</li>' : ''}
            </ul>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://meettransfer.app/customer" style="display: inline-block; background: linear-gradient(135deg, #fdd835 0%, #fbc02d 100%); color: #111111; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(253, 216, 53, 0.5);">
              View Your Booking
            </a>
          </div>
          
          <p style="color: #888888; font-size: 14px; text-align: center; margin: 30px 0 0;">
            Need help? Contact us via WhatsApp</p>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #111111; padding: 25px 30px; text-align: center;">
          <p style="color: #888888; font-size: 13px; margin: 0;">
            © ${new Date().getFullYear()} Meet Transfer. All rights reserved.
          </p>
          <p style="color: #666666; font-size: 12px; margin: 10px 0 0;">
            WhatsApp: +1 (555) 805-1101 | Emergency: +90 532 174 83 90</p>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Meet Transfer <noreply@mail.meettransfer.app>",
      reply_to: "info@meettransfer.app",
      to: [customerEmail],
      subject: `⏰ Reminder: Your transfer is tomorrow - ${reservation.reservation_code || 'Meet Transfer'}`,
      html,
    }),
  });

  return response.ok;
};

const sendDriverReminderEmail = async (reservation: any, driverEmail: string, driverName: string) => {
  const pickupDisplay = formatLocation(reservation.pickup_place_name, reservation.pickup);
  const dropoffDisplay = formatLocation(reservation.dropoff_place_name, reservation.dropoff);
  
  const formattedDate = new Date(reservation.pickup_date).toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transfer Hatırlatması</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #111111 0%, #333333 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #fdd835; margin: 0; font-size: 28px; font-weight: bold;">Meet Transfer</h1>
          <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Sürücü Paneli</p>
        </div>
        
        <!-- Reminder Banner -->
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 20px 30px; text-align: center;">
          <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">
            ⏰ Yarın için transfer hatırlatması
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #111111; margin: 0 0 20px; font-size: 24px; text-align: center;">
            Transfer Hatırlatması
          </h2>
          
          <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
            Merhaba ${driverName},
          </p>
          
          <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
            Yarın için planlanmış bir transferiniz var. Lütfen aşağıdaki detayları kontrol ediniz.
          </p>
          
          <!-- Reservation Code -->
          <div style="text-align: center; margin: 25px 0;">
            <span style="background-color: #fdd835; color: #111111; padding: 12px 24px; border-radius: 8px; font-size: 20px; font-weight: bold; display: inline-block;">
              ${reservation.reservation_code || reservation.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          
          <!-- Transfer Details -->
          <div style="background-color: #f8f8f8; border-radius: 12px; padding: 24px; margin: 0 0 30px; border-left: 4px solid #10B981;">
            <h3 style="color: #111111; margin: 0 0 15px; font-size: 16px; font-weight: 600;">📋 Transfer Detayları</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; width: 40%; vertical-align: top;">Tarih:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px; font-weight: 600;">📅 ${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Saat:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px; font-weight: 600;">🕐 ${reservation.pickup_time}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Müşteri:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px; font-weight: 600;">👤 ${reservation.customer_name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Telefon:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px;">📱 ${reservation.customer_phone}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Alış:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px;">📍 ${pickupDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Bırakış:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px;">🏁 ${dropoffDisplay}</td>
              </tr>
              ${reservation.flight_number ? `
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Uçuş:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px;">✈️ ${reservation.flight_number}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Araç:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px;">🚐 ${getVehicleLabel(reservation.vehicle_type)}</td>
              </tr>
              ${reservation.baby_seat_count ? `
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Bebek Koltuğu:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px;">👶 ${reservation.baby_seat_count} adet</td>
              </tr>
              ` : ''}
              ${reservation.luggage_count ? `
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Bagaj:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 14px;">🧳 ${reservation.luggage_count} adet</td>
              </tr>
              ` : ''}
              ${reservation.driver_cash_amount ? `
              <tr>
                <td style="padding: 10px 0; color: #888888; font-size: 14px; vertical-align: top;">Tahsil Edilecek:</td>
                <td style="padding: 10px 0; color: #10B981; font-size: 14px; font-weight: 700;">💵 ${reservation.driver_cash_amount} ${reservation.passenger_cash_currency || 'TRY'}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          ${reservation.customer_notes ? `
          <!-- Customer Notes -->
          <div style="background-color: #FEF3C7; border-radius: 12px; padding: 20px; margin: 0 0 30px; border-left: 4px solid #F59E0B;">
            <h3 style="color: #92400E; margin: 0 0 10px; font-size: 14px; font-weight: 600;">📝 Müşteri Notu</h3>
            <p style="color: #92400E; font-size: 13px; margin: 0;">${reservation.customer_notes}</p>
          </div>
          ` : ''}
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://meettransfer.app/driver" style="display: inline-block; background: linear-gradient(135deg, #fdd835 0%, #fbc02d 100%); color: #111111; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(253, 216, 53, 0.5);">
              Sürücü Paneline Git
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #111111; padding: 25px 30px; text-align: center;">
          <p style="color: #888888; font-size: 13px; margin: 0;">
            © ${new Date().getFullYear()} Meet Transfer. All rights reserved.
          </p>
          <p style="color: #666666; font-size: 12px; margin: 10px 0 0;">
            WhatsApp: +1 (555) 805-1101 | Emergency: +90 532 174 83 90</p>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Meet Transfer <noreply@mail.meettransfer.app>",
      reply_to: "info@meettransfer.app",
      to: [driverEmail],
      subject: `⏰ Yarın için transfer: ${reservation.reservation_code || reservation.id.slice(0, 8).toUpperCase()} - ${reservation.pickup_time}`,
      html,
    }),
  });

  return response.ok;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-transfer-reminder function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Calculate the date range for tomorrow (24 hours from now)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    console.log("Checking for reservations on:", tomorrowDate);

    // Fetch active reservations for tomorrow that haven't been reminded
    const { data: reservations, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        *,
        drivers (id, name, phone, user_id, vehicle_model, plate_number)
      `)
      .eq('pickup_date', tomorrowDate)
      .in('status', ['active', 'confirmed', 'assigned', 'sent_to_driver'])
      .is('reminder_sent_at', null);

    if (fetchError) {
      console.error("Error fetching reservations:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${reservations?.length || 0} reservations to remind`);

    if (!reservations || reservations.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No reservations to remind", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      customerEmails: 0,
      driverEmails: 0,
      errors: [] as string[],
    };

    for (const reservation of reservations || []) {
      try {
        // Send customer reminder
        if (reservation.customer_id) {
          const { data: userData } = await supabase.auth.admin.getUserById(reservation.customer_id);
          if (userData?.user?.email) {
            const sent = await sendCustomerReminderEmail(reservation, userData.user.email);
            if (sent) {
              results.customerEmails++;
              console.log(`Customer reminder sent for reservation ${reservation.id}`);
            }
          }
        }

        // Send driver reminder
        if (reservation.drivers?.user_id) {
          const { data: driverUserData } = await supabase.auth.admin.getUserById(reservation.drivers.user_id);
          if (driverUserData?.user?.email) {
            const sent = await sendDriverReminderEmail(reservation, driverUserData.user.email, reservation.drivers.name);
            if (sent) {
              results.driverEmails++;
              console.log(`Driver reminder sent for reservation ${reservation.id}`);
            }
          }
        }

        // Mark reservation as reminded
        await supabase
          .from('reservations')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', reservation.id);

      } catch (err: any) {
        console.error(`Error processing reservation ${reservation.id}:`, err);
        results.errors.push(`${reservation.id}: ${err.message}`);
      }
    }

    console.log("Reminder results:", results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: reservations?.length || 0,
        ...results 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-transfer-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);