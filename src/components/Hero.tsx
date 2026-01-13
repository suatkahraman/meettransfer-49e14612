import { useState, useEffect, useCallback, useRef } from "react";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, CalendarIcon, Clock, ArrowRight, Loader2, Car, Timer, ArrowUpDown, Users, Sparkles, Shield, Star, Plane, Globe, Check, Wifi, Baby, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePromo, getLocalizedDiscountText } from "@/contexts/PromoContext";
import { GooglePlacesAutocomplete, PlaceDetails } from "@/components/ui/google-places-autocomplete";
import { cn } from "@/lib/utils";
import meetTransferLogo from "@/assets/meet-transfer-logo-small.webp";
import heroMercedes from "@/assets/hero-mercedes-vito.jpg";
import CityMarquee from "@/components/website/CityMarquee";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VEHICLE_TYPES, isMinibusRequired } from "@/lib/vehicleTypes";
import BookingChatAssistant from "@/components/website/BookingChatAssistant";
import { CompactRouteMap } from "@/components/ui/compact-route-map";
import { motion, useScroll, useTransform } from "framer-motion";

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
  const { promoCode: activePromo } = usePromo();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  
  // Parallax effect
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"ride" | "hourly">("ride");
  
  // Ride form state
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [passengers, setPassengers] = useState("2");
  const [vehicleType, setVehicleType] = useState("mercedes-vito");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [allVehiclePrices, setAllVehiclePrices] = useState<any[]>([]);
  const [transferPriceCurrency, setTransferPriceCurrency] = useState<string>("EUR");
  const [loadingTransferPrice, setLoadingTransferPrice] = useState(false);

  // Hourly form state
  const [hourlyCity, setHourlyCity] = useState("");
  const [hourlyDate, setHourlyDate] = useState<Date | undefined>(undefined);
  const [hourlyTime, setHourlyTime] = useState("");
  const [hourlyDuration, setHourlyDuration] = useState("");
  const [hourlyPassengers, setHourlyPassengers] = useState("2");
  const [hourlyVehicleType, setHourlyVehicleType] = useState("mercedes-vito");
  const [hourlyDatePopoverOpen, setHourlyDatePopoverOpen] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [cityDurations, setCityDurations] = useState<Record<string, string[]>>({});
  const [loadingCities, setLoadingCities] = useState(false);
  const [allHourlyPrices, setAllHourlyPrices] = useState<Array<{ vehicleType: string; price: number; currency: string }>>([]);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [customHours, setCustomHours] = useState("9");
  const [hourlyCurrency, setHourlyCurrency] = useState<string>("EUR");
  const [convertingHourlyPrices, setConvertingHourlyPrices] = useState(false);
  const [originalHourlyPrices, setOriginalHourlyPrices] = useState<Array<{ vehicleType: string; price: number; currency: string }>>([]);

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
      {/* Parallax Background */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
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
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={meetTransferLogo} 
                alt="Meet Transfer" 
                width={48}
                height={48}
                loading="eager"
                className="h-12 w-12 rounded-full object-cover shadow-lg ring-2 ring-primary/20"
              />
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                  {t("heroTitle")}
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {getLocalizedDiscountText(activePromo.discountPercentage, activePromo.code, language, activePromo.validUntil).heroSubtitle}
                </p>
              </div>
            </div>

            {/* AI Assistant - Compact on mobile */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>{t("bookTransferOrHourlyWithAI") || "Book with AI"}</span>
              </div>
              <BookingChatAssistant onApplyBooking={handleApplyBooking} />
            </div>

            {/* Booking Form Card */}
            <div className="bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden backdrop-blur-sm">
              {/* Tabs */}
              <div className="flex bg-muted/50">
                <button
                  onClick={() => setActiveTab("ride")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-3 px-4 font-medium transition-all text-sm",
                    activeTab === "ride" ? "text-primary bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Car className="h-4 w-4" />
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
                  <Timer className="h-4 w-4" />
                  <span className="hidden xs:inline">{t("perHour") || "Hourly"}</span>
                  <span className="xs:hidden">Hourly</span>
                </button>
              </div>

              {/* Form Content */}
              <div className="p-4 md:p-5">
                {activeTab === "ride" ? (
                  <div className="space-y-3">
                    {/* Locations */}
                    <div className="space-y-2">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
                        <GooglePlacesAutocomplete 
                          onPlaceSelected={handlePickupSelected} 
                          placeholder={t("enterPickupPoint") || "Pickup location"} 
                          className="pl-10 h-11 bg-muted/50 border border-border focus:border-primary rounded-xl text-sm"
                          value={pickup}
                        />
                      </div>
                      
                      <div className="flex justify-center -my-0.5">
                        <button
                          type="button"
                          onClick={() => { const temp = pickup; setPickup(dropoff); setDropoff(temp); }}
                          disabled={!pickup && !dropoff}
                          className="w-7 h-7 rounded-full bg-primary text-primary-foreground shadow hover:scale-110 transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <div className="relative">
                        <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent z-10" />
                        <GooglePlacesAutocomplete 
                          onPlaceSelected={handleDropoffSelected} 
                          placeholder={t("hotelOrAddress") || "Drop-off location"} 
                          className="pl-10 h-11 bg-muted/50 border border-border focus:border-accent rounded-xl text-sm"
                          value={dropoff}
                        />
                      </div>
                      
                      {pickup && dropoff && <CompactRouteMap pickup={pickup} dropoff={dropoff} className="mt-2" />}
                    </div>

                    {/* Date, Time, Passengers */}
                    <div className="grid grid-cols-3 gap-2">
                      <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn(
                            "w-full h-11 justify-start bg-muted/50 border-border rounded-xl text-xs px-2.5",
                            !date && "text-muted-foreground"
                          )}>
                            <CalendarIcon className="mr-1 h-3.5 w-3.5 text-primary" />
                            <span className="truncate">{date ? format(date, "dd MMM") : t("date") || "Date"}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50" align="start">
                          <Calendar mode="single" selected={date} 
                            onSelect={(d) => { setDate(d); setDatePopoverOpen(false); }} 
                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
                            initialFocus className="p-3" 
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Select value={time} onValueChange={setTime}>
                        <SelectTrigger className="h-11 bg-muted/50 border-border rounded-xl text-xs px-2.5">
                          <Clock className="mr-1 h-3.5 w-3.5 text-primary" />
                          <span className="truncate">{time || t("time") || "Time"}</span>
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px] z-50">
                          {timeOptions.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      
                      <Select value={passengers} onValueChange={setPassengers}>
                        <SelectTrigger className="h-11 bg-muted/50 border-border rounded-xl text-xs px-2.5">
                          <Users className="mr-1 h-3.5 w-3.5 text-primary" />
                          <span>{passengers}</span>
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px] z-50">
                          {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>{num} pax</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Vehicle Selection */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {VEHICLE_TYPES.map((vehicle) => {
                        const vehiclePrice = allVehiclePrices.find(v => v.vehicleType === vehicle.value);
                        const isSelected = vehicleType === vehicle.value;
                        const isDisabled = vehicle.passengers < parseInt(passengers);
                        
                        return (
                          <button
                            key={vehicle.value}
                            type="button"
                            onClick={() => !isDisabled && setVehicleType(vehicle.value)}
                            disabled={isDisabled}
                            className={cn(
                              "rounded-lg border p-2 transition-all text-center",
                              isDisabled ? "opacity-40 cursor-not-allowed" : "",
                              isSelected ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-muted/30 hover:border-primary/50"
                            )}
                          >
                            <div className="text-[10px] font-medium truncate">{vehicle.label.split(' ').pop()}</div>
                            {vehiclePrice ? (
                              <div className="text-xs font-bold text-primary">€{vehiclePrice.price}</div>
                            ) : loadingTransferPrice && pickup && dropoff ? (
                              <Loader2 className="h-3 w-3 animate-spin mx-auto text-muted-foreground" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>

                    {/* CTA */}
                    <Button 
                      onClick={handleRideContinue}
                      disabled={submitting}
                      className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 shadow-lg rounded-xl"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <>{t("getQuote") || "Get Quote"} <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                ) : (
                  /* Hourly Form */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={hourlyCity} onValueChange={setHourlyCity}>
                        <SelectTrigger className="h-11 bg-muted/50 border-border rounded-xl text-sm">
                          <MapPin className="mr-1 h-4 w-4 text-primary" />
                          <SelectValue placeholder={t("city") || "City"} />
                        </SelectTrigger>
                        <SelectContent className="z-50 max-h-[250px]">
                          {availableCities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      
                      <Select value={hourlyDuration} onValueChange={setHourlyDuration} disabled={!hourlyCity}>
                        <SelectTrigger className="h-11 bg-muted/50 border-border rounded-xl text-sm disabled:opacity-50">
                          <Timer className="mr-1 h-4 w-4 text-primary" />
                          <SelectValue placeholder={t("duration") || "Duration"} />
                        </SelectTrigger>
                        <SelectContent className="z-50">
                          {availableDurations.map((d) => {
                            const opt = hourlyDurationOptions.find(o => o.value === d);
                            return <SelectItem key={d} value={d}>{opt ? (t(opt.labelKey) || opt.defaultLabel) : `${d}h`}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {hourlyDuration === "custom" && (
                      <Select value={customHours} onValueChange={setCustomHours}>
                        <SelectTrigger className="h-11 bg-muted/50 border-border rounded-xl text-sm">
                          <Timer className="mr-1 h-4 w-4 text-primary" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-50 max-h-[250px]">
                          {Array.from({ length: 16 }, (_, i) => i + 9).map((h) => (
                            <SelectItem key={h} value={h.toString()}>{h} {t("hours") || "hours"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <Popover open={hourlyDatePopoverOpen} onOpenChange={setHourlyDatePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn(
                            "w-full h-11 justify-start bg-muted/50 border-border rounded-xl text-xs px-2.5",
                            !hourlyDate && "text-muted-foreground"
                          )}>
                            <CalendarIcon className="mr-1 h-3.5 w-3.5 text-primary" />
                            <span className="truncate">{hourlyDate ? format(hourlyDate, "dd MMM") : t("date") || "Date"}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50" align="start">
                          <Calendar mode="single" selected={hourlyDate} 
                            onSelect={(d) => { setHourlyDate(d); setHourlyDatePopoverOpen(false); }} 
                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
                            initialFocus className="p-3" 
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Select value={hourlyTime} onValueChange={setHourlyTime}>
                        <SelectTrigger className="h-11 bg-muted/50 border-border rounded-xl text-xs px-2.5">
                          <Clock className="mr-1 h-3.5 w-3.5 text-primary" />
                          <span className="truncate">{hourlyTime || t("time") || "Time"}</span>
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px] z-50">
                          {timeOptions.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      
                      <Select value={hourlyPassengers} onValueChange={setHourlyPassengers}>
                        <SelectTrigger className="h-11 bg-muted/50 border-border rounded-xl text-xs px-2.5">
                          <Users className="mr-1 h-3.5 w-3.5 text-primary" />
                          <span>{hourlyPassengers}</span>
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px] z-50">
                          {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>{num} pax</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {hourlyCity && hourlyDuration && (
                      <div className="grid grid-cols-3 gap-1.5">
                        {VEHICLE_TYPES.filter(v => v.value !== 'minibus').map((vehicle) => {
                          const vehiclePrice = allHourlyPrices.find(v => v.vehicleType === vehicle.value);
                          const isSelected = hourlyVehicleType === vehicle.value;
                          const isDisabled = vehicle.passengers < parseInt(hourlyPassengers);
                          const symbol = vehiclePrice?.currency === "EUR" ? "€" : vehiclePrice?.currency === "USD" ? "$" : vehiclePrice?.currency === "GBP" ? "£" : "₺";
                          
                          return (
                            <button
                              key={vehicle.value}
                              type="button"
                              onClick={() => !isDisabled && setHourlyVehicleType(vehicle.value)}
                              disabled={isDisabled}
                              className={cn(
                                "rounded-lg border p-2 transition-all text-center",
                                isDisabled ? "opacity-40 cursor-not-allowed" : "",
                                isSelected ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-muted/30 hover:border-primary/50"
                              )}
                            >
                              <div className="text-[10px] font-medium truncate">{vehicle.label.split(' ').pop()}</div>
                              {vehiclePrice ? (
                                <div className="text-xs font-bold text-primary">{symbol}{vehiclePrice.price}</div>
                              ) : (loadingPrice || convertingHourlyPrices) ? (
                                <Loader2 className="h-3 w-3 animate-spin mx-auto text-muted-foreground" />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <Button 
                      onClick={handleHourlyContinue}
                      disabled={submitting}
                      className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 shadow-lg rounded-xl"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <>{t("getQuote") || "Get Quote"} <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Badges - Mobile Compact */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-green-500" />
                <span>{t("freeCancellation") || "Free Cancel"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                <span>4.9/5 (2000+)</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-primary" />
                <span>{t("fixedPrices") || "Fixed Price"}</span>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Visual (Tablet: 2 cols compact, Desktop: full) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-2 hidden md:block md:col-span-2 lg:col-span-1"
          >
            <div className="relative">
              {/* Main Image with Overlay */}
              <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl">
                <motion.img 
                  src={heroMercedes}
                  alt="Mercedes Vito VIP Transfer"
                  className="w-full h-48 md:h-56 lg:h-auto object-cover"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1 }}
                />
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
                        <span className="hidden lg:inline">Baby Seat</span>
                        <span className="lg:hidden">Seat</span>
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

              {/* City Marquee Below Image - Hidden on tablet */}
              <div className="mt-4 lg:mt-6 hidden lg:block">
                <CityMarquee />
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
    </section>
  );
};
