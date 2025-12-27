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

    // Fetch the quick booking request to get customer info
    const { data: quickBooking, error: fetchError } = await supabase
      .from("quick_booking_requests")
      .select("customer_notes, customer_phone, customer_email, customer_name")
      .eq("id", requestData.bookingId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching quick booking:", fetchError);
    }

    const customerNotes = quickBooking?.customer_notes || null;
    const customerPhone = quickBooking?.customer_phone || "";
    const customerEmail = quickBooking?.customer_email || null;
    const customerName = quickBooking?.customer_name || null;

    // Create main reservation WITHOUT customer_id (will be set later when customer registers)
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
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          // Format return date if exists
          const formattedReturnDate = requestData.returnDate 
            ? new Date(requestData.returnDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })
            : null;

          // Build return trip section if applicable
          const returnTripHtml = returnReservation ? `
            <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h3 style="color: #2e7d32; margin-top: 0;">🔄 Return Transfer</h3>
              <div style="background: rgba(255,255,255,0.7); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin: 5px 0;"><strong>Return Reservation Code:</strong> <span style="color: #2e7d32; font-size: 16px;">${returnReservation.reservation_code}</span></p>
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9;"><strong>📍 Pickup:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9;">${requestData.dropoff}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9;"><strong>📍 Dropoff:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9;">${requestData.pickup}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9;"><strong>📅 Date:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9;">${formattedReturnDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9;"><strong>🕐 Time:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #c8e6c9;">${requestData.returnTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>💰 Price:</strong></td>
                  <td style="padding: 8px 0; color: #2e7d32; font-weight: bold;">${requestData.returnPrice || requestData.price} ${requestData.priceCurrency}</td>
                </tr>
              </table>
              ${requestData.promoCode ? `
                <div style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 5px; border: 1px dashed #2e7d32;">
                  <p style="margin: 0; color: #2e7d32; font-size: 14px;">
                    🎁 <strong>Promo Code Applied:</strong> ${requestData.promoCode} (30% discount on return)
                  </p>
                </div>
              ` : ''}
            </div>
          ` : '';

          // Calculate total price for display
          const totalPrice = returnReservation 
            ? requestData.price + (requestData.returnPrice || requestData.price)
            : requestData.price;

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #D4AF37; margin: 0;">Meet Transfer</h1>
                <p style="color: #666; margin: 5px 0;">VIP Transfer Service</p>
              </div>
              
              <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
                <h2 style="color: #D4AF37; margin-top: 0;">✅ Booking Confirmed!</h2>
                <p style="margin-bottom: 20px;">Thank you for choosing Meet Transfer. Your reservation${returnReservation ? 's have' : ' has'} been confirmed.</p>
                
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
                  <p style="margin: 5px 0;"><strong>Main Reservation Code:</strong> <span style="color: #D4AF37; font-size: 18px;">${reservation.reservation_code}</span></p>
                  ${returnReservation ? `<p style="margin: 5px 0;"><strong>Return Reservation Code:</strong> <span style="color: #81c784; font-size: 18px;">${returnReservation.reservation_code}</span></p>` : ''}
                </div>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="color: #1a1a2e; margin-top: 0;">🚗 Outbound Transfer</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>📍 Pickup:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${requestData.pickup}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>📍 Dropoff:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${requestData.dropoff}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>📅 Date:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>🕐 Time:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${requestData.pickupTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>🚗 Vehicle:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${requestData.vehicleType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>💰 Price:</strong></td>
                    <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">${requestData.price} ${requestData.priceCurrency}</td>
                  </tr>
                </table>
              </div>
              
              ${returnTripHtml}
              
              ${returnReservation ? `
                <div style="background: #1a1a2e; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                  <p style="margin: 0; font-size: 18px;">
                    <strong>Total:</strong> <span style="color: #D4AF37; font-size: 22px;">${totalPrice} ${requestData.priceCurrency}</span>
                  </p>
                </div>
              ` : ''}
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; color: #856404;">
                  <strong>⚠️ Next Step:</strong> Please complete your booking by providing your contact details. 
                  Your driver will contact you before pickup.
                </p>
              </div>
              
              <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                <p style="margin: 0 0 10px 0; color: #666;">Need assistance?</p>
                <p style="margin: 0;">
                  <a href="https://wa.me/905321748390" style="color: #25D366; text-decoration: none;">💬 WhatsApp Support</a>
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Meet Transfer. All rights reserved.
                </p>
              </div>
            </body>
            </html>
          `;

          await resend.emails.send({
            from: "Meet Transfer <info@meet-transfer.com>",
            to: [customerEmail],
            subject: `✅ Booking Confirmed - ${reservation.reservation_code}`,
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

