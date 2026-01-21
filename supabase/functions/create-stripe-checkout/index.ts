import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  reservationId?: string;
  quickBookingId?: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if Stripe is configured
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.log("Stripe not configured - payments disabled");
      return new Response(
        JSON.stringify({ 
          error: "Payment system not configured",
          code: "PAYMENTS_DISABLED" 
        }),
        { 
          status: 503, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const {
      reservationId,
      quickBookingId,
      amount,
      currency,
      customerEmail,
      customerName,
      description,
      successUrl,
      cancelUrl,
    }: CheckoutRequest = await req.json();

    // Validate required fields
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    if (!currency) {
      throw new Error("Currency is required");
    }

    if (!successUrl || !cancelUrl) {
      throw new Error("Success and cancel URLs are required");
    }

    console.log("Creating Stripe checkout session:", {
      amount,
      currency,
      reservationId,
      quickBookingId,
    });

    // Convert amount to smallest currency unit (cents/kuruş)
    const amountInSmallestUnit = Math.round(amount * 100);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description || "Transfer Service",
              description: reservationId 
                ? `Reservation: ${reservationId}` 
                : quickBookingId 
                  ? `Booking: ${quickBookingId}`
                  : "Transfer booking",
            },
            unit_amount: amountInSmallestUnit,
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        reservation_id: reservationId || "",
        quick_booking_id: quickBookingId || "",
        customer_name: customerName || "",
      },
    });

    console.log("Stripe checkout session created:", session.id);

    // Store payment link in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (reservationId) {
      await supabase
        .from("reservations")
        .update({ 
          payment_link: session.url,
          payment_status: "pending"
        })
        .eq("id", reservationId);
    }

    if (quickBookingId) {
      await supabase
        .from("quick_booking_requests")
        .update({ payment_link: session.url })
        .eq("id", quickBookingId);
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error creating Stripe checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
