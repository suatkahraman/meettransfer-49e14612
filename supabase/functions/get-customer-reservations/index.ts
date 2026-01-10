import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the authorization header to verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Create user client to get the authenticated user
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.log("User authentication failed:", userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Authentication failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    console.log("Fetching reservations for user:", user.id);

    // Get user's profile to find their verified phone number
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("phone, full_name")
      .eq("id", user.id)
      .maybeSingle();

    const userPhone = profile?.phone?.trim();
    console.log("User profile phone:", userPhone ? "Found" : "Not set");

    // Build query conditions
    // Always fetch by customer_id
    let reservationsById: any[] = [];
    let reservationsByPhone: any[] = [];

    // Fetch reservations by customer_id
    const { data: byIdData, error: byIdError } = await supabaseAdmin
      .from("reservations")
      .select("*")
      .eq("customer_id", user.id)
      .order("pickup_date", { ascending: false });

    if (byIdError) {
      console.error("Error fetching by customer_id:", byIdError);
    } else {
      reservationsById = byIdData || [];
      console.log("Reservations by customer_id:", reservationsById.length);
    }

    // If user has a verified phone, also fetch reservations by phone
    if (userPhone && userPhone.length >= 7) {
      // Normalize phone for comparison - remove spaces and common formatting
      const normalizedPhone = userPhone.replace(/[\s\-\(\)]/g, "");
      
      // Fetch reservations where customer_phone matches (and customer_id is null or different)
      const { data: byPhoneData, error: byPhoneError } = await supabaseAdmin
        .from("reservations")
        .select("*")
        .neq("customer_id", user.id) // Only get ones not already linked
        .order("pickup_date", { ascending: false });

      if (byPhoneError) {
        console.error("Error fetching by phone:", byPhoneError);
      } else if (byPhoneData) {
        // Filter by phone match (flexible matching)
        reservationsByPhone = byPhoneData.filter((res: any) => {
          if (!res.customer_phone) return false;
          const resPhone = res.customer_phone.replace(/[\s\-\(\)]/g, "");
          // Check if phones match (handle different formats)
          return resPhone === normalizedPhone || 
                 resPhone.endsWith(normalizedPhone.slice(-10)) ||
                 normalizedPhone.endsWith(resPhone.slice(-10));
        });
        console.log("Reservations by phone match:", reservationsByPhone.length);
      }
    }

    // Combine and deduplicate
    const allReservationIds = new Set<string>();
    const allReservations: any[] = [];

    // Add reservations by customer_id first
    for (const res of reservationsById) {
      if (!allReservationIds.has(res.id)) {
        allReservationIds.add(res.id);
        allReservations.push(res);
      }
    }

    // Add reservations by phone (mark them as phone-matched)
    for (const res of reservationsByPhone) {
      if (!allReservationIds.has(res.id)) {
        allReservationIds.add(res.id);
        allReservations.push({ ...res, matched_by_phone: true });
      }
    }

    // Sort by pickup_date descending
    allReservations.sort((a, b) => {
      const dateA = new Date(a.pickup_date + "T" + (a.pickup_time || "00:00"));
      const dateB = new Date(b.pickup_date + "T" + (b.pickup_time || "00:00"));
      return dateB.getTime() - dateA.getTime();
    });

    console.log("Total reservations found:", allReservations.length);

    // Fetch driver info for reservations that have drivers assigned
    const driverIds = [...new Set(allReservations.filter(r => r.driver_id).map(r => r.driver_id))];
    let driversMap: Record<string, any> = {};

    if (driverIds.length > 0) {
      const { data: drivers } = await supabaseAdmin
        .from("drivers")
        .select("id, name, plate_number, vehicle_model, vehicle_color")
        .in("id", driverIds);

      if (drivers) {
        driversMap = drivers.reduce((acc: Record<string, any>, driver: any) => {
          acc[driver.id] = driver;
          return acc;
        }, {});
      }
    }

    // Attach driver info to reservations
    const reservationsWithDrivers = allReservations.map(res => ({
      ...res,
      drivers: res.driver_id ? driversMap[res.driver_id] || null : null
    }));

    return new Response(
      JSON.stringify({
        success: true,
        reservations: reservationsWithDrivers,
        total: reservationsWithDrivers.length,
        by_id: reservationsById.length,
        by_phone: reservationsByPhone.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in get-customer-reservations:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
