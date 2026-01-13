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
import { AnimatePresence } from "framer-motion";
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
  RideFormContent,
  HourlyFormContent,
} from "@/components/hero";
import { SwipeableBookingCard } from "@/components/hero/SwipeableBookingCard";

import vitoVipImg from "@/assets/vito-vip-1.jpg";

// CDN URLs for hero videos (Supabase Storage with edge caching)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const CDN_VIDEO_BASE = `${SUPABASE_URL}/storage/v1/object/public/hero-videos`;

// Video configuration with CDN URLs and local fallbacks
const VIDEO_CONFIG = {
  istanbul: {
    cdn: `${CDN_VIDEO_BASE}/hero-istanbul.mp4`,
    cdnWebm: `${CDN_VIDEO_BASE}/hero-istanbul.webm`,
    poster: "/images/destinations/istanbul-city.jpg",
    label: "Istanbul",
    labelTR: "İstanbul"
  },
  antalya: {
    cdn: `${CDN_VIDEO_BASE}/hero-antalya.mp4`,
    cdnWebm: `${CDN_VIDEO_BASE}/hero-antalya.webm`,
    poster: "/images/destinations/antalya-city.jpg",
    label: "Antalya",
    labelTR: "Antalya"
  },
  bodrum: {
    cdn: `${CDN_VIDEO_BASE}/hero-bodrum.mp4`,
    cdnWebm: `${CDN_VIDEO_BASE}/hero-bodrum.webm`,
    poster: "/images/destinations/bodrum-city.jpg",
    label: "Bodrum",
    labelTR: "Bodrum"
  },
  vipTransfer: {
    cdn: `${CDN_VIDEO_BASE}/hero-mercedes-video.mp4`,
    cdnWebm: `${CDN_VIDEO_BASE}/hero-mercedes-video.webm`,
    poster: vitoVipImg,
    label: "VIP Transfer",
    labelTR: "VIP Transfer"
  }
};

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
  
  // Load videos from CDN - DEFERRED to not block initial render
  useEffect(() => {
    // On mobile, videos are not shown - skip entirely
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return;
    
    const loadVideosFromCDN = async () => {
      // Use a single video initially, load others in background
      try {
        // Load Istanbul first (most common destination) - direct URL, no HEAD check
        const istanbulVideo = {
          src: VIDEO_CONFIG.istanbul.cdn,
          srcMp4: VIDEO_CONFIG.istanbul.cdn,
          ...VIDEO_CONFIG.istanbul
        };
        
        setCityVideos([istanbulVideo]);
        setVideosLoaded(true);
        
        // Load remaining videos much later with very low priority
        setTimeout(() => {
          requestIdleCallback(() => {
            const additionalVideos = [
              { src: VIDEO_CONFIG.antalya.cdn, ...VIDEO_CONFIG.antalya },
              { src: VIDEO_CONFIG.bodrum.cdn, ...VIDEO_CONFIG.bodrum },
              { src: VIDEO_CONFIG.vipTransfer.cdn, ...VIDEO_CONFIG.vipTransfer },
            ];
            
            setCityVideos(prev => [...prev, ...additionalVideos]);
          }, { timeout: 5000 });
        }, 3000); // Wait 3 seconds before loading additional videos
      } catch (error) {
        console.error('[Hero] Video load error:', error);
        setVideosLoaded(true); // Allow fallback image to show
      }
    };
    
    // Delay video loading to prioritize form rendering
    const timer = setTimeout(loadVideosFromCDN, 500);
    return () => clearTimeout(timer);
  }, []);
  
  // Video rotation
  useEffect(() => {
    if (!videosLoaded || cityVideos.length === 0) return;
    const interval = setInterval(() => setCurrentVideoIndex((prev) => (prev + 1) % cityVideos.length), 6000);
    return () => clearInterval(interval);
  }, [videosLoaded, cityVideos.length]);

  // Fetch cities - DEFERRED to not block initial render
  useEffect(() => {
    // Only fetch when hourly tab is active
    if (activeTab !== 'hourly') return;
    
    const fetchCities = async () => {
      if (availableCities.length > 0) return; // Already loaded
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
    
    // Small delay to let the tab animation complete first
    const timer = setTimeout(fetchCities, 100);
    return () => clearTimeout(timer);
  }, [activeTab, availableCities.length]);

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
    <section ref={heroRef} id="booking-form" className="relative overflow-hidden bg-background">
      <HeroBackground videosLoaded={videosLoaded} cityVideos={cityVideos} currentVideoIndex={currentVideoIndex} setCurrentVideoIndex={setCurrentVideoIndex} language={language} />

      {/* Mobile: pb-20 for bottom nav, desktop: normal padding. pt handled by WebsiteLayout */}
      <div className="container relative z-10 px-2 sm:px-3 md:px-4 pt-4 md:pt-8 pb-4 md:pb-8 lg:pb-16">
        <div className="grid md:grid-cols-5 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-12 items-start lg:items-center min-h-[calc(100svh-8rem)] md:min-h-[calc(100svh-6rem)]">
          {/* Left Side - Form */}
          <div className="order-1 md:col-span-3 lg:col-span-1">
            <HeroHeader language={language} />
            <HeroAIAssistant language={language} onApplyBooking={handleApplyBooking} />
            <ReturnTripPromoBanner language={language} onApplyPromoCode={handleApplyPromoCode} />

            {/* Booking Form Card - Enhanced visibility */}
            <SwipeableBookingCard 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              language={language}
              t={t}
            >
              {/* Tabs */}
              <div className="flex bg-muted/50 relative">
                <div 
                  className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300"
                  style={{ left: activeTab === "ride" ? "0%" : "50%", width: "50%" }}
                />
                <button onClick={() => setActiveTab("ride")} className={cn("flex-1 flex items-center justify-center gap-1.5 md:gap-1.5 py-3.5 md:py-3 px-4 md:px-4 font-medium transition-all text-sm md:text-sm relative", activeTab === "ride" ? "text-primary bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  <Car className="h-4 w-4 md:h-4 md:w-4" />
                  <span>{t("pointToPoint") || "Transfer"}</span>
                </button>
                <button onClick={() => setActiveTab("hourly")} className={cn("flex-1 flex items-center justify-center gap-1.5 md:gap-1.5 py-3.5 md:py-3 px-4 md:px-4 font-medium transition-all text-sm md:text-sm", activeTab === "hourly" ? "text-primary bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  <Timer className="h-4 w-4 md:h-4 md:w-4" />
                  <span>{t("perHour") || "Hourly"}</span>
                </button>
              </div>

              {/* Form Content */}
              <div className="p-4 sm:p-4 md:p-5 lg:p-5">
                <AnimatePresence mode="wait">
                  {activeTab === "ride" ? (
                    <RideFormContent
                      pickup={pickup}
                      dropoff={dropoff}
                      date={date}
                      time={time}
                      passengers={passengers}
                      vehicleType={vehicleType}
                      allVehiclePrices={allVehiclePrices}
                      loadingTransferPrice={loadingTransferPrice}
                      transferPriceCurrency={transferPriceCurrency}
                      submitting={submitting}
                      language={language}
                      t={t}
                      onPickupSelected={handlePickupSelected}
                      onDropoffSelected={handleDropoffSelected}
                      onSwapLocations={handleSwapLocations}
                      setDate={setDate}
                      setTime={setTime}
                      setPassengers={setPassengers}
                      setVehicleType={setVehicleType}
                      handleRideContinue={handleRideContinue}
                    />
                  ) : (
                    <HourlyFormContent
                      hourlyCity={hourlyCity}
                      hourlyDuration={hourlyDuration}
                      customHours={customHours}
                      hourlyDate={hourlyDate}
                      hourlyTime={hourlyTime}
                      hourlyPassengers={hourlyPassengers}
                      hourlyVehicleType={hourlyVehicleType}
                      allHourlyPrices={allHourlyPrices}
                      loadingPrice={loadingPrice}
                      submitting={submitting}
                      availableCities={availableCities}
                      availableDurations={availableDurations}
                      language={language}
                      t={t}
                      setHourlyCity={setHourlyCity}
                      setHourlyDuration={setHourlyDuration}
                      setCustomHours={setCustomHours}
                      setHourlyDate={setHourlyDate}
                      setHourlyTime={setHourlyTime}
                      setHourlyPassengers={setHourlyPassengers}
                      setHourlyVehicleType={setHourlyVehicleType}
                      handleHourlyContinue={handleHourlyContinue}
                    />
                  )}
                </AnimatePresence>
              </div>
            </SwipeableBookingCard>

            <HeroTrustBadges language={language} />
          </div>

          {/* Visual Sections */}
          <HeroVisualSection videosLoaded={videosLoaded} cityVideos={cityVideos} currentVideoIndex={currentVideoIndex} language={language} t={t} />
        </div>
      </div>
    </section>
  );
};
