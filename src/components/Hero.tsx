import { useState, useEffect, useCallback, useRef, lazy, Suspense, memo, useMemo } from "react";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, CalendarIcon, Clock, ArrowRight, Loader2, Car, Timer, ArrowUpDown, Users, Sparkles, Shield, Star, Globe, Check, Zap, Wifi, Baby, Briefcase, Plane, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LazyGooglePlacesAutocomplete as GooglePlacesAutocomplete, PlaceDetails } from "@/components/ui/lazy-google-places-autocomplete";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VEHICLE_TYPES } from "@/lib/vehicleTypes";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { FloatingLabelDatePicker } from "@/components/ui/floating-label-datepicker";

// Lazy load heavy components - deferred loading
const BookingChatAssistant = lazy(() => import("@/components/website/BookingChatAssistant"));
const CompactRouteMap = lazy(() => import("@/components/ui/compact-route-map").then(m => ({ default: m.CompactRouteMap })));
const VehicleTooltip = lazy(() => import("@/components/VehicleTooltip").then(m => ({ default: m.VehicleTooltip })));
const VehicleImageCarousel = lazy(() => import("@/components/website/VehicleImageCarousel").then(m => ({ default: m.VehicleImageCarousel })));
const VehicleDetailModal = lazy(() => import("@/components/website/VehicleDetailModal").then(m => ({ default: m.VehicleDetailModal })));

// Critical images loaded eagerly with optimized paths
import meetTransferLogo from "@/assets/meet-transfer-logo-small.webp";
import heroMercedes from "@/assets/hero-mercedes-vito.jpg";

// Vehicle images - critical for form display
import vitoImg from "@/assets/vito-1.jpg";
import vitoVipImg from "@/assets/vito-vip-1.jpg";
import maybachImg from "@/assets/maybach-1.jpg";
import sprinterImg from "@/assets/sprinter-1.jpg";

// Vehicle image mapping
const vehicleImages: Record<string, string> = {
  'mercedes-vito': vitoImg,
  'vip-mercedes': vitoVipImg,
  'maybach-minibus': maybachImg,
  'sprinter-minibus': sprinterImg,
  'minibus': sprinterImg,
};

