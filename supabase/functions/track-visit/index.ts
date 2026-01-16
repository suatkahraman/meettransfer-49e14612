import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TrackVisitBody = {
  visit_id?: string | null;
  visitor_id: string;
  page_path: string;
  country_code?: string;
  country_name?: string;
  city?: string;
  browser?: string;
  device?: string;
  referrer?: string | null;
  session_start?: string;
  last_activity?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = (await req.json()) as TrackVisitBody;

    if (!body?.visitor_id || !body?.page_path) {
      return new Response(
        JSON.stringify({ error: "visitor_id and page_path are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if visitor is blocked
    const { data: blockedVisitor } = await supabaseAdmin
      .from("blocked_visitors")
      .select("id")
      .eq("visitor_id", body.visitor_id)
      .eq("is_active", true)
      .maybeSingle();

    if (blockedVisitor) {
      console.log(`[track-visit] Blocked visitor attempted access: ${body.visitor_id}`);
      return new Response(
        JSON.stringify({ blocked: true, message: "Visitor is blocked" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const nowIso = new Date().toISOString();
    const sessionStart = body.session_start || nowIso;
    const lastActivity = body.last_activity || nowIso;

    // Try to update existing visit first if visit_id provided
    if (body.visit_id) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("page_visits")
        .update({
          last_activity: lastActivity,
          page_path: body.page_path,
        })
        .eq("id", body.visit_id)
        .eq("visitor_id", body.visitor_id)
        .select("id")
        .maybeSingle();

      if (!updateError && updated?.id) {
        return new Response(JSON.stringify({ visit_id: updated.id }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
      }
    }

    // Check for recent visit from same visitor (within 30 minutes)
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: recentVisit } = await supabaseAdmin
      .from("page_visits")
      .select("id")
      .eq("visitor_id", body.visitor_id)
      .gte("last_activity", thirtyMinAgo)
      .order("last_activity", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentVisit?.id) {
      // Update existing recent visit
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("page_visits")
        .update({
          last_activity: lastActivity,
          page_path: body.page_path,
          // Update geo/device only if provided and different
          ...(body.country_code && { country_code: body.country_code }),
          ...(body.country_name && { country_name: body.country_name }),
          ...(body.city && { city: body.city }),
        })
        .eq("id", recentVisit.id)
        .select("id")
        .single();

      if (!updateError && updated) {
        return new Response(JSON.stringify({ visit_id: updated.id }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
      }
    }

    // Insert new visit
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("page_visits")
      .insert({
        visitor_id: body.visitor_id,
        page_path: body.page_path,
        country_code: body.country_code ?? null,
        country_name: body.country_name ?? null,
        city: body.city ?? null,
        browser: body.browser ?? null,
        device: body.device ?? null,
        referrer: body.referrer ?? null,
        session_start: sessionStart,
        last_activity: lastActivity,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[track-visit] insert error:", insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ visit_id: inserted.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error: any) {
    console.error("[track-visit] unexpected error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
