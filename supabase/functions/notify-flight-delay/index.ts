import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { reservation_id, flight_number, delay_minutes, status, arrival_time }: NotifyRequest = await req.json();

    console.log(`Flight delay notification for reservation: ${reservation_id}, flight: ${flight_number}, delay: ${delay_minutes}min, status: ${status}`);

    // Get reservation with driver info
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('id, reservation_code, pickup, dropoff, pickup_date, pickup_time, driver_id, customer_name')
      .eq('id', reservation_id)
      .single();

    if (resError || !reservation) {
      console.error('Reservation not found:', resError);
      return new Response(
        JSON.stringify({ error: 'Reservation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!reservation.driver_id) {
      console.log('No driver assigned to this reservation');
      return new Response(
        JSON.stringify({ success: true, message: 'No driver assigned' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get driver's user_id
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('user_id, name')
      .eq('id', reservation.driver_id)
      .single();

    if (driverError || !driver) {
      console.error('Driver not found:', driverError);
      return new Response(
        JSON.stringify({ error: 'Driver not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build notification message
    let title = '';
    let message = '';

    if (status === 'cancelled') {
      title = `⚠️ Uçuş İptal Edildi - ${flight_number}`;
      message = `${reservation.customer_name} müşterisinin ${flight_number} uçuşu iptal edildi. Lütfen müşteriyle iletişime geçin.`;
    } else if (delay_minutes && delay_minutes > 0) {
      title = `⏰ Uçuş Gecikmesi - ${flight_number}`;
      message = `${reservation.customer_name} müşterisinin uçuşu ${delay_minutes} dakika gecikti.`;
      if (arrival_time) {
        message += ` Yeni varış: ${new Date(arrival_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
      }
    } else if (status === 'landed') {
      title = `✈️ Uçuş İndi - ${flight_number}`;
      message = `${reservation.customer_name} müşterisinin uçuşu indi. Müşteriyi karşılamaya hazırlanın.`;
    } else {
      title = `📢 Uçuş Durumu - ${flight_number}`;
      message = `${reservation.customer_name} müşterisinin uçuş durumu güncellendi: ${status}`;
    }

    // Create in-app notification
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: driver.user_id,
        reservation_id: reservation.id,
        title,
        message,
        type: 'flight_update'
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
    }

    // Send push notification
    const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        user_id: driver.user_id,
        title,
        body: message,
        url: `/driver/jobs/${reservation.id}`
      })
    });

    const pushResult = await pushResponse.json();
    console.log('Push notification result:', pushResult);

    return new Response(
      JSON.stringify({ success: true, notification_sent: true }),
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
