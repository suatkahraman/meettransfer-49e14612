// Centralized currency utilities

export interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
  flag: string;
}

// All supported currencies with their symbols and flags - SINGLE SOURCE OF TRUTH
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { value: 'TRY', label: '₺ TRY - Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { value: 'EUR', label: '€ EUR - Euro', symbol: '€', flag: '🇪🇺' },
  { value: 'GBP', label: '£ GBP - British Pound', symbol: '£', flag: '🇬🇧' },
  { value: 'USD', label: '$ USD - US Dollar', symbol: '$', flag: '🇺🇸' },
  { value: 'RUB', label: '₽ RUB - Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { value: 'UAH', label: '₴ UAH - Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦' },
  { value: 'AED', label: 'د.إ AED - UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { value: 'JPY', label: '¥ JPY - Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { value: 'AUD', label: 'A$ AUD - Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
];

// Currency codes as a type for validation
export const CURRENCY_CODES = CURRENCY_OPTIONS.map(c => c.value) as [string, ...string[]];

// Currency symbols map for quick lookup
export const CURRENCY_SYMBOLS: Record<string, string> = Object.fromEntries(
  CURRENCY_OPTIONS.map(c => [c.value, c.symbol])
);

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

/**
 * Currency balance calculation result
 */
export interface CurrencyBalance {
  currency: string;
  totalCompanyAmount: number;
  totalPassengerCash: number;
  totalPaid: number;
  netBalance: number;
}

/**
 * Completed reservation data for balance calculation
 */
export interface CompletedReservationData {
  passenger_cash_amount: number | null;
  passenger_cash_currency: string | null;
  agency_reservation_details: {
    company_amount: number | null;
    agency_price_currency: string | null;
  } | null;
}

/**
 * Payment data for balance calculation
 */
export interface PaymentData {
  amount: number;
  currency: string | null;
}

/**
 * Calculate currency-based balances from completed reservations and payments.
 * Uses the actual currency from each completed reservation - NO EUR FALLBACK.
 * 
 * @param completedReservations - Array of completed reservations with agency details
 * @param payments - Array of payments with currency
 * @returns Array of CurrencyBalance sorted by netBalance descending
 */
export function calculateCurrencyBalances(
  completedReservations: CompletedReservationData[],
  payments: PaymentData[]
): CurrencyBalance[] {
  const currencyData: Record<string, { companyAmount: number; passengerCash: number; paid: number }> = {};

  // Process completed reservations - use agency_price_currency (TRY fallback for very old data)
  completedReservations.forEach((r) => {
    const detail = r.agency_reservation_details;
    if (!detail) return;
    
    // Use the reservation's actual currency, fallback to TRY only for legacy data
    const currency = detail.agency_price_currency || 'TRY';
    
    if (!currencyData[currency]) {
      currencyData[currency] = { companyAmount: 0, passengerCash: 0, paid: 0 };
    }
    
    currencyData[currency].companyAmount += detail.company_amount || 0;
    
    // Passenger cash - only subtract if same currency
    const passengerCashCurrency = r.passenger_cash_currency || 'TRY';
    if (passengerCashCurrency === currency) {
      currencyData[currency].passengerCash += r.passenger_cash_amount || 0;
    }
  });

  // Process payments - use the payment's actual currency
  payments.forEach((p) => {
    // Use TRY fallback for legacy payments without currency
    const currency = p.currency || 'TRY';
    
    if (!currencyData[currency]) {
      currencyData[currency] = { companyAmount: 0, passengerCash: 0, paid: 0 };
    }
    currencyData[currency].paid += p.amount || 0;
  });

  // Build and return CurrencyBalance array
  return Object.entries(currencyData)
    .filter(([_, data]) => data.companyAmount > 0 || data.paid > 0)
    .map(([currency, data]) => ({
      currency,
      totalCompanyAmount: data.companyAmount,
      totalPassengerCash: data.passengerCash,
      totalPaid: data.paid,
      netBalance: data.companyAmount - data.passengerCash - data.paid
    }))
    .sort((a, b) => b.netBalance - a.netBalance);
}
