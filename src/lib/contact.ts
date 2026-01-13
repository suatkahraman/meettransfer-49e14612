/**
 * Centralized contact information configuration
 * All contact details should be imported from this file
 */

// Company name
export const COMPANY_NAME = "Meet Transfer USA, LLC";

// WhatsApp number for customer support and bookings
// Format: country code + number without spaces or special characters
export const WHATSAPP_NUMBER = "15558051101";

// Display format for the phone number
export const WHATSAPP_DISPLAY = "+1 (555) 805-1101";

// Emergency/alternative phone number
export const EMERGENCY_PHONE = "+905321748390";

// Email addresses
export const SUPPORT_EMAIL = "info@meettransfer.app";

// Global office locations
export interface OfficeLocation {
  flag: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  whatsappOnly: boolean;
  email: string | null;
}

export const GLOBAL_OFFICES: OfficeLocation[] = [
  {
    flag: "🇺🇸",
    country: "USA",
    city: "Sheridan",
    address: "30 N Gould St, Sheridan, WY 82801",
    phone: WHATSAPP_DISPLAY,
    whatsappOnly: true,
    email: null,
  },
  {
    flag: "🇩🇪",
    country: "Germany",
    city: "Berlin",
    address: "Street Business Center, Berlin 245",
    phone: WHATSAPP_DISPLAY,
    whatsappOnly: true,
    email: null,
  },
  {
    flag: "🇦🇪",
    country: "UAE",
    city: "Dubai",
    address: "Downtown Business Tower, Dubai 35",
    phone: WHATSAPP_DISPLAY,
    whatsappOnly: true,
    email: null,
  },
  {
    flag: "🇦🇺",
    country: "Australia",
    city: "Sydney",
    address: "10 Ettolong St, Auburn NSW 2144",
    phone: WHATSAPP_DISPLAY,
    whatsappOnly: true,
    email: null,
  },
];

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
