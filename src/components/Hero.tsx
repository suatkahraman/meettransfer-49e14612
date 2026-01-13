import { useState, useEffect, useCallback, useRef } from "react";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, ArrowRight, Loader2, Car, Timer, Users, MapPin, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { PlaceDetails } from "@/components/ui/lazy-google-places-autocomplete";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VEHICLE_TYPES } from "@/lib/vehicleTypes";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { FloatingLabelDatePicker } from "@/components/ui/floating-label-datepicker";

// Import refactored components
import {
  HeroBackground,
  HeroHeader,
  HeroAIAssistant,
  ReturnTripPromoBanner,
  VehicleSelector,
  LocationInputs,
  HeroVisualSection,
  HeroTrustBadges,
  CityVideo,
  BookingData,
} from "@/components/hero";

import vitoVipImg from "@/assets/vito-vip-1.jpg";

const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

const hourlyDurationOptions = [
  { value: "4", labelKey: "halfDay", defaultLabel: "4 Hours (Half Day)" },
  { value: "6", labelKey: "sixHours", defaultLabel: "6 Hours" },
  { value: "8", labelKey: "fullDay", defaultLabel: "8 Hours (Full Day)" },
  { value: "custom", labelKey: "customHourly", defaultLabel: "9+ Hours (Custom)" },
];

