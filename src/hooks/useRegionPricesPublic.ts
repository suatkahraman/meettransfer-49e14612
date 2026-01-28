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
  // Normalize pickupDate to just the date part for stable cache keys
  const dateKey = pickupDate ? pickupDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ["region-prices-public", city, alternativeCityNames.join(','), dateKey],
    queryFn: async () => {
      // Build query for city and alternative names
      const cityNames = [city, ...alternativeCityNames];
      
      // Use a simpler approach: fetch with single ilike first, then filter
      // This works better with PostgREST's OR syntax requirements
      let query = supabase
        .from("region_prices")
        .select("city, airport, district, vehicle_type, price, price_currency, valid_from, valid_to")
        .eq("is_active", true);
      
      // If only one city, use simple ilike
      if (cityNames.length === 1) {
        query = query.ilike("city", `%${cityNames[0]}%`);
      } else {
        // For multiple city names, we need to use OR properly
        // PostgREST OR syntax: field.operator.value,field.operator.value
        const orFilter = cityNames.map(name => `city.ilike.%${name}%`).join(',');
        query = query.or(orFilter);
      }
      
      const { data, error } = await query
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
  
  // Map airport values to readable names - supports both codes and full names from DB
  const getAirportDisplayName = (airport: string | null): string => {
    if (!airport) return "Airport";
    
    // Direct code mappings
    const codeMap: Record<string, string> = {
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
      DIY: "Diyarbakır Airport",
      MQM: "Mardin Airport",
      NAV: "Kapadokya Airport",
      ASR: "Kayseri Airport",
      DXB: "Dubai Airport",
    };
    
    // Check if it's a direct code match
    if (codeMap[airport]) {
      return codeMap[airport];
    }
    
    // Extract code from full name like "Istanbul Airport (IST)" or "Bodrum-Milas Airport (BJV)"
    const codeMatch = airport.match(/\(([A-Z]{3})\)/);
    if (codeMatch && codeMap[codeMatch[1]]) {
      return codeMap[codeMatch[1]];
    }
    
    // Pattern matching for common formats
    if (airport.includes("Istanbul") && airport.includes("IST")) return "IST Airport";
    if (airport.includes("Sabiha") || airport.includes("SAW")) return "SAW Airport";
    if (airport.includes("Antalya") || airport.includes("AYT")) return "Antalya Airport";
    if (airport.includes("Bodrum") || airport.includes("BJV")) return "Bodrum Airport";
    if (airport.includes("Dalaman") || airport.includes("DLM")) return "Dalaman Airport";
    if (airport.includes("Izmir") || airport.includes("ADB")) return "İzmir Airport";
    if (airport.includes("Ercan") || airport.includes("ECN")) return "Ercan Airport";
    if (airport.includes("Adana")) return "Adana Airport";
    if (airport.includes("Mardin")) return "Mardin Airport";
    if (airport.includes("Kapadokya") || airport.includes("Nevsehir")) return "Kapadokya Airport";
    if (airport.includes("Kayseri")) return "Kayseri Airport";
    if (airport.includes("Diyarbakir")) return "Diyarbakır Airport";
    if (airport.includes("Zurich")) return "Zurich Airport";
    if (airport.includes("Geneva")) return "Geneva Airport";
    if (airport.includes("Basel")) return "Basel Airport";
    if (airport.includes("Milan") || airport.includes("Malpensa")) return "Milan Malpensa";
    if (airport.includes("Dubai")) return "Dubai Airport";
    
    // If nothing matches, return as-is (cleaned up)
    return airport.replace(/\s*\([A-Z]{3}\)\s*$/, '').trim() || "Airport";
  };

  return filteredPrices.map(price => ({
    from: getAirportDisplayName(price.airport),
    to: price.district,
    price: `From ${formatPriceDisplay(price.price, price.price_currency)}`,
  }));
}
