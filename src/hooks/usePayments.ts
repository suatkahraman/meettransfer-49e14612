import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  paymentConfig, 
  isPaymentsEnabled, 
  isStripeEnabled, 
  isPayPalEnabled,
  getAvailablePaymentMethods,
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
  code?: string;
}

// Error messages for different failure scenarios
const ERROR_MESSAGES = {
  PAYMENTS_DISABLED: "Payment system is not configured yet",
  INVALID_AMOUNT: "Invalid payment amount",
  NETWORK_ERROR: "Network error. Please try again.",
  UNKNOWN: "Failed to process payment",
} as const;

// Validate payment options before making API call
const validatePaymentOptions = (options: CreatePaymentOptions): string | null => {
  if (!options.amount || options.amount <= 0) {
    return ERROR_MESSAGES.INVALID_AMOUNT;
  }
  if (!options.currency) {
    return "Currency is required";
  }
  return null;
};

export const usePayments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize static values
  const paymentsEnabled = useMemo(() => isPaymentsEnabled(), []);
  const stripeEnabled = useMemo(() => isStripeEnabled(), []);
  const paypalEnabled = useMemo(() => isPayPalEnabled(), []);
  const availableMethods = useMemo(() => getAvailablePaymentMethods(), []);

  const createStripeCheckout = useCallback(async (options: CreatePaymentOptions): Promise<PaymentResult> => {
    if (!stripeEnabled) {
      return { success: false, error: "Stripe payments are not enabled", code: "STRIPE_DISABLED" };
    }

    const validationError = validatePaymentOptions(options);
    if (validationError) {
      return { success: false, error: validationError, code: "VALIDATION_ERROR" };
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
        throw new Error(invokeError.message || ERROR_MESSAGES.NETWORK_ERROR);
      }

      if (data?.error) {
        if (data.code === "PAYMENTS_DISABLED") {
          return { success: false, error: ERROR_MESSAGES.PAYMENTS_DISABLED, code: data.code };
        }
        throw new Error(data.error);
      }

      if (!data?.url) {
        throw new Error("No payment URL returned");
      }

      return {
        success: true,
        url: data.url,
        sessionId: data.sessionId,
      };
    } catch (err: any) {
      const errorMessage = err.message || ERROR_MESSAGES.UNKNOWN;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [stripeEnabled]);

  const createPayPalOrder = useCallback(async (options: CreatePaymentOptions): Promise<PaymentResult> => {
    if (!paypalEnabled) {
      return { success: false, error: "PayPal payments are not enabled", code: "PAYPAL_DISABLED" };
    }

    const validationError = validatePaymentOptions(options);
    if (validationError) {
      return { success: false, error: validationError, code: "VALIDATION_ERROR" };
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("create-paypal-order", {
        body: options,
      });

      if (invokeError) {
        throw new Error(invokeError.message || ERROR_MESSAGES.NETWORK_ERROR);
      }

      if (data?.error) {
        if (data.code === "PAYMENTS_DISABLED") {
          return { success: false, error: ERROR_MESSAGES.PAYMENTS_DISABLED, code: data.code };
        }
        throw new Error(data.error);
      }

      if (!data?.approvalUrl) {
        throw new Error("No PayPal approval URL returned");
      }

      return {
        success: true,
        url: data.approvalUrl,
        orderId: data.orderId,
      };
    } catch (err: any) {
      const errorMessage = err.message || ERROR_MESSAGES.UNKNOWN;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [paypalEnabled]);

  const createPayment = useCallback(async (
    provider: PaymentProvider,
    options: CreatePaymentOptions
  ): Promise<PaymentResult> => {
    if (!paymentsEnabled) {
      toast.error("Online payments are not available yet");
      return { success: false, error: "Payments are disabled", code: "PAYMENTS_DISABLED" };
    }

    switch (provider) {
      case "stripe":
        return createStripeCheckout(options);
      case "paypal":
        return createPayPalOrder(options);
      default:
        return { success: false, error: "Invalid payment provider", code: "INVALID_PROVIDER" };
    }
  }, [paymentsEnabled, createStripeCheckout, createPayPalOrder]);

  const redirectToPayment = useCallback(async (
    provider: PaymentProvider,
    options: CreatePaymentOptions
  ): Promise<boolean> => {
    const result = await createPayment(provider, options);

    if (result.success && result.url) {
      // Use replace to prevent back button issues
      window.location.href = result.url;
      return true;
    }
    
    toast.error(result.error || ERROR_MESSAGES.UNKNOWN);
    return false;
  }, [createPayment]);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    clearError,
    isPaymentsEnabled: paymentsEnabled,
    isStripeEnabled: stripeEnabled,
    isPayPalEnabled: paypalEnabled,
    availableProviders: useMemo(() => ({
      stripe: stripeEnabled,
      paypal: paypalEnabled,
    }), [stripeEnabled, paypalEnabled]),
    availableMethods,
    createStripeCheckout,
    createPayPalOrder,
    createPayment,
    redirectToPayment,
    config: paymentConfig,
  };
};
