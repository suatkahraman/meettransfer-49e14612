// Google Analytics 4 + Google Ads Tracking Utility
// GA4 Property ID: G-507992036
// Google Ads Conversion ID: AW-668686697

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

// GA4 Measurement ID
export const GA4_MEASUREMENT_ID = 'G-507992036';

// Conversion labels for different events
export const CONVERSION_LABELS = {
  RESERVATION_SUBMIT: 'AW-668686697/P-SqCJuKoK8aEOmy7b4C',
  CONTACT_FORM_SUBMIT: 'AW-668686697/contact_form',
  WHATSAPP_CLICK: 'AW-668686697/whatsapp_click',
  PHONE_CALL: 'AW-668686697/phone_call',
} as const;

/**
 * Track a Google Ads conversion event
 * @param conversionLabel - The conversion label (e.g., 'AW-668686697/xxxxx')
 * @param value - Optional conversion value
 * @param currency - Optional currency code (default: 'TRY')
 */
export function trackConversion(
  conversionLabel: string,
  value?: number,
  currency: string = 'TRY'
): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    const eventParams: Record<string, unknown> = {
      send_to: conversionLabel,
    };

    if (value !== undefined) {
      eventParams.value = value;
      eventParams.currency = currency;
    }

    window.gtag('event', 'conversion', eventParams);
    console.log('Google Ads conversion tracked:', conversionLabel);
  }
}

/**
 * Track a custom event in Google Analytics/Ads
 * @param eventName - The name of the event
 * @param params - Additional event parameters
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}
