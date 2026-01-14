import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateReservationRequest {
  bookingId: string;
  pickup: string;
  dropoff: string;
  pickupDate: string;
  pickupTime: string;
  vehicleType: string;
  passengers: number;
  price: number;
  priceCurrency: string;
  paymentMethod: string;
  hasReturnTrip: boolean;
  returnDate?: string;
  returnTime?: string;
  returnPrice?: number;
  promoCode?: string;
  // Customer info from Step 2
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerPassword?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: CreateReservationRequest = await req.json();

    console.log("Creating reservation for quick booking:", requestData.bookingId);
    console.log("Customer info provided:", {
      name: requestData.customerName,
      email: requestData.customerEmail,
      phone: requestData.customerPhone,
      hasPassword: !!requestData.customerPassword
    });

    // Fetch the quick booking request to get agency info, luggage/baby seat, and notes
    const { data: quickBooking, error: fetchError } = await supabase
      .from("quick_booking_requests")
      .select("customer_notes, agency_id, agency_user_id, luggage_count, baby_seat_count")
      .eq("id", requestData.bookingId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching quick booking:", fetchError);
    }

    const customerNotes = quickBooking?.customer_notes || null;
    const agencyId = quickBooking?.agency_id || null;
    const agencyUserId = quickBooking?.agency_user_id || null;
    const luggageCount = quickBooking?.luggage_count || 1;
    const babySeatCount = quickBooking?.baby_seat_count || 0;

    // Use customer info from request (Step 2 form) - priority over quick booking data
    const finalCustomerName = requestData.customerName || "Guest";
    const finalCustomerPhone = requestData.customerPhone || "";
    const finalCustomerEmail = requestData.customerEmail || null;

    // Handle user account - check existing first (for Google OAuth users)
    let customerId: string | null = null;
    let isExistingUser = false;
    
    if (finalCustomerEmail) {
      console.log("Checking for existing user:", finalCustomerEmail);
      
      // First check if user already exists (could be Google OAuth user)
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === finalCustomerEmail);
      
      if (existingUser) {
        // User already exists (Google OAuth or previous registration)
        console.log("Existing user found:", existingUser.id, "Provider:", existingUser.app_metadata?.provider || "email");
        customerId = existingUser.id;
        isExistingUser = true;
        
        // Update profile with latest info if not already set
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: customerId,
            full_name: finalCustomerName,
            phone: finalCustomerPhone,
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (profileError) {
          console.error("Error updating profile:", profileError);
        }
        
        // Ensure customer role exists
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", customerId)
          .eq("role", "customer")
          .maybeSingle();
          
        if (!existingRole) {
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: customerId,
              role: "customer"
            });

          if (roleError && !roleError.message.includes('duplicate')) {
            console.error("Error creating user role:", roleError);
          }
        }
      } else if (requestData.customerPassword) {
        // No existing user and password provided - create new account
        console.log("Creating new user account for:", finalCustomerEmail);
        
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: finalCustomerEmail,
          password: requestData.customerPassword,
          email_confirm: true,
          user_metadata: {
            full_name: finalCustomerName,
            phone: finalCustomerPhone,
          }
        });

        if (authError) {
          console.error("Error creating user:", authError);
        } else if (authData.user) {
          customerId = authData.user.id;
          console.log("New user account created:", customerId);

          // Create customer role
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: customerId,
              role: "customer"
            });

          if (roleError) {
            console.error("Error creating user role:", roleError);
          }

          // Create profile
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: customerId,
              full_name: finalCustomerName,
              phone: finalCustomerPhone,
            });

          if (profileError) {
            console.error("Error creating profile:", profileError);
          }
        }
      } else {
        // No password and no existing user - reservation without account
        console.log("No password provided and no existing user - creating reservation without account");
      }
    }

    // Create main reservation with actual customer info
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .insert({
        customer_id: customerId,
        customer_name: finalCustomerName,
        customer_phone: finalCustomerPhone,
        pickup: requestData.pickup,
        dropoff: requestData.dropoff,
        pickup_date: requestData.pickupDate,
        pickup_time: requestData.pickupTime,
        vehicle_type: requestData.vehicleType,
        payment_type: requestData.paymentMethod,
        status: "confirmed", // Now confirmed since customer info is complete
        price: requestData.price,
        price_currency: requestData.priceCurrency,
        customer_notes: customerNotes,
        agency_id: agencyId,
        agency_user_id: agencyUserId,
        luggage_count: luggageCount,
        baby_seat_count: babySeatCount,
      })
      .select()
      .single();

    if (reservationError) {
      console.error("Error creating reservation:", reservationError);
      throw new Error(`Failed to create reservation: ${reservationError.message}`);
    }

    console.log("Main reservation created:", reservation.id, reservation.reservation_code);

    // Create return trip reservation if enabled
    // IMPORTANT: Use exact returnPrice from frontend - no automatic calculation
    let returnReservation = null;
    if (requestData.hasReturnTrip && requestData.returnDate && requestData.returnTime) {
      // Use the exact price sent from frontend (already includes any discounts)
      const finalReturnPrice = requestData.returnPrice;
      
      console.log("Creating return reservation with exact price:", finalReturnPrice, "(no automatic calculation)");
      
      const { data: returnRes, error: returnError } = await supabase
        .from("reservations")
        .insert({
          customer_id: customerId,
          customer_name: finalCustomerName,
          customer_phone: finalCustomerPhone,
          pickup: requestData.dropoff, // Swapped for return
          dropoff: requestData.pickup, // Swapped for return
          pickup_date: requestData.returnDate,
          pickup_time: requestData.returnTime,
          vehicle_type: requestData.vehicleType,
          payment_type: requestData.paymentMethod,
          status: "confirmed", // Now confirmed since customer info is complete
          price: finalReturnPrice, // Use exact frontend price - NO FALLBACK to main price
          price_currency: requestData.priceCurrency,
          is_return_transfer: true,
          original_reservation_id: reservation.id,
          promo_code: requestData.promoCode || null,
          customer_notes: customerNotes,
          agency_id: agencyId,
          agency_user_id: agencyUserId,
          luggage_count: luggageCount,
          baby_seat_count: babySeatCount,
        })
        .select()
        .single();

      if (returnError) {
        console.error("Error creating return reservation:", returnError);
        // Don't fail the whole operation, just log the error
      } else {
        returnReservation = returnRes;
        console.log("Return reservation created:", returnRes.id, returnRes.reservation_code, "with price:", finalReturnPrice);
      }
    }

    // Update quick booking status to confirmed with selected vehicle and price
    const { error: updateError } = await supabase
      .from("quick_booking_requests")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        payment_method: requestData.paymentMethod,
        vehicle_type: requestData.vehicleType,
        price: requestData.price,
        has_return_trip: requestData.hasReturnTrip,
        return_date: requestData.returnDate || null,
        return_time: requestData.returnTime || null,
        return_price: requestData.returnPrice || null,
        promo_code: requestData.promoCode || null,
      })
      .eq("id", requestData.bookingId);

    console.log("Quick booking updated with selected vehicle:", requestData.vehicleType, "and price:", requestData.price);

    if (updateError) {
      console.error("Error updating quick booking:", updateError);
      // Don't fail - reservation is already created
    }

    // Notify admin (server-side) so it doesn't depend on the customer's browser/network
    try {
      await supabase.functions.invoke("notify-admin-quick-booking-confirmed", {
        body: {
          bookingId: requestData.bookingId,
          pickup: requestData.pickup,
          dropoff: requestData.dropoff,
          pickupDate: requestData.pickupDate,
          pickupTime: requestData.pickupTime,
          vehicleType: requestData.vehicleType,
          passengers: requestData.passengers,
          price: requestData.price,
          priceCurrency: requestData.priceCurrency,
          paymentMethod: requestData.paymentMethod,
          reservationCode: reservation.reservation_code,
        },
      });
      console.log("Admin notified for quick booking confirmation:", requestData.bookingId);
    } catch (notifyError) {
      console.error("Failed to notify admin (server-side):", notifyError);
      // Don't fail - reservation is already created
    }

    // Send confirmation email to customer if email is available
    if (finalCustomerEmail) {
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);

          const formattedDate = new Date(requestData.pickupDate).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });

          const formattedReturnDate = requestData.returnDate 
            ? new Date(requestData.returnDate).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })
            : null;

          const vehicleLabels: Record<string, string> = {
            "mercedes-vito": "Mercedes Vito",
            "mercedes-vclass": "VIP Mercedes V-Class",
            "maybach": "Maybach Minivan",
            "minibus": "Mercedes Sprinter Minibus",
          };
          const vehicleName = vehicleLabels[requestData.vehicleType] || requestData.vehicleType;

          const currencySymbol = requestData.priceCurrency === "EUR" ? "€" 
            : requestData.priceCurrency === "USD" ? "$" 
            : requestData.priceCurrency === "GBP" ? "£" 
            : requestData.priceCurrency === "TRY" ? "₺" 
            : requestData.priceCurrency === "AED" ? "د.إ"
            : requestData.priceCurrency === "AUD" ? "A$"
            : requestData.priceCurrency;

          // Use exact prices from frontend - no automatic calculation
          const totalPrice = returnReservation 
            ? requestData.price + (requestData.returnPrice || 0)
            : requestData.price;

          // Return trip discount is always 30% - calculated from main price
          const discountPercent = 30;
          
          // Calculate discount based on frontend prices
          // If return price is less than main price, calculate the discount
          const originalReturnPrice = returnReservation ? requestData.price : null;
          const discountAmount = returnReservation && requestData.returnPrice && requestData.returnPrice < requestData.price
            ? requestData.price - requestData.returnPrice
            : null;

          // Build return trip section - use frontend prices directly
          const returnTripText = returnReservation ? `
Return Transfer:
- Code: ${returnReservation.reservation_code}
- From: ${requestData.dropoff}
- To: ${requestData.pickup}
- Date: ${formattedReturnDate}
- Time: ${requestData.returnTime}
${discountAmount ? `- Original Price: ${currencySymbol}${originalReturnPrice}` : ''}
${discountAmount ? `- Discount (${discountPercent}%): -${currencySymbol}${discountAmount}` : ''}
- Price: ${currencySymbol}${requestData.returnPrice || 0}
` : '';

          const returnTripHtml = returnReservation ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#e8f5e9;border-radius:8px;margin:20px 0;">
          <tr><td style="padding:15px;">
            <p style="margin:0 0 10px;color:#2e7d32;font-weight:bold;">🔄 Return Transfer</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Code:</strong> ${returnReservation.reservation_code}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>From:</strong> ${requestData.dropoff}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>To:</strong> ${requestData.pickup}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Date:</strong> ${formattedReturnDate}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Time:</strong> ${requestData.returnTime}</p>
            ${discountAmount ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:6px;margin:10px 0;border:1px dashed #2e7d32;">
              <tr><td style="padding:12px;">
                <p style="margin:0 0 5px;color:#666;font-size:13px;text-decoration:line-through;">Original: ${currencySymbol}${originalReturnPrice}</p>
                <p style="margin:0 0 5px;color:#2e7d32;font-size:14px;font-weight:bold;">🎉 ${discountPercent}% Discount: -${currencySymbol}${discountAmount}</p>
                <p style="margin:0;color:#1a365d;font-size:16px;font-weight:bold;">Final Price: ${currencySymbol}${requestData.returnPrice}</p>
              </td></tr>
            </table>
            ` : `<p style="margin:5px 0;color:#333;font-size:14px;"><strong>Price:</strong> ${currencySymbol}${requestData.returnPrice || 0}</p>`}
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a365d;border-radius:8px;margin:20px 0;">
          <tr><td style="padding:15px;text-align:center;">
            <p style="margin:0;color:#fff;font-size:18px;"><strong>Total:</strong> ${currencySymbol}${totalPrice}</p>
            ${discountAmount ? `<p style="margin:5px 0 0;color:#48bb78;font-size:14px;">You saved ${currencySymbol}${discountAmount} on return trip!</p>` : ''}
          </td></tr>
        </table>
          ` : '';

          const customerLoginText = customerId 
            ? `\nYour account is ready! View your reservations at: https://meettransfer.lovable.app/customer\n`
            : '';

          const plainText = `
Meet Transfer - Booking Confirmed

Your reservation has been confirmed.

Reservation Code: ${reservation.reservation_code}

Outbound Transfer:
- From: ${requestData.pickup}
- To: ${requestData.dropoff}
- Date: ${formattedDate}
- Time: ${requestData.pickupTime}
- Vehicle: ${vehicleName}
- Price: ${currencySymbol}${requestData.price}
${returnTripText}
${returnReservation ? `Total: ${currencySymbol}${totalPrice}` : ''}
${customerLoginText}
Need help? Contact us via WhatsApp: +1 (555) 805-1101 or email: info@meettransfer.app

Best regards,
Meet Transfer USA, LLC
30 N Gould St, Sheridan, WY 82801, USA
          `.trim();

          const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <tr>
      <td style="background-color:#1a365d;padding:20px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">Meet Transfer</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:30px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#48bb78;border-radius:8px;margin:0 0 20px;">
          <tr>
            <td style="padding:20px;text-align:center;">
              <p style="color:#fff;margin:0;font-size:18px;font-weight:bold;">Booking Confirmed</p>
              <p style="color:#fff;margin:10px 0 0;font-size:24px;font-weight:bold;">${reservation.reservation_code}</p>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7fafc;border-radius:8px;margin:20px 0;">
          <tr><td style="padding:15px;">
            <p style="margin:0 0 10px;color:#1a365d;font-weight:bold;">Outbound Transfer</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>From:</strong> ${requestData.pickup}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>To:</strong> ${requestData.dropoff}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Time:</strong> ${requestData.pickupTime}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Vehicle:</strong> ${vehicleName}</p>
            <p style="margin:5px 0;color:#333;font-size:14px;"><strong>Price:</strong> ${currencySymbol}${requestData.price}</p>
          </td></tr>
        </table>

        ${returnTripHtml}

        ${customerId ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#e3f2fd;border-radius:8px;margin:20px 0;">
          <tr><td style="padding:20px;text-align:center;">
            <p style="margin:0 0 10px;color:#1565c0;font-weight:bold;font-size:16px;">🔐 Your Account is Ready!</p>
            <p style="margin:0 0 15px;color:#333;font-size:14px;">Track your reservations and manage your bookings online.</p>
            <a href="https://meettransfer.lovable.app/customer" style="display:inline-block;background-color:#1a365d;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">View My Reservations</a>
          </td></tr>
        </table>
        ` : `
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff3cd;border-radius:8px;margin:20px 0;">
          <tr><td style="padding:15px;">
            <p style="margin:0;color:#856404;font-size:14px;"><strong>📋 Booking Confirmed!</strong> Your transfer details have been saved.</p>
          </td></tr>
        </table>
        `}

        <p style="color:#666;font-size:13px;margin:20px 0 0;">
          Professional driver • Flight tracking • Free waiting time • 24/7 support
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#1a365d;padding:20px;text-align:center;">
        <p style="color:#fff;margin:0 0 10px;font-size:14px;font-weight:bold;">Meet Transfer USA, LLC</p>
        <p style="color:#ccc;margin:0 0 5px;font-size:12px;">📍 30 N Gould St, Sheridan, WY 82801, USA</p>
        <p style="color:#ccc;margin:0 0 10px;font-size:12px;">📧 info@meettransfer.app</p>
        <a href="https://wa.me/15558051101" style="display:inline-block;background-color:#25D366;color:#fff;padding:8px 16px;text-decoration:none;border-radius:4px;font-size:12px;">💬 WhatsApp: +1 (555) 805-1101</a>
      </td>
    </tr>
  </table>
</body>
</html>
          `.trim();

          await resend.emails.send({
            from: "Meet Transfer <noreply@mail.meettransfer.app>",
            to: [finalCustomerEmail],
            reply_to: "info@meettransfer.app",
            subject: `Booking Confirmed - ${reservation.reservation_code}`,
            text: plainText,
            html: emailHtml,
          });

          console.log("Confirmation email sent to customer:", finalCustomerEmail);
        }
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail - reservation is already created
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reservation: {
          id: reservation.id,
          reservationCode: reservation.reservation_code,
        },
        returnReservation: returnReservation
          ? {
              id: returnReservation.id,
              reservationCode: returnReservation.reservation_code,
            }
          : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in create-quick-booking-reservation:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

