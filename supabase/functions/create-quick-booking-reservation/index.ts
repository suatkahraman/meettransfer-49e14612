import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateReservationRequest {
  bookingId: string;
  pickup: string;
  dropoff: string;
  pickupDate: string;
  pickupTime: string;
  vehicleType: string;
  passengers: number;
  price: number;
  priceCurrency: string;
  paymentMethod: string;
  hasReturnTrip: boolean;
  returnDate?: string;
  returnTime?: string;
  returnPrice?: number;
  promoCode?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: CreateReservationRequest = await req.json();

    console.log("Creating reservation for quick booking:", requestData.bookingId);

    // Fetch the quick booking request to get customer info, agency info, and luggage/baby seat
    const { data: quickBooking, error: fetchError } = await supabase
      .from("quick_booking_requests")
      .select("customer_notes, customer_phone, customer_email, customer_name, agency_id, agency_user_id, luggage_count, baby_seat_count")
      .eq("id", requestData.bookingId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching quick booking:", fetchError);
    }

    const customerNotes = quickBooking?.customer_notes || null;
    const customerPhone = quickBooking?.customer_phone || "";
    const customerEmail = quickBooking?.customer_email || null;
    const customerName = quickBooking?.customer_name || null;
    const agencyId = quickBooking?.agency_id || null;
    const agencyUserId = quickBooking?.agency_user_id || null;
    const luggageCount = quickBooking?.luggage_count || 1;
    const babySeatCount = quickBooking?.baby_seat_count || 0;

    // Create main reservation WITHOUT customer_id (will be set later when customer registers)
    // If from agency, link to agency
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .insert({
        customer_id: null, // Will be filled when customer completes the form
        customer_name: "Pending Customer Info",
        customer_phone: customerPhone,
        pickup: requestData.pickup,
        dropoff: requestData.dropoff,
        pickup_date: requestData.pickupDate,
        pickup_time: requestData.pickupTime,
        vehicle_type: requestData.vehicleType,
        payment_type: requestData.paymentMethod,
        status: "pending_customer_info",
        price: requestData.price,
        price_currency: requestData.priceCurrency,
        customer_notes: customerNotes,
        agency_id: agencyId,
        agency_user_id: agencyUserId,
        luggage_count: luggageCount,
        baby_seat_count: babySeatCount,
      })
      .select()
      .single();

    if (reservationError) {
      console.error("Error creating reservation:", reservationError);
      throw new Error(`Failed to create reservation: ${reservationError.message}`);
    }

    console.log("Main reservation created:", reservation.id, reservation.reservation_code);

    // Create return trip reservation if enabled
    let returnReservation = null;
    if (requestData.hasReturnTrip && requestData.returnDate && requestData.returnTime) {
      const { data: returnRes, error: returnError } = await supabase
        .from("reservations")
        .insert({
          customer_id: null, // Will be filled when customer completes the form
          customer_name: "Pending Customer Info",
          customer_phone: customerPhone,
          pickup: requestData.dropoff, // Swapped for return
          dropoff: requestData.pickup, // Swapped for return
          pickup_date: requestData.returnDate,
          pickup_time: requestData.returnTime,
          vehicle_type: requestData.vehicleType,
          payment_type: requestData.paymentMethod,
          status: "pending_customer_info",
          price: requestData.returnPrice || requestData.price,
          price_currency: requestData.priceCurrency,
          is_return_transfer: true,
          original_reservation_id: reservation.id,
          promo_code: requestData.promoCode || null,
          customer_notes: customerNotes,
          agency_id: agencyId,
          agency_user_id: agencyUserId,
          luggage_count: luggageCount,
          baby_seat_count: babySeatCount,
        })
        .select()
        .single();

      if (returnError) {
        console.error("Error creating return reservation:", returnError);
        // Don't fail the whole operation, just log the error
      } else {
        returnReservation = returnRes;
        console.log("Return reservation created:", returnRes.id, returnRes.reservation_code);
      }
    }

    // Update quick booking status to confirmed
    const { error: updateError } = await supabase
      .from("quick_booking_requests")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        payment_method: requestData.paymentMethod,
      })
      .eq("id", requestData.bookingId);

    if (updateError) {
      console.error("Error updating quick booking:", updateError);
      // Don't fail - reservation is already created
    }

    // Notify admin (server-side) so it doesn't depend on the customer's browser/network
    try {
      await supabase.functions.invoke("notify-admin-quick-booking-confirmed", {
        body: {
          bookingId: requestData.bookingId,
          pickup: requestData.pickup,
          dropoff: requestData.dropoff,
          pickupDate: requestData.pickupDate,
          pickupTime: requestData.pickupTime,
          vehicleType: requestData.vehicleType,
          passengers: requestData.passengers,
          price: requestData.price,
          priceCurrency: requestData.priceCurrency,
          paymentMethod: requestData.paymentMethod,
          reservationCode: reservation.reservation_code,
        },
      });
      console.log("Admin notified for quick booking confirmation:", requestData.bookingId);
    } catch (notifyError) {
      console.error("Failed to notify admin (server-side):", notifyError);
      // Don't fail - reservation is already created
    }

    // Send confirmation email to customer if email is available
    if (customerEmail) {
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);

          const formattedDate = new Date(requestData.pickupDate).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });

          const formattedReturnDate = requestData.returnDate 
            ? new Date(requestData.returnDate).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })
            : null;

          const vehicleLabels: Record<string, string> = {
            "mercedes-vito": "Mercedes Vito",
            "mercedes-vclass": "VIP Mercedes V-Class",
            "maybach": "Maybach Minivan",
            "minibus": "Mercedes Sprinter Minibus",
          };
          const vehicleName = vehicleLabels[requestData.vehicleType] || requestData.vehicleType;

          const currencySymbol = requestData.priceCurrency === "EUR" ? "€" 
            : requestData.priceCurrency === "USD" ? "$" 
            : requestData.priceCurrency === "GBP" ? "£" 
            : requestData.priceCurrency === "TRY" ? "₺" 
            : requestData.priceCurrency === "AED" ? "د.إ"
            : requestData.priceCurrency === "AUD" ? "A$"
            : requestData.priceCurrency;

          const totalPrice = returnReservation 
            ? requestData.price + (requestData.returnPrice || requestData.price)
            : requestData.price;

          // Calculate discount amount for return trip
          const originalReturnPrice = requestData.promoCode && requestData.returnPrice 
            ? Math.round(requestData.returnPrice / 0.7) // Original price before 30% discount
            : null;
          const discountAmount = originalReturnPrice 
            ? originalReturnPrice - requestData.returnPrice!
            : null;

          // Build return trip section
          const returnTripText = returnReservation ? `
Return Transfer:
- Code: ${returnReservation.reservation_code}
- From: ${requestData.dropoff}
- To: ${requestData.pickup}
- Date: ${formattedReturnDate}
- Time: ${requestData.returnTime}
${requestData.promoCode && originalReturnPrice ? `- Original Price: ${currencySymbol}${originalReturnPrice}` : ''}
${requestData.promoCode && discountAmount ? `- Discount (30%): -${currencySymbol}${discountAmount}` : ''}
- Price: ${currencySymbol}${requestData.returnPrice || requestData.price}
${requestData.promoCode ? `- Promo Code: ${requestData.promoCode}` : ''}
` : '';

          const returnTripHtml = returnReservation ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#e8f5e9;border-radius:8px;margin:20px 0;">
          <tr><td style="padding:15px;">
            <p style="margin:0 0 10px;color:#2e7d32;font-weight:bold;">🔄 Return Transfer</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Code:</strong> ${returnReservation.reservation_code}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>From:</strong> ${requestData.dropoff}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>To:</strong> ${requestData.pickup}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Date:</strong> ${formattedReturnDate}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Time:</strong> ${requestData.returnTime}</p>
            ${requestData.promoCode && originalReturnPrice ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:6px;margin:10px 0;border:1px dashed #2e7d32;">
              <tr><td style="padding:12px;">
                <p style="margin:0 0 5px;color:#666;font-size:13px;text-decoration:line-through;">Original: ${currencySymbol}${originalReturnPrice}</p>
                <p style="margin:0 0 5px;color:#2e7d32;font-size:14px;font-weight:bold;">🎉 Discount (30%): -${currencySymbol}${discountAmount}</p>
                <p style="margin:0;color:#1a365d;font-size:16px;font-weight:bold;">Final Price: ${currencySymbol}${requestData.returnPrice}</p>
                <p style="margin:8px 0 0;color:#2e7d32;font-size:12px;background-color:#e8f5e9;padding:4px 8px;border-radius:4px;display:inline-block;">✓ Promo Code: ${requestData.promoCode}</p>
              </td></tr>
            </table>
            ` : `<p style="margin:5px 0;color:#333;font-size:14px;"><strong>Price:</strong> ${currencySymbol}${requestData.returnPrice || requestData.price}</p>`}
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a365d;border-radius:8px;margin:20px 0;">
          <tr><td style="padding:15px;text-align:center;">
            <p style="margin:0;color:#fff;font-size:18px;"><strong>Total:</strong> ${currencySymbol}${totalPrice}</p>
            ${requestData.promoCode && discountAmount ? `<p style="margin:5px 0 0;color:#48bb78;font-size:14px;">You saved ${currencySymbol}${discountAmount} with promo code!</p>` : ''}
          </td></tr>
        </table>
          ` : '';

          const plainText = `
Meet Transfer - Booking Confirmed

Your reservation has been confirmed.

Reservation Code: ${reservation.reservation_code}

Outbound Transfer:
- From: ${requestData.pickup}
- To: ${requestData.dropoff}
- Date: ${formattedDate}
- Time: ${requestData.pickupTime}
- Vehicle: ${vehicleName}
- Price: ${currencySymbol}${requestData.price}
${returnTripText}
${returnReservation ? `Total: ${currencySymbol}${totalPrice}` : ''}

Next Step: Please complete your booking by providing your contact details.

Need help? Contact us via WhatsApp or reply to this email.

Best regards,
Meet Transfer Team
          `.trim();

          const emailHtml = `
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
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#48bb78;border-radius:8px;margin:0 0 20px;">
          <tr>
            <td style="padding:20px;text-align:center;">
              <p style="color:#fff;margin:0;font-size:18px;font-weight:bold;">Booking Confirmed</p>
              <p style="color:#fff;margin:10px 0 0;font-size:24px;font-weight:bold;">${reservation.reservation_code}</p>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7fafc;border-radius:8px;margin:20px 0;">
          <tr><td style="padding:15px;">
            <p style="margin:0 0 10px;color:#1a365d;font-weight:bold;">Outbound Transfer</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>From:</strong> ${requestData.pickup}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>To:</strong> ${requestData.dropoff}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Time:</strong> ${requestData.pickupTime}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Vehicle:</strong> ${vehicleName}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Price:</strong> ${currencySymbol}${requestData.price}</p>
          </td></tr>
        </table>

        ${returnTripHtml}

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff3cd;border-radius:8px;margin:20px 0;">
          <tr><td style="padding:15px;">
            <p style="margin:0;color:#856404;font-size:14px;"><strong>Next Step:</strong> Please complete your booking by providing your contact details.</p>
          </td></tr>
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
          `.trim();

          await resend.emails.send({
            from: "Meet Transfer <info@meettransfer.app>",
            to: [customerEmail],
            reply_to: "info@meettransfer.app",
            subject: `Booking Confirmed - ${reservation.reservation_code}`,
            text: plainText,
            html: emailHtml,
          });

          console.log("Confirmation email sent to customer:", customerEmail);
        }
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail - reservation is already created
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reservation: {
          id: reservation.id,
          reservationCode: reservation.reservation_code,
        },
        returnReservation: returnReservation
          ? {
              id: returnReservation.id,
              reservationCode: returnReservation.reservation_code,
            }
          : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in create-quick-booking-reservation:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

