import { useState, useEffect, useCallback } from "react";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, CalendarIcon, Clock, ArrowRight, Loader2, Car, Timer, ArrowUpDown, Users, Sparkles, ChevronLeft, ChevronRight, Shield, Star, Plane, Building2, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePromo, getLocalizedDiscountText } from "@/contexts/PromoContext";
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
import Autoplay from "embla-carousel-autoplay";
import BookingChatAssistant from "@/components/website/BookingChatAssistant";
import { CompactRouteMap } from "@/components/ui/compact-route-map";

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
  { value: "4", labelKey: "halfDay", defaultLabel: "4 Hours (Half Day)" },
  { value: "6", labelKey: "sixHours", defaultLabel: "6 Hours" },
  { value: "8", labelKey: "fullDay", defaultLabel: "8 Hours (Full Day)" },
  { value: "custom", labelKey: "customHourly", defaultLabel: "9+ Hours (Custom)" },
];

export const Hero = () => {
  const { t, language } = useLanguage();
  const { promoCode: activePromo } = usePromo();
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
        
        const uniqueCities = [...new Set(data?.map(item => item.city) || [])];
        setAvailableCities(uniqueCities);
        
        const durationsMap: Record<string, string[]> = {};
        data?.forEach(item => {
          if (!durationsMap[item.city]) {
            durationsMap[item.city] = [];
          }
          const durationType = item.duration_type.replace("_hours", "").replace("h", "");
          
          let mappedDuration: string;
          if (durationType === "4") {
            mappedDuration = "4";
          } else if (durationType === "6") {
            mappedDuration = "6";
          } else if (durationType === "8") {
            mappedDuration = "8";
          } else if (durationType === "custom" || parseInt(durationType) >= 9) {
            mappedDuration = "custom";
          } else {
            return;
          }
          
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
      if (suitableVehicle) {
        setVehicleType(suitableVehicle.value);
      }
    }
  }, [passengers]);

  useEffect(() => {
    const passengerCount = parseInt(hourlyPassengers);
    const currentVehicle = VEHICLE_TYPES.find(v => v.value === hourlyVehicleType);
    
    if (currentVehicle && currentVehicle.passengers < passengerCount) {
      const suitableVehicle = VEHICLE_TYPES.find(v => v.passengers >= passengerCount && v.value !== 'minibus');
      if (suitableVehicle) {
        setHourlyVehicleType(suitableVehicle.value);
      }
    }
  }, [hourlyPassengers]);

  const [originalHourlyPrices, setOriginalHourlyPrices] = useState<Array<{ vehicleType: string; price: number; currency: string }>>([]);

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
              prices.push({
                vehicleType: mappedType,
                price: item.hourly_rate * hours,
                currency: item.price_currency
              });
            }
          });
          
          setOriginalHourlyPrices(prices);
          setAllHourlyPrices(prices);
        } else {
          const durationKeyShort = `${hourlyDuration}h`;
          const durationKeyLong = `${hourlyDuration}_hours`;
          
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
          
          const combinedData = [...(shortData || []), ...(longData || [])];
          
          const vehiclePriceMap = new Map<string, { price: number; currency: string }>();
          combinedData.forEach(item => {
            if (!vehiclePriceMap.has(item.vehicle_type)) {
              vehiclePriceMap.set(item.vehicle_type, {
                price: item.price,
                currency: item.price_currency
              });
            }
          });
          
          const prices: Array<{ vehicleType: string; price: number; currency: string }> = [];
          
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
          body: {
            from_currency: baseCurrency,
            to_currency: hourlyCurrency,
          }
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
    if (hourlyDuration === "custom") {
      params.set("duration", `${customHours}h`);
    } else {
      params.set("duration", `${hourlyDuration}h`);
    }
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

  const handleApplyBooking = useCallback((bookingData: {
    pickup?: string | null;
    dropoff?: string | null;
    date?: string | null;
    time?: string | null;
    passengers?: number | null;
    vehicleType?: string | null;
  }) => {
    if (bookingData.pickup) {
      setPickup(bookingData.pickup);
    }
    if (bookingData.dropoff) {
      setDropoff(bookingData.dropoff);
    }
    if (bookingData.date) {
      try {
        const parsedDate = parse(bookingData.date, "yyyy-MM-dd", new Date());
        if (!isNaN(parsedDate.getTime())) {
          setDate(parsedDate);
        }
      } catch (e) {
        console.error("Failed to parse date:", e);
      }
    }
    if (bookingData.time) {
      setTime(bookingData.time);
    }
    if (bookingData.passengers) {
      setPassengers(bookingData.passengers.toString());
    }
    if (bookingData.vehicleType) {
      const vehicleMap: Record<string, string> = {
        'mercedes-vito': 'mercedes-vito',
        'vip-mercedes': 'vip-mercedes',
        'maybach-minibus': 'maybach-minibus',
        'minibus': 'minibus'
      };
      const mappedType = vehicleMap[bookingData.vehicleType] || 'mercedes-vito';
      setVehicleType(mappedType);
    }
    
    toast.success(t("bookingDetailsApplied") || "Booking details applied to form!");
    
    document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [t]);
  
  return (
    <section id="booking-form" className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaC0ydjJoMnYtMmgydi0yaC0yem0tMiAydi0yaC0ydjJoMnptMi0yaDJ2LTJoLTJ2MnptLTItNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0yLTJoMnYtMmgtMnYyem0tMiAydjJoLTJ2Mmgydi0yaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container relative z-10 px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side - Form */}
          <div className="order-2 lg:order-1 animate-in fade-in slide-in-from-left-4 duration-700">
            {/* Logo & Title */}
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={meetTransferLogo} 
                alt="Meet Transfer Logo" 
                width={56}
                height={56}
                loading="eager"
                decoding="async"
                className="h-14 w-14 rounded-full object-cover shadow-lg ring-2 ring-primary/20"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                  {t("heroTitle")}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {getLocalizedDiscountText(activePromo.discountPercentage, activePromo.code, language, activePromo.validUntil).heroSubtitle}
                </p>
              </div>
            </div>

            {/* AI Chat Assistant */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>{t("bookTransferOrHourlyWithAI") || "Book with AI Assistant"}</span>
              </div>
              <BookingChatAssistant onApplyBooking={handleApplyBooking} />
            </div>

            {/* Booking Form Card */}
            <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
              {/* Tab Switcher */}
              <div className="flex bg-muted/30">
                <button
                  onClick={() => setActiveTab("ride")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-4 px-6 font-semibold transition-all relative text-sm",
                    activeTab === "ride"
                      ? "text-primary bg-card"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Car className="h-4 w-4" />
                  <span>{t("pointToPoint") || "Transfer"}</span>
                </button>
                <button
                  onClick={() => setActiveTab("hourly")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-4 px-6 font-semibold transition-all relative text-sm",
                    activeTab === "hourly"
                      ? "text-primary bg-card"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Timer className="h-4 w-4" />
                  <span>{t("perHour") || "Per Hour"}</span>
                </button>
              </div>

              {/* Form Content */}
              <div className="p-5 md:p-6">
                {activeTab === "ride" ? (
                  /* Ride Form */
                  <div className="space-y-4">
                    {/* Location Fields */}
                    <div className="space-y-3">
                      <div className="relative">
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
                          <GooglePlacesAutocomplete 
                            onPlaceSelected={handlePickupSelected} 
                            placeholder={t("enterPickupPoint") || "Pickup: Airport, hotel, address..."} 
                            className="pl-10 h-12 bg-muted/50 border border-border focus:border-primary text-foreground placeholder:text-muted-foreground rounded-xl transition-all text-sm"
                            value={pickup}
                          />
                        </div>
                      </div>
                      
                      {/* Swap Button */}
                      <div className="flex justify-center -my-1">
                        <button
                          type="button"
                          onClick={() => {
                            const temp = pickup;
                            setPickup(dropoff);
                            setDropoff(temp);
                          }}
                          disabled={!pickup && !dropoff}
                          className={cn(
                            "flex items-center justify-center",
                            "w-8 h-8 rounded-full bg-primary text-primary-foreground shadow",
                            "hover:bg-primary/90 hover:scale-110 active:scale-95",
                            "transition-all duration-200",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          )}
                          title={t("swapLocations") || "Swap locations"}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <div className="relative">
                        <div className="relative">
                          <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent z-10" />
                          <GooglePlacesAutocomplete 
                            onPlaceSelected={handleDropoffSelected} 
                            placeholder={t("hotelOrAddress") || "Drop-off: Where to?"} 
                            className="pl-10 h-12 bg-muted/50 border border-border focus:border-accent text-foreground placeholder:text-muted-foreground rounded-xl transition-all text-sm"
                            value={dropoff}
                          />
                        </div>
                      </div>
                      
                      {/* Route Map */}
                      {pickup && dropoff && (
                        <CompactRouteMap 
                          pickup={pickup} 
                          dropoff={dropoff}
                          className="mt-2"
                        />
                      )}
                    </div>

                    {/* Date, Time & Passengers */}
                    <div className="grid grid-cols-3 gap-2">
                      <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className={cn(
                              "w-full h-12 justify-start text-left font-normal bg-muted/50 border-border hover:border-primary/50 text-foreground rounded-xl transition-all text-sm px-3",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-1.5 h-4 w-4 text-primary flex-shrink-0" />
                            <span className="truncate text-xs">{date ? format(date, "dd MMM") : t("date")}</span>
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
                      
                      <Select value={time} onValueChange={setTime}>
                        <SelectTrigger className="w-full h-12 bg-muted/50 border-border hover:border-primary/50 text-foreground rounded-xl transition-all text-sm px-3">
                          <div className="flex items-center">
                            <Clock className="mr-1.5 h-4 w-4 text-primary flex-shrink-0" />
                            <span className="truncate text-xs">{time || t("time")}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] z-50">
                          {timeOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={passengers} onValueChange={setPassengers}>
                        <SelectTrigger className="w-full h-12 bg-muted/50 border-border hover:border-primary/50 text-foreground rounded-xl transition-all text-sm px-3">
                          <div className="flex items-center">
                            <Users className="mr-1.5 h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-xs">{passengers}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] z-50">
                          {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? (t("passenger") || "pax") : (t("passengers") || "pax")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Vehicle Type Selection - Compact */}
                    <div>
                      {isMinibusRequired(parseInt(passengers), 0) && (
                        <p className="text-xs text-amber-600 mb-2">
                          {t("minibusRequiredForPassengers") || "Sprinter minibus required for 7+ passengers"}
                        </p>
                      )}
                      <div className="grid grid-cols-4 gap-1.5">
                        {VEHICLE_TYPES.map((vehicle) => {
                          const vehiclePrice = allVehiclePrices.find(v => v.vehicleType === vehicle.value);
                          const isSelected = vehicleType === vehicle.value;
                          const passengerCount = parseInt(passengers);
                          const isDisabled = vehicle.passengers < passengerCount;
                          
                          return (
                            <button
                              key={vehicle.value}
                              type="button"
                              onClick={() => !isDisabled && setVehicleType(vehicle.value)}
                              disabled={isDisabled}
                              className={cn(
                                "relative rounded-lg border p-2 transition-all text-center",
                                isDisabled
                                  ? "border-border bg-muted/20 opacity-40 cursor-not-allowed"
                                  : isSelected
                                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                                    : "border-border hover:border-primary/50 bg-muted/30"
                              )}
                            >
                              <div className="text-xs font-medium truncate">{vehicle.label.split(' ')[1] || vehicle.label}</div>
                              {vehiclePrice && (
                                <div className="text-xs font-bold text-primary mt-0.5">
                                  €{vehiclePrice.price}
                                </div>
                              )}
                              {loadingTransferPrice && !vehiclePrice && pickup && dropoff && (
                                <Loader2 className="h-3 w-3 animate-spin mx-auto mt-0.5 text-muted-foreground" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button 
                      onClick={handleRideContinue}
                      disabled={submitting}
                      size="lg"
                      className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all rounded-xl"
                    >
                      {submitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("loading")}</>
                      ) : (
                        <>{t("getQuote") || "Get Quote"} <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                ) : (
                  /* Hourly Rental Form */
                  <div className="space-y-4">
                    {/* City & Duration */}
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={hourlyCity} onValueChange={setHourlyCity}>
                        <SelectTrigger className="w-full h-12 bg-muted/50 border-border hover:border-primary/50 text-foreground rounded-xl transition-all text-sm">
                          <div className="flex items-center">
                            <MapPin className="mr-2 h-4 w-4 text-primary" />
                            <SelectValue placeholder={loadingCities ? "..." : (t("selectCity") || "City")} />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="z-50 max-h-[300px]">
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={hourlyDuration} 
                        onValueChange={setHourlyDuration}
                        disabled={!hourlyCity || availableDurations.length === 0}
                      >
                        <SelectTrigger className="w-full h-12 bg-muted/50 border-border hover:border-primary/50 text-foreground rounded-xl transition-all disabled:opacity-50 text-sm">
                          <div className="flex items-center">
                            <Timer className="mr-2 h-4 w-4 text-primary" />
                            <SelectValue placeholder={t("duration") || "Duration"} />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="z-50">
                          {availableDurations.map((duration) => {
                            const option = hourlyDurationOptions.find(o => o.value === duration);
                            const label = option 
                              ? (t(option.labelKey) || option.defaultLabel)
                              : `${duration}h`;
                            return (
                              <SelectItem key={duration} value={duration}>{label}</SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Custom Hours */}
                    {hourlyDuration === "custom" && (
                      <Select value={customHours} onValueChange={setCustomHours}>
                        <SelectTrigger className="w-full h-12 bg-muted/50 border-border hover:border-primary/50 text-foreground rounded-xl transition-all text-sm">
                          <div className="flex items-center">
                            <Timer className="mr-2 h-4 w-4 text-primary" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="z-50 max-h-[300px]">
                          {Array.from({ length: 16 }, (_, i) => i + 9).map((hours) => (
                            <SelectItem key={hours} value={hours.toString()}>
                              {hours} {t("hours") || "hours"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Date, Time & Passengers */}
                    <div className="grid grid-cols-3 gap-2">
                      <Popover open={hourlyDatePopoverOpen} onOpenChange={setHourlyDatePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className={cn(
                              "w-full h-12 justify-start text-left font-normal bg-muted/50 border-border hover:border-primary/50 text-foreground rounded-xl transition-all text-sm px-3",
                              !hourlyDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-1.5 h-4 w-4 text-primary flex-shrink-0" />
                            <span className="truncate text-xs">{hourlyDate ? format(hourlyDate, "dd MMM") : t("date")}</span>
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
                      
                      <Select value={hourlyTime} onValueChange={setHourlyTime}>
                        <SelectTrigger className="w-full h-12 bg-muted/50 border-border hover:border-primary/50 text-foreground rounded-xl transition-all text-sm px-3">
                          <div className="flex items-center">
                            <Clock className="mr-1.5 h-4 w-4 text-primary flex-shrink-0" />
                            <span className="truncate text-xs">{hourlyTime || t("time")}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] z-50">
                          {timeOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={hourlyPassengers} onValueChange={setHourlyPassengers}>
                        <SelectTrigger className="w-full h-12 bg-muted/50 border-border hover:border-primary/50 text-foreground rounded-xl transition-all text-sm px-3">
                          <div className="flex items-center">
                            <Users className="mr-1.5 h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-xs">{hourlyPassengers}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] z-50">
                          {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? "pax" : "pax"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Vehicle Selection with Prices */}
                    {hourlyCity && hourlyDuration && (
                      <div className="grid grid-cols-3 gap-1.5">
                        {VEHICLE_TYPES.filter(v => v.value !== 'minibus').map((vehicle) => {
                          const vehiclePrice = allHourlyPrices.find(v => v.vehicleType === vehicle.value);
                          const isSelected = hourlyVehicleType === vehicle.value;
                          const passengerCount = parseInt(hourlyPassengers);
                          const isDisabled = vehicle.passengers < passengerCount;
                          const currencySymbol = vehiclePrice?.currency === "EUR" ? "€" : vehiclePrice?.currency === "USD" ? "$" : vehiclePrice?.currency === "GBP" ? "£" : "₺";
                          
                          return (
                            <button
                              key={vehicle.value}
                              type="button"
                              onClick={() => !isDisabled && setHourlyVehicleType(vehicle.value)}
                              disabled={isDisabled}
                              className={cn(
                                "relative rounded-lg border p-2 transition-all text-center",
                                isDisabled
                                  ? "border-border bg-muted/20 opacity-40 cursor-not-allowed"
                                  : isSelected
                                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                                    : "border-border hover:border-primary/50 bg-muted/30"
                              )}
                            >
                              <div className="text-xs font-medium truncate">{vehicle.label.split(' ')[1] || vehicle.label}</div>
                              {vehiclePrice && (
                                <div className="text-xs font-bold text-primary mt-0.5">
                                  {currencySymbol}{vehiclePrice.price}
                                </div>
                              )}
                              {(loadingPrice || convertingHourlyPrices) && !vehiclePrice && (
                                <Loader2 className="h-3 w-3 animate-spin mx-auto mt-0.5 text-muted-foreground" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* CTA Button */}
                    <Button 
                      onClick={handleHourlyContinue}
                      disabled={submitting}
                      size="lg"
                      className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all rounded-xl"
                    >
                      {submitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("loading")}</>
                      ) : (
                        <>{t("getQuote") || "Get Quote"} <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-green-500" />
                <span>{t("freeCancellation") || "Free Cancellation"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span>4.9/5</span>
              </div>
            </div>
          </div>

          {/* Right Side - Visual/Illustration */}
          <div className="order-1 lg:order-2 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
            <div className="relative">
              {/* Main Visual Container */}
              <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 rounded-3xl p-8 lg:p-12">
                {/* City Marquee */}
                <div className="mb-8">
                  <CityMarquee />
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-border/50">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Globe className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">100+</div>
                    <div className="text-sm text-muted-foreground">{t("cities") || "Cities"}</div>
                  </div>
                  <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-border/50">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <Plane className="h-6 w-6 text-accent" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">670+</div>
                    <div className="text-sm text-muted-foreground">{t("airports") || "Airports"}</div>
                  </div>
                  <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-border/50">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Star className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">50K+</div>
                    <div className="text-sm text-muted-foreground">{t("happyCustomers") || "Happy Customers"}</div>
                  </div>
                  <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-border/50">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground">24/7</div>
                    <div className="text-sm text-muted-foreground">{t("support") || "Support"}</div>
                  </div>
                </div>

                {/* Feature Highlights */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-card/60 backdrop-blur-sm rounded-xl p-3 border border-border/30">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">{t("fixedPrices") || "Fixed Prices"}</div>
                      <div className="text-xs text-muted-foreground">{t("noHiddenFees") || "No hidden fees, no surprises"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-card/60 backdrop-blur-sm rounded-xl p-3 border border-border/30">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">{t("luxuryVehicles") || "Luxury Vehicles"}</div>
                      <div className="text-xs text-muted-foreground">{t("mercedesFleet") || "Premium Mercedes fleet"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-card/60 backdrop-blur-sm rounded-xl p-3 border border-border/30">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">{t("professionalDrivers") || "Professional Drivers"}</div>
                      <div className="text-xs text-muted-foreground">{t("englishSpeaking") || "English speaking, meet & greet"}</div>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
