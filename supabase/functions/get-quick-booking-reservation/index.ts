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

    console.log("Reservation found:", reservation.id, "Status:", reservation.status);

    return new Response(
      JSON.stringify({
        success: true,
        reservation,
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
