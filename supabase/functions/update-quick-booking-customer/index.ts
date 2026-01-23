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

// City to driver region mapping for auto-assignment
const CITY_TO_REGION_MAP: Record<string, string[]> = {
  'Istanbul': ['Istanbul', 'İstanbul', 'istanbul', 'İSTANBUL'],
  'İstanbul': ['Istanbul', 'İstanbul', 'istanbul', 'İSTANBUL'],
  'Antalya': ['Antalya', 'antalya', 'ANTALYA'],
  'Alanya': ['Antalya', 'antalya', 'ANTALYA'],
  'Kemer': ['Antalya', 'antalya', 'ANTALYA'],
  'Belek': ['Antalya', 'antalya', 'ANTALYA'],
  'Side': ['Antalya', 'antalya', 'ANTALYA'],
  'Manavgat': ['Antalya', 'antalya', 'ANTALYA'],
  'Kas': ['Antalya', 'antalya', 'ANTALYA'],
  'Izmir': ['Izmir', 'İzmir', 'izmir', 'İZMİR'],
  'İzmir': ['Izmir', 'İzmir', 'izmir', 'İZMİR'],
  'Cesme': ['Izmir', 'İzmir', 'izmir', 'İZMİR'],
  'Kusadasi': ['Izmir', 'İzmir', 'izmir', 'İZMİR'],
  'Bodrum': ['Bodrum', 'bodrum', 'BODRUM', 'Mugla', 'Muğla'],
  'Dalaman': ['Dalaman', 'dalaman', 'DALAMAN', 'Mugla', 'Muğla'],
  'Fethiye': ['Fethiye', 'fethiye', 'FETHIYE', 'Dalaman', 'Mugla', 'Muğla'],
  'Marmaris': ['Dalaman', 'dalaman', 'DALAMAN', 'Mugla', 'Muğla'],
  'Cappadocia': ['Cappadocia', 'Kapadokya', 'Nevsehir', 'Nevşehir', 'Kayseri'],
  'Goreme': ['Cappadocia', 'Kapadokya', 'Nevsehir', 'Nevşehir', 'Kayseri'],
  'Urgup': ['Cappadocia', 'Kapadokya', 'Nevsehir', 'Nevşehir', 'Kayseri'],
  'Dubai': ['Dubai', 'dubai', 'DUBAI', 'UAE'],
  'Abu Dhabi': ['Abu Dhabi', 'abu dhabi', 'ABU DHABI', 'UAE'],
  'Cyprus': ['Cyprus', 'Kıbrıs', 'KKTC', 'Larnaca', 'Paphos', 'Ercan'],
  'Bursa': ['Bursa', 'bursa', 'BURSA'],
};

