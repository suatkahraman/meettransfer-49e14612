import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, CalendarIcon, Clock, ArrowRight, Loader2, Car, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { GooglePlacesAutocomplete, PlaceDetails } from "@/components/ui/google-places-autocomplete";
import { cn } from "@/lib/utils";
import meetTransferLogo from "@/assets/meet-transfer-logo-small.webp";
import CityMarquee from "@/components/website/CityMarquee";
import { toast } from "sonner";

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
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Hourly form state
  const [hourlyCity, setHourlyCity] = useState("");
  const [hourlyDate, setHourlyDate] = useState<Date | undefined>(undefined);
  const [hourlyTime, setHourlyTime] = useState("");
  const [hourlyDuration, setHourlyDuration] = useState("4");
  const [hourlyDatePopoverOpen, setHourlyDatePopoverOpen] = useState(false);

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
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("pickupPoint")}</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
                        <GooglePlacesAutocomplete 
                          onPlaceSelected={handlePickupSelected} 
                          placeholder={t("enterPickupPoint") || "Airport, hotel, address..."} 
                          className="pl-10 h-14 bg-muted/50 border-2 border-transparent focus:border-primary text-foreground placeholder:text-muted-foreground rounded-xl transition-all" 
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
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
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
                            <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                            {date ? format(date, "dd MMM yyyy") : <span>{t("selectDate")}</span>}
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
                            <Clock className="mr-2 h-5 w-5 text-primary" />
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
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
                        <GooglePlacesAutocomplete 
                          onPlaceSelected={handleHourlyCitySelected} 
                          placeholder={t("selectCity") || "Istanbul, Antalya, Dubai..."} 
                          className="pl-10 h-14 bg-muted/50 border-2 border-transparent focus:border-primary text-foreground placeholder:text-muted-foreground rounded-xl transition-all" 
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="text-muted-foreground text-sm font-medium mb-2 block text-left">{t("duration") || "Duration"}</label>
                      <Select value={hourlyDuration} onValueChange={setHourlyDuration}>
                        <SelectTrigger className="w-full h-14 bg-muted/50 border-2 border-transparent hover:border-primary/50 text-foreground rounded-xl transition-all">
                          <div className="flex items-center">
                            <Timer className="mr-2 h-5 w-5 text-primary" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="z-50">
                          {hourlyDurationOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label.replace("hours", t("hours") || "hours")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
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
                            <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                            {hourlyDate ? format(hourlyDate, "dd MMM yyyy") : <span>{t("selectDate")}</span>}
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
                            <Clock className="mr-2 h-5 w-5 text-primary" />
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
                  </div>

                  {/* Info Box */}
                  <div className="bg-accent/10 rounded-xl p-4 text-left">
                    <p className="text-sm text-accent font-medium flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      {t("hourlyRentalInfo") || "Driver at your disposal for the selected duration. Visit multiple locations!"}
                    </p>
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
