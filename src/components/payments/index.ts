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
 * 
 * PAYMENT FLOW:
 * 1. Reservation is created first (payment NOT required)
 * 2. User can pay anytime (after reservation, before transfer, or on transfer day)
 * 3. Only logged-in users (customer/agency) see payment options
 * 4. Statuses: pending, paid, partial, pay_on_transfer
 */

// Main unified panel with full customization
export { 
  UnifiedPaymentPanel, 
  TURKISH_TRANSLATIONS,
  type UnifiedPaymentPanelProps,
  type PaymentPanelTranslations,
} from "./UnifiedPaymentPanel";

// Convenience wrappers
export { PaymentMethodSelector } from "./PaymentMethodSelector";
export { PaymentStatusBadge } from "./PaymentStatusBadge";
export { ReservationPaymentPanel, type ReservationPaymentPanelProps } from "./ReservationPaymentPanel";
