import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYPAL_SANDBOX_URL = "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const response = await fetch(`${PAYPAL_SANDBOX_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get PayPal access token");
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "PayPal not configured" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get order ID from query params (PayPal redirects with token param)
    const url = new URL(req.url);
    const orderId = url.searchParams.get("token");

    if (!orderId) {
      throw new Error("Order ID not provided");
    }

    console.log("Capturing PayPal order:", orderId);

    const accessToken = await getPayPalAccessToken(clientId, clientSecret);

    // Capture the order
    const captureResponse = await fetch(
      `${PAYPAL_SANDBOX_URL}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!captureResponse.ok) {
      const errorData = await captureResponse.text();
      console.error("PayPal capture failed:", errorData);
      throw new Error("Failed to capture PayPal payment");
    }

    const captureData = await captureResponse.json();
    console.log("PayPal payment captured:", captureData.id);

    // Extract custom_id to get reservation/booking/agency info
    const customId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;
    let reservationId: string | undefined;
    let quickBookingId: string | undefined;
    let agencyId: string | undefined;
    let agencyAmount: number | undefined;
    let agencyCurrency: string | undefined;

    if (customId) {
      try {
        const parsed = JSON.parse(customId);
        reservationId = parsed.reservation_id;
        quickBookingId = parsed.quick_booking_id;
        agencyId = parsed.agency_id;
        agencyAmount = parsed.agency_amount;
        agencyCurrency = parsed.agency_currency;
      } catch (e) {
        console.log("Could not parse custom_id");
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update payment status
    if (reservationId) {
      await supabase
        .from("reservations")
        .update({ 
          payment_status: "paid",
          payment_provider: "paypal",
          payment_completed_at: new Date().toISOString()
        })
        .eq("id", reservationId);

      console.log("Reservation payment marked as paid:", reservationId);

      // Send confirmation email
      await supabase.functions.invoke("send-payment-confirmation", {
        body: { reservationId, paymentProvider: "paypal" }
      });
    }

    if (quickBookingId) {
      await supabase
        .from("quick_booking_requests")
        .update({ status: "paid" })
        .eq("id", quickBookingId);

      console.log("Quick booking marked as paid:", quickBookingId);
    }

    // Handle agency payment
    if (agencyId && agencyAmount) {
      const currency = agencyCurrency || "EUR";
      
      console.log("Recording agency PayPal payment:", { agencyId, agencyAmount, currency });
      
      // Insert into agency_payments
      const { error: paymentError } = await supabase
        .from("agency_payments")
        .insert({
          agency_id: agencyId,
          amount: agencyAmount,
          currency: currency,
          payment_date: new Date().toISOString().split('T')[0],
          notes: `PayPal ile online ödeme (Order: ${orderId})`,
        });

      if (paymentError) {
        console.error("Error recording agency payment:", paymentError);
      } else {
        console.log("Agency payment recorded successfully:", { agencyId, agencyAmount, currency });
        
        // Update agency balance (deduct the paid amount)
        const { data: agency, error: agencyError } = await supabase
          .from("agencies")
          .select("balance")
          .eq("id", agencyId)
          .single();

        if (!agencyError && agency) {
          const newBalance = (agency.balance || 0) - agencyAmount;
          await supabase
            .from("agencies")
            .update({ balance: newBalance })
            .eq("id", agencyId);
          
          console.log("Agency balance updated:", { agencyId, oldBalance: agency.balance, newBalance });
        }
      }
    }

    // Redirect to success page
    const successUrl = Deno.env.get("PAYMENT_SUCCESS_URL") || "https://meettransfer.lovable.app/payment-success";
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${successUrl}?orderId=${orderId}`,
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("PayPal capture error:", error);
    
    const errorUrl = Deno.env.get("PAYMENT_ERROR_URL") || "https://meettransfer.lovable.app/payment-error";
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${errorUrl}?error=${encodeURIComponent(error.message)}`,
        ...corsHeaders,
      },
    });
  }
});
