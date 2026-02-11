import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VEHICLE_TYPES } from "@/lib/vehicleTypes";
import { useHeroFormStorage, parseSavedDate, SavedFormData } from "./useHeroFormStorage";
import { useLanguage } from "@/contexts/LanguageContext";

export interface UseHourlyFormReturn {
  // State
  hourlyCity: string;
  hourlyDate: Date | undefined;
  hourlyTime: string;
  hourlyDuration: string;
  hourlyPassengers: string;
  hourlyVehicleType: string;
  customHours: string;
  availableCities: string[];
  availableDurations: string[];
  allHourlyPrices: Array<{ vehicleType: string; price: number; currency: string }>;
  loadingPrice: boolean;
  loadingCities: boolean;
  submitting: boolean;
  
  // Handlers
  handleSetHourlyCity: (c: string) => void;
  handleSetHourlyDuration: (d: string) => void;
  handleSetCustomHours: (h: string) => void;
  handleSetHourlyDate: (d: Date | undefined) => void;
  handleSetHourlyTime: (t: string) => void;
  handleSetHourlyPassengers: (p: string) => void;
  handleSetHourlyVehicleType: (v: string) => void;
  handleHourlyContinue: () => void;
  
  // For data fetching
  fetchCitiesIfNeeded: () => void;
  
  // For storage sync
  getFormData: () => Partial<SavedFormData>;
}

