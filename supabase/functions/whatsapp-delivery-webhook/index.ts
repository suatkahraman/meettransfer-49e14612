import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Twilio StatusCallback webhook (public)
// Updates whatsapp_messages.status based on Twilio delivery updates.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const normalizeWa = (value: string) =>
  value
    .trim()
    .replace(/^whatsapp:/i, "")
    .replace(/[\s()-]/g, "")
    .replace(/^00/, "+");

serve(async (req) => {
  // Twilio doesn't need CORS, but keeping OPTIONS handler helps for manual testing.
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER")?.trim() || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const form = await req.formData();
    const messageSid = String(form.get("MessageSid") ?? "").trim();
    const messageStatus = String(form.get("MessageStatus") ?? "").trim();

    const from = String(form.get("From") ?? "").trim();
    const to = String(form.get("To") ?? "").trim();
    const errorCode = form.get("ErrorCode")?.toString() ?? null;
    const errorMessage = form.get("ErrorMessage")?.toString() ?? null;

    if (!messageSid || !messageStatus) {
      console.warn("StatusCallback missing MessageSid/MessageStatus", {
        messageSid,
        messageStatus,
      });
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const { data: msgRow, error: msgErr } = await supabase
      .from("whatsapp_messages")
      .select("id, conversation_id, metadata, twilio_sid")
      .eq("twilio_sid", messageSid)
      .maybeSingle();

    if (msgErr) {
      console.error("StatusCallback DB lookup error", msgErr);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    if (!msgRow) {
      console.warn("StatusCallback: message not found for sid", { messageSid, messageStatus });
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const { data: conv } = await supabase
      .from("whatsapp_conversations")
      .select("customer_phone")
      .eq("id", msgRow.conversation_id)
      .maybeSingle();

    // Basic sanity check to reduce spoofing (not a full Twilio signature verification)
    const expectedTo = conv?.customer_phone ? normalizeWa(conv.customer_phone) : null;
    const expectedFrom = twilioWhatsAppNumber ? normalizeWa(twilioWhatsAppNumber) : null;
    const actualTo = to ? normalizeWa(to) : null;
    const actualFrom = from ? normalizeWa(from) : null;

    if (expectedTo && actualTo && expectedTo !== actualTo) {
      console.warn("StatusCallback: 'To' mismatch", {
        messageSid,
        expectedTo,
        actualTo,
      });
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    if (expectedFrom && actualFrom && expectedFrom !== actualFrom) {
      console.warn("StatusCallback: 'From' mismatch", {
        messageSid,
        expectedFrom,
        actualFrom,
      });
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const nextMeta = {
      ...(msgRow.metadata ?? {}),
      twilio_status: messageStatus,
      twilio_error_code: errorCode,
      twilio_error_message: errorMessage,
      twilio_to: to || null,
      twilio_from: from || null,
      twilio_updated_at: new Date().toISOString(),
    };

    const { error: updErr } = await supabase
      .from("whatsapp_messages")
      .update({
        status: messageStatus,
        metadata: nextMeta,
      })
      .eq("id", msgRow.id);

    if (updErr) {
      console.error("StatusCallback DB update error", updErr);
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error in whatsapp-delivery-webhook:", error);
    // Return 200 so Twilio doesn't retry indefinitely; logs will show the failure.
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
