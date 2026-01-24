import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey || !webhookSecret) {
      console.log("Stripe webhook not configured");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Stripe webhook received:", event.type);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Payment completed for session:", session.id);

        const reservationId = session.metadata?.reservation_id;
        const quickBookingId = session.metadata?.quick_booking_id;
        const agencyId = session.metadata?.agency_id;
        const agencyAmount = session.metadata?.agency_amount;
        const agencyCurrency = session.metadata?.agency_currency;

        if (reservationId) {
          // Fetch reservation details for notification
          const { data: reservation } = await supabase
            .from("reservations")
            .select("reservation_code, customer_name, price, price_currency")
            .eq("id", reservationId)
            .single();

          const { error } = await supabase
            .from("reservations")
            .update({ 
              payment_status: "paid",
              payment_provider: "stripe",
              payment_completed_at: new Date().toISOString()
            })
            .eq("id", reservationId);

          if (error) {
            console.error("Error updating reservation payment status:", error);
          } else {
            console.log("Reservation payment marked as paid:", reservationId);
            
            // Send confirmation email to customer and agency
            try {
              await supabase.functions.invoke("send-payment-confirmation", {
                body: { reservationId, paymentProvider: "stripe" }
              });
              console.log("Payment confirmation emails sent for reservation:", reservationId);
            } catch (emailError) {
              console.error("Error sending payment confirmation emails:", emailError);
            }

            // Send push notification to admins
            try {
              const amount = reservation?.price || 0;
              const currency = reservation?.price_currency || "TRY";
              const customerName = reservation?.customer_name || "Müşteri";
              const code = reservation?.reservation_code || reservationId.slice(0, 8);
              
              await supabase.functions.invoke("create-notification", {
                body: {
                  notify_admins: true,
                  send_push: true,
                  title: "💳 Ödeme Alındı (Stripe)",
                  message: `${customerName} - #${code} için ${amount} ${currency} ödeme alındı.`,
                  type: "payment",
                  reservation_id: reservationId,
                }
              });
              console.log("Admin push notification sent for payment:", reservationId);
            } catch (notifError) {
              console.error("Error sending admin notification:", notifError);
            }
          }
        }

        if (quickBookingId) {
          // Fetch quick booking details for notification
          const { data: quickBooking } = await supabase
            .from("quick_booking_requests")
            .select("customer_name, price, price_currency")
            .eq("id", quickBookingId)
            .single();

          const { error } = await supabase
            .from("quick_booking_requests")
            .update({ status: "paid" })
            .eq("id", quickBookingId);

          if (error) {
            console.error("Error updating quick booking status:", error);
          } else {
            console.log("Quick booking marked as paid:", quickBookingId);
            
            // Send confirmation email to customer and agency for quick booking
            try {
              await supabase.functions.invoke("send-payment-confirmation", {
                body: { quickBookingId, paymentProvider: "stripe" }
              });
              console.log("Payment confirmation emails sent for quick booking:", quickBookingId);
            } catch (emailError) {
              console.error("Error sending payment confirmation emails:", emailError);
            }

            // Send push notification to admins
            try {
              const amount = quickBooking?.price || 0;
              const currency = quickBooking?.price_currency || "EUR";
              const customerName = quickBooking?.customer_name || "Müşteri";
              
              await supabase.functions.invoke("create-notification", {
                body: {
                  notify_admins: true,
                  send_push: true,
                  title: "💳 Hızlı Rezervasyon Ödemesi (Stripe)",
                  message: `${customerName} için ${amount} ${currency} ödeme alındı.`,
                  type: "payment",
                }
              });
              console.log("Admin push notification sent for quick booking payment:", quickBookingId);
            } catch (notifError) {
              console.error("Error sending admin notification:", notifError);
            }
          }
        }

        // Handle agency payment
        if (agencyId && agencyAmount) {
          const amount = parseFloat(agencyAmount);
          const currency = agencyCurrency || "EUR";
          
          // Fetch agency name for notification
          const { data: agencyData } = await supabase
            .from("agencies")
            .select("agency_name, balance")
            .eq("id", agencyId)
            .single();
          
          console.log("Recording agency payment:", { agencyId, amount, currency });
          
          // Insert into agency_payments
          const { error: paymentError } = await supabase
            .from("agency_payments")
            .insert({
              agency_id: agencyId,
              amount: amount,
              currency: currency,
              payment_date: new Date().toISOString().split('T')[0],
              notes: `Stripe ile online ödeme (Session: ${session.id})`,
            });

          if (paymentError) {
            console.error("Error recording agency payment:", paymentError);
          } else {
            console.log("Agency payment recorded successfully:", { agencyId, amount, currency });
            
            // Update agency_reservation_details payment_status if reservation exists
            if (reservationId) {
              const { error: detailsError } = await supabase
                .from("agency_reservation_details")
                .update({ payment_status: "paid" })
                .eq("reservation_id", reservationId);
              
              if (detailsError) {
                console.error("Error updating agency_reservation_details:", detailsError);
              } else {
                console.log("Agency reservation details payment status updated to paid");
              }
            }
            
            // Insert agency_transaction record
            // First get current balance to calculate balance_after
            const { data: currentTransactions } = await supabase
              .from("agency_transactions")
              .select("balance_after")
              .eq("agency_id", agencyId)
              .order("created_at", { ascending: false })
              .limit(1);
            
            const currentBalance = currentTransactions?.[0]?.balance_after || 0;
            const newBalance = currentBalance - amount;
            
            const { error: transactionError } = await supabase
              .from("agency_transactions")
              .insert({
                agency_id: agencyId,
                amount: -amount, // Negative because it's a payment (reduces debt)
                balance_after: newBalance,
                currency: currency,
                type: "payment",
                description: `Online ödeme (Stripe) - ${reservationId ? `Rezervasyon: ${reservationId}` : "Toplu ödeme"}`,
                reservation_id: reservationId || null,
              });
            
            if (transactionError) {
              console.error("Error inserting agency transaction:", transactionError);
            } else {
              console.log("Agency transaction recorded:", { agencyId, amount: -amount, newBalance });
            }
            
            // Update agency balance (deduct the paid amount)
            if (agencyData) {
              const updatedBalance = (agencyData.balance || 0) - amount;
              await supabase
                .from("agencies")
                .update({ balance: updatedBalance })
                .eq("id", agencyId);
              
              console.log("Agency balance updated:", { agencyId, oldBalance: agencyData.balance, updatedBalance });
            }

            // Send push notification to admins for agency payment
            try {
              const agencyName = agencyData?.agency_name || "Acenta";
              
              await supabase.functions.invoke("create-notification", {
                body: {
                  notify_admins: true,
                  send_push: true,
                  title: "🏢 Acenta Ödemesi (Stripe)",
                  message: `${agencyName} - ${amount} ${currency} online ödeme yaptı.`,
                  type: "payment",
                  reservation_id: reservationId || null,
                }
              });
              console.log("Admin push notification sent for agency payment:", agencyId);
            } catch (notifError) {
              console.error("Error sending admin notification for agency payment:", notifError);
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Payment session expired:", session.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Stripe webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
