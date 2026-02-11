/**
 * get-user-role - RLS bypass ile kullanıcı rolünü döner.
 * Driver panel giriş sorununu kesin çözmek için service_role kullanır.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole = "admin" | "driver" | "customer" | "agency";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, role: "customer", driverId: null, agencyId: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, role: "customer", driverId: null, agencyId: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Service role ile user_roles - RLS bypass
    let { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    // user_roles boşsa drivers/agencies tablosundan rol çöz (kayıt uyumsuzluğu fallback)
    let role: AppRole = (roleData?.role as AppRole) || "customer";
    if (!roleData?.role) {
      const { data: driverRow } = await supabaseAdmin
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (driverRow?.id) {
        role = "driver";
        roleData = { role: "driver" };
      } else {
        const { data: agencyRow } = await supabaseAdmin
          .from("agencies")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (agencyRow?.id) {
          role = "agency";
          roleData = { role: "agency" };
        }
      }
    }

    let driverId: string | null = null;
    let agencyId: string | null = null;

    if (role === "driver") {
      const { data: driverData } = await supabaseAdmin
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      driverId = driverData?.id || null;
    }

    if (role === "agency") {
      const { data: agencyData } = await supabaseAdmin
        .from("agencies")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      agencyId = agencyData?.id || null;
    }

    return new Response(
      JSON.stringify({
        success: true,
        role,
        driverId,
        agencyId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("get-user-role error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        role: "customer",
        driverId: null,
        agencyId: null,
        error: error.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
