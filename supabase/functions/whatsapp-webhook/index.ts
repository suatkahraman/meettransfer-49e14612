import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "sautkahraman@gmail.com";

const WELCOME_MESSAGE = `Hello 👋
Welcome to Meet Transfer.

Please send:
• Airport (IST / AYT / etc.)
• Destination
• Date & time
• Number of passengers
• Email address
• Vehicle Type: Vito / Vip Vito / Mercedes Maybach / Minibus`;

// Send email notification to admin using Resend API directly
async function sendAdminEmailNotification(
  customerPhone: string,
  customerName: string | null,
  messageContent: string,
  isNewCustomer: boolean
): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured, skipping email notification");
    return;
  }

  try {
    
    const subject = isNewCustomer 
      ? `🆕 Yeni WhatsApp Müşterisi: ${customerName || customerPhone}`
      : `💬 WhatsApp Mesajı: ${customerName || customerPhone}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 24px; }
          .header h1 { margin: 0; font-size: 20px; }
          .header p { margin: 8px 0 0; opacity: 0.8; font-size: 14px; }
          .content { padding: 24px; }
          .info-row { display: flex; margin-bottom: 12px; }
          .info-label { font-weight: 600; color: #666; width: 120px; }
          .info-value { color: #333; }
          .message-box { background: #f8f9fa; border-left: 4px solid #1a1a2e; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
          .message-box p { margin: 0; color: #333; white-space: pre-wrap; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .badge-new { background: #e3fcef; color: #00875a; }
          .badge-existing { background: #deebff; color: #0052cc; }
          .cta { display: inline-block; background: #1a1a2e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
          .footer { background: #f8f9fa; padding: 16px 24px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📱 WhatsApp Bildirimi</h1>
            <p>Meet Transfer Admin Paneli</p>
          </div>
          <div class="content">
            <span class="badge ${isNewCustomer ? 'badge-new' : 'badge-existing'}">
              ${isNewCustomer ? '🆕 Yeni Müşteri' : '💬 Mevcut Müşteri'}
            </span>
            
            <div style="margin-top: 20px;">
              <div class="info-row">
                <span class="info-label">📞 Telefon:</span>
                <span class="info-value">${customerPhone}</span>
              </div>
              ${customerName ? `
              <div class="info-row">
                <span class="info-label">👤 İsim:</span>
                <span class="info-value">${customerName}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">🕐 Zaman:</span>
                <span class="info-value">${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}</span>
              </div>
            </div>
            
            <h3 style="margin: 24px 0 8px; color: #333;">Mesaj İçeriği:</h3>
            <div class="message-box">
              <p>${messageContent}</p>
            </div>
            
            <a href="https://meettransfer.app/admin/whatsapp" class="cta">
              WhatsApp Sohbetine Git →
            </a>
          </div>
          <div class="footer">
            Bu e-posta Meet Transfer WhatsApp entegrasyonu tarafından otomatik olarak gönderilmiştir.
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Meet Transfer <info@meettransfer.app>",
        to: [ADMIN_EMAIL],
        subject: subject,
        html: htmlContent,
      }),
    });

    const result = await emailResponse.json();

    console.log("Admin email notification sent:", result);
  } catch (error) {
    console.error("Failed to send admin email notification:", error);
  }
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Parse Twilio webhook data (form-urlencoded)
    const formData = await req.formData();
    const from = formData.get("From")?.toString() || "";
    const body = formData.get("Body")?.toString() || "";
    const profileName = formData.get("ProfileName")?.toString() || "";
    const messageSid = formData.get("MessageSid")?.toString() || "";

    // Extract phone number (remove whatsapp: prefix)
    const customerPhone = from.replace("whatsapp:", "");

    console.log(`Incoming WhatsApp from ${customerPhone}: ${body}`);

    // Find or create conversation
    let { data: conversation, error: convError } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("customer_phone", customerPhone)
      .maybeSingle();

    const isNewCustomer = !conversation;

    if (!conversation) {
      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from("whatsapp_conversations")
        .insert({
          customer_phone: customerPhone,
          customer_name: profileName || null,
          unread_count: 1,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating conversation:", createError);
        return new Response("Error", { status: 500 });
      }
      conversation = newConv;
    } else {
      // Update existing conversation
      await supabase
        .from("whatsapp_conversations")
        .update({
          last_message_at: new Date().toISOString(),
          unread_count: (conversation.unread_count || 0) + 1,
          customer_name: profileName || conversation.customer_name,
        })
        .eq("id", conversation.id);
    }

    // Store incoming message
    const { error: msgError } = await supabase
      .from("whatsapp_messages")
      .insert({
        conversation_id: conversation.id,
        direction: "incoming",
        content: body,
        twilio_sid: messageSid,
        metadata: { profile_name: profileName },
      });

    if (msgError) {
      console.error("Error storing message:", msgError);
    }

    // Send email notification to admin (fire and forget, don't block response)
    sendAdminEmailNotification(customerPhone, profileName || null, body, isNewCustomer)
      .catch(err => console.error("Email notification error:", err));

    // Check if this is a booking confirmation callback
    if (body.toLowerCase().includes("confirm") || body === "1") {
      // Check for pending confirmation
      const { data: pendingConfirmation } = await supabase
        .from("whatsapp_booking_confirmations")
        .select("*")
        .eq("conversation_id", conversation.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingConfirmation) {
        // Mark as confirmed
        await supabase
          .from("whatsapp_booking_confirmations")
          .update({
            status: "confirmed",
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", pendingConfirmation.id);

        // Update reservation if linked
        if (pendingConfirmation.reservation_id) {
          await supabase
            .from("reservations")
            .update({ status: "confirmed" })
            .eq("id", pendingConfirmation.reservation_id);
        }

        // Generate customer account link
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await supabase
          .from("customer_magic_links")
          .insert({
            customer_phone: customerPhone,
            token,
            expires_at: expiresAt.toISOString(),
          });

        const appUrl = "https://meettransfer.app";
        const customerLink = `${appUrl}/customer-portal?token=${token}`;

        const confirmationMessage = `✅ Your booking is confirmed.

You can view all your reservation details and driver information in the Meet Transfer App using the link below.
You can also create new reservations from your account.

👉 ${customerLink}

🎁 Special offer:
If you book a round-trip (return transfer), you will receive a 30% discount on your return transfer.`;

        // Send confirmation message
        console.log(`Sending confirmation to ${customerPhone}, from: ${twilioWhatsAppNumber}`);
        const confirmSid = await sendWhatsAppMessage(
          twilioAccountSid,
          twilioAuthToken,
          twilioWhatsAppNumber!,
          customerPhone,
          confirmationMessage
        );
        console.log(`Confirmation message SID: ${confirmSid}`);

        // Store outgoing message
        await supabase
          .from("whatsapp_messages")
          .insert({
            conversation_id: conversation.id,
            direction: "outgoing",
            content: confirmationMessage,
            reservation_id: pendingConfirmation.reservation_id,
            twilio_sid: confirmSid,
          });

        return new Response(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
        );
      }
    }

    // Send welcome message for new customers
    if (isNewCustomer) {
      await sendWhatsAppMessage(
        twilioAccountSid,
        twilioAuthToken,
        twilioWhatsAppNumber!,
        customerPhone,
        WELCOME_MESSAGE
      );

      // Store outgoing message
      await supabase
        .from("whatsapp_messages")
        .insert({
          conversation_id: conversation.id,
          direction: "outgoing",
          content: WELCOME_MESSAGE,
        });
    }

    // Return empty TwiML response
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
    );
  } catch (error) {
    console.error("Error in whatsapp-webhook:", error);
    return new Response("Error", { status: 500, headers: corsHeaders });
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

    const callbackBase = Deno.env.get("SUPABASE_URL")?.trim();
    if (callbackBase) {
      formData.append("StatusCallback", `${callbackBase}/functions/v1/whatsapp-delivery-webhook`);
    }

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
