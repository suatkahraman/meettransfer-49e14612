// Centralized currency utilities

export interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
  flag: string;
}

// All supported currencies with their symbols and flags
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { value: 'EUR', label: '€ EUR', symbol: '€', flag: '🇪🇺' },
  { value: 'USD', label: '$ USD', symbol: '$', flag: '🇺🇸' },
  { value: 'GBP', label: '£ GBP', symbol: '£', flag: '🇬🇧' },
  { value: 'TRY', label: '₺ TRY', symbol: '₺', flag: '🇹🇷' },
  { value: 'AED', label: 'د.إ AED', symbol: 'د.إ', flag: '🇦🇪' },
  { value: 'AUD', label: 'A$ AUD', symbol: 'A$', flag: '🇦🇺' },
];

// Currency symbols map for quick lookup
export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  TRY: '₺',
  AED: 'د.إ',
  AUD: 'A$',
};

/**
 * Get the symbol for a currency code
 * @param currency - Currency code (e.g., 'EUR', 'USD')
 * @param fallback - Fallback symbol if currency not found (defaults to '₺')
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: string | null | undefined, fallback: string = '₺'): string {
  if (!currency) return fallback;
  return CURRENCY_SYMBOLS[currency] || currency || fallback;
}

/**
 * Format a price with its currency symbol
 * @param price - The price amount
 * @param currency - Currency code
 * @param options - Formatting options
 * @returns Formatted price string
 */
export function formatCurrency(
  price: number | null | undefined,
  currency: string | null | undefined,
  options: {
    showDecimal?: boolean;
    fallbackText?: string;
    locale?: string;
  } = {}
): string {
  const { showDecimal = false, fallbackText = '-', locale = 'tr-TR' } = options;
  
  if (price === null || price === undefined) return fallbackText;
  
  const symbol = getCurrencySymbol(currency);
  const formattedAmount = showDecimal 
    ? price.toFixed(2) 
    : price.toLocaleString(locale);
  
  return `${symbol}${formattedAmount}`;
}

/**
 * Get currency option by value
 * @param currency - Currency code
 * @returns CurrencyOption or undefined
 */
export function getCurrencyOption(currency: string | null | undefined): CurrencyOption | undefined {
  if (!currency) return undefined;
  return CURRENCY_OPTIONS.find(c => c.value === currency);
}
