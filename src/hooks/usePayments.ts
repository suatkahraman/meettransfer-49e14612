import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  paymentConfig, 
  isPaymentsEnabled, 
  isStripeEnabled, 
  isPayPalEnabled,
  type PaymentProvider,
  type SupportedCurrency 
} from "@/config/payments";
import { toast } from "sonner";

interface CreatePaymentOptions {
  reservationId?: string;
  quickBookingId?: string;
  agencyId?: string;
  amount: number;
  currency: SupportedCurrency;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface PaymentResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  orderId?: string;
  error?: string;
}

export const usePayments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStripeCheckout = useCallback(async (options: CreatePaymentOptions): Promise<PaymentResult> => {
    if (!isStripeEnabled()) {
      return { success: false, error: "Stripe payments are not enabled" };
    }

    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = window.location.origin;
      
      const { data, error: invokeError } = await supabase.functions.invoke("create-stripe-checkout", {
        body: {
          ...options,
          successUrl: options.successUrl || `${baseUrl}/payment-success`,
          cancelUrl: options.cancelUrl || `${baseUrl}/payment-cancel`,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data?.error) {
        if (data.code === "PAYMENTS_DISABLED") {
          return { success: false, error: "Payment system is not configured yet" };
        }
        throw new Error(data.error);
      }

      return {
        success: true,
        url: data.url,
        sessionId: data.sessionId,
      };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create payment session";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPayPalOrder = useCallback(async (options: CreatePaymentOptions): Promise<PaymentResult> => {
    if (!isPayPalEnabled()) {
      return { success: false, error: "PayPal payments are not enabled" };
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("create-paypal-order", {
        body: options,
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data?.error) {
        if (data.code === "PAYMENTS_DISABLED") {
          return { success: false, error: "PayPal is not configured yet" };
        }
        throw new Error(data.error);
      }

      return {
        success: true,
        url: data.approvalUrl,
        orderId: data.orderId,
      };
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create PayPal order";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPayment = useCallback(async (
    provider: PaymentProvider,
    options: CreatePaymentOptions
  ): Promise<PaymentResult> => {
    if (!isPaymentsEnabled()) {
      toast.error("Online payments are not available yet");
      return { success: false, error: "Payments are disabled" };
    }

    if (provider === "stripe") {
      return createStripeCheckout(options);
    } else if (provider === "paypal") {
      return createPayPalOrder(options);
    }

    return { success: false, error: "Invalid payment provider" };
  }, [createStripeCheckout, createPayPalOrder]);

  const redirectToPayment = useCallback(async (
    provider: PaymentProvider,
    options: CreatePaymentOptions
  ): Promise<void> => {
    const result = await createPayment(provider, options);

    if (result.success && result.url) {
      window.location.href = result.url;
    } else {
      toast.error(result.error || "Failed to initiate payment");
    }
  }, [createPayment]);

  return {
    isLoading,
    error,
    isPaymentsEnabled: isPaymentsEnabled(),
    isStripeEnabled: isStripeEnabled(),
    isPayPalEnabled: isPayPalEnabled(),
    availableProviders: {
      stripe: isStripeEnabled(),
      paypal: isPayPalEnabled(),
    },
    createStripeCheckout,
    createPayPalOrder,
    createPayment,
    redirectToPayment,
    config: paymentConfig,
  };
};
