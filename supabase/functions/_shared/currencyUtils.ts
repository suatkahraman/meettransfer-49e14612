// Shared currency utilities for edge functions

// Currency symbols
export const CURRENCY_SYMBOLS: Record<string, string> = {
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
  'TRY': '₺',
  'AED': 'د.إ',
  'AUD': 'A$',
};

// Get currency symbol
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

// Fallback exchange rates (updated periodically)
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  'EUR': { 'USD': 1.08, 'TRY': 37.5, 'GBP': 0.85, 'AED': 3.97 },
  'USD': { 'EUR': 0.93, 'TRY': 34.5, 'GBP': 0.79, 'AED': 3.67 },
  'TRY': { 'EUR': 0.027, 'USD': 0.029, 'GBP': 0.023, 'AED': 0.11 },
  'GBP': { 'EUR': 1.18, 'USD': 1.27, 'TRY': 44.1, 'AED': 4.67 },
  'AED': { 'EUR': 0.25, 'USD': 0.27, 'TRY': 9.4, 'GBP': 0.21 },
};

// Convert currency with API fallback
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ amount: number; rate: number }> {
  if (fromCurrency === toCurrency) {
    return { amount, rate: 1 };
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`,
      { signal: AbortSignal.timeout(3000) } // 3 second timeout
    );
    if (response.ok) {
      const data = await response.json();
      const rate = data.rates[toCurrency];
      if (rate) {
        return { amount: Math.round(amount * rate), rate };
      }
    }
  } catch (e) {
    console.error("Currency conversion API error:", e);
  }

  // Fallback rates
  const rate = FALLBACK_RATES[fromCurrency]?.[toCurrency] || 1;
  console.log(`Using fallback rate: ${fromCurrency} -> ${toCurrency} = ${rate}`);
  return { amount: Math.round(amount * rate), rate };
}

// Format price with currency
export function formatPrice(amount: number, currency: string): string {
  return `${getCurrencySymbol(currency)}${amount}`;
}
