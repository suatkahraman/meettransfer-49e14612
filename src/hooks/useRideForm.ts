import { useState, useEffect, useCallback, useMemo } from "react";
import { format, parse } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VEHICLE_TYPES } from "@/lib/vehicleTypes";
import { PlaceDetails } from "@/components/ui/lazy-google-places-autocomplete";
import { useHeroFormStorage, parseSavedDate, SavedFormData } from "./useHeroFormStorage";
import type { BookingData } from "@/components/hero/types";

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
  
  // Handlers
  handlePickupSelected: (value: string, details?: PlaceDetails) => void;
  handleDropoffSelected: (value: string, details?: PlaceDetails) => void;
  handleSwapLocations: () => void;
  handleSetDate: (d: Date | undefined) => void;
  handleSetTime: (t: string) => void;
  handleSetPassengers: (p: string) => void;
  handleSetVehicleType: (v: string) => void;
  handleRideContinue: () => void;
  handleApplyBooking: (data: BookingData) => void;
  handleApplyPromoCode: (code: string) => void;
  
  // For storage sync
  getFormData: () => Partial<SavedFormData>;
}

export function useRideForm(t: (key: string) => string | undefined): UseRideFormReturn {
  const navigate = useNavigate();
  const { loadSavedFormData } = useHeroFormStorage();
  
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

  // Auto-adjust vehicle type based on passenger count
  useEffect(() => {
    const currentVehicle = VEHICLE_TYPES.find(v => v.value === vehicleType);
    if (currentVehicle && currentVehicle.passengers < parseInt(passengers)) {
      const suitable = VEHICLE_TYPES.find(v => v.passengers >= parseInt(passengers));
      if (suitable) setVehicleType(suitable.value);
    }
  }, [passengers, vehicleType]);

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
    navigate(`/book?${params.toString()}`);
  }, [pickup, dropoff, date, time, passengers, vehicleType, appliedPromoCode, navigate, t]);

  const handleApplyBooking = useCallback((data: BookingData) => {
    if (data.pickup) setPickup(data.pickup);
    if (data.dropoff) setDropoff(data.dropoff);
    if (data.date) {
      try {
        const d = parse(data.date, "yyyy-MM-dd", new Date());
        if (!isNaN(d.getTime())) setDate(d);
      } catch {}
    }
    if (data.time) setTime(data.time);
    if (data.passengers) setPassengers(data.passengers.toString());
    if (data.vehicleType) {
      const vehicleMap: Record<string, string> = {
        'mercedes-vito': 'mercedes-vito',
        'vip-mercedes': 'vip-mercedes',
        'maybach-minibus': 'maybach-minibus',
        'minibus': 'minibus'
      };
      setVehicleType(vehicleMap[data.vehicleType] || 'mercedes-vito');
    }
    toast.success(t("bookingDetailsApplied") || "Booking details applied!");
    document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    handlePickupSelected,
    handleDropoffSelected,
    handleSwapLocations,
    handleSetDate,
    handleSetTime,
    handleSetPassengers,
    handleSetVehicleType,
    handleRideContinue,
    handleApplyBooking,
    handleApplyPromoCode,
    getFormData
  };
}
