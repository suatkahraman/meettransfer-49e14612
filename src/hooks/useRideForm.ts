import { useState, useEffect, useCallback } from "react";
import { format, parse, parseISO, isValid } from "date-fns";
import { tr, enUS, de, fr, ru, es, it } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VEHICLE_TYPES } from "@/lib/vehicleTypes";
import { DUBAI_VEHICLE_TYPES, isDubaiLocation } from "@/lib/dubaiVehicleTypes";
import { PlaceDetails } from "@/components/ui/lazy-google-places-autocomplete";
import { useHeroFormStorage, parseSavedDate, SavedFormData } from "./useHeroFormStorage";
import type { BookingData } from "@/components/hero/types";
import { usePromo } from "@/contexts/PromoContext";

// Helper to parse various date formats from AI
function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const trimmed = dateStr.trim();
  
  // Try ISO format first (yyyy-MM-dd or full ISO string)
  try {
    const isoDate = parseISO(trimmed);
    if (isValid(isoDate)) return isoDate;
  } catch {}
  
  // Try yyyy-MM-dd format
  try {
    const d = parse(trimmed, "yyyy-MM-dd", new Date());
    if (isValid(d)) return d;
  } catch {}
  
  // Try dd/MM/yyyy format
  try {
    const d = parse(trimmed, "dd/MM/yyyy", new Date());
    if (isValid(d)) return d;
  } catch {}
  
  // Try dd.MM.yyyy format
  try {
    const d = parse(trimmed, "dd.MM.yyyy", new Date());
    if (isValid(d)) return d;
  } catch {}
  
  // Try dd-MM-yyyy format
  try {
    const d = parse(trimmed, "dd-MM-yyyy", new Date());
    if (isValid(d)) return d;
  } catch {}
  
  // Try locale-specific formats
  const locales = [tr, enUS, de, fr, ru, es, it];
  const formats = [
    "d MMMM yyyy",
    "dd MMMM yyyy", 
    "MMMM d, yyyy",
    "MMMM dd, yyyy",
    "d MMM yyyy",
    "dd MMM yyyy",
  ];
  
  for (const locale of locales) {
    for (const fmt of formats) {
      try {
        const d = parse(trimmed, fmt, new Date(), { locale });
        if (isValid(d)) return d;
      } catch {}
    }
  }
  
  return null;
}

// Helper to parse various time formats
function parseFlexibleTime(timeStr: string): string | null {
  if (!timeStr) return null;
  
  const trimmed = timeStr.trim();
  
  // Already in HH:mm format
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [h, m] = trimmed.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  
  // HH:mm:ss format
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) {
    const [h, m] = trimmed.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  
  // 12-hour format with AM/PM
  const amPmMatch = trimmed.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)$/i);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = amPmMatch[2] || '00';
    const isPM = amPmMatch[3].toLowerCase() === 'pm';
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  return null;
}

export interface UseRideFormReturn {
  // State
  pickup: string;
  dropoff: string;
  date: Date | undefined;
  time: string;
  passengers: string;
  vehicleType: string;
  submitting: boolean;
  allVehiclePrices: any[];
  transferPriceCurrency: string;
  loadingTransferPrice: boolean;
  appliedPromoCode: string;
  // Return trip
  returnDate: Date | undefined;
  returnTime: string;
  hasReturnTrip: boolean;
  // Extras
  babySeatCount: number;
  luggageCount: number;
  
  // Handlers
  handlePickupSelected: (value: string, details?: PlaceDetails) => void;
  handleDropoffSelected: (value: string, details?: PlaceDetails) => void;
  handleSwapLocations: () => void;
  handleSetDate: (d: Date | undefined) => void;
  handleSetTime: (t: string) => void;
  handleSetPassengers: (p: string) => void;
  handleSetVehicleType: (v: string) => void;
  handleSetReturnDate: (d: Date | undefined) => void;
  handleSetReturnTime: (t: string) => void;
  handleSetHasReturnTrip: (v: boolean) => void;
  handleSetBabySeatCount: (n: number) => void;
  handleSetLuggageCount: (n: number) => void;
  handleRideContinue: () => void;
  handleApplyBooking: (data: BookingData) => void;
  handleApplyPromoCode: (code: string) => void;
  
