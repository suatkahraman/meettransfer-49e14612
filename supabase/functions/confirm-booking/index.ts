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
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER")?.trim();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch active promo code from database
    let activePromoDiscount = 25;
    try {
      const { data: promoData } = await supabase
        .from('promo_codes')
        .select('discount_percentage')
        .eq('is_active', true)
        .eq('applies_to', 'return_transfer')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (promoData) {
        activePromoDiscount = promoData.discount_percentage;
      }
    } catch (e) {
      console.log('Failed to fetch promo from DB, using default 25%');
    }

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find booking confirmation
    const { data: confirmation, error: confError } = await supabase
      .from("whatsapp_booking_confirmations")
      .select("*, whatsapp_conversations(*)")
      .eq("confirmation_token", token)
      .eq("status", "pending")
      .single();

    if (confError || !confirmation) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired confirmation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (new Date(confirmation.expires_at) < new Date()) {
      await supabase
        .from("whatsapp_booking_confirmations")
        .update({ status: "expired" })
        .eq("id", confirmation.id);

      return new Response(
        JSON.stringify({ error: "Confirmation expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as confirmed
    await supabase
      .from("whatsapp_booking_confirmations")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", confirmation.id);

    // Update reservation if linked
    if (confirmation.reservation_id) {
      await supabase
        .from("reservations")
        .update({ status: "confirmed" })
        .eq("id", confirmation.reservation_id);
    }

    const conversation = confirmation.whatsapp_conversations;
    const customerPhone = conversation?.customer_phone;

    if (customerPhone) {
      // Generate customer account magic link
      const magicToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const appUrl = Deno.env.get("APP_URL") || "https://meet-transfer.com";

      await supabase
        .from("customer_magic_links")
        .insert({
          customer_phone: customerPhone,
          token: magicToken,
          expires_at: expiresAt.toISOString(),
        });

      const customerLink = `${appUrl}/customer-portal?token=${magicToken}`;

      const confirmationMessage = `✅ Your booking is confirmed.

You can view all your reservation details and driver information in the Meet Transfer App using the link below.
You can also create new reservations from your account.

👉 ${customerLink}

🎁 Special offer:
If you book a round-trip (return transfer), you will receive a ${activePromoDiscount}% discount on your return transfer.`;

      // Send WhatsApp confirmation
      await sendWhatsAppMessage(
        twilioAccountSid,
        twilioAuthToken,
        twilioWhatsAppNumber!,
        customerPhone,
        confirmationMessage
      );

      // Store outgoing message
      await supabase
        .from("whatsapp_messages")
        .insert({
          conversation_id: conversation.id,
          direction: "outgoing",
          content: confirmationMessage,
          reservation_id: confirmation.reservation_id,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Booking confirmed",
        reservation_id: confirmation.reservation_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in confirm-booking:", error);
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
