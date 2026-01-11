import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { reservationId } = await req.json();

    if (!reservationId) {
      return new Response(
        JSON.stringify({ success: false, error: "Reservation ID is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("Fetching reservation for quick booking info:", reservationId);

    const { data: reservation, error } = await supabase
      .from("reservations")
      .select("id, pickup, dropoff, pickup_date, pickup_time, vehicle_type, price, price_currency, status")
      .eq("id", reservationId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching reservation:", error);
      throw new Error(`Failed to fetch reservation: ${error.message}`);
    }

    if (!reservation) {
      console.log("Reservation not found:", reservationId);
      return new Response(
        JSON.stringify({ success: false, error: "Reservation not found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Try to find matching quick_booking_request to get pre-filled customer info and all vehicle prices
    const { data: quickBooking } = await supabase
      .from("quick_booking_requests")
      .select("customer_email, customer_phone, customer_name, customer_notes, all_vehicle_prices")
      .eq("pickup", reservation.pickup)
      .eq("dropoff", reservation.dropoff)
      .eq("pickup_date", reservation.pickup_date)
      .eq("pickup_time", reservation.pickup_time)
      .eq("status", "confirmed")
      .order("confirmed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Parse all_vehicle_prices if it exists
    let allVehiclePrices: Record<string, number> | null = null;
    if (quickBooking?.all_vehicle_prices) {
      try {
        allVehiclePrices = typeof quickBooking.all_vehicle_prices === 'string' 
          ? JSON.parse(quickBooking.all_vehicle_prices) 
          : quickBooking.all_vehicle_prices;
      } catch (e) {
        console.error("Error parsing all_vehicle_prices:", e);
      }
    }

    // Merge quick booking customer info into reservation response
    const reservationWithCustomerInfo = {
      ...reservation,
      prefilled_email: quickBooking?.customer_email || null,
      prefilled_phone: quickBooking?.customer_phone || null,
      prefilled_name: quickBooking?.customer_name || null,
      all_vehicle_prices: allVehiclePrices,
    };

    console.log("Quick booking customer info found:", !!quickBooking, "Has vehicle prices:", !!allVehiclePrices);

    console.log("Reservation found:", reservation.id, "Status:", reservation.status);

    return new Response(
      JSON.stringify({
        success: true,
        reservation: reservationWithCustomerInfo,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in get-quick-booking-reservation:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