  // For storage sync
  getFormData: () => Partial<SavedFormData>;
}

export function useRideForm(t: (key: string) => string | undefined): UseRideFormReturn {
  const navigate = useNavigate();
  const { loadSavedFormData } = useHeroFormStorage();
  const { promoCode: activePromo } = usePromo();
  
  // Initialize state from localStorage
  const [pickup, setPickup] = useState(() => loadSavedFormData()?.pickup || "");
  const [dropoff, setDropoff] = useState(() => loadSavedFormData()?.dropoff || "");
  const [date, setDate] = useState<Date | undefined>(() => 
    parseSavedDate(loadSavedFormData()?.date)
  );
  const [time, setTime] = useState(() => loadSavedFormData()?.time || "");
  const [passengers, setPassengers] = useState(() => loadSavedFormData()?.passengers || "2");
  const [vehicleType, setVehicleType] = useState(() => loadSavedFormData()?.vehicleType || "mercedes-vito");
  const [submitting, setSubmitting] = useState(false);
  const [allVehiclePrices, setAllVehiclePrices] = useState<any[]>([]);
  const [transferPriceCurrency, setTransferPriceCurrency] = useState("EUR");
  const [loadingTransferPrice, setLoadingTransferPrice] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>("");
  
  // Return trip state
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTime, setReturnTime] = useState("");
  const [hasReturnTrip, setHasReturnTrip] = useState(false);
  
  // Extras state
  const [babySeatCount, setBabySeatCount] = useState(0);
  const [luggageCount, setLuggageCount] = useState(0);

  // Auto-apply promo code when return trip is enabled
  useEffect(() => {
    if (hasReturnTrip && activePromo?.code && !appliedPromoCode) {
      setAppliedPromoCode(activePromo.code);
      console.log("[useRideForm] Auto-applied promo code for return trip:", activePromo.code);
    } else if (!hasReturnTrip && appliedPromoCode) {
      // Clear promo code when return trip is disabled
      setAppliedPromoCode("");
      console.log("[useRideForm] Cleared promo code - return trip disabled");
    }
  }, [hasReturnTrip, activePromo?.code]);
  // Fetch transfer prices when locations change
  useEffect(() => {
    if (!pickup || !dropoff) {
      setAllVehiclePrices([]);
      return;
    }
    
    setLoadingTransferPrice(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase.functions.invoke("get-all-vehicle-prices", {
          body: { pickup, dropoff, customerCurrency: "EUR" }
        });
        if (data?.vehicles?.length > 0) {
          setAllVehiclePrices(data.vehicles);
          setTransferPriceCurrency(data.currency || "EUR");
        } else {
          setAllVehiclePrices([]);
        }
      } catch {
        setAllVehiclePrices([]);
      } finally {
        setLoadingTransferPrice(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [pickup, dropoff]);

  // Auto-adjust vehicle type based on passenger count AND location
  useEffect(() => {
    const isDubai = isDubaiLocation(pickup) || isDubaiLocation(dropoff);
    const vehicleList = isDubai ? DUBAI_VEHICLE_TYPES : VEHICLE_TYPES;
    
    // Check if current vehicle is valid for this location
    const isValidVehicle = vehicleList.some(v => v.value === vehicleType);
    
    // If vehicle is not valid for this location, switch to first available
    if (!isValidVehicle) {
      const suitable = vehicleList.find(v => v.passengers >= parseInt(passengers));
      if (suitable) setVehicleType(suitable.value);
      else setVehicleType(vehicleList[0].value);
      return;
    }
    
    // Check passenger capacity
    const currentVehicle = vehicleList.find(v => v.value === vehicleType);
    if (currentVehicle && currentVehicle.passengers < parseInt(passengers)) {
      const suitable = vehicleList.find(v => v.passengers >= parseInt(passengers));
      if (suitable) setVehicleType(suitable.value);
    }
  }, [passengers, vehicleType, pickup, dropoff]);

  // Handlers
  const handlePickupSelected = useCallback((value: string, details?: PlaceDetails) => {
    setPickup(details?.displayText || value);
  }, []);

  const handleDropoffSelected = useCallback((value: string, details?: PlaceDetails) => {
    setDropoff(details?.displayText || value);
  }, []);

  const handleSwapLocations = useCallback(() => {
    setPickup(prev => {
      setDropoff(() => prev);
      return dropoff;
    });
  }, [dropoff]);

  const handleSetDate = useCallback((d: Date | undefined) => setDate(d), []);
  const handleSetTime = useCallback((t: string) => setTime(t), []);
  const handleSetPassengers = useCallback((p: string) => setPassengers(p), []);
  const handleSetVehicleType = useCallback((v: string) => setVehicleType(v), []);
  
  // Return trip handlers
  const handleSetReturnDate = useCallback((d: Date | undefined) => setReturnDate(d), []);
  const handleSetReturnTime = useCallback((t: string) => setReturnTime(t), []);
  const handleSetHasReturnTrip = useCallback((v: boolean) => setHasReturnTrip(v), []);
  
  // Extras handlers
  const handleSetBabySeatCount = useCallback((n: number) => setBabySeatCount(n), []);
  const handleSetLuggageCount = useCallback((n: number) => setLuggageCount(n), []);

  const handleRideContinue = useCallback(() => {
    const missing: string[] = [];
    if (!pickup) missing.push(t("pickupPoint") || "Pickup");
    if (!dropoff) missing.push(t("dropoffLocation") || "Drop-off");
    if (!date) missing.push(t("pickupDate") || "Date");
    if (!time) missing.push(t("pickupTime") || "Time");
    
    if (missing.length > 0) {
      toast.error(`${t("pleaseFilAllFields") || "Please fill in"}: ${missing.join(", ")}`);
      return;
    }
    
    setSubmitting(true);
    const params = new URLSearchParams();
    params.set("pickup", pickup);
    params.set("dropoff", dropoff);
    params.set("date", format(date!, "yyyy-MM-dd"));
    params.set("time", time);
    params.set("passengers", passengers);
    params.set("vehicleType", vehicleType);
    if (appliedPromoCode) params.set("promoCode", appliedPromoCode);
    
    // Return trip params
    if (hasReturnTrip && returnDate) {
      params.set("hasReturnTrip", "true");
      params.set("returnDate", format(returnDate, "yyyy-MM-dd"));
      if (returnTime) params.set("returnTime", returnTime);
    }
    
    // Extras params
    if (babySeatCount > 0) params.set("babySeatCount", babySeatCount.toString());
    if (luggageCount > 0) params.set("luggageCount", luggageCount.toString());
    
    navigate(`/book?${params.toString()}`);
  }, [pickup, dropoff, date, time, passengers, vehicleType, appliedPromoCode, navigate, t, hasReturnTrip, returnDate, returnTime, babySeatCount, luggageCount]);

  const handleApplyBooking = useCallback((data: BookingData) => {
    let hasChanges = false;
    
    if (data.pickup) {
      setPickup(data.pickup);
      hasChanges = true;
    }
    if (data.dropoff) {
      setDropoff(data.dropoff);
      hasChanges = true;
    }
    if (data.date) {
      const parsedDate = parseFlexibleDate(data.date);
      if (parsedDate) {
        setDate(parsedDate);
        hasChanges = true;
        console.log("[Form Sync] Date parsed:", data.date, "->", parsedDate);
      }
    }
    if (data.time) {
      const parsedTime = parseFlexibleTime(data.time);
      if (parsedTime) {
        setTime(parsedTime);
        hasChanges = true;
        console.log("[Form Sync] Time parsed:", data.time, "->", parsedTime);
      } else if (/^\d{1,2}:\d{2}/.test(data.time)) {
        // Fallback: if time looks valid, use it directly
        setTime(data.time);
        hasChanges = true;
      }
    }
    if (data.passengers) {
      setPassengers(data.passengers.toString());
      hasChanges = true;
    }
    if (data.vehicleType) {
      // Extended vehicle mapping for AI assistant sync
      const vehicleMap: Record<string, string> = {
        'sedan': 'sedan',
        'mercedes-vito': 'mercedes-vito',
        'vip-mercedes': 'vip-mercedes',
        'maybach-minibus': 'maybach-minibus',
        'minibus': 'minibus',
        // Alternative names from AI (multi-language)
        'vito': 'mercedes-vito',
        'mercedes': 'mercedes-vito',
        'vip': 'vip-mercedes',
        'minivan': 'vip-mercedes',
        'vip-minivan': 'vip-mercedes',
        'vip minivan': 'vip-mercedes',
        'v-class': 'vip-mercedes',
        'v class': 'vip-mercedes',
        'maybach': 'maybach-minibus',
        'maybach-sprinter': 'maybach-minibus',
        'lux': 'maybach-minibus',
        'luxury': 'maybach-minibus',
        'minibüs': 'minibus',
        'sprinter': 'minibus',
        'bus': 'minibus',
        'van': 'minibus',
      };
      const normalizedType = data.vehicleType.toLowerCase().trim();
      const mappedVehicle = vehicleMap[normalizedType] || vehicleMap[data.vehicleType] || 'mercedes-vito';
      setVehicleType(mappedVehicle);
      hasChanges = true;
      console.log("[Form Sync] Vehicle mapped:", data.vehicleType, "->", mappedVehicle);
    }
    
    // Return trip sync
    if (data.hasReturnTrip !== undefined && data.hasReturnTrip !== null) {
      setHasReturnTrip(data.hasReturnTrip);
      hasChanges = true;
      console.log("[Form Sync] Has return trip:", data.hasReturnTrip);
    }
    if (data.returnDate) {
      const parsedReturnDate = parseFlexibleDate(data.returnDate);
      if (parsedReturnDate) {
        setReturnDate(parsedReturnDate);
        setHasReturnTrip(true);
        hasChanges = true;
        console.log("[Form Sync] Return date parsed:", data.returnDate, "->", parsedReturnDate);
      }
    }
    if (data.returnTime) {
      const parsedReturnTime = parseFlexibleTime(data.returnTime);
      if (parsedReturnTime) {
        setReturnTime(parsedReturnTime);
        hasChanges = true;
        console.log("[Form Sync] Return time parsed:", data.returnTime, "->", parsedReturnTime);
      } else if (/^\d{1,2}:\d{2}/.test(data.returnTime)) {
        setReturnTime(data.returnTime);
        hasChanges = true;
      }
    }
    
    // Extras sync
    if (data.babySeatCount !== undefined && data.babySeatCount !== null && data.babySeatCount >= 0) {
      setBabySeatCount(data.babySeatCount);
      hasChanges = true;
      console.log("[Form Sync] Baby seat count:", data.babySeatCount);
    }
    if (data.luggageCount !== undefined && data.luggageCount !== null && data.luggageCount >= 0) {
      setLuggageCount(data.luggageCount);
      hasChanges = true;
      console.log("[Form Sync] Luggage count:", data.luggageCount);
    }
    
    // Only show toast and scroll if there are actual changes
    if (hasChanges) {
      toast.success(t("bookingDetailsApplied") || "Booking details applied!");
      document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [t]);

  const handleApplyPromoCode = useCallback((code: string) => {
    setAppliedPromoCode(code);
  }, []);

  const getFormData = useCallback((): Partial<SavedFormData> => ({
    pickup,
    dropoff,
    date: date?.toISOString(),
    time,
    passengers,
    vehicleType
  }), [pickup, dropoff, date, time, passengers, vehicleType]);

  return {
    pickup,
    dropoff,
    date,
    time,
    passengers,
    vehicleType,
    submitting,
    allVehiclePrices,
    transferPriceCurrency,
    loadingTransferPrice,
    appliedPromoCode,
    // Return trip
    returnDate,
    returnTime,
    hasReturnTrip,
    // Extras
    babySeatCount,
    luggageCount,
    // Handlers
    handlePickupSelected,
    handleDropoffSelected,
    handleSwapLocations,
    handleSetDate,
    handleSetTime,
    handleSetPassengers,
    handleSetVehicleType,
    handleSetReturnDate,
    handleSetReturnTime,
    handleSetHasReturnTrip,
    handleSetBabySeatCount,
    handleSetLuggageCount,
    handleRideContinue,
    handleApplyBooking,
    handleApplyPromoCode,
    getFormData
  };
}
