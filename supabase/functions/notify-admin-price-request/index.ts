import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      pickup, 
      dropoff, 
      passengers, 
      vehicleType, 
      customerName,
      customerSessionId,
      language = 'EN'
    } = await req.json();

    console.log("Price request notification for route:", pickup, "->", dropoff);

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get admin emails
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found");
      return new Response(JSON.stringify({ success: false, error: "No admins found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin email addresses
    const adminEmails: string[] = [];
    for (const admin of adminRoles) {
      const { data: userData } = await supabase.auth.admin.getUserById(admin.user_id);
      if (userData?.user?.email) {
        adminEmails.push(userData.user.email);
      }
    }

    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(JSON.stringify({ success: false, error: "No admin emails" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vehicleNames: Record<string, string> = {
      'mercedes-vito': 'Mercedes Vito',
      'vip-mercedes': 'Mercedes Vito VIP',
      'maybach-minibus': 'Maybach',
      'minibus': 'Mercedes Sprinter'
    };

    const isTurkish = language === 'TR';
    
    const subject = isTurkish 
      ? `🚨 Acil Fiyat Talebi - ${pickup} → ${dropoff}`
      : `🚨 Urgent Price Request - ${pickup} → ${dropoff}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .route-box { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .route-item { display: flex; align-items: center; margin: 10px 0; }
          .label { color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 16px; font-weight: 600; color: #1e293b; }
          .cta-button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 ${isTurkish ? 'Acil Fiyat Talebi' : 'Urgent Price Request'}</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>${isTurkish ? 'Dikkat!' : 'Attention!'}</strong> 
              ${isTurkish 
                ? 'Müşteri için bu güzergahta fiyat bulunamadı. Lütfen hemen fiyat girin.' 
                : 'No price found for this route. Please enter a price immediately.'}
            </div>
            
            <div class="route-box">
              <div class="route-item">
                <div>
                  <p class="label">📍 ${isTurkish ? 'Alış Noktası' : 'Pickup'}</p>
                  <p class="value">${pickup}</p>
                </div>
              </div>
              <div style="text-align: center; color: #64748b; margin: 10px 0;">↓</div>
              <div class="route-item">
                <div>
                  <p class="label">🏁 ${isTurkish ? 'Varış Noktası' : 'Dropoff'}</p>
                  <p class="value">${dropoff}</p>
                </div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
              <div>
                <p class="label">👥 ${isTurkish ? 'Yolcu Sayısı' : 'Passengers'}</p>
                <p class="value">${passengers || 'Belirtilmedi'}</p>
              </div>
              <div>
                <p class="label">🚗 ${isTurkish ? 'Araç Tipi' : 'Vehicle Type'}</p>
                <p class="value">${vehicleNames[vehicleType] || vehicleType || 'Belirtilmedi'}</p>
              </div>
              ${customerName ? `
              <div style="grid-column: span 2;">
                <p class="label">👤 ${isTurkish ? 'Müşteri' : 'Customer'}</p>
                <p class="value">${customerName}</p>
              </div>
              ` : ''}
            </div>
            
            <p style="color: #64748b; margin-top: 20px;">
              ${isTurkish 
                ? 'Müşteri şu anda bekliyor. Fiyatı girdikten sonra AI asistan otomatik olarak müşteriye bildirecek.' 
                : 'Customer is currently waiting. Once you enter the price, the AI assistant will automatically notify them.'}
            </p>
            
            <div style="text-align: center;">
              <a href="https://meettransfer.lovable.app/admin/reservations" class="cta-button">
                ${isTurkish ? 'Admin Paneline Git' : 'Go to Admin Panel'}
              </a>
            </div>
          </div>
          <div class="footer">
            <p>Meet Transfer - VIP Transfer Service</p>
            <p style="color: #94a3b8; font-size: 11px;">Session ID: ${customerSessionId || 'N/A'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Meet Transfer <noreply@mail.meettransfer.app>',
        to: adminEmails,
        subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent:", emailResult);

    // Also create a notification in the database
    for (const admin of adminRoles) {
      await supabase.from('notifications').insert({
        user_id: admin.user_id,
        title: isTurkish ? 'Acil Fiyat Talebi' : 'Urgent Price Request',
        message: isTurkish 
          ? `${pickup} → ${dropoff} güzergahı için fiyat girilmesi gerekiyor.`
          : `Price needed for route: ${pickup} → ${dropoff}`,
        type: 'price_request',
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailsSent: adminEmails.length,
      notificationsCreated: adminRoles.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in notify-admin-price-request:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