const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      times.push(`${h}:${m}`);
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
  // PromoCode is not used in this optimized version
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  
  // Parallax effect
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  
  // LocalStorage key for form persistence
  const STORAGE_KEY = 'hero_form_data';
  
  // Load saved form data from localStorage
  const loadSavedFormData = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved form data:', e);
    }
    return null;
  }, []);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"ride" | "hourly">(() => {
    const saved = loadSavedFormData();
    return saved?.activeTab || "ride";
  });
  
  // Ride form state - initialize from localStorage
  const [pickup, setPickup] = useState(() => loadSavedFormData()?.pickup || "");
  const [dropoff, setDropoff] = useState(() => loadSavedFormData()?.dropoff || "");
  const [date, setDate] = useState<Date | undefined>(() => {
    const saved = loadSavedFormData();
    if (saved?.date) {
      const parsedDate = new Date(saved.date);
      // Only restore if date is in the future
      if (parsedDate > new Date()) {
        return parsedDate;
      }
    }
    return undefined;
  });
  const [time, setTime] = useState(() => loadSavedFormData()?.time || "");
  const [passengers, setPassengers] = useState(() => loadSavedFormData()?.passengers || "2");
  const [vehicleType, setVehicleType] = useState(() => loadSavedFormData()?.vehicleType || "mercedes-vito");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [allVehiclePrices, setAllVehiclePrices] = useState<any[]>([]);
  const [transferPriceCurrency, setTransferPriceCurrency] = useState<string>("EUR");
  const [loadingTransferPrice, setLoadingTransferPrice] = useState(false);

  // Hourly form state - initialize from localStorage
  const [hourlyCity, setHourlyCity] = useState(() => loadSavedFormData()?.hourlyCity || "");
  const [hourlyDate, setHourlyDate] = useState<Date | undefined>(() => {
    const saved = loadSavedFormData();
    if (saved?.hourlyDate) {
      const parsedDate = new Date(saved.hourlyDate);
      if (parsedDate > new Date()) {
        return parsedDate;
      }
    }
    return undefined;
  });
  const [hourlyTime, setHourlyTime] = useState(() => loadSavedFormData()?.hourlyTime || "");
  const [hourlyDuration, setHourlyDuration] = useState(() => loadSavedFormData()?.hourlyDuration || "");
  const [hourlyPassengers, setHourlyPassengers] = useState(() => loadSavedFormData()?.hourlyPassengers || "2");
  const [hourlyVehicleType, setHourlyVehicleType] = useState(() => loadSavedFormData()?.hourlyVehicleType || "mercedes-vito");
  const [hourlyDatePopoverOpen, setHourlyDatePopoverOpen] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [cityDurations, setCityDurations] = useState<Record<string, string[]>>({});
  const [loadingCities, setLoadingCities] = useState(false);
  const [allHourlyPrices, setAllHourlyPrices] = useState<Array<{ vehicleType: string; price: number; currency: string }>>([]);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [customHours, setCustomHours] = useState(() => loadSavedFormData()?.customHours || "9");
  const [hourlyCurrency, setHourlyCurrency] = useState<string>("EUR");
  const [convertingHourlyPrices, setConvertingHourlyPrices] = useState(false);
  const [originalHourlyPrices, setOriginalHourlyPrices] = useState<Array<{ vehicleType: string; price: number; currency: string }>>([]);
  
  // Vehicle detail modal state
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<typeof VEHICLE_TYPES[0] | null>(null);
  const [isVehicleDetailOpen, setIsVehicleDetailOpen] = useState(false);
  const [detailModalContext, setDetailModalContext] = useState<'ride' | 'hourly'>('ride');
  
  // Save form data to localStorage when it changes
  useEffect(() => {
    const formData = {
      activeTab,
      // Ride form
      pickup,
      dropoff,
      date: date?.toISOString(),
      time,
      passengers,
      vehicleType,
      // Hourly form
      hourlyCity,
      hourlyDate: hourlyDate?.toISOString(),
      hourlyTime,
      hourlyDuration,
      hourlyPassengers,
      hourlyVehicleType,
      customHours,
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('Failed to save form data:', e);
    }
  }, [
    activeTab, pickup, dropoff, date, time, passengers, vehicleType,
    hourlyCity, hourlyDate, hourlyTime, hourlyDuration, hourlyPassengers, hourlyVehicleType, customHours
  ]);
  
  // Video/Image background state - Lazy loaded videos
  const [videosLoaded, setVideosLoaded] = useState(false);
  const [cityVideos, setCityVideos] = useState<Array<{ src: string; label: string; labelTR: string; poster: string }>>([]);
  
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Lazy load videos after initial render for faster FCP
  useEffect(() => {
    const loadVideos = async () => {
      // Delay video loading to prioritize form rendering
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
  
  // Hover state for vehicle tooltips
  const [hoveredVehicle, setHoveredVehicle] = useState<string | null>(null);
  
  // Rotate between city videos every 6 seconds - only when videos are loaded
  useEffect(() => {
    if (!videosLoaded || cityVideos.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % cityVideos.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [videosLoaded, cityVideos.length]);

  // Fetch available cities and their durations
  useEffect(() => {
    const fetchCitiesAndDurations = async () => {
      setLoadingCities(true);
      try {
        const { data, error } = await supabase
          .from("hourly_rental_prices")
          .select("city, duration_type")
          .eq("is_active", true)
          .order("city");
        
        if (error) throw error;
        
        const uniqueCities = [...new Set(data?.map(item => item.city) || [])];
        setAvailableCities(uniqueCities);
        
        const durationsMap: Record<string, string[]> = {};
        data?.forEach(item => {
          if (!durationsMap[item.city]) {
            durationsMap[item.city] = [];
          }
          const durationType = item.duration_type.replace("_hours", "").replace("h", "");
          
          let mappedDuration: string;
          if (durationType === "4") mappedDuration = "4";
          else if (durationType === "6") mappedDuration = "6";
          else if (durationType === "8") mappedDuration = "8";
          else if (durationType === "custom" || parseInt(durationType) >= 9) mappedDuration = "custom";
          else return;
          
          if (!durationsMap[item.city].includes(mappedDuration)) {
            durationsMap[item.city].push(mappedDuration);
          }
        });
        
        const sortOrder = ["4", "6", "8", "custom"];
        Object.keys(durationsMap).forEach(city => {
          durationsMap[city].sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b));
        });
        
        setCityDurations(durationsMap);
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCitiesAndDurations();
  }, []);

  // Fetch transfer price
  useEffect(() => {
    const fetchTransferPrice = async () => {
      if (!pickup || !dropoff) {
        setAllVehiclePrices([]);
        return;
      }

      setLoadingTransferPrice(true);
      try {
        const { data, error } = await supabase.functions.invoke("get-all-vehicle-prices", {
          body: { pickup, dropoff, customerCurrency: "EUR" },
        });

        if (error) throw error;

        if (data?.vehicles && data.vehicles.length > 0) {
          setAllVehiclePrices(data.vehicles);
          setTransferPriceCurrency(data.currency || "EUR");
        } else {
          setAllVehiclePrices([]);
        }
      } catch (error) {
        console.error("Error fetching transfer price:", error);
        setAllVehiclePrices([]);
      } finally {
        setLoadingTransferPrice(false);
      }
    };

    const timer = setTimeout(fetchTransferPrice, 500);
    return () => clearTimeout(timer);
  }, [pickup, dropoff]);

  const availableDurations = hourlyCity ? (cityDurations[hourlyCity] || []) : [];
  
  useEffect(() => {
    if (hourlyCity && availableDurations.length > 0) {
      if (!availableDurations.includes(hourlyDuration)) {
        setHourlyDuration(availableDurations[0]);
      }
    } else if (!hourlyCity) {
      setHourlyDuration("");
    }
    setAllHourlyPrices([]);
  }, [hourlyCity, availableDurations]);

  useEffect(() => {
    const passengerCount = parseInt(passengers);
    const currentVehicle = VEHICLE_TYPES.find(v => v.value === vehicleType);
    
    if (currentVehicle && currentVehicle.passengers < passengerCount) {
      const suitableVehicle = VEHICLE_TYPES.find(v => v.passengers >= passengerCount);
      if (suitableVehicle) setVehicleType(suitableVehicle.value);
    }
  }, [passengers]);

  useEffect(() => {
    const passengerCount = parseInt(hourlyPassengers);
    const currentVehicle = VEHICLE_TYPES.find(v => v.value === hourlyVehicleType);
    
    if (currentVehicle && currentVehicle.passengers < passengerCount) {
      const suitableVehicle = VEHICLE_TYPES.find(v => v.passengers >= passengerCount && v.value !== 'minibus');
      if (suitableVehicle) setHourlyVehicleType(suitableVehicle.value);
    }
  }, [hourlyPassengers]);

  // Fetch hourly prices
  useEffect(() => {
    const fetchAllPrices = async () => {
      if (!hourlyCity || !hourlyDuration) {
        setOriginalHourlyPrices([]);
        setAllHourlyPrices([]);
        return;
      }

      setLoadingPrice(true);
      try {
        if (hourlyDuration === "custom") {
          const { data: customData, error: customError } = await supabase
            .from("hourly_rental_prices")
            .select("vehicle_type, hourly_rate, price_currency")
            .eq("city", hourlyCity)
            .eq("duration_type", "custom")
            .eq("is_active", true);
          
          if (customError) throw customError;
          
          const hours = parseInt(customHours) || 9;
          const vehicleTypeMapping: Record<string, string> = {
            'vito': 'mercedes-vito',
            'vito_vip': 'vip-mercedes',
            'maybach': 'maybach-minibus',
            'sprinter': 'sprinter-minibus',
          };
          
          const prices: Array<{ vehicleType: string; price: number; currency: string }> = [];
          customData?.forEach(item => {
            if (item.hourly_rate) {
              const mappedType = vehicleTypeMapping[item.vehicle_type] || item.vehicle_type;
              prices.push({ vehicleType: mappedType, price: item.hourly_rate * hours, currency: item.price_currency });
            }
          });
          
          setOriginalHourlyPrices(prices);
          setAllHourlyPrices(prices);
        } else {
          const durationKeyShort = `${hourlyDuration}h`;
          const durationKeyLong = `${hourlyDuration}_hours`;
          
          const { data: shortData } = await supabase
            .from("hourly_rental_prices")
            .select("vehicle_type, price, price_currency")
            .eq("city", hourlyCity)
            .eq("duration_type", durationKeyShort)
            .eq("is_active", true);
          
          const { data: longData } = await supabase
            .from("hourly_rental_prices")
            .select("vehicle_type, price, price_currency")
            .eq("city", hourlyCity)
            .eq("duration_type", durationKeyLong)
            .eq("is_active", true);
          
          const combinedData = [...(shortData || []), ...(longData || [])];
          const vehiclePriceMap = new Map<string, { price: number; currency: string }>();
          combinedData.forEach(item => {
            if (!vehiclePriceMap.has(item.vehicle_type)) {
              vehiclePriceMap.set(item.vehicle_type, { price: item.price, currency: item.price_currency });
            }
          });
          
          const prices: Array<{ vehicleType: string; price: number; currency: string }> = [];
          const vehicleTypeMapping: Record<string, string> = {
            'vito': 'mercedes-vito', 'vito_vip': 'vip-mercedes',
            'maybach': 'maybach-minibus', 'sprinter': 'sprinter-minibus',
            'mercedes-vito': 'mercedes-vito', 'vip-mercedes': 'vip-mercedes',
            'maybach-minibus': 'maybach-minibus', 'sprinter-minibus': 'sprinter-minibus'
          };
          
          vehiclePriceMap.forEach((value, key) => {
            const mappedType = vehicleTypeMapping[key] || key;
            prices.push({ vehicleType: mappedType, price: value.price, currency: value.currency });
          });
          
          setOriginalHourlyPrices(prices);
          setAllHourlyPrices(prices);
        }
      } catch (error) {
        console.error("Error fetching hourly prices:", error);
        setOriginalHourlyPrices([]);
        setAllHourlyPrices([]);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchAllPrices();
  }, [hourlyCity, hourlyDuration, customHours]);

  useEffect(() => {
    const convertPrices = async () => {
      if (originalHourlyPrices.length === 0) return;
      
      const baseCurrency = originalHourlyPrices[0]?.currency || "EUR";
      
      if (hourlyCurrency === baseCurrency) {
        setAllHourlyPrices(originalHourlyPrices);
        return;
      }

      setConvertingHourlyPrices(true);
      try {
        const { data: rateData, error: rateError } = await supabase.functions.invoke('get-exchange-rate', {
          body: { from_currency: baseCurrency, to_currency: hourlyCurrency }
        });

        if (rateError) throw rateError;

        const rate = rateData?.rate || 1;
        const convertedPrices = originalHourlyPrices.map(p => ({
          vehicleType: p.vehicleType,
          price: Math.round(p.price * rate),
          currency: hourlyCurrency
        }));
        
        setAllHourlyPrices(convertedPrices);
      } catch (error) {
        console.error("Error converting hourly prices:", error);
        setAllHourlyPrices(originalHourlyPrices);
      } finally {
        setConvertingHourlyPrices(false);
      }
    };

    convertPrices();
  }, [hourlyCurrency, originalHourlyPrices]);

  const handleRideContinue = () => {
    const missingFields: string[] = [];
    if (!pickup) missingFields.push(t("pickupPoint") || "Pickup");
    if (!dropoff) missingFields.push(t("dropoffLocation") || "Drop-off");
    if (!date) missingFields.push(t("pickupDate") || "Date");
    if (!time) missingFields.push(t("pickupTime") || "Time");
    
    if (missingFields.length > 0) {
      toast.error(`${t("pleaseFilAllFields") || "Please fill in"}: ${missingFields.join(", ")}`);
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
    navigate(`/book?${params.toString()}`);
  };

  const handleHourlyContinue = () => {
    const missingFields: string[] = [];
    if (!hourlyCity) missingFields.push(t("city") || "City");
    if (!hourlyDate) missingFields.push(t("pickupDate") || "Date");
    if (!hourlyTime) missingFields.push(t("pickupTime") || "Time");
    
    if (missingFields.length > 0) {
      toast.error(`${t("pleaseFilAllFields") || "Please fill in"}: ${missingFields.join(", ")}`);
      return;
    }

    setSubmitting(true);
    const params = new URLSearchParams();
    params.set("city", hourlyCity);
    params.set("date", format(hourlyDate!, "yyyy-MM-dd"));
    params.set("time", hourlyTime);
    params.set("duration", hourlyDuration === "custom" ? `${customHours}h` : `${hourlyDuration}h`);
    params.set("passengers", hourlyPassengers);
    params.set("vehicleType", hourlyVehicleType);
    params.set("type", "hourly");
    navigate(`/book?${params.toString()}`);
  };

  const handlePickupSelected = (value: string, details?: PlaceDetails) => setPickup(details?.displayText || value);
  const handleDropoffSelected = (value: string, details?: PlaceDetails) => setDropoff(details?.displayText || value);

  const handleApplyBooking = useCallback((bookingData: {
    pickup?: string | null;
    dropoff?: string | null;
    date?: string | null;
    time?: string | null;
    passengers?: number | null;
    vehicleType?: string | null;
  }) => {
    if (bookingData.pickup) setPickup(bookingData.pickup);
    if (bookingData.dropoff) setDropoff(bookingData.dropoff);
    if (bookingData.date) {
      try {
        const parsedDate = parse(bookingData.date, "yyyy-MM-dd", new Date());
        if (!isNaN(parsedDate.getTime())) setDate(parsedDate);
      } catch (e) { console.error("Failed to parse date:", e); }
    }
    if (bookingData.time) setTime(bookingData.time);
    if (bookingData.passengers) setPassengers(bookingData.passengers.toString());
    if (bookingData.vehicleType) {
      const vehicleMap: Record<string, string> = {
        'mercedes-vito': 'mercedes-vito', 'vip-mercedes': 'vip-mercedes',
        'maybach-minibus': 'maybach-minibus', 'minibus': 'minibus'
      };
      setVehicleType(vehicleMap[bookingData.vehicleType] || 'mercedes-vito');
    }
    toast.success(t("bookingDetailsApplied") || "Booking details applied!");
    document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [t]);
  
  return (
    <section ref={heroRef} id="booking-form" className="relative min-h-screen overflow-hidden bg-background">
      {/* City Video Background with Smooth Transitions */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        {/* Video Background - Desktop - Only render when videos are loaded */}
        <div className="absolute inset-0 hidden md:block">
          {videosLoaded && cityVideos.length > 0 ? (
            <>
              <AnimatePresence mode="wait">
                <motion.video
                  key={currentVideoIndex}
                  ref={videoRef}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={cityVideos[currentVideoIndex].poster}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 0.35, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <source src={cityVideos[currentVideoIndex].src} type="video/mp4" />
                </motion.video>
              </AnimatePresence>
              
              {/* City Label Badge */}
              <motion.div
                key={`label-${currentVideoIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="absolute bottom-8 right-8 z-20"
              >
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md rounded-full px-4 py-2 border border-primary/30 shadow-xl">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {language === 'TR' 
                      ? cityVideos[currentVideoIndex].labelTR 
                      : cityVideos[currentVideoIndex].label}
                  </span>
                </div>
              </motion.div>
              
              {/* Video Navigation Dots */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {cityVideos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentVideoIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      currentVideoIndex === index 
                        ? "bg-primary w-6" 
                        : "bg-foreground/30 hover:bg-foreground/50"
                    )}
                    aria-label={`Go to video ${index + 1}`}
                  />
                ))}
              </div>
            </>
          ) : (
            /* Fallback static image while videos load */
            <img
              src={heroMercedes}
              alt="VIP Transfer"
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
          )}
        </div>
        
        {/* Mobile - Static Image with Gradient */}
        <div className="absolute inset-0 md:hidden">
          <img
            src={heroMercedes}
            alt="VIP Transfer"
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        </div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaC0ydjJoMnYtMmgydi0yaC0yem0tMiAydi0yaC0ydjJoMnptMi0yaDJ2LTJoLTJ2MnptLTItNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0yLTJoMnYtMmgtMnYyem0tMiAydjJoLTJ2Mmgydi0yaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
      </motion.div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 right-[10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-40 left-[5%] w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container relative z-10 px-4 py-6 md:py-8 lg:py-16">
        <div className="grid md:grid-cols-5 lg:grid-cols-2 gap-6 md:gap-6 lg:gap-12 items-start lg:items-center min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-8rem)]">
          {/* Left Side - Form (Mobile: First, Tablet: 3 cols) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="order-1 md:col-span-3 lg:col-span-1"
          >
            {/* Enhanced Header with Animated Title */}
            <motion.div 
              className="mb-5"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Logo + Title Row */}
              <div className="flex items-start gap-3 mb-4">
                <motion.img 
                  src={meetTransferLogo} 
                  alt="Meet Transfer" 
                  width={56}
                  height={56}
                  loading="eager"
                  className="h-14 w-14 rounded-xl object-cover shadow-xl ring-2 ring-primary/30"
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                />
                <div className="flex-1">
                  <motion.h1 
                    className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {language === 'TR' ? (
                      <>
                        <span className="text-primary">Lüks VIP</span> Transfer
                      </>
                    ) : (
                      <>
                        <span className="text-primary">Premium VIP</span> Transfer
                      </>
                    )}
                  </motion.h1>
                  <motion.p 
                    className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium">
                      <Shield className="h-3 w-3" />
                      {language === 'TR' ? 'Güvenli' : 'Safe'}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-accent/10 text-accent rounded-full px-2 py-0.5 text-[10px] font-medium">
                      <Zap className="h-3 w-3" />
                      {language === 'TR' ? 'Hızlı' : 'Fast'}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-600 rounded-full px-2 py-0.5 text-[10px] font-medium">
                      <Star className="h-3 w-3 fill-current" />
                      4.9
                    </span>
                  </motion.p>
                </div>
              </div>
              
              {/* Trust Badges Row */}
              <motion.div 
                className="flex items-center gap-2 mb-3 flex-wrap"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>{language === 'TR' ? 'Sabit Fiyat' : 'Fixed Price'}</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>{language === 'TR' ? 'Ücretsiz İptal' : 'Free Cancellation'}</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>{language === 'TR' ? 'Profesyonel Şoför' : 'Pro Chauffeur'}</span>
                </div>
              </motion.div>
              
              {/* Vehicle Fleet Showcase */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {VEHICLE_TYPES.slice(0, 4).map((vehicle, index) => (
                  <motion.div
                    key={vehicle.value}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.1 * index + 0.5, duration: 0.3, type: "spring" }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex-shrink-0"
                  >
                    <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm rounded-full pl-1 pr-2.5 py-1 border border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-default">
                      <div className="relative">
                        <img 
                          src={vehicleImages[vehicle.value]} 
                          alt={vehicle.label}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
                      </div>
                      <span className="text-[10px] font-medium text-foreground whitespace-nowrap">
                        {vehicle.label.split(' ').pop()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* AI Assistant - Compact on mobile */}
            {/* AI Assistant - Animated Entry */}
            <motion.div 
              className="mb-4 relative"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
            >
              {/* Glowing Background Effect */}
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Content Container */}
              <div className="relative bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl p-3 border border-primary/20 backdrop-blur-sm">
                {/* Animated Badge */}
                <motion.div 
                  className="flex items-center gap-2 mb-3"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Sparkles className="h-5 w-5 text-primary" />
                  </motion.div>
                  
                  <motion.span 
                    className="text-sm md:text-base font-semibold bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ["0%", "100%", "0%"],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    {language === 'TR' 
                      ? "🌍 Dünyada İlk: AI ile Transfer & Saatlik Kiralama" 
                      : "🌍 World's First: Book Transfer & Hourly Rental With AI"}
                  </motion.span>
                  
                  {/* NEW Badge */}
                  <motion.span
                    className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full uppercase tracking-wider"
                    animate={{
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 0 0 rgba(34, 197, 94, 0.4)",
                        "0 0 0 8px rgba(34, 197, 94, 0)",
                        "0 0 0 0 rgba(34, 197, 94, 0)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {language === 'TR' ? 'YENİ' : 'NEW'}
                  </motion.span>
                </motion.div>
                
                {/* AI Assistant Component */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <Suspense fallback={<Skeleton className="h-10 w-full rounded-lg" />}>
                    <BookingChatAssistant onApplyBooking={handleApplyBooking} />
                  </Suspense>
                </motion.div>
              </div>
            </motion.div>

            {/* Return Trip Promo Banner */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mb-3 relative overflow-hidden"
            >
              <div className="relative bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/30 rounded-xl px-4 py-2.5 backdrop-blur-sm">
                {/* Animated background shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                
                <div className="relative flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-lg"
                    >
                      🎁
                    </motion.span>
                    <div>
                      <span className="font-bold text-green-700 dark:text-green-400 text-sm md:text-base">
                        {language === 'TR' ? 'Dönüş Yolculuğu' : 'Return Trip'}: 
                        <span className="ml-1 text-base md:text-lg">%30 {language === 'TR' ? 'İndirim' : 'OFF'}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Promo Code */}
                    <div className="flex items-center gap-1.5 bg-green-500/20 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                        {language === 'TR' ? 'Kod' : 'Code'}:
                      </span>
                      <code className="font-mono font-bold text-green-700 dark:text-green-300 text-sm">
                        RETURN30
                      </code>
                    </div>
                    
                    {/* Expiry Date */}
                    <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{language === 'TR' ? 'Son' : 'Expires'}: 31.03.2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Booking Form Card */}
            <motion.div 
              className="bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* Tabs */}
              <div className="flex bg-muted/50 relative">
                <motion.div
                  className="absolute bottom-0 h-0.5 bg-primary"
                  initial={false}
                  animate={{
                    left: activeTab === "ride" ? "0%" : "50%",
                    width: "50%"
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <button
                  onClick={() => setActiveTab("ride")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-3 px-4 font-medium transition-all text-sm relative",
                    activeTab === "ride" ? "text-primary bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <motion.div
                    animate={{ scale: activeTab === "ride" ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Car className="h-4 w-4" />
                  </motion.div>
                  <span className="hidden xs:inline">{t("pointToPoint") || "Transfer"}</span>
                  <span className="xs:hidden">Transfer</span>
                </button>
                <button
                  onClick={() => setActiveTab("hourly")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-3 px-4 font-medium transition-all text-sm",
                    activeTab === "hourly" ? "text-primary bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <motion.div
                    animate={{ scale: activeTab === "hourly" ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Timer className="h-4 w-4" />
                  </motion.div>
                  <span className="hidden xs:inline">{t("perHour") || "Hourly"}</span>
                  <span className="xs:hidden">Hourly</span>
                </button>
              </div>

              {/* Form Content */}
              <div className="p-4 md:p-5">
                <AnimatePresence mode="wait">
                {activeTab === "ride" ? (
                  <motion.div 
                    key="ride-form"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {/* Locations with Floating Labels */}
                    <div className="space-y-2">
                      <GooglePlacesAutocomplete 
                        onPlaceSelected={handlePickupSelected} 
                        placeholder={language === 'TR' ? 'Nereden alınacak?' : 'Where to pick you up?'} 
                        className="bg-muted/50 border border-border rounded-xl text-sm"
                        value={pickup}
                        floatingLabel
                        icon={<MapPin className="h-4 w-4 text-primary" />}
                      />
                      
                      <motion.div 
                        className="flex justify-center -my-0.5"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <button
                          type="button"
                          onClick={() => { const temp = pickup; setPickup(dropoff); setDropoff(temp); }}
                          disabled={!pickup && !dropoff}
                          className="w-7 h-7 rounded-full bg-primary text-primary-foreground shadow hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </motion.div>
                      
                      <GooglePlacesAutocomplete 
                        onPlaceSelected={handleDropoffSelected} 
                        placeholder={language === 'TR' ? 'Nereye gideceksiniz?' : 'Where to drop you off?'} 
                        className="bg-muted/50 border border-border rounded-xl text-sm"
                        value={dropoff}
                        floatingLabel
                        icon={<Navigation className="h-4 w-4 text-accent" />}
                      />
                      
                      {pickup && dropoff && (
                        <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg mt-2" />}>
                          <CompactRouteMap pickup={pickup} dropoff={dropoff} className="mt-2" />
                        </Suspense>
                      )}
                    </div>

                    {/* Date, Time, Passengers with Floating Labels */}
                    <div className="grid grid-cols-3 gap-2">
                      <FloatingLabelDatePicker
                        label={t("date") || "Date"}
                        date={date}
                        onSelect={setDate}
                        icon={<CalendarIcon className="h-4 w-4" />}
                        disabledDates={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="col-span-1"
                      />
                      
                      <FloatingLabelSelect
                        label={t("time") || "Time"}
                        value={time}
                        onValueChange={setTime}
                        options={timeOptions.map(opt => ({ value: opt, label: opt }))}
                        icon={<Clock className="h-4 w-4" />}
                        className="col-span-1"
                      />
                      
                      <FloatingLabelSelect
                        label={t("passengers") || "Passengers"}
                        value={passengers}
                        onValueChange={setPassengers}
                        options={Array.from({ length: 18 }, (_, i) => ({ 
                          value: (i + 1).toString(), 
                          label: `${i + 1} pax` 
                        }))}
                        icon={<Users className="h-4 w-4" />}
                        className="col-span-1"
                      />
                    </div>

                    {/* Vehicle Selection with Larger Images & Tooltips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {VEHICLE_TYPES.map((vehicle, index) => {
                        const vehiclePrice = allVehiclePrices.find(v => v.vehicleType === vehicle.value);
                        const isSelected = vehicleType === vehicle.value;
                        const isDisabled = vehicle.passengers < parseInt(passengers);
                        const isHovered = hoveredVehicle === vehicle.value;
                        
                        return (
                          <motion.div 
                            key={vehicle.value}
                            className="relative"
                            onMouseEnter={() => !isDisabled && setHoveredVehicle(vehicle.value)}
                            onMouseLeave={() => setHoveredVehicle(null)}
                          >
                            {/* Tooltip */}
                            <VehicleTooltip 
                              vehicleType={vehicle.value}
                              isVisible={isHovered && !isDisabled}
                              position="top"
                              isTurkish={language === 'TR'}
                            />
                            
                            <motion.button
                              type="button"
                              onClick={() => !isDisabled && setVehicleType(vehicle.value)}
                              disabled={isDisabled}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.05 * index }}
                              whileHover={{ scale: isDisabled ? 1 : 1.03, y: isDisabled ? 0 : -3 }}
                              whileTap={{ scale: isDisabled ? 1 : 0.97 }}
                              className={cn(
                                "w-full rounded-xl border p-2 transition-all text-center overflow-hidden",
                                isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                                isSelected 
                                  ? "border-primary bg-primary/10 ring-2 ring-primary shadow-lg" 
                                  : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                              )}
                            >
                              {/* Larger Vehicle Image with Carousel */}
                              <div className="w-full aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-muted relative group/image">
                                <Suspense fallback={
                                  <img 
                                    src={vehicleImages[vehicle.value]} 
                                    alt={vehicle.label}
                                    className="w-full h-full object-cover"
                                  />
                                }>
                                  <VehicleImageCarousel
                                    images={vehicle.images.slice(0, 5).map(img => img.src)}
                                    alt={vehicle.label}
                                    className="w-full h-full"
                                    interval={3000}
                                    isHovered={isHovered}
                                  />
                                </Suspense>
                                
                                {/* Info Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVehicleForDetail(vehicle);
                                    setDetailModalContext('ride');
                                    setIsVehicleDetailOpen(true);
                                  }}
                                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white opacity-0 group-hover/image:opacity-100 transition-opacity z-20"
                                >
                                  <Info className="h-3.5 w-3.5" />
                                </button>
                                
                                {isSelected && (
                                  <motion.div 
                                    className="absolute inset-0 bg-primary/20 flex items-center justify-center z-10"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                  >
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                      <Check className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                              <div className="text-xs font-semibold truncate mb-0.5">{vehicle.label.split(' ').pop()}</div>
                              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{vehicle.passengers} pax</span>
                              </div>
                              {vehiclePrice ? (
                                <motion.div 
                                  className="text-xs font-bold text-primary"
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 300 }}
                                >
                                  €{vehiclePrice.price}
                                </motion.div>
                              ) : loadingTransferPrice && pickup && dropoff ? (
                                <div className="h-4 flex items-center justify-center">
                                  <Skeleton className="h-3 w-8" />
                                </div>
                              ) : (
                                <div className="h-4" />
                              )}
                            </motion.button>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* CTA */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Button 
                        onClick={handleRideContinue}
                        disabled={submitting}
                        className="w-full h-12 font-semibold bg-primary hover:bg-primary/90 shadow-lg rounded-xl text-base group"
                      >
                        {submitting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Zap className="mr-1 h-4 w-4" />
                            {language === 'TR' ? 'Anında Fiyat Al' : 'Get Instant Quote'} 
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  /* Hourly Form */
                  <motion.div 
                    key="hourly-form"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {/* City and Duration with Floating Labels */}
                    <div className="grid grid-cols-2 gap-2">
                      <FloatingLabelSelect
                        label={t("city") || "City"}
                        value={hourlyCity}
                        onValueChange={setHourlyCity}
                        options={availableCities.map(city => ({ value: city, label: city }))}
                        icon={<MapPin className="h-4 w-4" />}
                        className="col-span-1"
                      />
                      
                      <FloatingLabelSelect
                        label={t("duration") || "Duration"}
                        value={hourlyDuration}
                        onValueChange={setHourlyDuration}
                        options={availableDurations.map(d => {
                          const opt = hourlyDurationOptions.find(o => o.value === d);
                          return { value: d, label: opt ? (t(opt.labelKey) || opt.defaultLabel) : `${d}h` };
                        })}
                        icon={<Timer className="h-4 w-4" />}
                        disabled={!hourlyCity}
                        className="col-span-1"
                      />
                    </div>
                    
                    {hourlyDuration === "custom" && (
                      <FloatingLabelSelect
                        label={t("customHours") || "Custom Hours"}
                        value={customHours}
                        onValueChange={setCustomHours}
                        options={Array.from({ length: 16 }, (_, i) => ({ 
                          value: (i + 9).toString(), 
                          label: `${i + 9} ${t("hours") || "hours"}` 
                        }))}
                        icon={<Timer className="h-4 w-4" />}
                      />
                    )}

                    {/* Hourly Date, Time, Passengers with Floating Labels */}
                    <div className="grid grid-cols-3 gap-2">
                      <FloatingLabelDatePicker
                        label={t("date") || "Date"}
                        date={hourlyDate}
                        onSelect={setHourlyDate}
                        icon={<CalendarIcon className="h-4 w-4" />}
                        disabledDates={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="col-span-1"
                      />
                      
                      <FloatingLabelSelect
                        label={t("time") || "Time"}
                        value={hourlyTime}
                        onValueChange={setHourlyTime}
                        options={timeOptions.map(opt => ({ value: opt, label: opt }))}
                        icon={<Clock className="h-4 w-4" />}
                        className="col-span-1"
                      />
                      
                      <FloatingLabelSelect
                        label={t("passengers") || "Passengers"}
                        value={hourlyPassengers}
                        onValueChange={setHourlyPassengers}
                        options={Array.from({ length: 6 }, (_, i) => ({ 
                          value: (i + 1).toString(), 
                          label: `${i + 1} pax` 
                        }))}
                        icon={<Users className="h-4 w-4" />}
                        className="col-span-1"
                      />
                    </div>

                    {hourlyCity && hourlyDuration && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {VEHICLE_TYPES.filter(v => v.value !== 'minibus').map((vehicle, index) => {
                          const vehiclePrice = allHourlyPrices.find(v => v.vehicleType === vehicle.value);
                          const isSelected = hourlyVehicleType === vehicle.value;
                          const isDisabled = vehicle.passengers < parseInt(hourlyPassengers);
                          const symbol = vehiclePrice?.currency === "EUR" ? "€" : vehiclePrice?.currency === "USD" ? "$" : vehiclePrice?.currency === "GBP" ? "£" : "₺";
                          const isHovered = hoveredVehicle === `hourly-${vehicle.value}`;
                          
                          return (
                            <motion.div 
                              key={vehicle.value}
                              className="relative"
                              onMouseEnter={() => !isDisabled && setHoveredVehicle(`hourly-${vehicle.value}`)}
                              onMouseLeave={() => setHoveredVehicle(null)}
                            >
                              {/* Tooltip */}
                              <VehicleTooltip 
                                vehicleType={vehicle.value}
                                isVisible={isHovered && !isDisabled}
                                position="top"
                                isTurkish={language === 'TR'}
                              />
                              
                              <motion.button
                                type="button"
                                onClick={() => !isDisabled && setHourlyVehicleType(vehicle.value)}
                                disabled={isDisabled}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * index }}
                                whileHover={{ scale: isDisabled ? 1 : 1.03, y: isDisabled ? 0 : -3 }}
                                whileTap={{ scale: isDisabled ? 1 : 0.97 }}
                                className={cn(
                                  "w-full rounded-xl border p-2 transition-all text-center overflow-hidden",
                                  isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                                  isSelected 
                                    ? "border-primary bg-primary/10 ring-2 ring-primary shadow-lg" 
                                    : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                                )}
                              >
                                {/* Larger Vehicle Image with Carousel */}
                                <div className="w-full aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-muted relative group/image">
                                  <Suspense fallback={
                                    <img 
                                      src={vehicleImages[vehicle.value]} 
                                      alt={vehicle.label}
                                      className="w-full h-full object-cover"
                                    />
                                  }>
                                    <VehicleImageCarousel
                                      images={vehicle.images.slice(0, 5).map(img => img.src)}
                                      alt={vehicle.label}
                                      className="w-full h-full"
                                      interval={3000}
                                      isHovered={isHovered}
                                    />
                                  </Suspense>
                                  
                                  {/* Info Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedVehicleForDetail(vehicle);
                                      setDetailModalContext('hourly');
                                      setIsVehicleDetailOpen(true);
                                    }}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white opacity-0 group-hover/image:opacity-100 transition-opacity z-20"
                                  >
                                    <Info className="h-3.5 w-3.5" />
                                  </button>
                                  
                                  {isSelected && (
                                    <motion.div 
                                      className="absolute inset-0 bg-primary/20 flex items-center justify-center z-10"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                    >
                                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="h-4 w-4 text-primary-foreground" />
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                                <div className="text-xs font-semibold truncate mb-0.5">{vehicle.label.split(' ').pop()}</div>
                                <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  <span>{vehicle.passengers} pax</span>
                                </div>
                                {vehiclePrice ? (
                                  <motion.div 
                                    className="text-sm font-bold text-primary mt-1"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                  >
                                    {symbol}{vehiclePrice.price}
                                  </motion.div>
                                ) : (loadingPrice || convertingHourlyPrices) ? (
                                  <div className="h-5 flex items-center justify-center mt-1">
                                    <Skeleton className="h-4 w-10" />
                                  </div>
                                ) : (
                                  <div className="h-5 mt-1" />
                                )}
                              </motion.button>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Button 
                        onClick={handleHourlyContinue}
                        disabled={submitting}
                        className="w-full h-12 font-semibold bg-primary hover:bg-primary/90 shadow-lg rounded-xl text-base group"
                      >
                        {submitting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Zap className="mr-1 h-4 w-4" />
                            {language === 'TR' ? 'Anında Fiyat Al' : 'Get Instant Quote'} 
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Trust Badges - Animated */}
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-3 mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div 
                className="flex items-center gap-1.5 bg-green-500/10 rounded-full px-3 py-1.5"
                whileHover={{ scale: 1.05 }}
              >
                <Shield className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-medium text-green-600">
                  {language === 'TR' ? 'Ücretsiz İptal' : 'Free Cancellation'}
                </span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-1.5 bg-yellow-500/10 rounded-full px-3 py-1.5"
                whileHover={{ scale: 1.05 }}
              >
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-medium text-yellow-600">4.9/5 (2,500+)</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5"
                whileHover={{ scale: 1.05 }}
              >
                <Check className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {language === 'TR' ? 'Sabit Fiyat' : 'Fixed Price'}
                </span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Mobile Visual Section - Shows below form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="order-2 md:hidden"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              {/* Mobile Video/Image */}
              <div className="relative h-40">
                {videosLoaded && cityVideos.length > 0 ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.video
                        key={`mobile-${currentVideoIndex}`}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <source src={cityVideos[currentVideoIndex].src} type="video/mp4" />
                      </motion.video>
                    </AnimatePresence>
                    
                    {/* City label */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
                      <Globe className="h-2.5 w-2.5 text-white" />
                      <span className="text-[10px] text-white font-medium">
                        {language === 'TR' ? cityVideos[currentVideoIndex].labelTR : cityVideos[currentVideoIndex].label}
                      </span>
                    </div>
                  </>
                ) : (
                  <img
                    src={heroMercedes}
                    alt="VIP Transfer"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                {/* Mobile Overlay Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="text-white">
                    <h3 className="text-sm font-bold mb-1">{t("premiumFleet") || "Premium Mercedes Fleet"}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      <div className="flex items-center gap-1 text-[10px] bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                        <Wifi className="h-2.5 w-2.5" />
                        <span>WiFi</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                        <Baby className="h-2.5 w-2.5" />
                        <span>{language === 'TR' ? 'Bebek Koltuğu' : 'Baby Seat'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                        <Briefcase className="h-2.5 w-2.5" />
                        <span>Meet & Greet</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mobile Stats Row */}
              <div className="flex items-center justify-around bg-card p-3 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">100+</div>
                    <div className="text-[9px] text-muted-foreground">{t("cities") || "Cities"}</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                    <Plane className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">670+</div>
                    <div className="text-[9px] text-muted-foreground">{t("airports") || "Airports"}</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">4.9</div>
                    <div className="text-[9px] text-muted-foreground">Google</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Visual (Tablet: 2 cols compact, Desktop: full) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-3 hidden md:block md:col-span-2 lg:col-span-1"
          >
            <div className="relative">
              {/* Main Video/Image with Overlay */}
              <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl">
                {videosLoaded && cityVideos.length > 0 ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.video
                        key={`desktop-${currentVideoIndex}`}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-48 md:h-56 lg:h-80 object-cover"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                      >
                        <source src={cityVideos[currentVideoIndex].src} type="video/mp4" />
                      </motion.video>
                    </AnimatePresence>
                    
                    {/* City label indicator */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <Globe className="h-3 w-3 text-white" />
                      <span className="text-xs text-white font-medium">
                        {language === 'TR' ? cityVideos[currentVideoIndex].labelTR : cityVideos[currentVideoIndex].label}
                      </span>
                    </div>
                  </>
                ) : (
                  <img
                    src={heroMercedes}
                    alt="VIP Transfer"
                    className="w-full h-48 md:h-56 lg:h-80 object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Overlay Content - Compact on tablet */}
                <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-6">
                  <div className="text-white">
                    <h3 className="text-sm lg:text-lg font-bold mb-1 lg:mb-2">{t("premiumFleet") || "Premium Mercedes Fleet"}</h3>
                    <div className="flex flex-wrap gap-1.5 lg:gap-3">
                      <div className="flex items-center gap-1 text-xs lg:text-sm bg-white/20 backdrop-blur-sm rounded-full px-2 lg:px-3 py-0.5 lg:py-1">
                        <Wifi className="h-3 lg:h-3.5 w-3 lg:w-3.5" />
                        <span className="hidden lg:inline">Free WiFi</span>
                        <span className="lg:hidden">WiFi</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs lg:text-sm bg-white/20 backdrop-blur-sm rounded-full px-2 lg:px-3 py-0.5 lg:py-1">
                        <Baby className="h-3 lg:h-3.5 w-3 lg:w-3.5" />
                        <span className="hidden lg:inline">{language === 'TR' ? 'Bebek Koltuğu' : 'Baby Seat'}</span>
                        <span className="lg:hidden">{language === 'TR' ? 'Koltuk' : 'Seat'}</span>
                      </div>
                      <div className="hidden lg:flex items-center gap-1.5 text-sm bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>Meet & Greet</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats Cards - Smaller on tablet */}
              <motion.div 
                className="absolute -top-2 lg:-top-4 -right-2 lg:-right-4 bg-card rounded-lg lg:rounded-xl shadow-xl p-2 lg:p-4 border border-border/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-7 h-7 lg:w-10 lg:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="h-3.5 lg:h-5 w-3.5 lg:w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-base lg:text-xl font-bold text-foreground">100+</div>
                    <div className="text-[10px] lg:text-xs text-muted-foreground">{t("cities") || "Cities"}</div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="absolute -bottom-2 lg:-bottom-4 -left-2 lg:-left-4 bg-card rounded-lg lg:rounded-xl shadow-xl p-2 lg:p-4 border border-border/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-7 h-7 lg:w-10 lg:h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Plane className="h-3.5 lg:h-5 w-3.5 lg:w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-base lg:text-xl font-bold text-foreground">670+</div>
                    <div className="text-[10px] lg:text-xs text-muted-foreground">{t("airports") || "Airports"}</div>
                  </div>
                </div>
              </motion.div>

              {/* Right stat - Hidden on tablet, visible on desktop */}
              <motion.div 
                className="absolute top-1/2 -right-6 bg-card rounded-xl shadow-xl p-4 border border-border/50 hidden lg:block"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">4.9</div>
                    <div className="text-xs text-muted-foreground">Google</div>
                  </div>
                </div>
              </motion.div>

              {/* Destination Cities Row */}
              <div className="mt-4 lg:mt-6 hidden lg:block">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium">{t("serviceLocations") || "We Serve"}:</span>
                  <span>Istanbul • Antalya • Bodrum • Dalaman • İzmir • Dubai • Cyprus</span>
                </div>
              </div>

              {/* Feature List - Compact grid on tablet */}
              <div className="mt-4 lg:mt-6 grid grid-cols-2 gap-2 lg:gap-3">
                <div className="flex items-center gap-1.5 lg:gap-2 bg-card/80 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-3 border border-border/30">
                  <Check className="h-3 lg:h-4 w-3 lg:w-4 text-green-500 flex-shrink-0" />
                  <span className="text-[10px] lg:text-sm text-foreground truncate">{t("freeCancellation") || "Free Cancel"}</span>
                </div>
                <div className="flex items-center gap-1.5 lg:gap-2 bg-card/80 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-3 border border-border/30">
                  <Check className="h-3 lg:h-4 w-3 lg:w-4 text-green-500 flex-shrink-0" />
                  <span className="text-[10px] lg:text-sm text-foreground truncate">{t("flightTracking") || "Flight Track"}</span>
                </div>
                <div className="flex items-center gap-1.5 lg:gap-2 bg-card/80 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-3 border border-border/30">
                  <Check className="h-3 lg:h-4 w-3 lg:w-4 text-green-500 flex-shrink-0" />
                  <span className="text-[10px] lg:text-sm text-foreground truncate">{t("noHiddenFees") || "No Hidden Fees"}</span>
                </div>
                <div className="flex items-center gap-1.5 lg:gap-2 bg-card/80 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-3 border border-border/30">
                  <Check className="h-3 lg:h-4 w-3 lg:w-4 text-green-500 flex-shrink-0" />
                  <span className="text-[10px] lg:text-sm text-foreground truncate">24/7 {t("support") || "Support"}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Vehicle Detail Modal */}
      <Suspense fallback={null}>
        <VehicleDetailModal
          vehicle={selectedVehicleForDetail}
          isOpen={isVehicleDetailOpen}
          onClose={() => setIsVehicleDetailOpen(false)}
          onSelect={() => {
            if (selectedVehicleForDetail) {
              if (detailModalContext === 'ride') {
                setVehicleType(selectedVehicleForDetail.value);
              } else {
                setHourlyVehicleType(selectedVehicleForDetail.value);
              }
            }
          }}
          isSelected={
            selectedVehicleForDetail 
              ? (detailModalContext === 'ride' 
                  ? vehicleType === selectedVehicleForDetail.value 
                  : hourlyVehicleType === selectedVehicleForDetail.value)
              : false
          }
          price={
            selectedVehicleForDetail
              ? (detailModalContext === 'ride'
                  ? allVehiclePrices.find(v => v.vehicleType === selectedVehicleForDetail.value)?.price
                  : allHourlyPrices.find(v => v.vehicleType === selectedVehicleForDetail.value)?.price)
              : undefined
          }
          currency={detailModalContext === 'ride' ? transferPriceCurrency : (allHourlyPrices[0]?.currency || "EUR")}
          isTurkish={language === 'TR'}
        />
      </Suspense>
    </section>
  );
};