export function useHourlyForm(
  t: (key: string) => string | undefined,
  appliedPromoCode: string
): UseHourlyFormReturn {
  const navigate = useNavigate();
  const { getLocalizedPath } = useLanguage();
  const { loadSavedFormData } = useHeroFormStorage();
  
  // Initialize state from localStorage
  const [hourlyCity, setHourlyCity] = useState(() => loadSavedFormData()?.hourlyCity || "");
  const [hourlyDate, setHourlyDate] = useState<Date | undefined>(() =>
    parseSavedDate(loadSavedFormData()?.hourlyDate)
  );
  const [hourlyTime, setHourlyTime] = useState(() => loadSavedFormData()?.hourlyTime || "");
  // Default to "4" hours - ensure a valid default is always set
  const [hourlyDuration, setHourlyDuration] = useState<string>(() => {
    const saved = loadSavedFormData()?.hourlyDuration;
    return saved && saved.length > 0 ? saved : "4";
  });
  const [hourlyPassengers, setHourlyPassengers] = useState(() => loadSavedFormData()?.hourlyPassengers || "2");
  const [hourlyVehicleType, setHourlyVehicleType] = useState(() => loadSavedFormData()?.hourlyVehicleType || "mercedes-vito");
  const [customHours, setCustomHours] = useState(() => loadSavedFormData()?.customHours || "9");
  
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [cityDurations, setCityDurations] = useState<Record<string, string[]>>({});
  const [loadingCities, setLoadingCities] = useState(false);
  const [allHourlyPrices, setAllHourlyPrices] = useState<Array<{ vehicleType: string; price: number; currency: string }>>([]);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Memoize available durations
  const availableDurations = useMemo(() =>
    hourlyCity ? (cityDurations[hourlyCity] || []) : [],
    [hourlyCity, cityDurations]
  );

  // Fetch cities data
  const fetchCitiesIfNeeded = useCallback(async () => {
    if (availableCities.length > 0) return; // Already loaded
    
    setLoadingCities(true);
    try {
      const { data } = await supabase
        .from("hourly_rental_prices")
        .select("city, duration_type")
        .eq("is_active", true)
        .order("city");
        
      if (data) {
        setAvailableCities([...new Set(data.map(item => item.city))]);
        const durationsMap: Record<string, string[]> = {};
        data.forEach(item => {
          if (!durationsMap[item.city]) durationsMap[item.city] = [];
          const d = item.duration_type.replace("_hours", "").replace("h", "");
          // Map to 4-9 hour options
          const durationNum = parseInt(d);
          if (durationNum >= 4 && durationNum <= 9 && !durationsMap[item.city].includes(d)) {
            durationsMap[item.city].push(d);
          }
        });
        Object.keys(durationsMap).forEach(city =>
          durationsMap[city].sort((a, b) => parseInt(a) - parseInt(b))
        );
        setCityDurations(durationsMap);
      }
    } catch {
      // Ignore errors
    } finally {
      setLoadingCities(false);
    }
  }, [availableCities.length]);

  // Reset duration only when city changes to a city with different available durations
  // Keep the user-selected duration intact unless it's truly incompatible
  useEffect(() => {
    // Only reset prices when city changes, don't reset duration unless necessary
    if (!hourlyCity) {
      // If no city, reset to default duration
      if (!hourlyDuration) {
        setHourlyDuration("4");
      }
    }
    // Only clear prices when city changes - pricing will be recalculated
    setAllHourlyPrices([]);
  }, [hourlyCity]);

  // Auto-adjust vehicle type based on passenger count
  useEffect(() => {
    const currentVehicle = VEHICLE_TYPES.find(v => v.value === hourlyVehicleType);
    if (currentVehicle && currentVehicle.passengers < parseInt(hourlyPassengers)) {
      const suitable = VEHICLE_TYPES.find(v => v.passengers >= parseInt(hourlyPassengers) && v.value !== 'minibus');
      if (suitable) setHourlyVehicleType(suitable.value);
    }
  }, [hourlyPassengers, hourlyVehicleType]);

  // Fetch hourly prices
  useEffect(() => {
    if (!hourlyCity || !hourlyDuration) {
      setAllHourlyPrices([]);
      return;
    }
    
    setLoadingPrice(true);
    const fetchPrices = async () => {
      try {
        const vehicleTypeMapping: Record<string, string> = {
          'vito': 'mercedes-vito',
          'vito_vip': 'vip-mercedes',
          'maybach': 'maybach-minibus',
          'sprinter': 'sprinter-minibus',
          'mercedes-vito': 'mercedes-vito',
          'vip-mercedes': 'vip-mercedes',
          'maybach-minibus': 'maybach-minibus',
          'sprinter-minibus': 'sprinter-minibus'
        };
        
        // Format pickup date for seasonal price matching
        const pickupDateStr = hourlyDate ? format(hourlyDate, 'yyyy-MM-dd') : null;
        
        if (hourlyDuration === "custom") {
          const { data } = await supabase
            .from("hourly_rental_prices")
            .select("vehicle_type, hourly_rate, price_currency, valid_from, valid_to")
            .eq("city", hourlyCity)
            .eq("duration_type", "custom")
            .eq("is_active", true);
            
          // Group by vehicle type and select seasonal or base price
          const pricesByVehicle = new Map<string, typeof data[0]>();
          data?.forEach(item => {
            const existing = pricesByVehicle.get(item.vehicle_type);
            
            // Check if this is a seasonal price matching the pickup date
            if (pickupDateStr && item.valid_from && item.valid_to) {
              if (pickupDateStr >= item.valid_from && pickupDateStr <= item.valid_to) {
                console.log(`🗓️ Using seasonal hourly rate for ${item.vehicle_type}`);
                pricesByVehicle.set(item.vehicle_type, item);
                return;
              }
            }
            
            // Use base price (valid_from is NULL) if no seasonal match yet
            if (!existing && !item.valid_from) {
              pricesByVehicle.set(item.vehicle_type, item);
            }
          });
          
          const prices = Array.from(pricesByVehicle.values())
            .filter(i => i.hourly_rate)
            .map(i => ({
              vehicleType: vehicleTypeMapping[i.vehicle_type] || i.vehicle_type,
              price: i.hourly_rate! * (parseInt(customHours) || 9),
              currency: i.price_currency
            }));
          setAllHourlyPrices(prices);
        } else {
          const { data: shortData } = await supabase
            .from("hourly_rental_prices")
            .select("vehicle_type, price, price_currency, valid_from, valid_to")
            .eq("city", hourlyCity)
            .eq("duration_type", `${hourlyDuration}h`)
            .eq("is_active", true);
            
          const { data: longData } = await supabase
            .from("hourly_rental_prices")
            .select("vehicle_type, price, price_currency, valid_from, valid_to")
            .eq("city", hourlyCity)
            .eq("duration_type", `${hourlyDuration}_hours`)
            .eq("is_active", true);
            
          const combined = [...(shortData || []), ...(longData || [])];
          
          // Group by vehicle type and select seasonal or base price
          const pricesByVehicle = new Map<string, { price: number; currency: string }>();
          combined.forEach(item => {
            const existing = pricesByVehicle.get(item.vehicle_type);
            
            // Check if this is a seasonal price matching the pickup date
            if (pickupDateStr && item.valid_from && item.valid_to) {
              if (pickupDateStr >= item.valid_from && pickupDateStr <= item.valid_to) {
                console.log(`🗓️ Using seasonal price for ${item.vehicle_type}: ${item.price}`);
                pricesByVehicle.set(item.vehicle_type, { price: item.price, currency: item.price_currency });
                return;
              }
            }
            
            // Use base price (valid_from is NULL) if no seasonal match yet
            if (!existing && !item.valid_from) {
              pricesByVehicle.set(item.vehicle_type, { price: item.price, currency: item.price_currency });
            }
          });
          
          const prices: Array<{ vehicleType: string; price: number; currency: string }> = [];
          pricesByVehicle.forEach((v, k) => prices.push({
            vehicleType: vehicleTypeMapping[k] || k,
            price: v.price,
            currency: v.currency
          }));
          setAllHourlyPrices(prices);
        }
      } catch {
        setAllHourlyPrices([]);
      } finally {
        setLoadingPrice(false);
      }
    };
    
    fetchPrices();
  }, [hourlyCity, hourlyDuration, customHours, hourlyDate]);

  // Handlers
  const handleSetHourlyCity = useCallback((c: string) => setHourlyCity(c), []);
  const handleSetHourlyDuration = useCallback((d: string) => setHourlyDuration(d), []);
  const handleSetCustomHours = useCallback((h: string) => setCustomHours(h), []);
  const handleSetHourlyDate = useCallback((d: Date | undefined) => setHourlyDate(d), []);
  const handleSetHourlyTime = useCallback((t: string) => setHourlyTime(t), []);
  const handleSetHourlyPassengers = useCallback((p: string) => setHourlyPassengers(p), []);
  const handleSetHourlyVehicleType = useCallback((v: string) => setHourlyVehicleType(v), []);

  const handleHourlyContinue = useCallback(() => {
    const missing: string[] = [];
    if (!hourlyCity) missing.push(t("pickupPoint") || "Pickup Location");
    if (!hourlyDate) missing.push(t("pickupDate") || "Date");
    if (!hourlyTime) missing.push(t("pickupTime") || "Time");
    
    if (missing.length > 0) {
      toast.error(`${t("pleaseFilAllFields") || "Please fill in"}: ${missing.join(", ")}`);
      return;
    }
    
    setSubmitting(true);
    const params = new URLSearchParams();
    // Send full pickup address - BookingPage will extract city for pricing
    params.set("pickup", hourlyCity);
    params.set("date", format(hourlyDate!, "yyyy-MM-dd"));
    params.set("time", hourlyTime);
    
    // Handle duration - convert day values to hours (1d = 24h, 2d = 48h, etc.)
    let durationValue = hourlyDuration;
    if (hourlyDuration.endsWith('d')) {
      const days = parseInt(hourlyDuration.replace('d', ''));
      durationValue = `${days * 24}h`;
    } else if (!hourlyDuration.endsWith('h')) {
      durationValue = `${hourlyDuration}h`;
    }
    
    params.set("duration", durationValue);
    params.set("passengers", hourlyPassengers);
    // Araç book sayfasında seçilecek - Hero'dan gönderilmez
    params.set("type", "hourly");
    if (appliedPromoCode) params.set("promoCode", appliedPromoCode);
    navigate(getLocalizedPath(`/book?${params.toString()}`));
  }, [hourlyCity, hourlyDate, hourlyTime, hourlyDuration, customHours, hourlyPassengers, hourlyVehicleType, appliedPromoCode, navigate, t, getLocalizedPath]);

  const getFormData = useCallback((): Partial<SavedFormData> => ({
    hourlyCity,
    hourlyDate: hourlyDate?.toISOString(),
    hourlyTime,
    hourlyDuration,
    hourlyPassengers,
    hourlyVehicleType,
    customHours
  }), [hourlyCity, hourlyDate, hourlyTime, hourlyDuration, hourlyPassengers, hourlyVehicleType, customHours]);

  return {
    hourlyCity,
    hourlyDate,
    hourlyTime,
    hourlyDuration,
    hourlyPassengers,
    hourlyVehicleType,
    customHours,
    availableCities,
    availableDurations,
    allHourlyPrices,
    loadingPrice,
    loadingCities,
    submitting,
    handleSetHourlyCity,
    handleSetHourlyDuration,
    handleSetCustomHours,
    handleSetHourlyDate,
    handleSetHourlyTime,
    handleSetHourlyPassengers,
    handleSetHourlyVehicleType,
    handleHourlyContinue,
    fetchCitiesIfNeeded,
    getFormData
  };
}
