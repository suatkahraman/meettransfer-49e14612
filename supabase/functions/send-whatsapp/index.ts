import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppRequest {
  user_id: string;
  message: string;
  title?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioWhatsAppNumberRaw = Deno.env.get("TWILIO_WHATSAPP_NUMBER");
    const twilioWhatsAppNumber = twilioWhatsAppNumberRaw?.trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      console.error("Twilio credentials not configured");
      return new Response(
        JSON.stringify({ error: "Twilio credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, message, title }: WhatsAppRequest = await req.json();

    console.log(`Sending WhatsApp message to user: ${user_id}`);

    // Get user's role to check if admin or driver
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user_id)
      .single();

    if (roleError) {
      console.error("Error fetching user role:", roleError);
      return new Response(
        JSON.stringify({ error: "User role not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only send WhatsApp to admin and driver users
    if (userRole.role !== 'admin' && userRole.role !== 'driver') {
      console.log(`Skipping WhatsApp for non-admin/driver user: ${userRole.role}`);
      return new Response(
        JSON.stringify({ success: true, message: "WhatsApp only for admin/driver users" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get phone number based on role
    let phoneNumber: string | null = null;

    if (userRole.role === 'driver') {
      // Get driver's phone from drivers table
      const { data: driver, error: driverError } = await supabase
        .from("drivers")
        .select("phone")
        .eq("user_id", user_id)
        .single();

      if (!driverError && driver?.phone) {
        phoneNumber = driver.phone;
      }
    } else if (userRole.role === 'admin') {
      // Get admin's phone from profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user_id)
        .single();

      if (!profileError && profile?.phone) {
        phoneNumber = profile.phone;
      }
    }

    if (!phoneNumber) {
      console.log("No phone number found for user");
      return new Response(
        JSON.stringify({ success: false, message: "No phone number found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number for WhatsApp (remove spaces and ensure + prefix)
    const formattedPhone = phoneNumber.replace(/\s/g, '').startsWith('+') 
      ? phoneNumber.replace(/\s/g, '') 
      : `+${phoneNumber.replace(/\s/g, '')}`;

    // Prepare message with title if provided
    const fullMessage = title ? `*${title}*\n\n${message}` : message;

    // Send WhatsApp message via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    const from = twilioWhatsAppNumber.startsWith('whatsapp:')
      ? twilioWhatsAppNumber
      : `whatsapp:${twilioWhatsAppNumber}`;
    formData.append("From", from);
    formData.append("To", `whatsapp:${formattedPhone}`);
    formData.append("Body", fullMessage);

    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioResult);
      return new Response(
        JSON.stringify({ success: false, error: twilioResult.message || "Failed to send WhatsApp" }),
        { status: twilioResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("WhatsApp message sent successfully:", twilioResult.sid);

    return new Response(
      JSON.stringify({ success: true, messageSid: twilioResult.sid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-whatsapp:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
