import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RegionPricePublic {
  city: string;
  airport: string | null;
  district: string;
  vehicle_type: string;
  price: number;
  price_currency: string;
  valid_from: string | null;
  valid_to: string | null;
}

interface UseRegionPricesPublicOptions {
  city: string;
  alternativeCityNames?: string[]; // For cities with multiple names (e.g., Cyprus = Kuzey Kıbrıs)
  pickupDate?: Date;
}

export function useRegionPricesPublic({ city, alternativeCityNames = [], pickupDate }: UseRegionPricesPublicOptions) {
  return useQuery({
    queryKey: ["region-prices-public", city, alternativeCityNames.join(','), pickupDate?.toISOString()],
    queryFn: async () => {
      // Build OR query for city and alternative names
      const cityNames = [city, ...alternativeCityNames];
      const cityFilter = cityNames.map(name => `city.ilike.%${name}%`).join(',');
      
      const { data, error } = await supabase
        .from("region_prices")
        .select("city, airport, district, vehicle_type, price, price_currency, valid_from, valid_to")
        .eq("is_active", true)
        .or(cityFilter)
        .order("district", { ascending: true })
        .order("vehicle_type", { ascending: true });

      if (error) throw error;

      // Filter prices based on date - prefer seasonal prices over base prices
      const dateToCheck = pickupDate || new Date();
      const dateStr = dateToCheck.toISOString().split('T')[0];

      // Group by route (airport + district + vehicle_type)
      const priceMap = new Map<string, RegionPricePublic>();

      data?.forEach((price) => {
        const key = `${price.airport || ''}-${price.district}-${price.vehicle_type}`;
        
        // Check if this is a seasonal price that applies to the date
        if (price.valid_from && price.valid_to) {
          if (dateStr >= price.valid_from && dateStr <= price.valid_to) {
            // Seasonal price applies - use it (overrides base price)
            priceMap.set(key, price);
          }
        } else {
          // Base price - only add if no seasonal price exists for this route
          if (!priceMap.has(key)) {
            priceMap.set(key, price);
          }
        }
      });

      return Array.from(priceMap.values());
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Helper to format price for display
export function formatPriceDisplay(price: number, currency: string, locale: string = "en"): string {
  const currencySymbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    TRY: "₺",
  };
  
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${price.toLocaleString(locale)}`;
}

// Helper to transform region prices to PriceTable format
export interface PriceTableItem {
  from: string;
  to: string;
  price?: string;
}

export function transformToPriceTableFormat(
  prices: RegionPricePublic[],
  vehicleType: string = "mercedes-vito"
): PriceTableItem[] {
  const filteredPrices = prices.filter(p => p.vehicle_type === vehicleType);
  
  // Map airport codes to readable names
  const airportNames: Record<string, string> = {
    IST: "IST Airport",
    SAW: "SAW Airport",
    ADA: "Adana Airport",
    AYT: "Antalya Airport",
    GZP: "Gazipaşa Airport",
    DLM: "Dalaman Airport",
    BJV: "Bodrum Airport",
    ADB: "İzmir Airport",
    ESB: "Ankara Airport",
    TZX: "Trabzon Airport",
    ECN: "Ercan Airport",
    ZRH: "Zurich Airport",
    GVA: "Geneva Airport",
    BSL: "Basel Airport",
    MXP: "Milan Malpensa",
  };

  return filteredPrices.map(price => ({
    from: airportNames[price.airport || ''] || price.airport || "Airport",
    to: price.district,
    price: `From ${formatPriceDisplay(price.price, price.price_currency)}`,
  }));
}
