import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyRequest {
  reservation_id: string;
  flight_number: string;
  delay_minutes: number;
  status: string;
  arrival_time?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { reservation_id, flight_number, delay_minutes, status, arrival_time }: NotifyRequest = await req.json();

    console.log(`Flight delay notification for reservation: ${reservation_id}, flight: ${flight_number}, delay: ${delay_minutes}min, status: ${status}`);

    // Get reservation with driver and customer info
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('id, reservation_code, pickup, dropoff, pickup_date, pickup_time, driver_id, customer_id, customer_name')
      .eq('id', reservation_id)
      .single();

    if (resError || !reservation) {
      console.error('Reservation not found:', resError);
      return new Response(
        JSON.stringify({ error: 'Reservation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build notification messages
    let driverTitle = '';
    let driverMessage = '';
    let customerTitle = '';
    let customerMessage = '';

    if (status === 'cancelled') {
      driverTitle = `⚠️ Uçuş İptal Edildi - ${flight_number}`;
      driverMessage = `${reservation.customer_name} müşterisinin ${flight_number} uçuşu iptal edildi. Lütfen müşteriyle iletişime geçin.`;
      
      customerTitle = `⚠️ Flight Cancelled - ${flight_number}`;
      customerMessage = `Your flight ${flight_number} has been cancelled. Please contact us to reschedule your transfer.`;
    } else if (delay_minutes && delay_minutes > 0) {
      const arrivalTimeStr = arrival_time 
        ? new Date(arrival_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        : '';
      
      driverTitle = `⏰ Uçuş Gecikmesi - ${flight_number}`;
      driverMessage = `${reservation.customer_name} müşterisinin uçuşu ${delay_minutes} dakika gecikti.`;
      if (arrivalTimeStr) {
        driverMessage += ` Yeni varış: ${arrivalTimeStr}`;
      }
      
      customerTitle = `⏰ Flight Delayed - ${flight_number}`;
      customerMessage = `Your flight ${flight_number} is delayed by ${delay_minutes} minutes.`;
      if (arrivalTimeStr) {
        customerMessage += ` New arrival time: ${arrivalTimeStr}`;
      }
      customerMessage += ` Don't worry, your driver will be notified automatically.`;
    } else if (status === 'landed') {
      driverTitle = `✈️ Uçuş İndi - ${flight_number}`;
      driverMessage = `${reservation.customer_name} müşterisinin uçuşu indi. Müşteriyi karşılamaya hazırlanın.`;
      
      customerTitle = `✈️ Flight Landed - ${flight_number}`;
      customerMessage = `Your flight ${flight_number} has landed. Your driver is ready to pick you up!`;
    } else {
      driverTitle = `📢 Uçuş Durumu - ${flight_number}`;
      driverMessage = `${reservation.customer_name} müşterisinin uçuş durumu güncellendi: ${status}`;
      
      customerTitle = `📢 Flight Status Update - ${flight_number}`;
      customerMessage = `Your flight ${flight_number} status: ${status}`;
    }

    // === NOTIFY DRIVER ===
    if (reservation.driver_id) {
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('user_id, name')
        .eq('id', reservation.driver_id)
        .single();

      if (!driverError && driver) {
        // Create in-app notification for driver
        await supabase
          .from('notifications')
          .insert({
            user_id: driver.user_id,
            reservation_id: reservation.id,
            title: driverTitle,
            message: driverMessage,
            type: 'flight_update'
          });

        // Send push notification to driver
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              user_id: driver.user_id,
              title: driverTitle,
              body: driverMessage,
              url: `/driver/job/${reservation.id}`
            })
          });
          console.log('Push notification sent to driver');
        } catch (e) {
          console.error('Failed to send push to driver:', e);
        }
      }
    }

    // === NOTIFY CUSTOMER ===
    if (reservation.customer_id) {
      // Create in-app notification for customer
      await supabase
        .from('notifications')
        .insert({
          user_id: reservation.customer_id,
          reservation_id: reservation.id,
          title: customerTitle,
          message: customerMessage,
          type: 'flight_update'
        });

      // Send push notification to customer
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            user_id: reservation.customer_id,
            title: customerTitle,
            body: customerMessage,
            url: `/customer/reservation/${reservation.id}`
          })
        });
        console.log('Push notification sent to customer');
      } catch (e) {
        console.error('Failed to send push to customer:', e);
      }

      // Send email to customer
      if (resendApiKey) {
        try {
          // Get customer email from auth
          const { data: userData } = await supabase.auth.admin.getUserById(reservation.customer_id);
          const customerEmail = userData?.user?.email;

          if (customerEmail) {
            let emailSubject = '';
            let emailHtml = '';
            const baseUrl = "https://meettransfer.app";

            if (status === 'cancelled') {
              emailSubject = `⚠️ Flight Cancelled - ${reservation.reservation_code}`;
              emailHtml = `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                  <div style="background: linear-gradient(135deg, #ef5350 0%, #c62828 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #fff; margin: 0; font-size: 24px;">⚠️ Flight Cancelled</h1>
                  </div>
                  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
                    <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                      <p style="margin: 0; color: #888; font-size: 12px;">Reservation Code</p>
                      <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: #ef5350; letter-spacing: 3px;">${reservation.reservation_code}</p>
                    </div>
                    <p style="font-size: 16px;">Your flight <strong>${flight_number}</strong> has been cancelled.</p>
                    <p style="font-size: 14px; color: #666;">Please contact us to reschedule your transfer or cancel your booking.</p>
                    <div style="text-align: center; margin-top: 25px;">
                      <a href="${baseUrl}/customer/reservation/${reservation.id}" style="display: inline-block; background: #fdd835; color: #111; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Reservation</a>
                    </div>
                    <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                      <p>© 2025 Meet Transfer. All rights reserved.</p>
                    </div>
                  </div>
                </body>
                </html>
              `;
            } else if (delay_minutes && delay_minutes > 0) {
              const arrivalTimeStr = arrival_time 
                ? new Date(arrival_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : '';
              
              emailSubject = `⏰ Flight Delayed - ${reservation.reservation_code}`;
              emailHtml = `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                  <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #fff; margin: 0; font-size: 24px;">⏰ Flight Delayed</h1>
                  </div>
                  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
                    <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                      <p style="margin: 0; color: #888; font-size: 12px;">Reservation Code</p>
                      <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: #ff9800; letter-spacing: 3px;">${reservation.reservation_code}</p>
                    </div>
                    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px; border: 2px solid #ff9800;">
                      <p style="margin: 0; color: #e65100; font-size: 14px;">Flight ${flight_number}</p>
                      <p style="margin: 10px 0 0; font-size: 32px; font-weight: bold; color: #e65100;">+${delay_minutes} min delay</p>
                      ${arrivalTimeStr ? `<p style="margin: 8px 0 0; color: #f57c00; font-size: 14px;">New arrival: ${arrivalTimeStr}</p>` : ''}
                    </div>
                    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                      <p style="margin: 0; color: #2e7d32; font-size: 14px;">✅ Don't worry! Your driver has been notified automatically.</p>
                    </div>
                    <div style="text-align: center; margin-top: 25px;">
                      <a href="${baseUrl}/customer/reservation/${reservation.id}" style="display: inline-block; background: #fdd835; color: #111; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Reservation</a>
                    </div>
                    <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                      <p>© 2025 Meet Transfer. All rights reserved.</p>
                    </div>
                  </div>
                </body>
                </html>
              `;
            } else if (status === 'landed') {
              emailSubject = `✈️ Flight Landed - ${reservation.reservation_code}`;
              emailHtml = `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                  <div style="background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #fff; margin: 0; font-size: 24px;">✈️ Flight Landed!</h1>
                  </div>
                  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
                    <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                      <p style="margin: 0; color: #888; font-size: 12px;">Reservation Code</p>
                      <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: #4caf50; letter-spacing: 3px;">${reservation.reservation_code}</p>
                    </div>
                    <p style="font-size: 16px; text-align: center;">Your flight <strong>${flight_number}</strong> has landed! 🎉</p>
                    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                      <p style="margin: 0; color: #2e7d32; font-size: 14px;">🚗 Your driver is ready to pick you up!</p>
                    </div>
                    <div style="text-align: center; margin-top: 25px;">
                      <a href="${baseUrl}/customer/reservation/${reservation.id}" style="display: inline-block; background: #fdd835; color: #111; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Reservation</a>
                    </div>
                    <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
                      <p>© 2025 Meet Transfer. All rights reserved.</p>
                    </div>
                  </div>
                </body>
                </html>
              `;
            }

            if (emailSubject && emailHtml) {
              const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${resendApiKey}`
                },
                body: JSON.stringify({
                  from: "Meet Transfer <no-reply@mail.meettransfer.app>",
                  reply_to: "info@meettransfer.app",
                  to: [customerEmail],
                  subject: emailSubject,
                  html: emailHtml,
                })
              });
              const emailResult = await emailResponse.json();
              console.log('Email sent to customer:', emailResult);
            }
          }
        } catch (emailError) {
          console.error('Failed to send email to customer:', emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, notifications_sent: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in notify-flight-delay:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
