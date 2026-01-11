import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, CalendarIcon, Clock, ArrowRight, Loader2, Car, Timer, ArrowUpDown, Users, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { GooglePlacesAutocomplete, PlaceDetails, GooglePlacesAutocompleteProps } from "@/components/ui/google-places-autocomplete";
import { cn } from "@/lib/utils";
import meetTransferLogo from "@/assets/meet-transfer-logo-small.webp";
import CityMarquee from "@/components/website/CityMarquee";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VEHICLE_TYPES, isMinibusRequired } from "@/lib/vehicleTypes";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

// Hourly rental duration options
const hourlyDurationOptions = [
  { value: "4", label: "4 hours" },
  { value: "6", label: "6 hours" },
  { value: "8", label: "8 hours" },
  { value: "10", label: "10 hours" },
  { value: "12", label: "12 hours" },
];

export const Hero = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
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
  const [hourlyVehicleType, setHourlyVehicleType] = useState("vito");
  const [hourlyDatePopoverOpen, setHourlyDatePopoverOpen] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [cityDurations, setCityDurations] = useState<Record<string, string[]>>({});
  const [loadingCities, setLoadingCities] = useState(false);
  const [allHourlyPrices, setAllHourlyPrices] = useState<Array<{ vehicleType: string; price: number; currency: string }>>([]);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Fetch available cities and their durations from hourly_rental_prices
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
        
        // Get unique cities
        const uniqueCities = [...new Set(data?.map(item => item.city) || [])];
        setAvailableCities(uniqueCities);
        
        // Build city -> durations map
        const durationsMap: Record<string, string[]> = {};
        data?.forEach(item => {
          if (!durationsMap[item.city]) {
            durationsMap[item.city] = [];
          }
          // Extract hours from duration_type (e.g., "4h" -> "4" or "4_hours" -> "4")
          // Skip "custom" duration type for the hero form
          if (item.duration_type === "custom") return;
          const hours = item.duration_type.replace("_hours", "").replace("h", "");
          if (!durationsMap[item.city].includes(hours)) {
            durationsMap[item.city].push(hours);
          }
        });
        
        // Sort durations numerically for each city
        Object.keys(durationsMap).forEach(city => {
          durationsMap[city].sort((a, b) => parseInt(a) - parseInt(b));
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

  // Fetch transfer price when pickup and dropoff are selected
  useEffect(() => {
    const fetchTransferPrice = async () => {
      if (!pickup || !dropoff) {
        setAllVehiclePrices([]);
        return;
      }

      setLoadingTransferPrice(true);
      try {
        const { data, error } = await supabase.functions.invoke("get-all-vehicle-prices", {
          body: {
            pickup,
            dropoff,
            customerCurrency: "EUR",
          },
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

    // Debounce the fetch
    const timer = setTimeout(fetchTransferPrice, 500);
    return () => clearTimeout(timer);
  }, [pickup, dropoff]);

  // Get available durations for selected city
  const availableDurations = hourlyCity ? (cityDurations[hourlyCity] || []) : [];
  
  // Reset duration when city changes if current duration is not available
  useEffect(() => {
    if (hourlyCity && availableDurations.length > 0) {
      if (!availableDurations.includes(hourlyDuration)) {
        setHourlyDuration(availableDurations[0]);
      }
    } else if (!hourlyCity) {
      setHourlyDuration("");
    }
    // Reset prices when city changes
    setAllHourlyPrices([]);
  }, [hourlyCity, availableDurations]);

  // Auto-select appropriate vehicle when passenger count changes (Transfer form)
  useEffect(() => {
    const passengerCount = parseInt(passengers);
    const currentVehicle = VEHICLE_TYPES.find(v => v.value === vehicleType);
    
    // If current vehicle can't fit passengers, switch to a suitable one
    if (currentVehicle && currentVehicle.passengers < passengerCount) {
      const suitableVehicle = VEHICLE_TYPES.find(v => v.passengers >= passengerCount);
      if (suitableVehicle) {
        setVehicleType(suitableVehicle.value);
      }
    }
  }, [passengers]);

  // Auto-select appropriate vehicle when passenger count changes (Hourly form)
  useEffect(() => {
    const passengerCount = parseInt(hourlyPassengers);
    const currentVehicle = VEHICLE_TYPES.find(v => v.value === hourlyVehicleType);
    
    // If current vehicle can't fit passengers, switch to a suitable one
    if (currentVehicle && currentVehicle.passengers < passengerCount) {
      const suitableVehicle = VEHICLE_TYPES.find(v => v.passengers >= passengerCount && v.value !== 'minibus');
      if (suitableVehicle) {
        setHourlyVehicleType(suitableVehicle.value);
      }
    }
  }, [hourlyPassengers]);

  // Fetch all vehicle prices when city and duration are selected
  useEffect(() => {
    const fetchAllPrices = async () => {
      if (!hourlyCity || !hourlyDuration) {
        setAllHourlyPrices([]);
        return;
      }

      setLoadingPrice(true);
      try {
        // Try both formats: "4h" and "4_hours"
        const durationKeyShort = `${hourlyDuration}h`;
        const durationKeyLong = `${hourlyDuration}_hours`;
        
        // Fetch all vehicle types for this city and duration
        const { data: shortData, error: shortError } = await supabase
          .from("hourly_rental_prices")
          .select("vehicle_type, price, price_currency")
          .eq("city", hourlyCity)
          .eq("duration_type", durationKeyShort)
          .eq("is_active", true);
        
        const { data: longData, error: longError } = await supabase
          .from("hourly_rental_prices")
          .select("vehicle_type, price, price_currency")
          .eq("city", hourlyCity)
          .eq("duration_type", durationKeyLong)
          .eq("is_active", true);
        
        // Combine results, preferring short format
        const combinedData = [...(shortData || []), ...(longData || [])];
        
        // Map to vehicle types, removing duplicates
        const vehiclePriceMap = new Map<string, { price: number; currency: string }>();
        combinedData.forEach(item => {
          if (!vehiclePriceMap.has(item.vehicle_type)) {
            vehiclePriceMap.set(item.vehicle_type, {
              price: item.price,
              currency: item.price_currency
            });
          }
        });
        
        // Convert to array with mapped vehicle types
        const prices: Array<{ vehicleType: string; price: number; currency: string }> = [];
        
        // Map database vehicle types to our VEHICLE_TYPES
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
        
        vehiclePriceMap.forEach((value, key) => {
          const mappedType = vehicleTypeMapping[key] || key;
          prices.push({
            vehicleType: mappedType,
            price: value.price,
            currency: value.currency
          });
        });
        
        setAllHourlyPrices(prices);
      } catch (error) {
        console.error("Error fetching hourly prices:", error);
        setAllHourlyPrices([]);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchAllPrices();
  }, [hourlyCity, hourlyDuration]);

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
    params.set("duration", hourlyDuration);
    params.set("passengers", hourlyPassengers);
    params.set("vehicleType", hourlyVehicleType);
    params.set("type", "hourly");
    
    navigate(`/book?${params.toString()}`);
  };

  const handlePickupSelected = (value: string, details?: PlaceDetails) => {
    setPickup(details?.displayText || value);
  };

  const handleDropoffSelected = (value: string, details?: PlaceDetails) => {
    setDropoff(details?.displayText || value);
  };

  const handleHourlyCitySelected = (value: string, details?: PlaceDetails) => {
    setHourlyCity(details?.displayText || value);
  };
  
  return (
    <section id="booking-form" className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaC0ydjJoMnYtMmgydi0yaC0yem0tMiAydi0yaC0ydjJoMnptMi0yaDJ2LTJoLTJ2MnptLTItNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0yLTJoMnYtMmgtMnYyem0tMiAydjJoLTJ2Mmgydi0yaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
      
      <div className="container relative z-10 px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src={meetTransferLogo} 
              alt="Meet Transfer Logo" 
              width={120}
              height={120}
              loading="eager"
              decoding="async"
              className="h-28 w-28 md:h-36 md:w-36 rounded-full object-cover shadow-2xl ring-4 ring-white/20"
            />
          </div>
          
          {/* City Marquee Animation */}
          <CityMarquee />
          
          {/* Hero Text */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-xl mx-auto font-sans">
              {t("heroSubtitle")}
            </p>
          </div>

          {/* Booking Form with Tabs */}
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl mx-auto overflow-hidden">
            {/* Tab Switcher */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("ride")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-4 px-6 font-semibold transition-all relative",
                  activeTab === "ride"
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Car className="h-5 w-5" />
                <span>{t("pointToPoint") || "Transfer"}</span>
                {activeTab === "ride" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("hourly")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-4 px-6 font-semibold transition-all relative",
                  activeTab === "hourly"
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Timer className="h-5 w-5" />
                <span>{t("perHour") || "Per Hour"}</span>
                {activeTab === "hourly" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 md:p-8">
              {activeTab === "ride" ? (
                /* Ride Form */
                <div className="space-y-4">
                  {/* Location Fields */}
                  <div className="relative">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("pickupPoint")}</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
                          <GooglePlacesAutocomplete 
                            onPlaceSelected={handlePickupSelected} 
                            placeholder={t("enterPickupPoint") || "Airport, hotel, address..."} 
                            className="pl-10 h-14 bg-muted/50 border-2 border-transparent focus:border-primary text-foreground placeholder:text-muted-foreground rounded-xl transition-all"
                            value={pickup}
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("dropoffLocation")}</label>
                        <div className="relative">
                          <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-accent z-10" />
                          <GooglePlacesAutocomplete 
                            onPlaceSelected={handleDropoffSelected} 
                            placeholder={t("hotelOrAddress") || "Where to?"} 
                            className="pl-10 h-14 bg-muted/50 border-2 border-transparent focus:border-accent text-foreground placeholder:text-muted-foreground rounded-xl transition-all"
                            value={dropoff}
                          />
                        </div>
                      </div>
                    </div>
                    {/* Swap Button - Mobile: bottom right, Desktop: center between fields */}
                    <button
                      type="button"
                      onClick={() => {
                        const temp = pickup;
                        setPickup(dropoff);
                        setDropoff(temp);
                      }}
                      disabled={!pickup && !dropoff}
                      className={cn(
                        "z-20 flex items-center justify-center",
                        "w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg",
                        "hover:bg-primary/90 hover:scale-110 active:scale-95",
                        "transition-all duration-200",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                        // Mobile: positioned below the fields, centered
                        "relative mx-auto -mt-2 mb-2 md:mt-0 md:mb-0",
                        // Desktop: absolute center between fields
                        "md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:mx-0"
                      )}
                      title={t("swapLocations") || "Swap locations"}
                    >
                      <ArrowUpDown className="h-4 w-4 md:rotate-0 rotate-90" />
                    </button>
                  </div>

                  {/* Date, Time & Passengers - 2 rows on mobile, 3 cols on desktop */}
                  <div className="space-y-4 md:space-y-0">
                    {/* First row: Date & Time */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("pickupDate")}</label>
                        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              className={cn(
                                "w-full h-14 justify-start text-left font-normal bg-muted/50 border-2 border-transparent hover:border-primary/50 text-foreground rounded-xl transition-all",
                                !date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                              <span className="truncate">{date ? format(date, "dd MMM") : t("selectDate")}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-50" align="start">
                            <Calendar 
                              mode="single" 
                              selected={date} 
                              onSelect={(selectedDate) => { setDate(selectedDate); setDatePopoverOpen(false); }} 
                              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
                              initialFocus 
                              className="p-3 pointer-events-auto" 
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="relative">
                        <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("pickupTime")}</label>
                        <Select value={time} onValueChange={setTime}>
                          <SelectTrigger className="w-full h-14 bg-muted/50 border-2 border-transparent hover:border-primary/50 text-foreground rounded-xl transition-all">
                            <div className="flex items-center">
                              <Clock className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                              <SelectValue placeholder={t("selectTime")} />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] z-50">
                            {timeOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Passengers - hidden on mobile, shown on desktop in same row */}
                      <div className="relative hidden md:block">
                        <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("passengers") || "Passengers"}</label>
                        <Select value={passengers} onValueChange={setPassengers}>
                          <SelectTrigger className="w-full h-14 bg-muted/50 border-2 border-transparent hover:border-primary/50 text-foreground rounded-xl transition-all">
                            <div className="flex items-center">
                              <Users className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] z-50">
                            {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? (t("passenger") || "passenger") : (t("passengers") || "passengers")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Second row: Passengers - shown only on mobile */}
                    <div className="md:hidden">
                      <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("passengers") || "Passengers"}</label>
                      <Select value={passengers} onValueChange={setPassengers}>
                        <SelectTrigger className="w-full h-14 bg-muted/50 border-2 border-transparent hover:border-primary/50 text-foreground rounded-xl transition-all">
                          <div className="flex items-center">
                            <Users className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] z-50">
                          {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? (t("passenger") || "passenger") : (t("passengers") || "passengers")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Vehicle Type Selection */}
                  <div>
                    <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("vehicleType") || "Vehicle Type"}</label>
                    {isMinibusRequired(parseInt(passengers), 0) && (
                      <p className="text-xs text-amber-600 mb-2">
                        {t("minibusRequiredForPassengers") || "Sprinter minibus is required for 7+ passengers"}
                      </p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {VEHICLE_TYPES.map((vehicle) => {
                        const vehiclePrice = allVehiclePrices.find(v => v.vehicleType === vehicle.value);
                        const isSelected = vehicleType === vehicle.value;
                        const passengerCount = parseInt(passengers);
                        const isDisabled = vehicle.passengers < passengerCount;
                        const isOnlyOption = isMinibusRequired(passengerCount, 0) && vehicle.value === 'minibus';
                        const vehicleImages = vehicle.images?.slice(0, 4) || [];
                        
                        return (
                          <div
                            key={vehicle.value}
                            className={cn(
                              "relative rounded-xl border-2 transition-all overflow-hidden",
                              isDisabled
                                ? "border-border bg-muted/20 opacity-50 cursor-not-allowed"
                                : isSelected
                                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                  : "border-border hover:border-primary/50 bg-muted/30",
                              isOnlyOption && "ring-2 ring-amber-400/50"
                            )}
                          >
                            {/* Image Carousel */}
                            {vehicleImages.length > 0 && (
                              <div className="relative group">
                                <Carousel className="w-full">
                                  <CarouselContent>
                                    {vehicleImages.map((image, imgIdx) => (
                                      <CarouselItem key={imgIdx}>
                                        <div className="aspect-[16/10] overflow-hidden">
                                          <img
                                            src={image.src}
                                            alt={image.alt}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      </CarouselItem>
                                    ))}
                                  </CarouselContent>
                                  {vehicleImages.length > 1 && (
                                    <>
                                      <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </>
                                  )}
                                </Carousel>
                                {vehicleImages.length > 1 && (
                                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                    1/{vehicleImages.length}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Vehicle Info */}
                            <button
                              type="button"
                              onClick={() => !isDisabled && setVehicleType(vehicle.value)}
                              disabled={isDisabled}
                              className="w-full p-2 text-left"
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                {vehicle.value === 'maybach-minibus' ? (
                                  <Sparkles className={cn("h-3 w-3", isDisabled ? "text-muted-foreground" : "text-amber-500")} />
                                ) : vehicle.value === 'vip-mercedes' ? (
                                  <Sparkles className={cn("h-3 w-3", isDisabled ? "text-muted-foreground" : "text-purple-500")} />
                                ) : (
                                  <Car className={cn("h-3 w-3", isDisabled ? "text-muted-foreground" : "text-primary")} />
                                )}
                                <span className={cn("font-medium text-xs truncate", isDisabled && "text-muted-foreground")}>
                                  {vehicle.label}
                                </span>
                              </div>
                              <div className={cn("text-[10px] mb-0.5", isDisabled ? "text-red-400" : "text-muted-foreground")}>
                                {isDisabled ? (
                                  <>{t("maxPassengers") || "Max"} {vehicle.passengers}</>
                                ) : (
                                  <>{vehicle.passengers} {t("passengers") || "pax"}</>
                                )}
                              </div>
                              {loadingTransferPrice ? (
                                <div className="h-4">
                                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                </div>
                              ) : vehiclePrice && !isDisabled ? (
                                <div className="text-base font-bold text-primary">
                                  {transferPriceCurrency === "EUR" ? "€" : transferPriceCurrency === "USD" ? "$" : transferPriceCurrency === "GBP" ? "£" : "₺"}
                                  {vehiclePrice.price}
                                </div>
                              ) : pickup && dropoff && !isDisabled ? (
                                <div className="text-[10px] text-muted-foreground">-</div>
                              ) : null}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Continue Button */}
                  <Button 
                    onClick={handleRideContinue} 
                    size="lg" 
                    variant="accent" 
                    className="w-full text-lg h-14 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t("loading") || "Loading..."}
                      </>
                    ) : (
                      <>
                        {t("getPrice") || "Get Price"}
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                /* Hourly Rental Form */
                <div className="space-y-4">
                  {/* City & Duration */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("city") || "City"}</label>
                      <Select value={hourlyCity} onValueChange={setHourlyCity}>
                        <SelectTrigger className="w-full h-14 bg-muted/50 border-2 border-transparent hover:border-primary/50 text-foreground rounded-xl transition-all">
                          <div className="flex items-center">
                            <MapPin className="mr-2 h-5 w-5 text-primary" />
                            <SelectValue placeholder={loadingCities ? (t("loading") || "Loading...") : (t("selectCity") || "Select city")} />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="z-50 max-h-[300px]">
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("duration") || "Duration"}</label>
                      <Select 
                        value={hourlyDuration} 
                        onValueChange={setHourlyDuration}
                        disabled={!hourlyCity || availableDurations.length === 0}
                      >
                        <SelectTrigger className="w-full h-14 bg-muted/50 border-2 border-transparent hover:border-primary/50 text-foreground rounded-xl transition-all disabled:opacity-50">
                          <div className="flex items-center">
                            <Timer className="mr-2 h-5 w-5 text-primary" />
                            <SelectValue placeholder={!hourlyCity ? (t("selectCityFirst") || "Select city first") : (t("selectDuration") || "Select duration")} />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="z-50">
                          {availableDurations.map((hours) => (
                            <SelectItem key={hours} value={hours}>
                              {hours} {t("hours") || "hours"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date, Time & Passengers - 2 rows on mobile, 3 cols on desktop */}
                  <div className="space-y-4 md:space-y-0">
                    {/* First row: Date & Time */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("pickupDate")}</label>
                        <Popover open={hourlyDatePopoverOpen} onOpenChange={setHourlyDatePopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              className={cn(
                                "w-full h-14 justify-start text-left font-normal bg-muted/50 border-2 border-transparent hover:border-primary/50 text-foreground rounded-xl transition-all",
                                !hourlyDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                              <span className="truncate">{hourlyDate ? format(hourlyDate, "dd MMM") : t("selectDate")}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-50" align="start">
                            <Calendar 
                              mode="single" 
                              selected={hourlyDate} 
                              onSelect={(selectedDate) => { setHourlyDate(selectedDate); setHourlyDatePopoverOpen(false); }} 
                              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
                              initialFocus 
                              className="p-3 pointer-events-auto" 
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="relative">
                        <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("pickupTime")}</label>
                        <Select value={hourlyTime} onValueChange={setHourlyTime}>
                          <SelectTrigger className="w-full h-14 bg-muted/50 border-2 border-transparent hover:border-primary/50 text-foreground rounded-xl transition-all">
                            <div className="flex items-center">
                              <Clock className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                              <SelectValue placeholder={t("selectTime")} />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] z-50">
                            {timeOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Passengers - hidden on mobile, shown on desktop in same row */}
                      <div className="relative hidden md:block">
                        <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("passengers") || "Passengers"}</label>
                        <Select value={hourlyPassengers} onValueChange={setHourlyPassengers}>
                          <SelectTrigger className="w-full h-14 bg-muted/50 border-2 border-transparent hover:border-primary/50 text-foreground rounded-xl transition-all">
                            <div className="flex items-center">
                              <Users className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] z-50">
                            {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? (t("passenger") || "passenger") : (t("passengers") || "passengers")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Second row: Passengers - shown only on mobile */}
                    <div className="md:hidden">
                      <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("passengers") || "Passengers"}</label>
                      <Select value={hourlyPassengers} onValueChange={setHourlyPassengers}>
                        <SelectTrigger className="w-full h-14 bg-muted/50 border-2 border-transparent hover:border-primary/50 text-foreground rounded-xl transition-all">
                          <div className="flex items-center">
                            <Users className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] z-50">
                          {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? (t("passenger") || "passenger") : (t("passengers") || "passengers")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Vehicle Type Selection with Prices */}
                  {(hourlyCity && hourlyDuration) && (
                    <div>
                      <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("vehicleType") || "Vehicle Type"}</label>
                      {parseInt(hourlyPassengers) > 6 && (
                        <p className="text-xs text-amber-600 mb-2">
                          {t("hourlyMaxPassengers") || "Hourly rental is available for up to 6 passengers"}
                        </p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {VEHICLE_TYPES.filter(v => v.value !== 'minibus').map((vehicle) => {
                          const vehiclePrice = allHourlyPrices.find(v => v.vehicleType === vehicle.value);
                          const isSelected = hourlyVehicleType === vehicle.value;
                          const passengerCount = parseInt(hourlyPassengers);
                          const isDisabled = vehicle.passengers < passengerCount;
                          const vehicleImages = vehicle.images?.slice(0, 4) || [];
                          
                          return (
                            <div
                              key={vehicle.value}
                              className={cn(
                                "relative rounded-xl border-2 transition-all overflow-hidden",
                                isDisabled
                                  ? "border-border bg-muted/20 opacity-50 cursor-not-allowed"
                                  : isSelected
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                    : "border-border hover:border-primary/50 bg-muted/30"
                              )}
                            >
                              {/* Image Carousel */}
                              {vehicleImages.length > 0 && (
                                <div className="relative group">
                                  <Carousel className="w-full">
                                    <CarouselContent>
                                      {vehicleImages.map((image, imgIdx) => (
                                        <CarouselItem key={imgIdx}>
                                          <div className="aspect-[16/10] overflow-hidden">
                                            <img
                                              src={image.src}
                                              alt={image.alt}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        </CarouselItem>
                                      ))}
                                    </CarouselContent>
                                    {vehicleImages.length > 1 && (
                                      <>
                                        <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </>
                                    )}
                                  </Carousel>
                                  {vehicleImages.length > 1 && (
                                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                      1/{vehicleImages.length}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Vehicle Info */}
                              <button
                                type="button"
                                onClick={() => !isDisabled && setHourlyVehicleType(vehicle.value)}
                                disabled={isDisabled}
                                className="w-full p-2 text-left"
                              >
                                <div className="flex items-center gap-1 mb-0.5">
                                  {vehicle.value === 'maybach-minibus' ? (
                                    <Sparkles className={cn("h-3 w-3", isDisabled ? "text-muted-foreground" : "text-amber-500")} />
                                  ) : vehicle.value === 'vip-mercedes' ? (
                                    <Sparkles className={cn("h-3 w-3", isDisabled ? "text-muted-foreground" : "text-purple-500")} />
                                  ) : (
                                    <Car className={cn("h-3 w-3", isDisabled ? "text-muted-foreground" : "text-primary")} />
                                  )}
                                  <span className={cn("font-medium text-xs truncate", isDisabled && "text-muted-foreground")}>
                                    {vehicle.label}
                                  </span>
                                </div>
                                <div className={cn("text-[10px] mb-0.5", isDisabled ? "text-red-400" : "text-muted-foreground")}>
                                  {isDisabled ? (
                                    <>{t("maxPassengers") || "Max"} {vehicle.passengers}</>
                                  ) : (
                                    <>{vehicle.passengers} {t("passengers") || "pax"}</>
                                  )}
                                </div>
                                {loadingPrice ? (
                                  <div className="h-4">
                                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                  </div>
                                ) : vehiclePrice && !isDisabled ? (
                                  <div className="text-base font-bold text-primary">
                                    {vehiclePrice.currency === "EUR" ? "€" : vehiclePrice.currency === "USD" ? "$" : vehiclePrice.currency === "GBP" ? "£" : "₺"}
                                    {vehiclePrice.price}
                                  </div>
                                ) : !isDisabled ? (
                                  <div className="text-[10px] text-muted-foreground">-</div>
                                ) : null}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="space-y-3">
                    <div className="bg-accent/10 rounded-xl p-4 text-left">
                      <p className="text-sm text-accent font-medium flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        {t("hourlyRentalInfo") || "Driver at your disposal for the selected duration. Visit multiple locations!"}
                      </p>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <Button 
                    onClick={handleHourlyContinue} 
                    size="lg" 
                    variant="accent" 
                    className="w-full text-lg h-14 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t("loading") || "Loading..."}
                      </>
                    ) : (
                      <>
                        {t("getHourlyPrice") || "Get Hourly Price"}
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 pt-4 text-white/80 text-sm font-sans">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span>{t("service247") || "24/7 Service"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span>{t("professionalDrivers") || "Professional Drivers"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span>{t("luxuryFleet") || "Luxury Fleet"}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" fillOpacity="1" />
        </svg>
      </div>
    </section>
  );
};
