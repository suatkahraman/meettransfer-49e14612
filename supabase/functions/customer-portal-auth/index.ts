import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Helper function to normalize phone numbers for matching
    const normalizePhone = (phone: string): string => {
      return phone.replace(/[^\d]/g, "").replace(/^0+/, "").replace(/^90/, "");
    };

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find magic link
    const { data: magicLink, error: linkError } = await supabase
      .from("customer_magic_links")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .single();

    if (linkError || !magicLink) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (new Date(magicLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Token expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists for this phone
    let userId = magicLink.customer_user_id;

    if (!userId) {
      const normalizedMagicPhone = normalizePhone(magicLink.customer_phone);
      
      // Find existing user by normalized phone in reservations
      const { data: allReservations } = await supabase
        .from("reservations")
        .select("customer_id, customer_phone");
      
      const matchingReservation = (allReservations || []).find(res => {
        const normalizedResPhone = normalizePhone(res.customer_phone || "");
        return normalizedResPhone === normalizedMagicPhone || 
               normalizedResPhone.endsWith(normalizedMagicPhone.slice(-10)) ||
               normalizedMagicPhone.endsWith(normalizedResPhone.slice(-10));
      });

      if (matchingReservation) {
        userId = matchingReservation.customer_id;
      } else {
        // Create new user account
        const email = `${magicLink.customer_phone.replace(/\+/g, "")}@whatsapp.meettransfer.com`;
        const password = crypto.randomUUID();

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            phone: magicLink.customer_phone,
            created_via: "whatsapp",
          },
        });

        if (createError) {
          console.error("Error creating user:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create account" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        userId = newUser.user.id;

        // Update profile with phone
        await supabase
          .from("profiles")
          .update({ phone: magicLink.customer_phone })
          .eq("id", userId);

        // Link conversation to user
        await supabase
          .from("whatsapp_conversations")
          .update({ customer_user_id: userId })
          .eq("customer_phone", magicLink.customer_phone);

        // Link existing reservations to user
        await supabase
          .from("reservations")
          .update({ customer_id: userId })
          .eq("customer_phone", magicLink.customer_phone);
      }

      // Update magic link with user id
      await supabase
        .from("customer_magic_links")
        .update({ customer_user_id: userId })
        .eq("id", magicLink.id);
    }

    // Mark magic link as used
    await supabase
      .from("customer_magic_links")
      .update({ used_at: new Date().toISOString() })
      .eq("id", magicLink.id);

    // Generate a session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: `${magicLink.customer_phone.replace(/\+/g, "")}@whatsapp.meettransfer.com`,
    });

    if (sessionError) {
      console.error("Error generating session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get customer data - first try by customer_id, then by phone match
    let { data: reservations } = await supabase
      .from("reservations")
      .select("*")
      .eq("customer_id", userId)
      .order("pickup_date", { ascending: false });

    // If no reservations found by customer_id, try matching by phone
    if (!reservations || reservations.length === 0) {
      const { data: allRes } = await supabase
        .from("reservations")
        .select("*")
        .order("pickup_date", { ascending: false });
      
      const normalizedMagicPhone = normalizePhone(magicLink.customer_phone);
      reservations = (allRes || []).filter(res => {
        const normalizedResPhone = normalizePhone(res.customer_phone || "");
        return normalizedResPhone === normalizedMagicPhone || 
               normalizedResPhone.endsWith(normalizedMagicPhone.slice(-10)) ||
               normalizedMagicPhone.endsWith(normalizedResPhone.slice(-10));
      });
    }

    const { data: conversation } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("customer_phone", magicLink.customer_phone)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        phone: magicLink.customer_phone,
        reservations: reservations || [],
        conversation_id: conversation?.id,
        auth_url: sessionData.properties?.hashed_token,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in customer-portal-auth:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
