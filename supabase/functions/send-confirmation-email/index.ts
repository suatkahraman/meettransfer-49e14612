import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEmailHeader, getEmailFooter, getTranslation } from "../_shared/emailTemplates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  reservation_id: string;
  lang?: string;
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
  'mercedes-vclass': 'VIP Mercedes Vito',
  'vip-mercedes': 'VIP Mercedes Vito',
  'mercedes-sprinter': 'Mercedes Sprinter VIP',
  'maybach': 'Mercedes Maybach Minivan',
  'maybach-minibus': 'Mercedes Maybach Minivan',
  'minibus': 'Mercedes Sprinter Minibus',
};

const getVehicleLabel = (vehicleType: string): string => {
  return vehicleTypeLabels[vehicleType] || vehicleType.replace(/-/g, ' ');
};

// Helper function to format location display (place_name + address)
const formatLocation = (placeName: string | null, address: string): string => {
  if (!placeName || placeName === address) {
    return address;
  }
  if (address.toLowerCase().includes(placeName.toLowerCase())) {
    return address;
  }
  return `${placeName}<br/><span style="color: #888; font-size: 12px;">${address}</span>`;
};

// Format date based on language
const formatDate = (dateStr: string, lang: string = 'en') => {
  try {
    const date = new Date(dateStr);
    const locales: Record<string, string> = {
      en: 'en-GB',
      tr: 'tr-TR',
      de: 'de-DE',
      ru: 'ru-RU',
      ar: 'ar-SA',
    };
    const locale = locales[lang?.substring(0, 2) || 'en'] || 'en-GB';
    return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reservation_id, lang = 'en' }: ConfirmationEmailRequest = await req.json();

    if (!reservation_id) {
      throw new Error("reservation_id is required");
    }

    console.log("Sending confirmation email for reservation:", reservation_id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch reservation with driver details
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select(`
        *,
        drivers (name, phone, plate_number, vehicle_model, vehicle_color)
      `)
      .eq("id", reservation_id)
      .single();

    if (fetchError || !reservation) {
      throw new Error("Reservation not found: " + fetchError?.message);
    }

    // Get customer email from auth.users
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(reservation.customer_id);

    if (userError || !user?.email) {
      console.log("User email not found:", userError?.message);
      return new Response(
        JSON.stringify({ success: false, message: "Customer email not found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const customerEmail = user.email;
    const t = getTranslation(lang);
    const currencySymbol = currencySymbols[reservation.price_currency || 'EUR'] || reservation.price_currency || '';
    const hasPrice = reservation.price !== null && reservation.price !== undefined;
    const priceDisplay = hasPrice ? `${currencySymbol}${reservation.price}` : (lang === 'tr' ? 'Onay bekleniyor' : 'To be confirmed');

    // Format passengers list
    const passengersList = reservation.passenger_names && reservation.passenger_names.length > 0
      ? reservation.passenger_names.map((name: string, i: number) => `${i + 1}. ${name}`).join('<br>')
      : reservation.customer_name;

    const passengerCount = reservation.passenger_names?.length || 1;

    // Format location displays
    const pickupDisplay = formatLocation(reservation.pickup_place_name, reservation.pickup);
    const dropoffDisplay = formatLocation(reservation.dropoff_place_name, reservation.dropoff);

    // Translations for email
    const emailTexts = {
      en: {
        reservationConfirmed: 'Your Transfer is Confirmed!',
        thankYou: 'Thank you for choosing Meet Transfer',
        reservationCode: 'Reservation Code',
        transferDetails: 'Transfer Details',
        dateTime: 'Date & Time',
        pickup: 'Pick-up',
        dropoff: 'Drop-off',
        flight: 'Flight',
        vehicle: 'Vehicle',
        passengers: 'Passengers',
        babySeat: 'Baby Seat',
        luggage: 'Luggage',
        price: 'Price',
        notes: 'Notes',
        yourDriver: 'Your Driver',
        driverName: 'Name',
        driverVehicle: 'Vehicle',
        driverPlate: 'Plate',
        driverPending: 'Driver will be assigned soon. We will notify you!',
        whatsIncluded: "What's Included",
        professionalDriver: 'Professional English-speaking driver',
        flightTracking: 'Real-time flight tracking',
        freeWaiting: '60 min free waiting at airport',
        meetGreet: 'Meet & greet with name sign',
        support247: '24/7 customer support',
        freeCancellation: 'Free cancellation up to 24h before',
        confirmed: 'Your transfer is confirmed!',
        saveCode: 'Please save your reservation code for reference.',
        viewReservation: 'View Reservation',
        priceNote: 'Price will be confirmed shortly',
      },
      tr: {
        reservationConfirmed: 'Transferiniz Onaylandı!',
        thankYou: 'Meet Transfer\'ı tercih ettiğiniz için teşekkür ederiz',
        reservationCode: 'Rezervasyon Kodu',
        transferDetails: 'Transfer Detayları',
        dateTime: 'Tarih & Saat',
        pickup: 'Alış Noktası',
        dropoff: 'Bırakış Noktası',
        flight: 'Uçuş',
        vehicle: 'Araç',
        passengers: 'Yolcular',
        babySeat: 'Bebek Koltuğu',
        luggage: 'Bagaj',
        price: 'Fiyat',
        notes: 'Notlar',
        yourDriver: 'Sürücünüz',
        driverName: 'İsim',
        driverVehicle: 'Araç',
        driverPlate: 'Plaka',
        driverPending: 'Sürücü yakında atanacaktır. Sizi bilgilendireceğiz!',
        whatsIncluded: 'Dahil Olanlar',
        professionalDriver: 'Profesyonel İngilizce konuşan sürücü',
        flightTracking: 'Gerçek zamanlı uçuş takibi',
        freeWaiting: 'Havalimanında 60 dk ücretsiz bekleme',
        meetGreet: 'İsim tabelası ile karşılama',
        support247: '7/24 müşteri desteği',
        freeCancellation: '24 saat öncesine kadar ücretsiz iptal',
        confirmed: 'Transferiniz onaylandı!',
        saveCode: 'Lütfen rezervasyon kodunuzu saklayın.',
        viewReservation: 'Rezervasyonu Görüntüle',
        priceNote: 'Fiyat en kısa sürede onaylanacak',
      },
    };

    const txt = emailTexts[lang as keyof typeof emailTexts] || emailTexts.en;

    // Build email HTML
    const emailHtml = `
${getEmailHeader(`✅ ${txt.reservationConfirmed}`, txt.thankYou, lang)}
<tr>
  <td style="padding:30px 25px;">
    <!-- Reservation Code -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);border-radius:12px;margin-bottom:25px;">
      <tr>
        <td style="padding:25px;text-align:center;">
          <p style="color:#94a3b8;margin:0;font-size:13px;text-transform:uppercase;letter-spacing:2px;">${txt.reservationCode}</p>
          <p style="color:#fdd835;margin:10px 0 0;font-size:32px;font-weight:bold;letter-spacing:4px;">${reservation.reservation_code || 'N/A'}</p>
        </td>
      </tr>
    </table>

    <!-- Transfer Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:20px;border:1px solid #e2e8f0;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 15px;color:#1e293b;font-weight:bold;font-size:15px;">📍 ${txt.transferDetails}</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:10px 0;color:#64748b;font-size:13px;width:120px;vertical-align:top;">${txt.dateTime}</td>
            <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;">📅 ${formatDate(reservation.pickup_date, lang)} - ${reservation.pickup_time}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top;">${txt.pickup}</td>
            <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:500;">📍 ${pickupDisplay}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top;">${txt.dropoff}</td>
            <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:500;">🏁 ${dropoffDisplay}</td>
          </tr>
          ${reservation.flight_number ? `
          <tr>
            <td style="padding:10px 0;color:#64748b;font-size:13px;">${txt.flight}</td>
            <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:500;">✈️ ${reservation.flight_number}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:10px 0;color:#64748b;font-size:13px;">${txt.vehicle}</td>
            <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:500;">🚐 ${getVehicleLabel(reservation.vehicle_type)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top;">${txt.passengers}</td>
            <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:500;">👥 ${passengerCount} ${lang === 'tr' ? 'kişi' : (passengerCount > 1 ? 'people' : 'person')}<br/><span style="font-size:12px;color:#64748b;">${passengersList}</span></td>
          </tr>
          ${reservation.baby_seat_count ? `
          <tr>
            <td style="padding:10px 0;color:#64748b;font-size:13px;">${txt.babySeat}</td>
            <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:500;">👶 ${reservation.baby_seat_count}</td>
          </tr>
          ` : ''}
          ${reservation.luggage_count ? `
          <tr>
            <td style="padding:10px 0;color:#64748b;font-size:13px;">${txt.luggage}</td>
            <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:500;">🧳 ${reservation.luggage_count}</td>
          </tr>
          ` : ''}
          ${reservation.customer_notes ? `
          <tr>
            <td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top;">${txt.notes}</td>
            <td style="padding:10px 0;color:#0f172a;font-size:14px;">${reservation.customer_notes}</td>
          </tr>
          ` : ''}
        </table>
      </td></tr>
    </table>

    <!-- Price Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, ${hasPrice ? '#10b981 0%, #059669' : '#f59e0b 0%, #d97706'} 100%);border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:25px;text-align:center;">
          <p style="color:rgba(255,255,255,0.9);margin:0;font-size:14px;text-transform:uppercase;letter-spacing:1px;">${txt.price}</p>
          <p style="color:#ffffff;margin:10px 0 0;font-size:32px;font-weight:bold;">${priceDisplay}</p>
          ${!hasPrice ? `<p style="color:rgba(255,255,255,0.8);margin:10px 0 0;font-size:12px;">${txt.priceNote}</p>` : ''}
        </td>
      </tr>
    </table>

    ${reservation.drivers ? `
    <!-- Driver Info -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:12px;margin-bottom:20px;border:1px solid #bfdbfe;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 15px;color:#1e40af;font-weight:bold;font-size:15px;">🚗 ${txt.yourDriver}</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;color:#3b82f6;font-size:13px;width:80px;">${txt.driverName}</td>
            <td style="padding:6px 0;color:#1e3a8a;font-size:14px;font-weight:600;">${reservation.drivers.name}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#3b82f6;font-size:13px;">${txt.driverVehicle}</td>
            <td style="padding:6px 0;color:#1e3a8a;font-size:14px;font-weight:500;">${reservation.drivers.vehicle_model || '-'} ${reservation.drivers.vehicle_color ? `(${reservation.drivers.vehicle_color})` : ''}</td>
          </tr>
          ${reservation.drivers.plate_number ? `
          <tr>
            <td style="padding:6px 0;color:#3b82f6;font-size:13px;">${txt.driverPlate}</td>
            <td style="padding:6px 0;color:#1e3a8a;font-size:14px;font-weight:600;">${reservation.drivers.plate_number}</td>
          </tr>
          ` : ''}
        </table>
      </td></tr>
    </table>
    ` : `
    <!-- Driver Pending -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:12px;margin-bottom:20px;border:1px solid #fbbf24;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="margin:0;color:#92400e;font-size:14px;">🚗 ${txt.driverPending}</p>
      </td></tr>
    </table>
    `}

    <!-- What's Included -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;margin-bottom:20px;border:1px solid #bbf7d0;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 12px;color:#166534;font-weight:bold;font-size:14px;">✨ ${txt.whatsIncluded}</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:5px 0;color:#15803d;font-size:13px;">✓ ${txt.professionalDriver}</td></tr>
          <tr><td style="padding:5px 0;color:#15803d;font-size:13px;">✓ ${txt.flightTracking}</td></tr>
          <tr><td style="padding:5px 0;color:#15803d;font-size:13px;">✓ ${txt.freeWaiting}</td></tr>
          <tr><td style="padding:5px 0;color:#15803d;font-size:13px;">✓ ${txt.meetGreet}</td></tr>
          <tr><td style="padding:5px 0;color:#15803d;font-size:13px;">✓ ${txt.support247}</td></tr>
          <tr><td style="padding:5px 0;color:#15803d;font-size:13px;">✓ ${txt.freeCancellation}</td></tr>
        </table>
      </td></tr>
    </table>

    <!-- Confirmation Banner -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:25px;text-align:center;">
          <p style="color:#fff;margin:0;font-size:18px;font-weight:bold;">✅ ${txt.confirmed}</p>
          <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:14px;">${txt.saveCode}</p>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;padding:10px 0;">
          <a href="https://meettransfer.app/customer" style="display:inline-block;background:linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);color:#1a1a2e;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:bold;box-shadow:0 4px 15px rgba(251,191,36,0.3);">📱 ${txt.viewReservation}</a>
        </td>
      </tr>
    </table>
  </td>
</tr>
${getEmailFooter(lang)}
    `;

    const emailSubject = lang === 'tr' 
      ? `Rezervasyon Onaylandı - ${reservation.reservation_code || 'Meet Transfer'}`
      : `Reservation Confirmed - ${reservation.reservation_code || 'Meet Transfer'}`;

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
        subject: emailSubject,
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
