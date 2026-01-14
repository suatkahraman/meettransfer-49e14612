import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TrackingEvent {
  type: string;
  timestamp: number;
  page: string;
  [key: string]: unknown;
}

interface TrackInteractionsBody {
  visitor_id: string;
  page_path: string;
  events: TrackingEvent[];
  scroll_depths_reached?: number[];
  active_time_ms?: number;
  idle_time_ms?: number;
  timestamp: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body: TrackInteractionsBody = await req.json();
    const { visitor_id, page_path, events, scroll_depths_reached, active_time_ms, idle_time_ms, timestamp } = body;

    if (!visitor_id || !events || events.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process events by type
    const scrollEvents = events.filter(e => e.type === "scroll");
    const clickEvents = events.filter(e => e.type === "click");
    const formEvents = events.filter(e => e.type.startsWith("form_"));
    const engagementEvents = events.filter(e => 
      ["time_on_page", "visibility_change", "idle", "active"].includes(e.type)
    );

    // Aggregate click heatmap data
    const clickHeatmap = clickEvents.map(e => ({
      x: e.x as number,
      y: e.y as number,
      element: e.element as string,
      selector: e.selector as string,
      viewport_width: e.viewportWidth as number,
      viewport_height: e.viewportHeight as number,
    }));

    // Aggregate form interaction data
    const formInteractions = new Map<string, {
      started: boolean;
      submitted: boolean;
      abandoned: boolean;
      time_spent: number;
      fields_interacted: string[];
    }>();

    formEvents.forEach(e => {
      const formId = e.formId as string;
      if (!formInteractions.has(formId)) {
        formInteractions.set(formId, {
          started: false,
          submitted: false,
          abandoned: false,
          time_spent: 0,
          fields_interacted: [],
        });
      }
      
      const form = formInteractions.get(formId)!;
      
      switch (e.type) {
        case "form_start":
          form.started = true;
          break;
        case "form_field_focus":
        case "form_field_blur":
          if (e.fieldName && !form.fields_interacted.includes(e.fieldName as string)) {
            form.fields_interacted.push(e.fieldName as string);
          }
          break;
        case "form_submit":
          form.submitted = true;
          form.time_spent = (e.timeSpent as number) || 0;
          break;
        case "form_abandon":
          form.abandoned = true;
          form.time_spent = (e.timeSpent as number) || 0;
          break;
      }
    });

    // Store interaction data
    const interactionData = {
      visitor_id,
      page_path,
      scroll_depths: scroll_depths_reached || [],
      max_scroll_depth: Math.max(...(scroll_depths_reached || [0])),
      click_count: clickEvents.length,
      click_heatmap: clickHeatmap,
      form_interactions: Object.fromEntries(formInteractions),
      active_time_ms: active_time_ms || 0,
      idle_time_ms: idle_time_ms || 0,
      engagement_score: calculateEngagementScore({
        scrollDepth: Math.max(...(scroll_depths_reached || [0])),
        clickCount: clickEvents.length,
        formInteraction: formInteractions.size > 0,
        formSubmitted: Array.from(formInteractions.values()).some(f => f.submitted),
        activeTime: active_time_ms || 0,
      }),
      created_at: timestamp || new Date().toISOString(),
    };

    // Upsert to visitor_interactions table
    const { error: insertError } = await supabaseAdmin
      .from("visitor_interactions")
      .upsert(interactionData, {
        onConflict: "visitor_id,page_path,created_at::date",
        ignoreDuplicates: false,
      });

    if (insertError) {
      // If upsert fails (likely due to missing table), try insert
      const { error: insertError2 } = await supabaseAdmin
        .from("visitor_interactions")
        .insert(interactionData);
        
      if (insertError2) {
        console.error("Insert error:", insertError2);
        // Table might not exist yet, return success anyway
        return new Response(
          JSON.stringify({ success: true, note: "Table may need to be created" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing interactions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Calculate engagement score (0-100)
function calculateEngagementScore(data: {
  scrollDepth: number;
  clickCount: number;
  formInteraction: boolean;
  formSubmitted: boolean;
  activeTime: number;
}): number {
  let score = 0;
  
  // Scroll depth contribution (max 30 points)
  score += Math.min(30, data.scrollDepth * 0.3);
  
  // Click activity contribution (max 20 points)
  score += Math.min(20, data.clickCount * 2);
  
  // Form interaction contribution (max 30 points)
  if (data.formSubmitted) {
    score += 30;
  } else if (data.formInteraction) {
    score += 15;
  }
  
  // Time on page contribution (max 20 points)
  // 1 point per 6 seconds of active time, max 20
  score += Math.min(20, Math.floor(data.activeTime / 6000));
  
  return Math.min(100, Math.round(score));
}
