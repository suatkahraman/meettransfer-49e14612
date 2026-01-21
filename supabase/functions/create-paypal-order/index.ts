import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayPalOrderRequest {
  reservationId?: string;
  quickBookingId?: string;
  amount: number;
  currency: string;
  description?: string;
}

// PayPal API base URLs
const PAYPAL_SANDBOX_URL = "https://api-m.sandbox.paypal.com";
const PAYPAL_LIVE_URL = "https://api-m.paypal.com";

async function getPayPalAccessToken(clientId: string, clientSecret: string, sandbox: boolean): Promise<string> {
  const baseUrl = sandbox ? PAYPAL_SANDBOX_URL : PAYPAL_LIVE_URL;
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
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
      console.log("PayPal not configured - payments disabled");
      return new Response(
        JSON.stringify({ 
          error: "PayPal not configured",
          code: "PAYMENTS_DISABLED" 
        }),
        { 
          status: 503, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const {
      reservationId,
      quickBookingId,
      amount,
      currency,
      description,
    }: PayPalOrderRequest = await req.json();

    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    if (!currency) {
      throw new Error("Currency is required");
    }

    console.log("Creating PayPal order:", {
      amount,
      currency,
      reservationId,
      quickBookingId,
    });

    // Always use sandbox for now
    const useSandbox = true;
    const baseUrl = useSandbox ? PAYPAL_SANDBOX_URL : PAYPAL_LIVE_URL;

    // Get access token
    const accessToken = await getPayPalAccessToken(clientId, clientSecret, useSandbox);

    // Create order
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: reservationId || quickBookingId || "transfer",
            description: description || "Transfer Service",
            amount: {
              currency_code: currency.toUpperCase(),
              value: amount.toFixed(2),
            },
            custom_id: JSON.stringify({
              reservation_id: reservationId,
              quick_booking_id: quickBookingId,
            }),
          },
        ],
        application_context: {
          brand_name: "Meet Transfer",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/paypal-capture`,
          cancel_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/paypal-cancel`,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error("PayPal order creation failed:", errorData);
      throw new Error("Failed to create PayPal order");
    }

    const order = await orderResponse.json();
    console.log("PayPal order created:", order.id);

    // Get approval URL
    const approvalLink = order.links?.find((link: any) => link.rel === "approve");

    // Store payment info in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (reservationId) {
      await supabase
        .from("reservations")
        .update({ 
          payment_link: approvalLink?.href,
          payment_status: "pending"
        })
        .eq("id", reservationId);
    }

    if (quickBookingId) {
      await supabase
        .from("quick_booking_requests")
        .update({ payment_link: approvalLink?.href })
        .eq("id", quickBookingId);
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        approvalUrl: approvalLink?.href,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error creating PayPal order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