export const Hero = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  
  const STORAGE_KEY = 'hero_form_data';
  
  const loadSavedFormData = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  }, []);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"ride" | "hourly">(() => loadSavedFormData()?.activeTab || "ride");
  
  // Ride form state
  const [pickup, setPickup] = useState(() => loadSavedFormData()?.pickup || "");
  const [dropoff, setDropoff] = useState(() => loadSavedFormData()?.dropoff || "");
  const [date, setDate] = useState<Date | undefined>(() => {
    const saved = loadSavedFormData();
    if (saved?.date) {
      const parsedDate = new Date(saved.date);
      return parsedDate > new Date() ? parsedDate : undefined;
    }
    return undefined;
  });
  const [time, setTime] = useState(() => loadSavedFormData()?.time || "");
  const [passengers, setPassengers] = useState(() => loadSavedFormData()?.passengers || "2");
  const [vehicleType, setVehicleType] = useState(() => loadSavedFormData()?.vehicleType || "mercedes-vito");
  const [submitting, setSubmitting] = useState(false);
  const [allVehiclePrices, setAllVehiclePrices] = useState<any[]>([]);
  const [transferPriceCurrency, setTransferPriceCurrency] = useState("EUR");
  const [loadingTransferPrice, setLoadingTransferPrice] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>("");

  // Hourly form state
  const [hourlyCity, setHourlyCity] = useState(() => loadSavedFormData()?.hourlyCity || "");
  const [hourlyDate, setHourlyDate] = useState<Date | undefined>(() => {
    const saved = loadSavedFormData();
    if (saved?.hourlyDate) {
      const parsedDate = new Date(saved.hourlyDate);
      return parsedDate > new Date() ? parsedDate : undefined;
    }
    return undefined;
  });
  const [hourlyTime, setHourlyTime] = useState(() => loadSavedFormData()?.hourlyTime || "");
  const [hourlyDuration, setHourlyDuration] = useState(() => loadSavedFormData()?.hourlyDuration || "");
  const [hourlyPassengers, setHourlyPassengers] = useState(() => loadSavedFormData()?.hourlyPassengers || "2");
  const [hourlyVehicleType, setHourlyVehicleType] = useState(() => loadSavedFormData()?.hourlyVehicleType || "mercedes-vito");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [cityDurations, setCityDurations] = useState<Record<string, string[]>>({});
  const [loadingCities, setLoadingCities] = useState(false);
  const [allHourlyPrices, setAllHourlyPrices] = useState<Array<{ vehicleType: string; price: number; currency: string }>>([]);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [customHours, setCustomHours] = useState(() => loadSavedFormData()?.customHours || "9");
  
  // Video state
  const [videosLoaded, setVideosLoaded] = useState(false);
  const [cityVideos, setCityVideos] = useState<CityVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  
  // Save form data
  useEffect(() => {
    const formData = { activeTab, pickup, dropoff, date: date?.toISOString(), time, passengers, vehicleType, hourlyCity, hourlyDate: hourlyDate?.toISOString(), hourlyTime, hourlyDuration, hourlyPassengers, hourlyVehicleType, customHours };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(formData)); } catch {}
  }, [activeTab, pickup, dropoff, date, time, passengers, vehicleType, hourlyCity, hourlyDate, hourlyTime, hourlyDuration, hourlyPassengers, hourlyVehicleType, customHours]);
  
  // Load videos
  useEffect(() => {
    const loadVideos = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const [heroVideo, heroIstanbul, heroAntalya, heroBodrum] = await Promise.all([
        import("@/assets/hero-mercedes-video.mp4"),
        import("@/assets/hero-istanbul.mp4"),
        import("@/assets/hero-antalya.mp4"),
        import("@/assets/hero-bodrum.mp4"),
      ]);
      setCityVideos([
        { src: heroIstanbul.default, label: "Istanbul", labelTR: "İstanbul", poster: "/images/destinations/istanbul-city.jpg" },
        { src: heroAntalya.default, label: "Antalya", labelTR: "Antalya", poster: "/images/destinations/antalya-city.jpg" },
        { src: heroBodrum.default, label: "Bodrum", labelTR: "Bodrum", poster: "/images/destinations/bodrum-city.jpg" },
        { src: heroVideo.default, label: "VIP Transfer", labelTR: "VIP Transfer", poster: vitoVipImg },
      ]);
      setVideosLoaded(true);
    };
    loadVideos();
  }, []);
  
  // Video rotation
  useEffect(() => {
    if (!videosLoaded || cityVideos.length === 0) return;
    const interval = setInterval(() => setCurrentVideoIndex((prev) => (prev + 1) % cityVideos.length), 6000);
    return () => clearInterval(interval);
  }, [videosLoaded, cityVideos.length]);

  // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const { data } = await supabase.from("hourly_rental_prices").select("city, duration_type").eq("is_active", true).order("city");
        if (data) {
          setAvailableCities([...new Set(data.map(item => item.city))]);
          const durationsMap: Record<string, string[]> = {};
          data.forEach(item => {
            if (!durationsMap[item.city]) durationsMap[item.city] = [];
            const d = item.duration_type.replace("_hours", "").replace("h", "");
            const mapped = d === "4" ? "4" : d === "6" ? "6" : d === "8" ? "8" : (d === "custom" || parseInt(d) >= 9) ? "custom" : null;
            if (mapped && !durationsMap[item.city].includes(mapped)) durationsMap[item.city].push(mapped);
          });
          Object.keys(durationsMap).forEach(city => durationsMap[city].sort((a, b) => ["4", "6", "8", "custom"].indexOf(a) - ["4", "6", "8", "custom"].indexOf(b)));
          setCityDurations(durationsMap);
        }
      } catch {} finally { setLoadingCities(false); }
    };
    fetchCities();
  }, []);

  // Fetch transfer prices
  useEffect(() => {
    if (!pickup || !dropoff) { setAllVehiclePrices([]); return; }
    setLoadingTransferPrice(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase.functions.invoke("get-all-vehicle-prices", { body: { pickup, dropoff, customerCurrency: "EUR" } });
        if (data?.vehicles?.length > 0) { setAllVehiclePrices(data.vehicles); setTransferPriceCurrency(data.currency || "EUR"); }
        else setAllVehiclePrices([]);
      } catch { setAllVehiclePrices([]); }
      finally { setLoadingTransferPrice(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [pickup, dropoff]);

  const availableDurations = hourlyCity ? (cityDurations[hourlyCity] || []) : [];
  
  useEffect(() => {
    if (hourlyCity && availableDurations.length > 0 && !availableDurations.includes(hourlyDuration)) setHourlyDuration(availableDurations[0]);
    else if (!hourlyCity) setHourlyDuration("");
    setAllHourlyPrices([]);
  }, [hourlyCity, availableDurations]);

  useEffect(() => {
    const currentVehicle = VEHICLE_TYPES.find(v => v.value === vehicleType);
    if (currentVehicle && currentVehicle.passengers < parseInt(passengers)) {
      const suitable = VEHICLE_TYPES.find(v => v.passengers >= parseInt(passengers));
      if (suitable) setVehicleType(suitable.value);
    }
  }, [passengers]);

  useEffect(() => {
    const currentVehicle = VEHICLE_TYPES.find(v => v.value === hourlyVehicleType);
    if (currentVehicle && currentVehicle.passengers < parseInt(hourlyPassengers)) {
      const suitable = VEHICLE_TYPES.find(v => v.passengers >= parseInt(hourlyPassengers) && v.value !== 'minibus');
      if (suitable) setHourlyVehicleType(suitable.value);
    }
  }, [hourlyPassengers]);

  // Fetch hourly prices
  useEffect(() => {
    if (!hourlyCity || !hourlyDuration) { setAllHourlyPrices([]); return; }
    setLoadingPrice(true);
    const fetchPrices = async () => {
      try {
        const vehicleTypeMapping: Record<string, string> = { 'vito': 'mercedes-vito', 'vito_vip': 'vip-mercedes', 'maybach': 'maybach-minibus', 'sprinter': 'sprinter-minibus', 'mercedes-vito': 'mercedes-vito', 'vip-mercedes': 'vip-mercedes', 'maybach-minibus': 'maybach-minibus', 'sprinter-minibus': 'sprinter-minibus' };
        if (hourlyDuration === "custom") {
          const { data } = await supabase.from("hourly_rental_prices").select("vehicle_type, hourly_rate, price_currency").eq("city", hourlyCity).eq("duration_type", "custom").eq("is_active", true);
          const prices = data?.filter(i => i.hourly_rate).map(i => ({ vehicleType: vehicleTypeMapping[i.vehicle_type] || i.vehicle_type, price: i.hourly_rate! * (parseInt(customHours) || 9), currency: i.price_currency })) || [];
          setAllHourlyPrices(prices);
        } else {
          const { data: shortData } = await supabase.from("hourly_rental_prices").select("vehicle_type, price, price_currency").eq("city", hourlyCity).eq("duration_type", `${hourlyDuration}h`).eq("is_active", true);
          const { data: longData } = await supabase.from("hourly_rental_prices").select("vehicle_type, price, price_currency").eq("city", hourlyCity).eq("duration_type", `${hourlyDuration}_hours`).eq("is_active", true);
          const combined = [...(shortData || []), ...(longData || [])];
          const map = new Map<string, { price: number; currency: string }>();
          combined.forEach(i => { if (!map.has(i.vehicle_type)) map.set(i.vehicle_type, { price: i.price, currency: i.price_currency }); });
          const prices: Array<{ vehicleType: string; price: number; currency: string }> = [];
          map.forEach((v, k) => prices.push({ vehicleType: vehicleTypeMapping[k] || k, price: v.price, currency: v.currency }));
          setAllHourlyPrices(prices);
        }
      } catch { setAllHourlyPrices([]); }
      finally { setLoadingPrice(false); }
    };
    fetchPrices();
  }, [hourlyCity, hourlyDuration, customHours]);

  const handleRideContinue = () => {
    const missing: string[] = [];
    if (!pickup) missing.push(t("pickupPoint") || "Pickup");
    if (!dropoff) missing.push(t("dropoffLocation") || "Drop-off");
    if (!date) missing.push(t("pickupDate") || "Date");
    if (!time) missing.push(t("pickupTime") || "Time");
    if (missing.length > 0) { toast.error(`${t("pleaseFilAllFields") || "Please fill in"}: ${missing.join(", ")}`); return; }
    setSubmitting(true);
    const params = new URLSearchParams();
    params.set("pickup", pickup); params.set("dropoff", dropoff);
    params.set("date", format(date!, "yyyy-MM-dd")); params.set("time", time);
    params.set("passengers", passengers); params.set("vehicleType", vehicleType);
    if (appliedPromoCode) params.set("promoCode", appliedPromoCode);
    navigate(`/book?${params.toString()}`);
  };

  const handleHourlyContinue = () => {
    const missing: string[] = [];
    if (!hourlyCity) missing.push(t("city") || "City");
    if (!hourlyDate) missing.push(t("pickupDate") || "Date");
    if (!hourlyTime) missing.push(t("pickupTime") || "Time");
    if (missing.length > 0) { toast.error(`${t("pleaseFilAllFields") || "Please fill in"}: ${missing.join(", ")}`); return; }
    setSubmitting(true);
    const params = new URLSearchParams();
    params.set("city", hourlyCity); params.set("date", format(hourlyDate!, "yyyy-MM-dd"));
    params.set("time", hourlyTime); params.set("duration", hourlyDuration === "custom" ? `${customHours}h` : `${hourlyDuration}h`);
    params.set("passengers", hourlyPassengers); params.set("vehicleType", hourlyVehicleType); params.set("type", "hourly");
    if (appliedPromoCode) params.set("promoCode", appliedPromoCode);
    navigate(`/book?${params.toString()}`);
  };

  const handlePickupSelected = (value: string, details?: PlaceDetails) => setPickup(details?.displayText || value);
  const handleDropoffSelected = (value: string, details?: PlaceDetails) => setDropoff(details?.displayText || value);
  const handleSwapLocations = () => { const temp = pickup; setPickup(dropoff); setDropoff(temp); };

  const handleApplyBooking = useCallback((data: BookingData) => {
    if (data.pickup) setPickup(data.pickup);
    if (data.dropoff) setDropoff(data.dropoff);
    if (data.date) { try { const d = parse(data.date, "yyyy-MM-dd", new Date()); if (!isNaN(d.getTime())) setDate(d); } catch {} }
    if (data.time) setTime(data.time);
    if (data.passengers) setPassengers(data.passengers.toString());
    if (data.vehicleType) setVehicleType({ 'mercedes-vito': 'mercedes-vito', 'vip-mercedes': 'vip-mercedes', 'maybach-minibus': 'maybach-minibus', 'minibus': 'minibus' }[data.vehicleType] || 'mercedes-vito');
    toast.success(t("bookingDetailsApplied") || "Booking details applied!");
    document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [t]);

  const handleApplyPromoCode = useCallback((code: string) => {
    setAppliedPromoCode(code);
  }, []);
   
  return (
    <section ref={heroRef} id="booking-form" className="relative min-h-screen overflow-hidden bg-background">
      <HeroBackground y={y} opacity={opacity} videosLoaded={videosLoaded} cityVideos={cityVideos} currentVideoIndex={currentVideoIndex} setCurrentVideoIndex={setCurrentVideoIndex} language={language} />
      
      {/* Floating Elements */}
      <div className="absolute top-20 right-[10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-40 left-[5%] w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container relative z-10 px-4 py-6 md:py-8 lg:py-16">
        <div className="grid md:grid-cols-5 lg:grid-cols-2 gap-6 md:gap-6 lg:gap-12 items-start lg:items-center min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-8rem)]">
          {/* Left Side - Form */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="order-1 md:col-span-3 lg:col-span-1">
            <HeroHeader language={language} />
            <HeroAIAssistant language={language} onApplyBooking={handleApplyBooking} />
            <ReturnTripPromoBanner language={language} onApplyPromoCode={handleApplyPromoCode} />

            {/* Booking Form Card */}
            <motion.div className="bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden backdrop-blur-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
              {/* Tabs */}
              <div className="flex bg-muted/50 relative">
                <motion.div className="absolute bottom-0 h-0.5 bg-primary" initial={false} animate={{ left: activeTab === "ride" ? "0%" : "50%", width: "50%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                <button onClick={() => setActiveTab("ride")} className={cn("flex-1 flex items-center justify-center gap-1.5 py-3 px-4 font-medium transition-all text-sm relative", activeTab === "ride" ? "text-primary bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  <motion.div animate={{ scale: activeTab === "ride" ? 1.1 : 1 }} transition={{ type: "spring", stiffness: 300 }}><Car className="h-4 w-4" /></motion.div>
                  <span className="hidden xs:inline">{t("pointToPoint") || "Transfer"}</span><span className="xs:hidden">Transfer</span>
                </button>
                <button onClick={() => setActiveTab("hourly")} className={cn("flex-1 flex items-center justify-center gap-1.5 py-3 px-4 font-medium transition-all text-sm", activeTab === "hourly" ? "text-primary bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  <motion.div animate={{ scale: activeTab === "hourly" ? 1.1 : 1 }} transition={{ type: "spring", stiffness: 300 }}><Timer className="h-4 w-4" /></motion.div>
                  <span className="hidden xs:inline">{t("perHour") || "Hourly"}</span><span className="xs:hidden">Hourly</span>
                </button>
              </div>

              {/* Form Content */}
              <div className="p-4 md:p-5">
                <AnimatePresence mode="wait">
                  {activeTab === "ride" ? (
                    <motion.div key="ride-form" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-3">
                      <LocationInputs pickup={pickup} dropoff={dropoff} onPickupSelected={handlePickupSelected} onDropoffSelected={handleDropoffSelected} onSwapLocations={handleSwapLocations} language={language} />
                      <div className="grid grid-cols-3 gap-2">
                        <FloatingLabelDatePicker label={t("date") || "Date"} date={date} onSelect={setDate} icon={<CalendarIcon className="h-4 w-4" />} disabledDates={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} className="col-span-1" />
                        <FloatingLabelSelect label={t("time") || "Time"} value={time} onValueChange={setTime} options={timeOptions.map(opt => ({ value: opt, label: opt }))} icon={<Clock className="h-4 w-4" />} className="col-span-1" />
                        <FloatingLabelSelect label={t("passengers") || "Passengers"} value={passengers} onValueChange={setPassengers} options={Array.from({ length: 18 }, (_, i) => ({ value: (i + 1).toString(), label: `${i + 1} pax` }))} icon={<Users className="h-4 w-4" />} className="col-span-1" />
                      </div>
                      <VehicleSelector selectedVehicle={vehicleType} onSelectVehicle={setVehicleType} passengers={passengers} prices={allVehiclePrices} loadingPrices={loadingTransferPrice} hasRoute={!!(pickup && dropoff)} language={language} currency={transferPriceCurrency} />
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Button onClick={handleRideContinue} disabled={submitting} className="w-full h-12 font-semibold bg-primary hover:bg-primary/90 shadow-lg rounded-xl text-base group">
                          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Zap className="mr-1 h-4 w-4" />{language === 'TR' ? 'Anında Fiyat Al' : 'Get Instant Quote'}<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>}
                        </Button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div key="hourly-form" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <FloatingLabelSelect label={t("city") || "City"} value={hourlyCity} onValueChange={setHourlyCity} options={availableCities.map(city => ({ value: city, label: city }))} icon={<MapPin className="h-4 w-4" />} className="col-span-1" />
                        <FloatingLabelSelect label={t("duration") || "Duration"} value={hourlyDuration} onValueChange={setHourlyDuration} options={availableDurations.map(d => { const opt = hourlyDurationOptions.find(o => o.value === d); return { value: d, label: opt ? (t(opt.labelKey) || opt.defaultLabel) : `${d}h` }; })} icon={<Timer className="h-4 w-4" />} disabled={!hourlyCity} className="col-span-1" />
                      </div>
                      {hourlyDuration === "custom" && <FloatingLabelSelect label={t("customHours") || "Custom Hours"} value={customHours} onValueChange={setCustomHours} options={Array.from({ length: 16 }, (_, i) => ({ value: (i + 9).toString(), label: `${i + 9} ${t("hours") || "hours"}` }))} icon={<Timer className="h-4 w-4" />} />}
                      <div className="grid grid-cols-3 gap-2">
                        <FloatingLabelDatePicker label={t("date") || "Date"} date={hourlyDate} onSelect={setHourlyDate} icon={<CalendarIcon className="h-4 w-4" />} disabledDates={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} className="col-span-1" />
                        <FloatingLabelSelect label={t("time") || "Time"} value={hourlyTime} onValueChange={setHourlyTime} options={timeOptions.map(opt => ({ value: opt, label: opt }))} icon={<Clock className="h-4 w-4" />} className="col-span-1" />
                        <FloatingLabelSelect label={t("passengers") || "Passengers"} value={hourlyPassengers} onValueChange={setHourlyPassengers} options={Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: `${i + 1} pax` }))} icon={<Users className="h-4 w-4" />} className="col-span-1" />
                      </div>
                      <VehicleSelector selectedVehicle={hourlyVehicleType} onSelectVehicle={setHourlyVehicleType} passengers={hourlyPassengers} prices={allHourlyPrices} loadingPrices={loadingPrice} hasRoute={!!(hourlyCity && hourlyDuration)} language={language} currency={allHourlyPrices[0]?.currency || "EUR"} />
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Button onClick={handleHourlyContinue} disabled={submitting} className="w-full h-12 font-semibold bg-primary hover:bg-primary/90 shadow-lg rounded-xl text-base group">
                          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Zap className="mr-1 h-4 w-4" />{language === 'TR' ? 'Anında Fiyat Al' : 'Get Instant Quote'}<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>}
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <HeroTrustBadges language={language} />
          </motion.div>

          {/* Visual Sections */}
          <HeroVisualSection videosLoaded={videosLoaded} cityVideos={cityVideos} currentVideoIndex={currentVideoIndex} language={language} t={t} />
        </div>
      </div>
    </section>
  );
};
