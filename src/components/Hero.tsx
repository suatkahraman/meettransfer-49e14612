import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, MapPin, Navigation, CalendarIcon, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { InstallAppButton } from "@/components/website/InstallAppButton";
import { GooglePlacesAutocomplete, PlaceDetails } from "@/components/ui/google-places-autocomplete";
import { cn } from "@/lib/utils";
import meetTransferLogo from "@/assets/meet-transfer-logo-small.webp";

// Generate time options from 00:00 to 23:30 in 30-minute intervals
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

export const Hero = () => {
  const { t, getLocalizedPath } = useLanguage();
  const navigate = useNavigate();
  
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");

  const handleRequestPrice = () => {
    // Navigate to booking form with pickup, dropoff, date and time as URL params
    const params = new URLSearchParams();
    if (pickup) params.set("pickup", pickup);
    if (dropoff) params.set("dropoff", dropoff);
    if (date) params.set("date", format(date, "yyyy-MM-dd"));
    if (time) params.set("time", time);
    navigate(`${getLocalizedPath("/book")}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handlePickupSelected = (value: string, details?: PlaceDetails) => {
    setPickup(details?.displayText || value);
  };

  const handleDropoffSelected = (value: string, details?: PlaceDetails) => {
    setDropoff(details?.displayText || value);
  };
  
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80">
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
                {/* Pick-up Point */}
                <div className="relative">
                  <label className="text-white/90 text-sm font-medium mb-2 block text-left">
                    {t("pickupPoint")}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
                    <GooglePlacesAutocomplete
                      onPlaceSelected={handlePickupSelected}
                      placeholder={t("enterPickupPoint")}
                      className="pl-10 h-12 bg-white border-0 text-foreground placeholder:text-muted-foreground rounded-lg shadow-md focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* Drop-off Point */}
                <div className="relative">
                  <label className="text-white/90 text-sm font-medium mb-2 block text-left">
                    {t("dropoffLocation")}
                  </label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-accent z-10" />
                    <GooglePlacesAutocomplete
                      onPlaceSelected={handleDropoffSelected}
                      placeholder={t("hotelOrAddress")}
                      className="pl-10 h-12 bg-white border-0 text-foreground placeholder:text-muted-foreground rounded-lg shadow-md focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Date & Time Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Date Picker */}
                <div className="relative">
                  <label className="text-white/90 text-sm font-medium mb-2 block text-left">
                    {t("pickupDate")}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-12 justify-start text-left font-normal bg-white border-0 text-foreground rounded-lg shadow-md hover:bg-white/95",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                        {date ? format(date, "dd/MM/yyyy") : <span>{t("selectDate")}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Picker */}
                <div className="relative">
                  <label className="text-white/90 text-sm font-medium mb-2 block text-left">
                    {t("pickupTime")}
                  </label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger className="w-full h-12 bg-white border-0 text-foreground rounded-lg shadow-md">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-5 w-5 text-primary" />
                        <SelectValue placeholder={t("selectTime")} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {timeOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Request Price Button */}
              <Button 
                onClick={handleRequestPrice}
                size="lg" 
                variant="accent" 
                className="w-full text-lg h-14 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {t("requestPrice")}
              </Button>
            </div>
          </div>

          {/* Booking Process Section */}
          <div className="mt-10 pt-8 border-t border-white/20">
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">
              🔁 {t("howBookingWorks")}
            </h2>
            <p className="text-white/90 mb-6 text-sm md:text-base">{t("bookingProcessIntro")}</p>
            
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 text-left mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-accent font-bold text-lg mb-2">1️⃣ {t("step1Title")}</div>
                <p className="text-white/80 text-sm">{t("step1Desc")}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-accent font-bold text-lg mb-2">2️⃣ {t("step2Title")}</div>
                <p className="text-white/80 text-sm">{t("step2Desc")}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-accent font-bold text-lg mb-2">3️⃣ {t("step3Title")}</div>
                <p className="text-white/80 text-sm">{t("step3Desc")}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-accent">✅</span>
                <span>{t("benefit1")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent">✅</span>
                <span>{t("benefit2")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent">✅</span>
                <span>{t("benefit3")}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 pt-8 text-white/80 text-sm font-sans">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span>{t("service247")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span>{t("professionalDrivers")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span>{t("luxuryFleet")}</span>
            </div>
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
