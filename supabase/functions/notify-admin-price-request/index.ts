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
      language = 'EN',
      // Additional optional fields for more complete booking
      pickupDate,
      pickupTime,
      customerPhone,
      customerEmail,
      babySeatCount,
      luggageCount,
      serviceType = 'airport_transfer'
    } = await req.json();

    console.log("Price request notification for route:", pickup, "->", dropoff);
    console.log("Additional data:", { pickupDate, pickupTime, customerPhone, customerEmail, passengers, vehicleType });

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================
    // CREATE QUICK BOOKING REQUEST RECORD
    // This ensures the request appears in admin panel
    // ============================================
    let quickBookingId: string | null = null;
    
    if (pickup && dropoff && customerSessionId) {
      // Check if there's already a pending request for this session with same route
      const { data: existingRequest } = await supabase
        .from('quick_booking_requests')
        .select('id')
        .eq('customer_session_id', customerSessionId)
        .eq('pickup', pickup)
        .eq('dropoff', dropoff)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequest) {
        console.log("Quick booking request already exists:", existingRequest.id);
        quickBookingId = existingRequest.id;
      } else {
        // Create new quick booking request with status 'pending' (awaiting price)
        const insertData: Record<string, any> = {
          pickup,
          dropoff,
          pickup_date: pickupDate || new Date().toISOString().split('T')[0], // Default to today if not provided
          pickup_time: pickupTime || '12:00', // Default time if not provided
          passengers: passengers || 1,
          vehicle_type: vehicleType || 'mercedes-vito',
          customer_session_id: customerSessionId,
          status: 'pending', // Awaiting admin price input
          language: language,
          service_type: serviceType,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          customer_email: customerEmail || null,
          baby_seat_count: babySeatCount || 0,
          luggage_count: luggageCount || null,
          created_via_ai: true, // Mark as created via AI assistant price request
          price: null, // No price yet - admin needs to set it
          price_currency: 'EUR',
        };

        const { data: newRequest, error: insertError } = await supabase
          .from('quick_booking_requests')
          .insert(insertData)
          .select('id')
          .single();

        if (insertError) {
          console.error("Failed to create quick booking request:", insertError);
        } else {
          quickBookingId = newRequest.id;
          console.log("Created quick booking request:", quickBookingId);
        }
      }
    }

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

    // Link directly to Quick Bookings page (not reservations)
    const adminPanelUrl = 'https://meettransfer.lovable.app/admin/quick-bookings';

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
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .cta-button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          .booking-id { background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-family: monospace; }
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
              ${quickBookingId ? `<br><br><span class="booking-id">Request ID: ${quickBookingId.substring(0, 8)}...</span>` : ''}
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
            
            <div class="info-grid">
              <div>
                <p class="label">👥 ${isTurkish ? 'Yolcu Sayısı' : 'Passengers'}</p>
                <p class="value">${passengers || 'Belirtilmedi'}</p>
              </div>
              <div>
                <p class="label">🚗 ${isTurkish ? 'Araç Tipi' : 'Vehicle Type'}</p>
                <p class="value">${vehicleNames[vehicleType] || vehicleType || 'Belirtilmedi'}</p>
              </div>
              ${pickupDate ? `
              <div>
                <p class="label">📅 ${isTurkish ? 'Tarih' : 'Date'}</p>
                <p class="value">${pickupDate}</p>
              </div>
              ` : ''}
              ${pickupTime ? `
              <div>
                <p class="label">🕐 ${isTurkish ? 'Saat' : 'Time'}</p>
                <p class="value">${pickupTime}</p>
              </div>
              ` : ''}
              ${customerName ? `
              <div>
                <p class="label">👤 ${isTurkish ? 'Müşteri' : 'Customer'}</p>
                <p class="value">${customerName}</p>
              </div>
              ` : ''}
              ${customerPhone ? `
              <div>
                <p class="label">📱 ${isTurkish ? 'Telefon' : 'Phone'}</p>
                <p class="value">${customerPhone}</p>
              </div>
              ` : ''}
            </div>
            
            <p style="color: #64748b; margin-top: 20px;">
              ${isTurkish 
                ? 'Müşteri şu anda bekliyor. Fiyatı girdikten sonra AI asistan otomatik olarak müşteriye bildirecek.' 
                : 'Customer is currently waiting. Once you enter the price, the AI assistant will automatically notify them.'}
            </p>
            
            <div style="text-align: center;">
              <a href="${adminPanelUrl}" class="cta-button">
                ${isTurkish ? 'Quick Bookings\'e Git' : 'Go to Quick Bookings'}
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

    // Send push notification to admins
    try {
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userIds: adminRoles.map(a => a.user_id),
          title: isTurkish ? '🚨 Acil Fiyat Talebi' : '🚨 Urgent Price Request',
          body: `${pickup} → ${dropoff}`,
          url: adminPanelUrl,
          tag: 'price-request',
        }
      });
      
      if (pushError) {
        console.error("Push notification error:", pushError);
      } else {
        console.log("Push notifications sent to admins");
      }
    } catch (pushErr) {
      console.error("Failed to send push notifications:", pushErr);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailsSent: adminEmails.length,
      notificationsCreated: adminRoles.length,
      quickBookingId: quickBookingId
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
