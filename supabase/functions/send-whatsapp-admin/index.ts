import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppAdminRequest {
  message: string;
  title?: string;
  phoneNumber?: string; // Optional override, defaults to admin phone
}

const ADMIN_PHONE = "+905321748390";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioWhatsAppNumberRaw = Deno.env.get("TWILIO_WHATSAPP_NUMBER");
    const twilioWhatsAppNumber = twilioWhatsAppNumberRaw?.trim();

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      console.error("Twilio credentials not configured");
      return new Response(
        JSON.stringify({ error: "Twilio credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, title, phoneNumber }: WhatsAppAdminRequest = await req.json();
    
    // Use provided phone or default admin phone
    const targetPhone = phoneNumber || ADMIN_PHONE;

    console.log(`Sending WhatsApp to admin: ${targetPhone}`);

    // Format phone number for WhatsApp
    const formattedPhone = targetPhone.replace(/\s/g, '').startsWith('+') 
      ? targetPhone.replace(/\s/g, '') 
      : `+${targetPhone.replace(/\s/g, '')}`;

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

    console.log("WhatsApp message sent successfully to admin:", twilioResult.sid);

    return new Response(
      JSON.stringify({ success: true, messageSid: twilioResult.sid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-whatsapp-admin:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
