/**
 * Payment Components
 * 
 * These components are DISABLED by default.
 * To enable payments, set these environment variables:
 * - VITE_PAYMENTS_ENABLED=true
 * - VITE_STRIPE_ENABLED=true (for Stripe)
 * - VITE_PAYPAL_ENABLED=true (for PayPal)
 * 
 * And add the required secrets in Lovable Cloud:
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_SECRET
 * - PAYPAL_CLIENT_ID
 * - PAYPAL_CLIENT_SECRET
 */

export { PaymentMethodSelector } from "./PaymentMethodSelector";
