import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateCustomerRequest {
  reservationId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerPassword: string;
  returnReservationCode?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: UpdateCustomerRequest = await req.json();
    
    console.log("Updating reservation with customer info:", requestData.reservationId);

    // Validate password
    if (!requestData.customerPassword || requestData.customerPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Check if user already exists with this email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === requestData.customerEmail);

    let userId: string;

    if (existingUser) {
      // User exists - update their password so they can login
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: requestData.customerPassword }
      );
      
      if (updateError) {
        console.error("Error updating user password:", updateError);
        // Continue anyway - they might already know their password
      }
      
      userId = existingUser.id;
      console.log("Using existing user:", userId);
      
      // Update profile
      await supabase
        .from("profiles")
        .upsert({
          id: userId,
          full_name: requestData.customerName,
          phone: requestData.customerPhone,
        }, { onConflict: "id" });
    } else {
      // Create a new user account WITH password
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: requestData.customerEmail,
        password: requestData.customerPassword,
        email_confirm: true,
        user_metadata: {
          full_name: requestData.customerName,
        },
      });

      if (createUserError) {
        console.error("Error creating user:", createUserError);
        throw new Error(`Failed to create user account: ${createUserError.message}`);
      }

      userId = newUser.user.id;
      console.log("Created new user:", userId);

      // Ensure profile exists
      await supabase
        .from("profiles")
        .upsert({
          id: userId,
          full_name: requestData.customerName,
          phone: requestData.customerPhone,
        }, { onConflict: "id" });
    }

    // Assign customer role if not exists
    await supabase
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: "customer",
      }, { onConflict: "user_id,role" });

    // Update the main reservation
    const { data: updatedReservation, error: updateError } = await supabase
      .from("reservations")
      .update({
        customer_id: userId,
        customer_name: requestData.customerName,
        customer_phone: requestData.customerPhone,
        status: "customer_approved",
      })
      .eq("id", requestData.reservationId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating reservation:", updateError);
      throw new Error(`Failed to update reservation: ${updateError.message}`);
    }

    console.log("Main reservation updated:", updatedReservation.reservation_code);

    // Update return reservation if exists
    if (requestData.returnReservationCode) {
      const { error: returnUpdateError } = await supabase
        .from("reservations")
        .update({
          customer_id: userId,
          customer_name: requestData.customerName,
          customer_phone: requestData.customerPhone,
          status: "customer_approved",
        })
        .eq("reservation_code", requestData.returnReservationCode);

      if (returnUpdateError) {
        console.error("Error updating return reservation:", returnUpdateError);
        // Don't fail the whole operation
      } else {
        console.log("Return reservation updated:", requestData.returnReservationCode);
      }
    }

    // Send confirmation email to customer
    try {
      await supabase.functions.invoke("send-confirmation-email", {
        body: {
          email: requestData.customerEmail,
          customerName: requestData.customerName,
          reservationCode: updatedReservation.reservation_code,
          pickup: updatedReservation.pickup,
          dropoff: updatedReservation.dropoff,
          pickupDate: updatedReservation.pickup_date,
          pickupTime: updatedReservation.pickup_time,
          vehicleType: updatedReservation.vehicle_type,
          price: updatedReservation.price,
          currency: updatedReservation.price_currency,
        },
      });
      console.log("Confirmation email sent to:", requestData.customerEmail);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the operation
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        reservationCode: updatedReservation.reservation_code,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in update-quick-booking-customer:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