// Detect city from pickup/dropoff location string
function detectCityFromLocation(location: string): string | null {
  if (!location) return null;
  
  const normalizedLocation = location.toLowerCase();
  
  // Istanbul detection - check for various keywords
  const istanbulKeywords = [
    'istanbul', 'İstanbul', 'taksim', 'sultanahmet', 'kadikoy', 'kadıköy',
    'besiktas', 'beşiktaş', 'sisli', 'şişli', 'fatih', 'beyoglu', 'beyoğlu',
    'uskudar', 'üsküdar', 'bakirkoy', 'bakırköy', 'atasehir', 'ataşehir',
    'maltepe', 'pendik', 'kartal', 'sariyer', 'sarıyer', 'zeytinburnu',
    'mecidiyekoy', 'mecidiyeköy', 'levent', 'maslak', 'arnavutkoy', 'arnavutköy',
    'ist airport', 'istanbul airport', 'istanbul havalimanı', 'sabiha gokcen',
    'sabiha gökçen', 'saw',
  ];
  
  for (const keyword of istanbulKeywords) {
    if (normalizedLocation.includes(keyword.toLowerCase())) {
      return 'Istanbul';
    }
  }
  
  // Antalya detection
  const antalyaKeywords = ['antalya', 'alanya', 'kemer', 'belek', 'side', 'manavgat', 'kas', 'kaş', 'ayt'];
  for (const keyword of antalyaKeywords) {
    if (normalizedLocation.includes(keyword.toLowerCase())) {
      return 'Antalya';
    }
  }
  
  // Izmir detection
  const izmirKeywords = ['izmir', 'İzmir', 'cesme', 'çeşme', 'kusadasi', 'kuşadası', 'adb'];
  for (const keyword of izmirKeywords) {
    if (normalizedLocation.includes(keyword.toLowerCase())) {
      return 'Izmir';
    }
  }
  
  // Bodrum detection
  if (normalizedLocation.includes('bodrum') || normalizedLocation.includes('bjv')) {
    return 'Bodrum';
  }
  
  // Dalaman/Fethiye/Marmaris detection
  const dalamanKeywords = ['dalaman', 'fethiye', 'marmaris', 'oludeniz', 'ölüdeniz', 'dlm'];
  for (const keyword of dalamanKeywords) {
    if (normalizedLocation.includes(keyword.toLowerCase())) {
      return 'Dalaman';
    }
  }
  
  // Cappadocia detection
  const cappadociaKeywords = ['cappadocia', 'kapadokya', 'goreme', 'göreme', 'urgup', 'ürgüp', 'nevsehir', 'nevşehir', 'nav'];
  for (const keyword of cappadociaKeywords) {
    if (normalizedLocation.includes(keyword.toLowerCase())) {
      return 'Cappadocia';
    }
  }
  
  // Dubai/UAE detection
  const dubaiKeywords = ['dubai', 'abu dhabi', 'sharjah', 'dxb', 'uae'];
  for (const keyword of dubaiKeywords) {
    if (normalizedLocation.includes(keyword.toLowerCase())) {
      return 'Dubai';
    }
  }
  
  // Bursa detection
  if (normalizedLocation.includes('bursa') || normalizedLocation.includes('yei')) {
    return 'Bursa';
  }
  
  return null;
}

