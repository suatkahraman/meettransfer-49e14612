/**
 * Centralized contact information configuration
 * All contact details should be imported from this file
 */

// WhatsApp number for customer support and bookings
// Format: country code + number without spaces or special characters
export const WHATSAPP_NUMBER = "15558051101";

// Display format for the phone number
export const WHATSAPP_DISPLAY = "+1 555 805 1101";

// Emergency/alternative phone number
export const EMERGENCY_PHONE = "+15558051101";

// Email addresses
export const SUPPORT_EMAIL = "info@meettransfer.app";

/**
 * Generate a WhatsApp URL with an optional pre-filled message
 * @param message - Optional message to pre-fill
 * @returns Full WhatsApp URL
 */
export const getWhatsAppUrl = (message?: string): string => {
  const baseUrl = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
};

/**
 * Open WhatsApp with an optional pre-filled message
 * @param message - Optional message to pre-fill
 */
export const openWhatsApp = (message?: string): void => {
  window.open(getWhatsAppUrl(message), "_blank");
};
