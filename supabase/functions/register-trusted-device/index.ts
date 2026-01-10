import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegisterDeviceRequest {
  userId: string;
  deviceFingerprint: string;
  deviceName?: string;
}

// Max devices per user
const MAX_DEVICES_PER_USER = 10;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, deviceFingerprint, deviceName }: RegisterDeviceRequest = await req.json();

    // Validate required fields
    if (!userId || !deviceFingerprint) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate userId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid user ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      null;
    const userAgent = req.headers.get('user-agent');

    // Extract base fingerprint for duplicate check
    const baseFp = deviceFingerprint.split('-')[0];

    // Check if a similar device already exists
    const { data: existingDevices, error: fetchError } = await supabase
      .from('trusted_devices')
      .select('id, device_fingerprint')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (fetchError) {
      console.error("Error fetching existing devices:", fetchError);
    }

    // Find if any existing device matches
    const existingDevice = existingDevices?.find(d => {
      const storedBaseFp = d.device_fingerprint.split('-')[0];
      return storedBaseFp === baseFp;
    });

    if (existingDevice) {
      // Update the existing device
      const { error: updateError } = await supabase
        .from('trusted_devices')
        .update({
          device_fingerprint: deviceFingerprint,
          device_name: deviceName || 'Unknown Device',
          ip_address: ipAddress,
          user_agent: userAgent,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existingDevice.id);

      if (updateError) {
        console.error("Error updating trusted device:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to update device" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Updated trusted device for user ${userId}: ${existingDevice.id}`);
      return new Response(
        JSON.stringify({ success: true, deviceId: existingDevice.id, updated: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check device count limit
    const activeDeviceCount = existingDevices?.length || 0;
    if (activeDeviceCount >= MAX_DEVICES_PER_USER) {
      // Remove the oldest device
      const { data: oldestDevice } = await supabase
        .from('trusted_devices')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_used_at', { ascending: true })
        .limit(1)
        .single();

      if (oldestDevice) {
        await supabase
          .from('trusted_devices')
          .update({ is_active: false })
          .eq('id', oldestDevice.id);
        
        console.log(`Removed oldest device for user ${userId}: ${oldestDevice.id}`);
      }
    }

    // Register the trusted device using RPC
    const { data: deviceId, error } = await supabase.rpc('register_trusted_device', {
      p_user_id: userId,
      p_device_fingerprint: deviceFingerprint,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_device_name: deviceName || 'Unknown Device',
    });

    if (error) {
      console.error("Error registering trusted device:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to register device" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Registered new trusted device for user ${userId}: ${deviceId}`);

    return new Response(
      JSON.stringify({ success: true, deviceId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in register-trusted-device function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
