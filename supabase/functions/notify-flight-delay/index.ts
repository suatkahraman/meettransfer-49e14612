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
  old_arrival_time?: string;
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

    const { reservation_id, flight_number, delay_minutes, status, arrival_time, old_arrival_time }: NotifyRequest = await req.json();

    console.log(`[FlightNotify] Processing notification for reservation: ${reservation_id}`);
    console.log(`[FlightNotify] Flight: ${flight_number}, Status: ${status}, Delay: ${delay_minutes}min`);
    console.log(`[FlightNotify] Old arrival: ${old_arrival_time || 'N/A'}, New arrival: ${arrival_time || 'N/A'}`);

    // Get reservation with driver info (NO customer contact details for driver notifications)
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('id, reservation_code, pickup, dropoff, pickup_date, pickup_time, driver_id, customer_id, customer_name, last_notified_arrival_time, flight_arrival_time')
      .eq('id', reservation_id)
      .single();

    if (resError || !reservation) {
      console.error('[FlightNotify] Reservation not found:', resError);
      return new Response(
        JSON.stringify({ error: 'Reservation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate notification
    if (reservation.last_notified_arrival_time === arrival_time && status !== 'cancelled' && status !== 'landed') {
      console.log('[FlightNotify] Duplicate notification detected, skipping');
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'duplicate' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format times for display
    const formatTimeDisplay = (time: string | undefined) => {
      if (!time) return 'N/A';
      // If it's already in HH:mm format, return as is
      if (/^\d{2}:\d{2}$/.test(time)) return time;
      // Otherwise try to parse as date
      try {
        return new Date(time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      } catch {
        return time;
      }
    };

    const oldTimeFormatted = formatTimeDisplay(old_arrival_time);
    const newTimeFormatted = formatTimeDisplay(arrival_time);

    // Build driver notification messages (NO pricing, NO customer contact)
    let driverTitle = '';
    let driverMessage = '';

    if (status === 'cancelled') {
      driverTitle = `⚠️ Uçuş İptal Edildi - ${flight_number}`;
      driverMessage = `${reservation.reservation_code} kodlu rezervasyonun uçuşu iptal edildi.`;
    } else if (status === 'landed') {
      driverTitle = `✈️ Uçuş İndi - ${flight_number}`;
      driverMessage = `${reservation.reservation_code} kodlu rezervasyonun uçuşu indi. Müşteriyi karşılamaya hazırlanın.`;
    } else if (delay_minutes && delay_minutes > 0) {
      driverTitle = `⏰ Uçuş Gecikmesi - ${flight_number}`;
      driverMessage = `${reservation.reservation_code} kodlu rezervasyonun uçuşu ${delay_minutes} dakika gecikti.`;
      if (old_arrival_time && arrival_time) {
        driverMessage += `\n\nEski Varış: ${oldTimeFormatted}\nYeni Varış: ${newTimeFormatted}`;
      } else if (arrival_time) {
        driverMessage += `\nYeni varış saati: ${newTimeFormatted}`;
      }
    } else if (old_arrival_time && arrival_time && old_arrival_time !== arrival_time) {
      driverTitle = `📢 Varış Saati Güncellendi - ${flight_number}`;
      driverMessage = `${reservation.reservation_code} kodlu rezervasyonun varış saati değişti.\n\nEski: ${oldTimeFormatted}\nYeni: ${newTimeFormatted}`;
    } else {
      driverTitle = `📢 Uçuş Durumu - ${flight_number}`;
      driverMessage = `${reservation.reservation_code} kodlu rezervasyonun uçuş durumu: ${status}`;
    }

    // === NOTIFY DRIVER ONLY (No customer details) ===
    if (reservation.driver_id) {
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('user_id, name')
        .eq('id', reservation.driver_id)
        .single();

      if (!driverError && driver) {
        console.log(`[FlightNotify] Notifying driver: ${driver.name}`);

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
        console.log('[FlightNotify] In-app notification created for driver');

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
              body: driverMessage.replace(/\n/g, ' '),
              url: `/driver/job/${reservation.id}`
            })
          });
          console.log('[FlightNotify] Push notification sent to driver');
        } catch (e) {
          console.error('[FlightNotify] Failed to send push to driver:', e);
        }

        // Send email to driver with old vs new arrival time
        if (resendApiKey) {
          try {
            // Get driver email
            const { data: driverEmailData } = await supabase.functions.invoke('get-driver-email', {
              body: { driver_id: reservation.driver_id }
            });
            const driverEmail = driverEmailData?.email;

            if (driverEmail) {
              const baseUrl = "https://meettransfer.app";
              let emailSubject = '';
              let emailHtml = '';

              if (status === 'cancelled') {
                emailSubject = `⚠️ Uçuş İptal - ${reservation.reservation_code}`;
                emailHtml = buildDriverEmailTemplate({
                  title: '⚠️ Uçuş İptal Edildi',
                  color: '#ef5350',
                  reservationCode: reservation.reservation_code || '',
                  flightNumber: flight_number,
                  message: 'Bu rezervasyonun uçuşu iptal edildi.',
                  pickup: reservation.pickup,
                  dropoff: reservation.dropoff,
                  pickupDate: reservation.pickup_date,
                  pickupTime: reservation.pickup_time,
                  baseUrl,
                  reservationId: reservation.id,
                });
              } else if (status === 'landed') {
                emailSubject = `✈️ Uçuş İndi - ${reservation.reservation_code}`;
                emailHtml = buildDriverEmailTemplate({
                  title: '✈️ Uçuş İndi!',
                  color: '#4caf50',
                  reservationCode: reservation.reservation_code || '',
                  flightNumber: flight_number,
                  message: 'Uçuş indi. Müşteriyi karşılamaya hazırlanın.',
                  pickup: reservation.pickup,
                  dropoff: reservation.dropoff,
                  pickupDate: reservation.pickup_date,
                  pickupTime: reservation.pickup_time,
                  baseUrl,
                  reservationId: reservation.id,
                });
              } else {
                // Delay or time change
                emailSubject = `⏰ Varış Saati Değişti - ${reservation.reservation_code}`;
                emailHtml = buildDriverEmailTemplate({
                  title: '⏰ Varış Saati Güncellendi',
                  color: '#ff9800',
                  reservationCode: reservation.reservation_code || '',
                  flightNumber: flight_number,
                  message: delay_minutes > 0 
                    ? `Uçuş ${delay_minutes} dakika gecikti.`
                    : 'Uçuş varış saati güncellendi.',
                  oldTime: oldTimeFormatted,
                  newTime: newTimeFormatted,
                  pickup: reservation.pickup,
                  dropoff: reservation.dropoff,
                  pickupDate: reservation.pickup_date,
                  pickupTime: reservation.pickup_time,
                  baseUrl,
                  reservationId: reservation.id,
                });
              }

              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${resendApiKey}`
                },
                body: JSON.stringify({
                  from: "Meet Transfer <no-reply@mail.meettransfer.app>",
                  reply_to: "info@meettransfer.app",
                  to: [driverEmail],
                  subject: emailSubject,
                  html: emailHtml,
                })
              });
              console.log('[FlightNotify] Email sent to driver:', driverEmail);
            } else {
              console.log('[FlightNotify] Driver email not found');
            }
          } catch (emailError) {
            console.error('[FlightNotify] Failed to send email to driver:', emailError);
          }
        }

        // Update last notified time to prevent duplicates
        await supabase
          .from('reservations')
          .update({ last_notified_arrival_time: arrival_time })
          .eq('id', reservation_id);
        console.log('[FlightNotify] Updated last_notified_arrival_time');
      }
    } else {
      console.log('[FlightNotify] No driver assigned to reservation');
    }

    // === NOTIFY CUSTOMER (separate from driver) ===
    if (reservation.customer_id) {
      let customerTitle = '';
      let customerMessage = '';

      if (status === 'cancelled') {
        customerTitle = `⚠️ Flight Cancelled - ${flight_number}`;
        customerMessage = `Your flight ${flight_number} has been cancelled. Please contact us to reschedule your transfer.`;
      } else if (status === 'landed') {
        customerTitle = `✈️ Flight Landed - ${flight_number}`;
        customerMessage = `Your flight ${flight_number} has landed. Your driver is ready to pick you up!`;
      } else if (delay_minutes && delay_minutes > 0) {
        customerTitle = `⏰ Flight Delayed - ${flight_number}`;
        customerMessage = `Your flight is delayed by ${delay_minutes} minutes. New arrival: ${newTimeFormatted}. Don't worry, your driver will be notified automatically.`;
      } else if (old_arrival_time && arrival_time && old_arrival_time !== arrival_time) {
        customerTitle = `📢 Arrival Time Updated - ${flight_number}`;
        customerMessage = `Your flight arrival time has changed from ${oldTimeFormatted} to ${newTimeFormatted}. Your driver has been notified.`;
      }

      if (customerTitle) {
        console.log(`[FlightNotify] Notifying customer: ${reservation.customer_name}`);

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
        console.log('[FlightNotify] In-app notification created for customer');

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
          console.log('[FlightNotify] Push notification sent to customer');
        } catch (e) {
          console.error('[FlightNotify] Failed to send push to customer:', e);
        }

        // Send email to customer
        if (resendApiKey) {
          try {
            // Get customer email from auth.users
            const { data: userData } = await supabase.auth.admin.getUserById(reservation.customer_id);
            const customerEmail = userData?.user?.email;

            if (customerEmail) {
              const baseUrl = "https://meettransfer.app";
              const emailHtml = buildCustomerEmailTemplate({
                title: customerTitle,
                color: status === 'cancelled' ? '#ef5350' : status === 'landed' ? '#4caf50' : '#ff9800',
                reservationCode: reservation.reservation_code || '',
                flightNumber: flight_number,
                message: customerMessage,
                oldTime: oldTimeFormatted,
                newTime: newTimeFormatted,
                pickup: reservation.pickup,
                dropoff: reservation.dropoff,
                pickupDate: reservation.pickup_date,
                baseUrl,
                reservationId: reservation.id,
              });

              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${resendApiKey}`
                },
                body: JSON.stringify({
                  from: "Meet Transfer <no-reply@mail.meettransfer.app>",
                  reply_to: "info@meettransfer.app",
                  to: [customerEmail],
                  subject: customerTitle,
                  html: emailHtml,
                })
              });
              console.log('[FlightNotify] Email sent to customer:', customerEmail);
            } else {
              console.log('[FlightNotify] Customer email not found');
            }
          } catch (emailError) {
            console.error('[FlightNotify] Failed to send email to customer:', emailError);
          }
        }
      }
    }

    console.log('[FlightNotify] Notification process completed successfully');

    return new Response(
      JSON.stringify({ success: true, notifications_sent: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[FlightNotify] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to build driver email template (NO pricing, NO customer contact)
function buildDriverEmailTemplate(params: {
  title: string;
  color: string;
  reservationCode: string;
  flightNumber: string;
  message: string;
  oldTime?: string;
  newTime?: string;
  pickup: string;
  dropoff: string;
  pickupDate: string;
  pickupTime: string;
  baseUrl: string;
  reservationId: string;
}): string {
  const { title, color, reservationCode, flightNumber, message, oldTime, newTime, pickup, dropoff, pickupDate, pickupTime, baseUrl, reservationId } = params;

  const timeChangeSection = oldTime && newTime ? `
    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid ${color};">
      <p style="margin: 0; color: #666; font-size: 14px;">Varış Saati Değişikliği</p>
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 10px;">
        <div>
          <p style="margin: 0; color: #999; font-size: 12px;">Eski</p>
          <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #999; text-decoration: line-through;">${oldTime}</p>
        </div>
        <div style="font-size: 24px; color: ${color};">→</div>
        <div>
          <p style="margin: 0; color: #666; font-size: 12px;">Yeni</p>
          <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: ${color};">${newTime}</p>
        </div>
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">${title}</h1>
      </div>
      <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
        <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
          <p style="margin: 0; color: #888; font-size: 12px;">Rezervasyon Kodu</p>
          <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: ${color}; letter-spacing: 3px;">${reservationCode}</p>
        </div>
        
        <p style="font-size: 16px; text-align: center; margin-bottom: 20px;">
          <strong>Uçuş:</strong> ${flightNumber}<br/>
          ${message}
        </p>

        ${timeChangeSection}

        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px; color: #333; font-size: 16px;">Transfer Detayları</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">📅 Tarih</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${pickupDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">🕐 Saat</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${pickupTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">📍 Alış</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${pickup}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">📍 Bırakış</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${dropoff}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <a href="${baseUrl}/driver/job/${reservationId}" style="display: inline-block; background: #fdd835; color: #111; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">İşi Görüntüle</a>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
          <p>© 2025 Meet Transfer. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to build customer email template (NO internal pricing, NO driver contact)
function buildCustomerEmailTemplate(params: {
  title: string;
  color: string;
  reservationCode: string;
  flightNumber: string;
  message: string;
  oldTime?: string;
  newTime?: string;
  pickup: string;
  dropoff: string;
  pickupDate: string;
  baseUrl: string;
  reservationId: string;
}): string {
  const { title, color, reservationCode, flightNumber, message, oldTime, newTime, pickup, dropoff, pickupDate, baseUrl, reservationId } = params;

  const timeChangeSection = oldTime && newTime && oldTime !== 'N/A' && newTime !== 'N/A' ? `
    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid ${color};">
      <p style="margin: 0; color: #666; font-size: 14px;">Arrival Time Change</p>
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 10px;">
        <div>
          <p style="margin: 0; color: #999; font-size: 12px;">Previous</p>
          <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #999; text-decoration: line-through;">${oldTime}</p>
        </div>
        <div style="font-size: 24px; color: ${color};">→</div>
        <div>
          <p style="margin: 0; color: #666; font-size: 12px;">New</p>
          <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: ${color};">${newTime}</p>
        </div>
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">${title}</h1>
      </div>
      <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
        <div style="background: #111; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
          <p style="margin: 0; color: #888; font-size: 12px;">Reservation Code</p>
          <p style="margin: 5px 0 0; font-size: 26px; font-weight: bold; color: ${color}; letter-spacing: 3px;">${reservationCode}</p>
        </div>
        
        <p style="font-size: 16px; text-align: center; margin-bottom: 20px;">
          <strong>Flight:</strong> ${flightNumber}<br/>
          ${message}
        </p>

        ${timeChangeSection}

        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px; color: #333; font-size: 16px;">Transfer Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">📅 Date</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${pickupDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">📍 Pickup</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${pickup}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">📍 Drop-off</td>
              <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${dropoff}</td>
            </tr>
          </table>
        </div>

        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #2e7d32; font-size: 14px;">
            ✅ Don't worry! Your driver has been automatically notified about this update.
          </p>
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <a href="${baseUrl}/customer/reservation/${reservationId}" style="display: inline-block; background: #fdd835; color: #111; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Reservation</a>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
          <p>Need help? Contact us via WhatsApp: +90 532 174 8390</p>
          <p>© 2025 Meet Transfer. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
