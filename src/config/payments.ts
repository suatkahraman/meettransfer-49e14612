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
 * 
 * PAYMENT FLOW:
 * 1. Reservation is created FIRST (payment is optional)
 * 2. Customer can pay anytime after reservation (even on transfer day)
 * 3. Only logged-in users (customer/agency) can access payment options
 * 4. Supported statuses: pending, paid, partial, pay_on_transfer
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
  
  // Payment statuses
  statuses: {
    PENDING: 'pending',
    PAID: 'paid',
    PARTIAL: 'partial',
    PAY_ON_TRANSFER: 'pay_on_transfer',
  } as const,
} as const;

// Type exports
export type SupportedCurrency = typeof paymentConfig.supportedCurrencies[number];
export type PaymentProvider = 'stripe' | 'paypal';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'pay_on_transfer';

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
