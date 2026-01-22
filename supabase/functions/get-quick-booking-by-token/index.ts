import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string' || token.length < 10) {
      return new Response(JSON.stringify({ 
        error: "Invalid token" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the quick booking by confirmation token
    // Service role bypasses RLS for secure access
    const { data, error } = await supabase
      .from("quick_booking_requests")
      .select("*")
      .eq("confirmation_token", token)
      .maybeSingle();

    if (error) {
      console.error("Error fetching quick booking:", error);
      return new Response(JSON.stringify({ 
        error: "Failed to fetch booking" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ 
        error: "Booking not found" 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return booking data (excluding sensitive internal fields)
    const safeData = {
      id: data.id,
      pickup: data.pickup,
      dropoff: data.dropoff,
      pickup_date: data.pickup_date,
      pickup_time: data.pickup_time,
      passengers: data.passengers,
      vehicle_type: data.vehicle_type,
      price: data.price,
      price_currency: data.price_currency,
      return_price: data.return_price,
      has_return_trip: data.has_return_trip,
      return_date: data.return_date,
      return_time: data.return_time,
      status: data.status,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      customer_notes: data.customer_notes,
      payment_method: data.payment_method,
      luggage_count: data.luggage_count,
      baby_seat_count: data.baby_seat_count,
      service_type: data.service_type,
      duration_hours: data.duration_hours,
      city: data.city,
      promo_code: data.promo_code,
      all_vehicle_prices: data.all_vehicle_prices,
    };

    return new Response(JSON.stringify({ 
      success: true, 
      data: safeData 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in get-quick-booking-by-token:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
