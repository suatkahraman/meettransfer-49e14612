import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GetDriverEmailRequest {
  driver_id?: string;
  user_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the user from the JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Invalid authentication token:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authenticated user:", user.id);

    // SECURITY: Verify admin role authorization
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      console.error("User is not authorized (not admin):", roleError);
      return new Response(
        JSON.stringify({ error: "Admin authorization required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Admin authorization verified for user:", user.id);

    const { driver_id, user_id }: GetDriverEmailRequest = await req.json();

    if (!driver_id && !user_id) {
      return new Response(
        JSON.stringify({ error: "driver_id or user_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let driverUserId = user_id;

    // If driver_id provided, first get the user_id from drivers table
    if (driver_id && !user_id) {
      console.log("Fetching driver with id:", driver_id);
      const { data: driver, error: driverError } = await supabase
        .from("drivers")
        .select("user_id, name")
        .eq("id", driver_id)
        .single();

      if (driverError || !driver) {
        console.error("Driver not found:", driverError);
        return new Response(
          JSON.stringify({ error: "Driver not found", details: driverError?.message }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      driverUserId = driver.user_id;
      console.log("Found driver user_id:", driverUserId);
    }

    if (!driverUserId) {
      return new Response(
        JSON.stringify({ error: "No user_id found for driver" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user email from auth
    console.log("Fetching user email for user_id:", driverUserId);
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(driverUserId);

    if (userError || !userData?.user) {
      console.error("User not found in auth:", userError);
      return new Response(
        JSON.stringify({ error: "User not found in auth system", details: userError?.message }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const email = userData.user.email;
    console.log("Found email for driver (admin request)");

    return new Response(
      JSON.stringify({ 
        success: true, 
        email,
        user_id: driverUserId 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in get-driver-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
