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

    // Validate required fields
    if (!userId || !deviceFingerprint) {
      return new Response(
        JSON.stringify({ trusted: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate userId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return new Response(
        JSON.stringify({ trusted: false, error: "Invalid user ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract base fingerprint (without timestamp suffix)
    const baseFp = deviceFingerprint.split('-')[0];

    // Check if device is trusted using pattern matching for the base fingerprint
    const { data: devices, error: fetchError } = await supabase
      .from('trusted_devices')
      .select('id, device_fingerprint, last_used_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_used_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error("Error fetching trusted devices:", fetchError);
      return new Response(
        JSON.stringify({ trusted: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if any device matches the base fingerprint
    const matchingDevice = devices?.find(d => {
      const storedBaseFp = d.device_fingerprint.split('-')[0];
      return storedBaseFp === baseFp;
    });

    if (matchingDevice) {
      // Update last_used_at for the matching device
      await supabase
        .from('trusted_devices')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', matchingDevice.id);
      
      console.log(`Trusted device found for user ${userId}`);
      return new Response(
        JSON.stringify({ trusted: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`No trusted device found for user ${userId}`);
    return new Response(
      JSON.stringify({ trusted: false }),
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