// Auto-assign driver based on city/region
async function autoAssignDriver(
  supabase: any,
  pickup: string,
  dropoff: string
): Promise<{ id: string; name: string; user_id: string; phone: string; plate_number: string | null } | null> {
  // Detect city from pickup or dropoff
  const pickupCity = detectCityFromLocation(pickup);
  const dropoffCity = detectCityFromLocation(dropoff);
  const detectedCity = pickupCity || dropoffCity;
  
  if (!detectedCity) {
    console.log('⚠️ Could not detect city from locations - manual assignment required');
    return null;
  }
  
  console.log(`🚗 Attempting auto-driver assignment for region: ${detectedCity}`);
  
  // Get possible region values for this city
  const possibleRegions = CITY_TO_REGION_MAP[detectedCity] || [detectedCity];
  
  // Find an active driver with matching region
  const { data: matchingDrivers } = await supabase
    .from('drivers')
    .select('id, name, user_id, phone, plate_number, region')
    .eq('active', true)
    .in('region', possibleRegions)
    .limit(5);
  
  if (matchingDrivers && matchingDrivers.length > 0) {
    console.log(`✅ Auto-assigning driver: ${matchingDrivers[0].name} (region: ${matchingDrivers[0].region})`);
    return matchingDrivers[0];
  }
  
  console.log(`⚠️ No active driver found for region: ${detectedCity} - manual assignment required`);
  return null;
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

    // Get the current reservation to detect city for driver assignment
    const { data: currentReservation } = await supabase
      .from("reservations")
      .select("pickup, dropoff")
      .eq("id", requestData.reservationId)
      .single();

    // Try to auto-assign driver based on pickup/dropoff location
    let autoAssignedDriver = null;
    if (currentReservation) {
      autoAssignedDriver = await autoAssignDriver(
        supabase, 
        currentReservation.pickup, 
        currentReservation.dropoff
      );
    }

    // Build update object - include vehicle change if provided
    const updateData: Record<string, any> = {
      customer_id: userId,
      customer_name: requestData.customerName,
      customer_phone: requestData.customerPhone,
      status: autoAssignedDriver ? "sent_to_driver" : "customer_approved",
    };

    // Add driver assignment if found
    if (autoAssignedDriver) {
      updateData.driver_id = autoAssignedDriver.id;
      updateData.driver_user_id = autoAssignedDriver.user_id;
      console.log(`🚗 Driver auto-assigned: ${autoAssignedDriver.name} (ID: ${autoAssignedDriver.id})`);
    }

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

    console.log("Main reservation updated:", updatedReservation.reservation_code, "Status:", updateData.status);
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
            driver_id: oldReservation.driver_id,
          } : null,
          new_data: {
            customer_id: userId,
            customer_name: requestData.customerName,
            customer_email: requestData.customerEmail,
            customer_phone: requestData.customerPhone,
            status: updateData.status,
            driver_id: autoAssignedDriver?.id || null,
            driver_name: autoAssignedDriver?.name || null,
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

    // Update return reservation if exists - also with driver assignment
    if (requestData.returnReservationCode) {
      // Get return reservation to detect its location
      const { data: returnReservation } = await supabase
        .from("reservations")
        .select("id, pickup, dropoff")
        .eq("reservation_code", requestData.returnReservationCode)
        .single();
      
      let returnDriver = null;
      if (returnReservation) {
        returnDriver = await autoAssignDriver(
          supabase,
          returnReservation.pickup,
          returnReservation.dropoff
        );
      }
      
      const returnUpdateData: Record<string, any> = {
        customer_id: userId,
        customer_name: requestData.customerName,
        customer_phone: requestData.customerPhone,
        status: returnDriver ? "sent_to_driver" : "customer_approved",
      };
      
      if (returnDriver) {
        returnUpdateData.driver_id = returnDriver.id;
        returnUpdateData.driver_user_id = returnDriver.user_id;
        console.log(`🚗 Return trip driver auto-assigned: ${returnDriver.name}`);
      }
      
      if (requestData.selectedVehicle) {
        returnUpdateData.vehicle_type = requestData.selectedVehicle;
      }
      if (requestData.newPrice !== undefined && requestData.newPrice !== null) {
        returnUpdateData.price = requestData.newPrice;
      }

      const { data: updatedReturnReservation, error: returnUpdateError } = await supabase
        .from("reservations")
        .update(returnUpdateData)
        .eq("reservation_code", requestData.returnReservationCode)
        .select()
        .single();

      if (returnUpdateError) {
        console.error("Error updating return reservation:", returnUpdateError);
        // Don't fail the whole operation
      } else {
        console.log("Return reservation updated:", requestData.returnReservationCode, "Status:", returnUpdateData.status);
        
        // Send notification to driver for return trip
        if (returnDriver && updatedReturnReservation) {
          try {
            await supabase.functions.invoke("notify-driver-new-reservation", {
              body: {
                reservationId: updatedReturnReservation.id,
                driverUserId: returnDriver.user_id,
                driverPhone: returnDriver.phone,
              },
            });
            console.log(`✅ Return trip driver notification sent to ${returnDriver.name}`);
          } catch (returnDriverNotifyError) {
            console.error("Failed to notify driver for return trip:", returnDriverNotifyError);
          }
        }
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
          driverAssigned: autoAssignedDriver?.name || null,
        },
      });
      console.log("Admin notification sent for completed quick booking");
    } catch (adminNotifyError) {
      console.error("Failed to send admin notification:", adminNotifyError);
      // Don't fail the operation
    }

    // If driver was assigned, send notification to driver
    if (autoAssignedDriver) {
      try {
        await supabase.functions.invoke("notify-driver-new-reservation", {
          body: {
            reservationId: updatedReservation.id,
            driverUserId: autoAssignedDriver.user_id,
            driverPhone: autoAssignedDriver.phone,
          },
        });
        console.log(`✅ Driver notification sent to ${autoAssignedDriver.name}`);
      } catch (driverNotifyError) {
        console.error("Failed to notify driver:", driverNotifyError);
        // Don't fail the operation
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        reservationCode: updatedReservation.reservation_code,
        driverAssigned: autoAssignedDriver?.name || null,
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
