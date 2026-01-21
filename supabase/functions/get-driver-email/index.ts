import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Rate limiting: 5 requests per minute per user
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || record.resetAt < now) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

interface GetDriverEmailRequest {
  driver_id?: string;
  user_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Restrict to POST method only
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // SECURITY: Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create client with user's auth context for validation
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error("Invalid authentication token:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authenticated user:", user.id);

    // Check rate limit using user ID
    const rateLimitKey = `user:${user.id}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      console.warn(`Rate limit exceeded for ${rateLimitKey}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many requests. Please try again later.",
          retry_after: rateCheck.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": String(rateCheck.retryAfter),
            ...corsHeaders 
          } 
        }
      );
    }

    // Create service role client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { driver_id, user_id: driverUserId }: GetDriverEmailRequest = await req.json();

    if (!driver_id && !driverUserId) {
      return new Response(
        JSON.stringify({ error: "driver_id or user_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (driver_id && !uuidRegex.test(driver_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid driver_id format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (driverUserId && !uuidRegex.test(driverUserId)) {
      return new Response(
        JSON.stringify({ error: "Invalid user_id format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let targetUserId = driverUserId;

    // If driver_id provided, first get the user_id from drivers table
    if (driver_id && !driverUserId) {
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

      targetUserId = driver.user_id;
      console.log("Found driver user_id:", targetUserId);
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "No user_id found for driver" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user email from auth
    console.log("Fetching user email for user_id:", targetUserId);
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(targetUserId);

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
        user_id: targetUserId 
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
