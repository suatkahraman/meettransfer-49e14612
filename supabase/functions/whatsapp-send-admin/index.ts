import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendMessageRequest {
  conversation_id: string;
  message: string;
  message_type?: "text" | "price" | "magic_link";
  price?: number;
  currency?: string;
  reservation_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER")?.trim();

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (userRole?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { conversation_id, message, message_type = "text", price, currency = "EUR", reservation_id }: SendMessageRequest = await req.json();

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("id", conversation_id)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let finalMessage = message;
    let messageSid: string | null = null;

    if (message_type === "price" && price) {
      // Create booking confirmation with token
      const confirmationToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const appUrl = Deno.env.get("APP_URL") || "https://meet-transfer.com";

      await supabase
        .from("whatsapp_booking_confirmations")
        .insert({
          conversation_id,
          reservation_id,
          price,
          currency,
          confirmation_token: confirmationToken,
          expires_at: expiresAt.toISOString(),
        });

      const confirmUrl = `${appUrl}/confirm-booking?token=${confirmationToken}`;

      finalMessage = `Your transfer price is ${currency === "EUR" ? "€" : currency}${price} 🚐

Please confirm your booking by clicking the link below or replying "Confirm":

👉 ${confirmUrl}`;
    } else if (message_type === "magic_link") {
      // Generate magic link for customer account
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const appUrl = Deno.env.get("APP_URL") || "https://meet-transfer.com";

      await supabase
        .from("customer_magic_links")
        .insert({
          customer_phone: conversation.customer_phone,
          token,
          expires_at: expiresAt.toISOString(),
          created_by: user.id,
        });

      const customerLink = `${appUrl}/customer-portal?token=${token}`;

      finalMessage = `${message}

👉 ${customerLink}`;
    }

    // Send via Twilio
    messageSid = await sendWhatsAppMessage(
      twilioAccountSid,
      twilioAuthToken,
      twilioWhatsAppNumber!,
      conversation.customer_phone,
      finalMessage
    );

    if (!messageSid) {
      return new Response(
        JSON.stringify({ error: "Failed to send message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store message
    const { data: storedMessage, error: msgError } = await supabase
      .from("whatsapp_messages")
      .insert({
        conversation_id,
        direction: "outgoing",
        content: finalMessage,
        message_type,
        twilio_sid: messageSid,
        sent_by_user_id: user.id,
        reservation_id,
        metadata: { price, currency },
      })
      .select()
      .single();

    if (msgError) {
      console.error("Error storing message:", msgError);
    }

    // Update conversation
    await supabase
      .from("whatsapp_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation_id);

    return new Response(
      JSON.stringify({ success: true, message_id: storedMessage?.id, twilio_sid: messageSid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in whatsapp-send-admin:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendWhatsAppMessage(
  accountSid: string,
  authToken: string,
  fromNumber: string,
  toPhone: string,
  message: string
): Promise<string | null> {
  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const from = fromNumber.startsWith("whatsapp:")
      ? fromNumber
      : `whatsapp:${fromNumber}`;
    const to = toPhone.startsWith("whatsapp:")
      ? toPhone
      : `whatsapp:${toPhone}`;

    const formData = new URLSearchParams();
    formData.append("From", from);
    formData.append("To", to);
    formData.append("Body", message);

    const credentials = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", result);
      return null;
    }

    return result.sid;
  } catch (error) {
    console.error("Error sending WhatsApp:", error);
    return null;
  }
}
