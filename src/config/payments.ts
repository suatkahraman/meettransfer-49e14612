/**
 * Payment Configuration
 * 
 * All payment features are DISABLED by default.
 * To enable payments, set these environment variables:
 * - VITE_PAYMENTS_ENABLED=true (master switch)
 * - VITE_STRIPE_ENABLED=true (enable Stripe)
 * - VITE_PAYPAL_ENABLED=true (enable PayPal)
 * 
 * Required secrets (to be added in Lovable Cloud):
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_SECRET
 * - PAYPAL_CLIENT_ID
 * - PAYPAL_CLIENT_SECRET
 */

export const paymentConfig = {
  // Master switch - must be true for any payments to work
  enabled: import.meta.env.VITE_PAYMENTS_ENABLED === 'true',
  
  // Individual provider switches
  stripe: {
    enabled: import.meta.env.VITE_STRIPE_ENABLED === 'true',
    // Stripe publishable key (safe to expose)
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  },
  
  paypal: {
    enabled: import.meta.env.VITE_PAYPAL_ENABLED === 'true',
    // PayPal client ID for sandbox (safe to expose)
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
    // Always use sandbox until production ready
    mode: 'sandbox' as const,
  },
  
  // Supported currencies
  supportedCurrencies: ['EUR', 'USD', 'GBP', 'TRY', 'AED', 'AUD'] as const,
  
  // Default currency
  defaultCurrency: 'EUR',
} as const;

// Type exports
export type SupportedCurrency = typeof paymentConfig.supportedCurrencies[number];
export type PaymentProvider = 'stripe' | 'paypal';

// Helper to check if payments are available
export const isPaymentsEnabled = (): boolean => {
  return paymentConfig.enabled;
};

export const isStripeEnabled = (): boolean => {
  return paymentConfig.enabled && paymentConfig.stripe.enabled;
};

export const isPayPalEnabled = (): boolean => {
  return paymentConfig.enabled && paymentConfig.paypal.enabled;
};

// Get available payment methods
export const getAvailablePaymentMethods = (): PaymentProvider[] => {
  const methods: PaymentProvider[] = [];
  if (isStripeEnabled()) methods.push('stripe');
  if (isPayPalEnabled()) methods.push('paypal');
  return methods;
};
