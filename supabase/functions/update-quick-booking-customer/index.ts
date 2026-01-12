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
  customerPassword?: string;
  customerId?: string; // For Google auth - existing user ID
  isGoogleAuth?: boolean;
  returnReservationCode?: string;
  selectedVehicle?: string;
  newPrice?: number;
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
    
    console.log("Updating reservation with customer info:", requestData.reservationId, "isGoogleAuth:", requestData.isGoogleAuth);

    // Validate password only for non-Google auth
    if (!requestData.isGoogleAuth && (!requestData.customerPassword || requestData.customerPassword.length < 6)) {
      throw new Error("Password must be at least 6 characters");
    }

    let userId: string;

    // If Google auth and customerId is provided, use that directly
    if (requestData.isGoogleAuth && requestData.customerId) {
      userId = requestData.customerId;
      console.log("Using Google auth user:", userId);
      
      // Update profile with provided info
      await supabase
        .from("profiles")
        .upsert({
          id: userId,
          full_name: requestData.customerName,
          phone: requestData.customerPhone || null,
        }, { onConflict: "id" });
    } else {
      // Check if user already exists with this email
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === requestData.customerEmail);

      if (existingUser) {
        // User exists - update their password so they can login
        if (requestData.customerPassword) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: requestData.customerPassword }
          );
          
          if (updateError) {
            console.error("Error updating user password:", updateError);
            // Continue anyway - they might already know their password
          }
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
    }

    // Assign customer role if not exists
    await supabase
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: "customer",
      }, { onConflict: "user_id,role" });

    // Build update object - include vehicle change if provided
    const updateData: Record<string, any> = {
      customer_id: userId,
      customer_name: requestData.customerName,
      customer_phone: requestData.customerPhone,
      status: "customer_approved",
    };

    // Update vehicle type and price if changed
    if (requestData.selectedVehicle) {
      updateData.vehicle_type = requestData.selectedVehicle;
    }
    if (requestData.newPrice !== undefined && requestData.newPrice !== null) {
      updateData.price = requestData.newPrice;
    }

    // Get old reservation data for audit log
    const { data: oldReservation } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", requestData.reservationId)
      .single();

    // Update the main reservation
    const { data: updatedReservation, error: updateError } = await supabase
      .from("reservations")
      .update(updateData)
      .eq("id", requestData.reservationId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating reservation:", updateError);
      throw new Error(`Failed to update reservation: ${updateError.message}`);
    }

    console.log("Main reservation updated:", updatedReservation.reservation_code);
    console.log("Customer account created/linked - User ID:", userId, "Email:", requestData.customerEmail);

    // Log audit for customer account creation and reservation linking
    try {
      const auditAction = requestData.isGoogleAuth ? "customer_google_signup" : "customer_account_created";
      await supabase
        .from("audit_logs")
        .insert({
          user_id: userId,
          user_email: requestData.customerEmail,
          action: auditAction,
          table_name: "reservations",
          record_id: requestData.reservationId,
          old_data: oldReservation ? {
            customer_id: oldReservation.customer_id,
            customer_name: oldReservation.customer_name,
            status: oldReservation.status,
          } : null,
          new_data: {
            customer_id: userId,
            customer_name: requestData.customerName,
            customer_email: requestData.customerEmail,
            customer_phone: requestData.customerPhone,
            status: "customer_approved",
            vehicle_type: updateData.vehicle_type || updatedReservation.vehicle_type,
            price: updateData.price || updatedReservation.price,
            reservation_code: updatedReservation.reservation_code,
            is_google_auth: requestData.isGoogleAuth || false,
          },
          ip_address: null,
          user_agent: "quick-booking-customer-info",
        });
      console.log(`✅ Audit log created: ${auditAction} - Reservation ${updatedReservation.reservation_code} linked to customer ${requestData.customerEmail} (User ID: ${userId})`);
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
      // Don't fail the operation for audit log failure
    }

    // Update return reservation if exists
    if (requestData.returnReservationCode) {
      const returnUpdateData: Record<string, any> = {
        customer_id: userId,
        customer_name: requestData.customerName,
        customer_phone: requestData.customerPhone,
        status: "customer_approved",
      };
      
      if (requestData.selectedVehicle) {
        returnUpdateData.vehicle_type = requestData.selectedVehicle;
      }
      if (requestData.newPrice !== undefined && requestData.newPrice !== null) {
        returnUpdateData.price = requestData.newPrice;
      }

      const { error: returnUpdateError } = await supabase
        .from("reservations")
        .update(returnUpdateData)
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
          reservation_id: updatedReservation.id,
          lang: "en", // Default to English, could be passed from request
        },
      });
      console.log("Confirmation email sent to customer for reservation:", updatedReservation.reservation_code);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the operation
    }

    // Send admin email notification about completed quick booking
    try {
      await supabase.functions.invoke("notify-admin-quick-booking-customer-info", {
        body: {
          reservationId: updatedReservation.id,
          reservationCode: updatedReservation.reservation_code,
          customerName: requestData.customerName,
          customerEmail: requestData.customerEmail,
          customerPhone: requestData.customerPhone,
          pickup: updatedReservation.pickup,
          dropoff: updatedReservation.dropoff,
          pickupDate: updatedReservation.pickup_date,
          pickupTime: updatedReservation.pickup_time,
          vehicleType: updatedReservation.vehicle_type,
          price: updatedReservation.price,
          priceCurrency: updatedReservation.price_currency,
          paymentMethod: updatedReservation.payment_type,
        },
      });
      console.log("Admin notification sent for completed quick booking");
    } catch (adminNotifyError) {
      console.error("Failed to send admin notification:", adminNotifyError);
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
