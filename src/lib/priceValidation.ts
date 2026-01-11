// Minimum price thresholds by vehicle type (in EUR)
// These are default fallbacks - actual values come from database via usePriceThresholds hook

export const DEFAULT_MIN_PRICE_THRESHOLDS: Record<string, number> = {
  'mercedes-vito': 50,
  'vip-mercedes': 60,
  'maybach-minibus': 70,
  'minibus': 100,
};

// Currency conversion rates to EUR for threshold comparison
// These are approximate rates for validation purposes only
const CURRENCY_TO_EUR: Record<string, number> = {
  'EUR': 1,
  'USD': 0.92,
  'GBP': 1.17,
  'TRY': 0.027,
  'AED': 0.25,
  'AUD': 0.61,
};

export interface PriceValidationResult {
  isLow: boolean;
  minThreshold: number;
  priceInEur: number;
  warningMessage: string;
}

/**
 * Check if a price is suspiciously low for a given vehicle type
 * @param price - The price to check
 * @param currency - The currency of the price
 * @param vehicleType - The vehicle type
 * @param thresholds - Optional custom thresholds map (from database)
 * @returns Validation result with warning info
 */
export function validatePrice(
  price: number,
  currency: string,
  vehicleType: string,
  thresholds?: Record<string, number>
): PriceValidationResult {
  const thresholdsMap = thresholds || DEFAULT_MIN_PRICE_THRESHOLDS;
  const minThreshold = thresholdsMap[vehicleType] || 50;
  const conversionRate = CURRENCY_TO_EUR[currency] || 1;
  const priceInEur = price * conversionRate;
  
  const isLow = priceInEur < minThreshold;
  
  return {
    isLow,
    minThreshold,
    priceInEur: Math.round(priceInEur * 100) / 100,
    warningMessage: isLow 
      ? `Fiyat çok düşük görünüyor! Minimum €${minThreshold} önerilir. (Şu anki: €${Math.round(priceInEur)})`
      : '',
  };
}

/**
 * Check multiple vehicle prices and return warnings for each
 */
export function validateAllVehiclePrices(
  prices: Record<string, string>,
  currency: string,
  thresholds?: Record<string, number>
): Record<string, PriceValidationResult> {
  const results: Record<string, PriceValidationResult> = {};
  
  Object.entries(prices).forEach(([vehicleType, priceStr]) => {
    const price = parseFloat(priceStr);
    if (price && price > 0) {
      results[vehicleType] = validatePrice(price, currency, vehicleType, thresholds);
    }
  });
  
  return results;
}

/**
 * Check if any of the prices are below threshold
 */
export function hasAnyLowPrice(
  prices: Record<string, string>,
  currency: string,
  thresholds?: Record<string, number>
): boolean {
  const results = validateAllVehiclePrices(prices, currency, thresholds);
  return Object.values(results).some(r => r.isLow);
}

/**
 * Get a summary of low price warnings
 */
export function getLowPriceWarnings(
  prices: Record<string, string>,
  currency: string,
  vehicleLabels: Record<string, string>,
  thresholds?: Record<string, number>
): string[] {
  const results = validateAllVehiclePrices(prices, currency, thresholds);
  const warnings: string[] = [];
  
  Object.entries(results).forEach(([vehicleType, result]) => {
    if (result.isLow) {
      const label = vehicleLabels[vehicleType] || vehicleType;
      warnings.push(`${label}: €${Math.round(result.priceInEur)} (min: €${result.minThreshold})`);
    }
  });
  
  return warnings;
}
