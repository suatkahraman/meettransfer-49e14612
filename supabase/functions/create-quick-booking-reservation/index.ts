import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const PLACEHOLDER_CUSTOMER_ID = "00000000-0000-0000-0000-000000000000";

    console.log("Creating reservation for quick booking:", requestData.bookingId);

    // Ensure placeholder profile exists (required by reservations_customer_id_fkey)
    const { error: placeholderProfileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: PLACEHOLDER_CUSTOMER_ID,
          full_name: "Pending Customer Info",
          phone: null,
        },
        { onConflict: "id" }
      );

    if (placeholderProfileError) {
      console.error("Error creating placeholder profile:", placeholderProfileError);
      throw new Error(
        `Failed to create placeholder profile: ${placeholderProfileError.message}`,
      );
    }

    // Create main reservation with a placeholder customer_id (will be updated when customer registers)
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .insert({
        customer_id: PLACEHOLDER_CUSTOMER_ID,
        customer_name: "Pending Customer Info",
        customer_phone: "",
        pickup: requestData.pickup,
        dropoff: requestData.dropoff,
        pickup_date: requestData.pickupDate,
        pickup_time: requestData.pickupTime,
        vehicle_type: requestData.vehicleType,
        payment_type: requestData.paymentMethod,
        status: "pending_customer_info",
        price: requestData.price,
        price_currency: requestData.priceCurrency,
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
          customer_id: PLACEHOLDER_CUSTOMER_ID,
          customer_name: "Pending Customer Info",
          customer_phone: "",
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
