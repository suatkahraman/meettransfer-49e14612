import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, CalendarIcon, Clock, Car, Users, Loader2, ArrowLeftRight, Coins, Briefcase, MessageSquare, Phone, Mail, Tag, CheckCircle, XCircle, Baby, AlertCircle } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { GooglePlacesAutocomplete, PlaceDetails } from "@/components/ui/google-places-autocomplete";
import { cn } from "@/lib/utils";
import { CURRENCY_OPTIONS } from "@/lib/currency";
import meetTransferLogo from "@/assets/meet-transfer-logo-small.webp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CityMarquee from "@/components/website/CityMarquee";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { VEHICLE_TYPES, getAvailableVehicles, isMinibusRequired, VEHICLE_TYPE_MAP } from "@/lib/vehicleTypes";

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

const getSessionId = () => {
  let sessionId = localStorage.getItem('quick_booking_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('quick_booking_session_id', sessionId);
  }
  return sessionId;
};

export const Hero = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is an agency
  const [isAgency, setIsAgency] = useState(false);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [vehicleType, setVehicleType] = useState("mercedes-vito");
  const [passengers, setPassengers] = useState("1");
  const [luggageCount, setLuggageCount] = useState("1");
  const [babySeatCount, setBabySeatCount] = useState("0");
  const [preferredCurrency, setPreferredCurrency] = useState("EUR");
  const [submitting, setSubmitting] = useState(false);
  
  const [hasReturnTrip, setHasReturnTrip] = useState(false);
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTime, setReturnTime] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phoneError, setPhoneError] = useState(false);

  // Computed: available vehicles based on passengers and luggage
  const passengerNum = parseInt(passengers) || 1;
  const luggageNum = parseInt(luggageCount) || 1;
  const availableVehicles = getAvailableVehicles(passengerNum, luggageNum);
  const minibusRequired = isMinibusRequired(passengerNum, luggageNum);

  // Auto-select minibus if required
  useEffect(() => {
    if (minibusRequired && vehicleType !== 'minibus') {
      setVehicleType('minibus');
    }
  }, [minibusRequired, vehicleType]);

  // Get current vehicle info
  const currentVehicle = VEHICLE_TYPE_MAP[vehicleType];
  
  // Promo code state for return trip
  const [promoCode, setPromoCode] = useState("");
  const [isPromoCodeValid, setIsPromoCodeValid] = useState<boolean | null>(null);
  const VALID_PROMO_CODE = "Meet40Return";
  
  const handlePromoCodeChange = (value: string) => {
    setPromoCode(value);
    if (value.trim() === "") {
      setIsPromoCodeValid(null);
    } else if (value.trim().toLowerCase() === VALID_PROMO_CODE.toLowerCase()) {
      setIsPromoCodeValid(true);
    } else {
      setIsPromoCodeValid(false);
    }
  };

  const currencyOptions = CURRENCY_OPTIONS;

  // Check if logged in user is an agency
  useEffect(() => {
    const checkAgencyRole = async () => {
      if (!user) {
        setIsAgency(false);
        setAgencyId(null);
        return;
      }
      
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (roleData?.role === 'agency') {
        setIsAgency(true);
        // Fetch agency ID
        const { data: agencyData } = await supabase
          .from('agencies')
          .select('id, currency')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (agencyData) {
          setAgencyId(agencyData.id);
          // Set default currency from agency profile
          if (agencyData.currency) {
            setPreferredCurrency(agencyData.currency);
          }
        }
      }
    };
    
    checkAgencyRole();
  }, [user]);
  
  // Popover open states
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [returnDatePopoverOpen, setReturnDatePopoverOpen] = useState(false);

  const handleRequestPrice = async () => {
    const missingFields: string[] = [];
    if (!pickup) missingFields.push(t("pickupPoint") || "Pickup");
    if (!dropoff) missingFields.push(t("dropoffLocation") || "Drop-off");
    if (!date) missingFields.push(t("pickupDate") || "Date");
    if (!time) missingFields.push(t("pickupTime") || "Time");
    
    // Phone validation - required for non-agency users
    const phoneTrimmed = customerPhone.trim();
    if (!isAgency && (!phoneTrimmed || phoneTrimmed.length < 8)) {
      setPhoneError(true);
      setTimeout(() => setPhoneError(false), 1000);
      toast.error(t("phoneRequired") || "Phone number is required");
      return;
    }
    
    // Validate email - optional but must be valid if provided
    const emailTrimmed = customerEmail.trim();
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      toast.error(t("invalidEmail") || "Please enter a valid email address");
      return;
    }
    
    if (missingFields.length > 0) {
      toast.error(`${t("pleaseFilAllFields") || "Please fill in"}: ${missingFields.join(", ")}`);
      return;
    }
    
    if (hasReturnTrip && (!returnDate || !returnTime)) {
      toast.error(t("pleaseFilAllFields") || "Please fill in all required fields");
      return;
    }

    // If user is logged in (but not agency), redirect to reservation form
    if (user && !isAgency) {
      const params = new URLSearchParams();
      params.set("pickup", pickup);
      params.set("dropoff", dropoff);
      params.set("date", format(date, "yyyy-MM-dd"));
      params.set("time", time);
      params.set("vehicleType", vehicleType);
      params.set("passengers", passengers);
      params.set("currency", preferredCurrency);
      
      if (hasReturnTrip && returnDate && returnTime) {
        params.set("hasReturn", "true");
        params.set("returnDate", format(returnDate, "yyyy-MM-dd"));
        params.set("returnTime", returnTime);
      }
      
      navigate(`/book?${params.toString()}`);
      return;
    }

    // For anonymous users or agency users, use QuickBookingConfirm flow
    setSubmitting(true);
    try {
      const sessionId = getSessionId();
      
      const insertData: any = {
        pickup,
        dropoff,
        pickup_date: format(date, "yyyy-MM-dd"),
        pickup_time: time,
        vehicle_type: vehicleType,
        passengers: passengerNum,
        luggage_count: luggageNum,
        baby_seat_count: parseInt(babySeatCount) || 0,
        customer_session_id: sessionId,
        price_currency: preferredCurrency,
        customer_notes: customerNotes.trim() || null,
        customer_phone: customerPhone.trim() || null,
        customer_email: customerEmail.trim() || null,
        // Return trip info
        has_return_trip: hasReturnTrip && returnDate && returnTime ? true : false,
        return_date: hasReturnTrip && returnDate ? format(returnDate, "yyyy-MM-dd") : null,
        return_time: hasReturnTrip && returnTime ? returnTime : null,
        promo_code: hasReturnTrip && isPromoCodeValid && promoCode ? promoCode : null,
      };
      
      // If user is an agency, link the request to the agency
      if (isAgency && agencyId && user) {
        insertData.agency_id = agencyId;
        insertData.agency_user_id = user.id;
      }
      
      const { data, error } = await supabase
        .from("quick_booking_requests")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Try auto-pricing first (only for non-agency guests)
      let autoPriceResult: any = null;
      if (!isAgency) {
        try {
          const { data: autoPriceData } = await supabase.functions.invoke("auto-price-quick-booking", {
            body: { quick_booking_id: data.id },
          });
          autoPriceResult = autoPriceData;
          console.log("Auto-price result:", autoPriceResult);
        } catch (autoPriceError) {
          console.error("Auto-pricing failed:", autoPriceError);
          // Continue with manual pricing flow
        }
      }

      // Only notify admin if auto-pricing didn't work
      if (!autoPriceResult?.matched) {
        try {
          await supabase.functions.invoke("notify-admin-quick-booking-new", {
            body: {
              bookingId: data.id,
              pickup,
              dropoff,
              pickupDate: format(date, "yyyy-MM-dd"),
              pickupTime: time,
              vehicleType,
              passengers: parseInt(passengers),
              priceCurrency: preferredCurrency,
              customerEmail: customerEmail.trim() || null,
              customerPhone: customerPhone.trim() || null,
              customerNotes: customerNotes.trim() || null,
            },
          });
        } catch (notifyError) {
          console.error("Failed to notify admin:", notifyError);
          // Don't fail the user flow
        }
      }

      let url = `/quick-booking-confirm?token=${data.confirmation_token}`;
      if (hasReturnTrip && returnDate && returnTime) {
        url += `&hasReturn=true&returnDate=${format(returnDate, "yyyy-MM-dd")}&returnTime=${returnTime}`;
        if (isPromoCodeValid && promoCode) {
          url += `&promoCode=${encodeURIComponent(promoCode)}`;
        }
      }
      navigate(url);
      
      // Show appropriate success message
      if (autoPriceResult?.matched) {
        toast.success(t("priceCalculated") || "Price has been calculated! Check your email.");
      } else {
        toast.success(t("priceRequestSent") || "Your price request has been sent!");
      }
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickupSelected = (value: string, details?: PlaceDetails) => {
    setPickup(details?.displayText || value);
  };

  const handleDropoffSelected = (value: string, details?: PlaceDetails) => {
    setDropoff(details?.displayText || value);
  };
  
  return (
    <section id="booking-form" className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaC0ydjJoMnYtMmgydi0yaC0yem0tMiAydi0yaC0ydjJoMnptMi0yaDJ2LTJoLTJ2MnptLTItNHYyaDJ2LTJoLTJ6bS0yLTJ2Mmgydi0yaC0yem0yLTJoMnYtMmgtMnYyem0tMiAydjJoLTJ2Mmgydi0yaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
      
      <div className="container relative z-10 px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex justify-center">
            <img 
              src={meetTransferLogo} 
              alt="Meet Transfer Logo" 
              width={128}
              height={128}
              loading="lazy"
              decoding="async"
              className="h-32 w-32 md:h-40 md:w-40 lg:h-48 lg:w-48 rounded-full object-cover shadow-2xl ring-4 ring-white/20"
            />
          </div>
          
          {/* City Marquee Animation */}
          <CityMarquee />
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-sans">
              {t("heroSubtitle")}
            </p>
          </div>

          {/* Quick Booking Form */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 max-w-2xl mx-auto border border-white/20 shadow-2xl">
            <div className="space-y-4">
              {/* Location Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-white/90 text-sm font-medium mb-2 block text-left">{t("pickupPoint")}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
                    <GooglePlacesAutocomplete onPlaceSelected={handlePickupSelected} placeholder={t("enterPickupPoint")} className="pl-10 h-12 bg-white border-0 text-foreground placeholder:text-muted-foreground rounded-lg shadow-md focus:ring-2 focus:ring-accent" />
                  </div>
                </div>
                <div className="relative">
                  <label className="text-white/90 text-sm font-medium mb-2 block text-left">{t("dropoffLocation")}</label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-accent z-10" />
                    <GooglePlacesAutocomplete onPlaceSelected={handleDropoffSelected} placeholder={t("hotelOrAddress")} className="pl-10 h-12 bg-white border-0 text-foreground placeholder:text-muted-foreground rounded-lg shadow-md focus:ring-2 focus:ring-accent" />
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-white/90 text-sm font-medium mb-2 block text-left">{t("pickupDate")}</label>
                  <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full h-12 justify-start text-left font-normal bg-white border-0 text-foreground rounded-lg shadow-md hover:bg-white/95", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                        {date ? format(date, "dd/MM/yyyy") : <span>{t("selectDate")}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar mode="single" selected={date} onSelect={(selectedDate) => { setDate(selectedDate); setDatePopoverOpen(false); }} disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="relative">
                  <label className="text-white/90 text-sm font-medium mb-2 block text-left">{t("pickupTime")}</label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger className="w-full h-12 bg-white border-0 text-foreground rounded-lg shadow-md">
                      <div className="flex items-center"><Clock className="mr-2 h-5 w-5 text-primary" /><SelectValue placeholder={t("selectTime")} /></div>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] z-50">{timeOptions.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vehicle Selection with Visual Cards */}
              <div className="relative space-y-4">
                <label className="text-white/90 text-sm font-medium block text-left">{t("vehicleType")}</label>
                {minibusRequired && (
                  <div className="flex items-center gap-2 text-amber-300 text-xs bg-amber-500/20 p-2 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <span>{t("minibusRequiredInfo") || "For 7+ passengers or luggage, only Minibus is available"}</span>
                  </div>
                )}
                
                {/* Vehicle Cards Grid */}
                <div className={cn(
                  "grid gap-3",
                  availableVehicles.length === 1 ? "grid-cols-1" : "grid-cols-2"
                )}>
                  {availableVehicles.map((v) => (
                    <button
                      key={v.value}
                      type="button"
                      disabled={minibusRequired && v.value !== 'minibus'}
                      onClick={() => setVehicleType(v.value)}
                      className={cn(
                        "relative overflow-hidden rounded-xl p-3 transition-all duration-300 text-left",
                        "border-2 hover:scale-[1.02] active:scale-[0.98]",
                        vehicleType === v.value
                          ? "border-accent bg-white/20 shadow-lg ring-2 ring-accent/50"
                          : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40",
                        minibusRequired && v.value !== 'minibus' && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {/* Selected indicator */}
                      {vehicleType === v.value && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      )}
                      
                      {/* Vehicle Image Thumbnail */}
                      <div className="aspect-video rounded-lg overflow-hidden mb-2 bg-black/20">
                        <img
                          src={v.images[0]?.src}
                          alt={v.label}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      
                      {/* Vehicle Name */}
                      <h3 className={cn(
                        "font-semibold text-sm mb-1",
                        vehicleType === v.value ? "text-white" : "text-white/90"
                      )}>
                        {v.label}
                      </h3>
                      
                      {/* Capacity Info */}
                      <div className="flex items-center gap-3 text-xs text-white/70">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {v.passengers}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {v.luggage}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Vehicle Gallery */}
              {vehicleType && currentVehicle && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white/90 text-sm font-medium">{currentVehicle.label}</h4>
                    <div className="flex items-center gap-3 text-xs text-white/70">
                      <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                        <Users className="h-3 w-3 text-accent" />
                        {currentVehicle.passengers} {t("passengers")}
                      </span>
                      <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                        <Briefcase className="h-3 w-3 text-accent" />
                        {currentVehicle.luggage} {t("luggage") || "Luggage"}
                      </span>
                    </div>
                  </div>
                  
                  <Carousel 
                    className="w-full"
                    plugins={[
                      Autoplay({
                        delay: 3000,
                        stopOnInteraction: true,
                      }),
                    ]}
                    opts={{
                      loop: true,
                    }}
                  >
                    <CarouselContent>
                      {currentVehicle.images.slice(0, 6).map((img, idx) => (
                        <CarouselItem key={idx}>
                          <div className="overflow-hidden rounded-xl aspect-[16/10] bg-black/20">
                            <img
                              src={img.src}
                              alt={img.alt}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2 bg-white/80 hover:bg-white" />
                    <CarouselNext className="right-2 bg-white/80 hover:bg-white" />
                    <CarouselDots className="[&_button]:bg-white/40 [&_button.bg-primary]:bg-white" />
                  </Carousel>
                </div>
              )}

              {/* Passengers */}
              <div className="relative">
                <label className="text-white/90 text-sm font-medium mb-2 block text-left">{t("passengers")}</label>
                <Select value={passengers} onValueChange={setPassengers}>
                  <SelectTrigger className="w-full h-12 bg-white border-0 text-foreground rounded-lg shadow-md">
                    <div className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /><SelectValue placeholder={t("selectPassengers")} /></div>
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50 max-h-[300px]">{Array.from({ length: 19 }, (_, i) => i + 1).map((num) => <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? t("passenger") : t("passengers")}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Luggage & Baby Seat */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-white/90 text-sm font-medium mb-2 block text-left flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-accent" />
                    {t("luggageCount") || "Luggage"}
                  </label>
                  <Select value={luggageCount} onValueChange={setLuggageCount}>
                    <SelectTrigger className="w-full h-12 bg-white border-0 text-foreground rounded-lg shadow-md">
                      <SelectValue placeholder={t("selectLuggage") || "Luggage"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50 max-h-[300px]">
                      {Array.from({ length: 20 }, (_, i) => i).map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num} {t("luggage") || "Luggage"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <label className="text-white/90 text-sm font-medium mb-2 block text-left flex items-center gap-2">
                    <Baby className="h-4 w-4 text-accent" />
                    {t("babySeat") || "Baby Seat"}
                  </label>
                  <Select value={babySeatCount} onValueChange={setBabySeatCount}>
                    <SelectTrigger className="w-full h-12 bg-white border-0 text-foreground rounded-lg shadow-md">
                      <SelectValue placeholder={t("selectBabySeat") || "Baby Seat"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      {Array.from({ length: 4 }, (_, i) => i).map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Return Trip Option */}
              <div className="bg-white/10 rounded-lg p-4 space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox id="returnTrip" checked={hasReturnTrip} onCheckedChange={(checked) => setHasReturnTrip(checked === true)} className="border-white/60 data-[state=checked]:bg-accent data-[state=checked]:border-accent" />
                  <Label htmlFor="returnTrip" className="flex items-center gap-2 cursor-pointer text-white font-medium">
                    <ArrowLeftRight className="h-4 w-4 text-accent" />
                    {t("addReturnTrip")}
                  </Label>
                </div>
                
                {hasReturnTrip && (
                  <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="text-white/90 text-sm font-medium mb-2 block text-left">{t("returnDate")}</label>
                        <Popover open={returnDatePopoverOpen} onOpenChange={setReturnDatePopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full h-12 justify-start text-left font-normal bg-white border-0 text-foreground rounded-lg shadow-md hover:bg-white/95", !returnDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                              {returnDate ? format(returnDate, "dd/MM/yyyy") : <span>{t("selectDate")}</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-50" align="start">
                            <Calendar mode="single" selected={returnDate} onSelect={(selectedDate) => { setReturnDate(selectedDate); setReturnDatePopoverOpen(false); }} disabled={(d) => d < (date || new Date())} initialFocus className={cn("p-3 pointer-events-auto")} />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="relative">
                        <label className="text-white/90 text-sm font-medium mb-2 block text-left">{t("returnTime")}</label>
                        <Select value={returnTime} onValueChange={setReturnTime}>
                          <SelectTrigger className="w-full h-12 bg-white border-0 text-foreground rounded-lg shadow-md">
                            <div className="flex items-center"><Clock className="mr-2 h-5 w-5 text-primary" /><SelectValue placeholder={t("selectTime")} /></div>
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] z-50">{timeOptions.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Promo Code Section */}
                    <div className="space-y-2">
                      <label className="text-white/90 text-sm font-medium block text-left flex items-center gap-2">
                        <Tag className="h-4 w-4 text-accent" />
                        {t("promoCode") || "Promo Code"}
                      </label>
                      <div className="relative">
                        <Input
                          placeholder={t("enterPromoCode") || "Enter promo code"}
                          value={promoCode}
                          onChange={(e) => handlePromoCodeChange(e.target.value)}
                          className={cn(
                            "h-12 bg-white border-0 text-foreground placeholder:text-muted-foreground rounded-lg shadow-md pr-10",
                            isPromoCodeValid === true && "ring-2 ring-green-500",
                            isPromoCodeValid === false && "ring-2 ring-red-500"
                          )}
                        />
                        {isPromoCodeValid === true && (
                          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                        )}
                        {isPromoCodeValid === false && (
                          <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                        )}
                      </div>
                      {isPromoCodeValid === true && (
                        <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                          ✓ {t("promoCodeAccepted") || "Promo code accepted! 30% discount will be applied to your return transfer."}
                        </p>
                      )}
                      {isPromoCodeValid === false && (
                        <p className="text-red-400 text-sm">
                          {t("invalidPromoCode") || "Invalid promo code"}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Currency Selection */}
              <div className="space-y-2">
                <label className="text-white/90 text-sm font-medium block text-left flex items-center gap-2">
                  <Coins className="h-4 w-4 text-accent" />
                  {t("preferredCurrency") || "Preferred Currency"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {currencyOptions.map((currency) => (
                    <button
                      key={currency.value}
                      type="button"
                      onClick={() => setPreferredCurrency(currency.value)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm",
                        preferredCurrency === currency.value
                          ? "bg-accent text-accent-foreground shadow-lg scale-105"
                          : "bg-white/20 text-white hover:bg-white/30 border border-white/30"
                      )}
                    >
                      <span>{currency.flag}</span>
                      <span>{currency.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="text-white/90 text-sm font-medium block text-left flex items-center gap-2">
                  <Phone className="h-4 w-4 text-accent" />
                  {t("phoneNumber") || "Phone Number"} <span className="text-red-400 font-bold">*</span>
                  <span className="text-white/60 text-xs">({t("required") || "Required"})</span>
                </label>
                <PhoneInput
                  value={customerPhone}
                  onChange={setCustomerPhone}
                  placeholder="555 123 4567"
                  inputClassName="h-12 bg-white border-0 text-foreground placeholder:text-muted-foreground rounded-lg shadow-md"
                  error={phoneError}
                />
              </div>

              {/* Email (Optional) */}
              <div className="space-y-2">
                <label className="text-white/90 text-sm font-medium block text-left flex items-center gap-2">
                  <Mail className="h-4 w-4 text-accent" />
                  {t("email") || "Email"}
                  <span className="text-white/60 text-xs">({t("optional") || "Optional"})</span>
                </label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder={t("emailPlaceholder") || "email@example.com"}
                  className="h-12 bg-white border-0 text-foreground placeholder:text-muted-foreground rounded-lg shadow-md"
                />
                <p className="text-white/70 text-xs">
                  {t("emailPriceNotification") || "Your price quote will also be sent to you via email."}
                </p>
              </div>

              {/* Customer Notes */}
              <div className="space-y-2">
                <label className="text-white/90 text-sm font-medium block text-left flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  {t("specialRequests") || "Special Requests / Notes"}
                </label>
                <Textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder={t("specialRequestsPlaceholder") || "Flight number, child seat, special requirements..."}
                  className="bg-white border-0 text-foreground placeholder:text-muted-foreground rounded-lg shadow-md resize-none min-h-[80px]"
                  maxLength={500}
                />
              </div>

              <Button onClick={handleRequestPrice} size="lg" variant="accent" className="w-full text-lg h-14 font-semibold shadow-lg hover:shadow-xl transition-all duration-300" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t("sending") || "Sending..."}</> : t("requestPrice")}
              </Button>
            </div>
          </div>

          {/* Booking Process */}
          <div className="mt-10 pt-8 border-t border-white/20">
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">🔁 {t("howBookingWorks")}</h2>
            <p className="text-white/90 mb-6 text-sm md:text-base">{t("bookingProcessIntro")}</p>
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 text-left mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4"><div className="text-accent font-bold text-lg mb-2">1️⃣ {t("step1Title")}</div><p className="text-white/80 text-sm">{t("step1Desc")}</p></div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4"><div className="text-accent font-bold text-lg mb-2">2️⃣ {t("step2Title")}</div><p className="text-white/80 text-sm">{t("step2Desc")}</p></div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4"><div className="text-accent font-bold text-lg mb-2">3️⃣ {t("step3Title")}</div><p className="text-white/80 text-sm">{t("step3Desc")}</p></div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-white/90 text-sm">
              <div className="flex items-center gap-2"><span className="text-accent">✅</span><span>{t("benefit1")}</span></div>
              <div className="flex items-center gap-2"><span className="text-accent">✅</span><span>{t("benefit2")}</span></div>
              <div className="flex items-center gap-2"><span className="text-accent">✅</span><span>{t("benefit3")}</span></div>
            </div>
          </div>

          {/* Service Locations */}
          <div className="pt-8">
            <p className="text-white/70 text-sm mb-4">{t("serviceLocations") || "We serve:"}</p>
            <div className="flex flex-wrap justify-center gap-3">
              {["Istanbul", "Antalya", "Bodrum", "Dalaman", "Izmir", "Cappadocia", "Dubai", "Cyprus"].map((city) => (
                <span key={city} className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-white font-semibold text-sm border border-white/20 hover:bg-white/25 transition-colors">
                  {city}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 pt-6 text-white/80 text-sm font-sans">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent"></div><span>{t("service247")}</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent"></div><span>{t("professionalDrivers")}</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent"></div><span>{t("luxuryFleet")}</span></div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" fillOpacity="1" />
        </svg>
      </div>
    </section>
  );
};