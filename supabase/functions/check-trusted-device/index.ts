import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckDeviceRequest {
  userId: string;
  deviceFingerprint: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, deviceFingerprint }: CheckDeviceRequest = await req.json();

    if (!userId || !deviceFingerprint) {
      return new Response(
        JSON.stringify({ trusted: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if device is trusted
    const { data: isTrusted, error } = await supabase.rpc('is_device_trusted', {
      p_user_id: userId,
      p_device_fingerprint: deviceFingerprint,
    });

    if (error) {
      console.error("Error checking trusted device:", error);
      return new Response(
        JSON.stringify({ trusted: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Device check for user ${userId}: trusted=${isTrusted}`);

    return new Response(
      JSON.stringify({ trusted: isTrusted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in check-trusted-device function:", error);
    return new Response(
      JSON.stringify({ trusted: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
