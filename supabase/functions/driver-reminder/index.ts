import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Driver reminder function started');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time and time 3 hours from now
    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes buffer to avoid duplicates

    console.log(`Checking for reservations between ${now.toISOString()} and ${threeHoursFromNow.toISOString()}`);

    // Get today's date in YYYY-MM-DD format
    const todayStr = now.toISOString().split('T')[0];
    const currentTimeStr = now.toTimeString().slice(0, 8);
    const targetTimeStr = threeHoursFromNow.toTimeString().slice(0, 8);

    // Fetch active reservations with pickup within the next 3 hours
    const { data: reservations, error: fetchError } = await supabase
      .from('reservations')
      .select('id, customer_name, pickup, dropoff, pickup_date, pickup_time, driver_id')
      .eq('pickup_date', todayStr)
      .in('status', ['active', 'sent_to_driver', 'assigned'])
      .not('driver_id', 'is', null)
      .gte('pickup_time', currentTimeStr)
      .lte('pickup_time', targetTimeStr);

    if (fetchError) {
      console.error('Error fetching reservations:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${reservations?.length || 0} reservations needing reminders`);

    if (!reservations || reservations.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No upcoming reservations needing reminders', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Process each reservation
    const notifications = [];
    for (const reservation of reservations) {
      // Get driver's user_id from drivers table
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('user_id, name')
        .eq('id', reservation.driver_id)
        .maybeSingle();

      if (driverError || !driver) {
        console.error(`Error fetching driver ${reservation.driver_id}:`, driverError);
        continue;
      }

      // Check if we already sent a reminder for this reservation today
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('reservation_id', reservation.id)
        .eq('user_id', driver.user_id)
        .eq('type', 'driver_reminder')
        .gte('created_at', todayStr)
        .maybeSingle();

      if (existingNotification) {
        console.log(`Reminder already sent for reservation ${reservation.id}`);
        continue;
      }

      // Create notification for the driver
      const notificationData = {
        user_id: driver.user_id,
        reservation_id: reservation.id,
        type: 'driver_reminder',
        title: '⏰ Upcoming Transfer Reminder',
        message: `You have a transfer in 3 hours!\n📍 ${reservation.pickup} → ${reservation.dropoff}\n🕐 ${reservation.pickup_time}\n👤 Passenger: ${reservation.customer_name}`,
      };

      const { error: notifyError } = await supabase
        .from('notifications')
        .insert(notificationData);

      if (notifyError) {
        console.error(`Error creating notification for driver ${driver.user_id}:`, notifyError);
      } else {
        console.log(`Reminder notification created for driver ${driver.name} (reservation ${reservation.id})`);
        notifications.push(reservation.id);
      }

      // Also try to send push notification
      try {
        const { data: pushSubs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', driver.user_id);

        if (pushSubs && pushSubs.length > 0) {
          // Invoke push notification function
          await supabase.functions.invoke('send-push-notification', {
            body: {
              user_id: driver.user_id,
              title: '⏰ Transfer in 3 Hours',
              body: `${reservation.pickup} → ${reservation.dropoff} at ${reservation.pickup_time}`,
              data: { reservation_id: reservation.id }
            }
          });
          console.log(`Push notification sent to driver ${driver.name}`);
        }
      } catch (pushError) {
        console.error('Push notification error:', pushError);
        // Continue even if push fails
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Driver reminders processed', 
        notificationsSent: notifications.length,
        reservationIds: notifications
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Driver reminder function error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
