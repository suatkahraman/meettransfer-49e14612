import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotifyDriverRequest {
  reservationId: string
  driverUserId: string
  driverPhone?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { reservationId, driverUserId, driverPhone }: NotifyDriverRequest = await req.json()

    console.log(`📧 Notifying driver ${driverUserId} about reservation ${reservationId}`)

    // Get reservation details
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        *,
        drivers!reservations_driver_id_fkey (name, phone, user_id)
      `)
      .eq('id', reservationId)
      .single()

    if (reservationError || !reservation) {
      console.error('Error fetching reservation:', reservationError)
      return new Response(
        JSON.stringify({ error: 'Reservation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get driver's email from auth.users
    const { data: driverAuth } = await supabase.auth.admin.getUserById(driverUserId)
    const driverEmail = driverAuth?.user?.email

    console.log(`Driver email: ${driverEmail}, Driver name: ${reservation.drivers?.name}`)

    // Format date and time
    const pickupDate = reservation.pickup_date
    const pickupTime = reservation.pickup_time

    // Prepare price display
    const currencySymbols: Record<string, string> = {
      TRY: '₺',
      EUR: '€',
      USD: '$',
      GBP: '£',
      AED: 'د.إ',
    }
    const currencySymbol = currencySymbols[reservation.price_currency || 'EUR'] || reservation.price_currency || '€'
    const priceDisplay = reservation.price ? `${currencySymbol}${reservation.price}` : 'Belirtilmemiş'

    // Determine passenger cash display
    let passengerCashDisplay = ''
    if (reservation.passenger_cash_amount && reservation.passenger_cash_currency) {
      const cashSymbol = currencySymbols[reservation.passenger_cash_currency] || reservation.passenger_cash_currency
      passengerCashDisplay = `${cashSymbol}${reservation.passenger_cash_amount}`
    }

    // 1. Send Push Notification
    try {
      console.log('📲 Sending push notification to driver...')
      const pushMessage = `Yeni transfer: ${reservation.pickup} → ${reservation.dropoff}, ${pickupDate} ${pickupTime}`
      
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: driverUserId,
          title: '🚗 Yeni Transfer Görevi',
          body: pushMessage,
          url: `/driver/job/${reservationId}`,
        },
      })
      console.log('✅ Push notification sent')
    } catch (pushError) {
      console.error('❌ Push notification failed:', pushError)
      // Don't fail the whole operation
    }

    // 2. Send Email Notification (if driver has email)
    if (driverEmail) {
      try {
        console.log('📧 Sending email notification to driver...')
        
        await supabase.functions.invoke('send-notification-email', {
          body: {
            to: driverEmail,
            type: 'driver_assigned_driver',
            data: {
              driver_name: reservation.drivers?.name || 'Şoför',
              reservation_code: reservation.reservation_code,
              pickup_date: pickupDate,
              pickup_time: pickupTime,
              pickup_display: reservation.pickup,
              dropoff_display: reservation.dropoff,
              customer_name: reservation.customer_name,
              customer_phone: reservation.customer_phone,
              vehicle_type: reservation.vehicle_type,
              payment_type: reservation.payment_type,
              price_display: priceDisplay,
              passenger_cash_display: passengerCashDisplay,
              flight_number: reservation.flight_number,
              customer_notes: reservation.customer_notes,
              baby_seat_count: reservation.baby_seat_count,
              luggage_count: reservation.luggage_count,
            },
          },
        })
        console.log('✅ Email notification sent to driver')
      } catch (emailError) {
        console.error('❌ Email notification failed:', emailError)
        // Don't fail the whole operation
      }
    } else {
      console.log('⚠️ Driver has no email, skipping email notification')
    }

    // 3. Create in-app notification
    try {
      await supabase.from('notifications').insert({
        user_id: driverUserId,
        reservation_id: reservationId,
        title: '🚗 Yeni Transfer Görevi',
        message: `${reservation.pickup} → ${reservation.dropoff} | ${pickupDate} ${pickupTime} | ${priceDisplay}`,
        type: 'driver_assigned',
        read: false,
      })
      console.log('✅ In-app notification created')
    } catch (notifError) {
      console.error('❌ In-app notification failed:', notifError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Driver notifications sent',
        notifications: {
          push: true,
          email: !!driverEmail,
          inApp: true,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
