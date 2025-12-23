import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MessageStatusRequest {
  message_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID")?.trim();
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN")?.trim();

    if (!twilioAccountSid || !twilioAuthToken) {
      return new Response(JSON.stringify({ error: "Twilio credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (userRole?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: MessageStatusRequest = await req.json();
    const messageId = String(body?.message_id ?? "").trim();

    if (!messageId) {
      return new Response(JSON.stringify({ error: "message_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: msg, error: msgError } = await supabaseAdmin
      .from("whatsapp_messages")
      .select("id, twilio_sid, metadata, status")
      .eq("id", messageId)
      .maybeSingle();

    if (msgError || !msg) {
      return new Response(JSON.stringify({ error: "Message not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!msg.twilio_sid) {
      return new Response(JSON.stringify({ error: "Message has no twilio_sid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    const checkUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages/${encodeURIComponent(
      msg.twilio_sid
    )}.json`;

    const checkResp = await fetch(checkUrl, {
      method: "GET",
      headers: { Authorization: `Basic ${credentials}` },
    });

    const text = await checkResp.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // ignore
    }

    if (!checkResp.ok) {
      console.error("Twilio status check failed:", { status: checkResp.status, body: json || text });
      return new Response(JSON.stringify({ error: "Twilio status check failed", details: json || text }), {
        status: checkResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nextMeta = {
      ...(msg.metadata ?? {}),
      twilio_status: json?.status ?? null,
      twilio_error_code: json?.error_code ?? null,
      twilio_error_message: json?.error_message ?? null,
      twilio_to: json?.to ?? null,
      twilio_from: json?.from ?? null,
      twilio_date_updated: json?.date_updated ?? null,
      twilio_checked_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from("whatsapp_messages")
      .update({
        status: json?.status ?? msg.status,
        metadata: nextMeta,
      })
      .eq("id", msg.id);

    return new Response(
      JSON.stringify({
        sid: json?.sid,
        status: json?.status,
        error_code: json?.error_code ?? null,
        error_message: json?.error_message ?? null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in whatsapp-message-status:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
