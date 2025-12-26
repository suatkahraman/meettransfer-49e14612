import { useState, useRef } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, CalendarIcon, Clock, Car, Users, Loader2, ArrowLeftRight, Coins, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { GooglePlacesAutocomplete, PlaceDetails } from "@/components/ui/google-places-autocomplete";
import { cn } from "@/lib/utils";
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

// Vehicle images
import vito2 from "@/assets/vito-2.jpg";
import vito3 from "@/assets/vito-3.jpg";
import vito4 from "@/assets/vito-4.jpg";
import vito5 from "@/assets/vito-5.jpg";
import vitoAirportAnime from "@/assets/vito-airport-anime.jpg";
import vitoAirportWelcome from "@/assets/vito-airport-welcome.jpg";
import vitoCappadociaBalloon from "@/assets/vito-cappadocia-balloon.jpg";
import vitoFamilyInterior from "@/assets/vito-family-interior.jpg";
import vitoInteriorLeather from "@/assets/vito-interior-leather.jpg";
import vitoExteriorBlack from "@/assets/vito-exterior-black.jpg";
import vitoPassengerOrange from "@/assets/vito-passenger-orange.jpg";
import vitoExteriorOpendoor from "@/assets/vito-exterior-opendoor.jpg";
import vitoPassengerNight from "@/assets/vito-passenger-night.jpg";
import vitoPassengerCouple from "@/assets/vito-passenger-couple.jpg";
import vitoVip1 from "@/assets/vito-vip-1.jpg";
import vitoVip2 from "@/assets/vito-vip-2.jpg";
import vitoVip3 from "@/assets/vito-vip-3.jpg";
import vitoVip4 from "@/assets/vito-vip-4.jpg";
import vitoVip5 from "@/assets/vito-vip-5.jpg";
import vitoVipPassengers1 from "@/assets/vito-vip-passengers-1.jpg";
import vitoVipPassengers2 from "@/assets/vito-vip-passengers-2.jpg";
import vitoVipStarlightPurple from "@/assets/vito-vip-starlight-purple.jpg";
import vitoVipStarlightRoof from "@/assets/vito-vip-starlight-roof.jpg";
import vitoVipLuxuryWhite from "@/assets/vito-vip-luxury-white.jpg";
import vitoVipCoupleStarlight from "@/assets/vito-vip-couple-starlight.jpg";
import vitoVipPassengersDay from "@/assets/vito-vip-passengers-day.jpg";
import maybach1 from "@/assets/maybach-1.jpg";
import maybach2 from "@/assets/maybach-2.jpg";
import maybach3 from "@/assets/maybach-3.jpg";
import maybach4 from "@/assets/maybach-4.jpg";
import maybach5 from "@/assets/maybach-5.jpg";
import maybachInterior from "@/assets/maybach-interior-starlight.jpg";
import maybachPassengersBlue from "@/assets/maybach-passengers-blue.jpg";
import maybachInteriorPurple from "@/assets/maybach-interior-purple.jpg";
import maybachInteriorOrange from "@/assets/maybach-interior-orange.jpg";
import sprinter1 from "@/assets/sprinter-1.jpg";
import sprinter2 from "@/assets/sprinter-2.jpg";
import sprinter3 from "@/assets/sprinter-3.jpg";
import sprinter4 from "@/assets/sprinter-4.jpg";
import sprinter5 from "@/assets/sprinter-5.jpg";
import sprinterLuggage from "@/assets/sprinter-luggage.jpg";
import sprinterExteriorVip from "@/assets/sprinter-exterior-vip.jpg";
import sprinterAirportFront from "@/assets/sprinter-airport-front.jpg";
import sprinterInteriorGrey from "@/assets/sprinter-interior-grey.jpg";
import sprinterInteriorTv from "@/assets/sprinter-interior-tv.jpg";
import sprinterInteriorRed from "@/assets/sprinter-interior-red.jpg";
import sprinterInteriorStarlight from "@/assets/sprinter-interior-starlight.jpg";
import sprinterInteriorBlue from "@/assets/sprinter-interior-blue.jpg";
import sprinterExteriorDark from "@/assets/sprinter-exterior-dark.jpg";
import sprinterInteriorNeon from "@/assets/sprinter-interior-neon.jpg";
import sprinterAirportNight from "@/assets/sprinter-airport-night.jpg";
import meetTransferCyprus from "@/assets/meet-transfer-cyprus.png";
import meetTransferDubai from "@/assets/meet-transfer-dubai.png";

// Vehicle data with images and SEO-friendly alt texts
const vehicleImageData: Record<string, { images: { src: string; alt: string }[]; passengers: number; luggage: number }> = {
  "mercedes-vito": {
    images: [
      { src: vito2, alt: "Mercedes Vito VIP airport transfer vehicle exterior" },
      { src: vitoAirportAnime, alt: "Mercedes Vito private transfer at airport terminal" },
      { src: vito3, alt: "Mercedes Vito luxury transfer service Turkey" },
      { src: vitoAirportWelcome, alt: "Mercedes Vito airport pickup with welcome service" },
      { src: meetTransferCyprus, alt: "Meet Transfer VIP service in Cyprus" },
      { src: vitoCappadociaBalloon, alt: "Mercedes Vito transfer to Cappadocia hot air balloons" },
      { src: vito4, alt: "Mercedes Vito comfortable interior for family transfers" },
      { src: vitoFamilyInterior, alt: "Mercedes Vito spacious family interior with leather seats" },
      { src: vitoInteriorLeather, alt: "Mercedes Vito premium leather interior detail" },
      { src: meetTransferDubai, alt: "Meet Transfer luxury service in Dubai" },
      { src: vitoExteriorBlack, alt: "Mercedes Vito black exterior professional transfer" },
      { src: vito5, alt: "Mercedes Vito executive airport transfer Istanbul" },
      { src: vitoPassengerOrange, alt: "Mercedes Vito passengers enjoying comfortable ride" },
      { src: vitoExteriorOpendoor, alt: "Mercedes Vito with open door welcoming passengers" },
      { src: vitoPassengerNight, alt: "Mercedes Vito night transfer service with ambient lighting" },
      { src: vitoPassengerCouple, alt: "Mercedes Vito romantic transfer for couples" },
    ],
    passengers: 7,
    luggage: 7,
  },
  "mercedes-vclass": {
    images: [
      { src: vitoVip1, alt: "Mercedes VIP Vito luxury transfer with starlight ceiling" },
      { src: vitoVipStarlightPurple, alt: "Mercedes VIP Vito purple starlight roof interior" },
      { src: meetTransferDubai, alt: "Meet Transfer VIP service in Dubai UAE" },
      { src: vitoVip2, alt: "Mercedes VIP Vito executive leather interior" },
      { src: vitoVipStarlightRoof, alt: "Mercedes VIP Vito starlight ceiling ambient lighting" },
      { src: vitoVipPassengers1, alt: "VIP passengers enjoying Mercedes Vito luxury transfer" },
      { src: vitoVip3, alt: "Mercedes VIP Vito premium business class interior" },
      { src: vitoVipLuxuryWhite, alt: "Mercedes VIP Vito white leather luxury interior" },
      { src: meetTransferCyprus, alt: "Meet Transfer VIP chauffeur service Cyprus" },
      { src: vitoVip4, alt: "Mercedes VIP Vito entertainment system and mini bar" },
      { src: vitoVipCoupleStarlight, alt: "Couple enjoying Mercedes VIP Vito starlight transfer" },
      { src: vitoVipPassengers2, alt: "Business travelers in Mercedes VIP Vito" },
      { src: vitoVip5, alt: "Mercedes VIP Vito first class airport transfer" },
      { src: vitoVipPassengersDay, alt: "Mercedes VIP Vito daytime luxury transfer service" },
    ],
    passengers: 6,
    luggage: 6,
  },
  "maybach": {
    images: [
      { src: maybach1, alt: "Mercedes Maybach Minivan ultra luxury VIP transfer" },
      { src: meetTransferCyprus, alt: "Meet Transfer Maybach service in Cyprus" },
      { src: maybach2, alt: "Mercedes Maybach Minivan executive interior design" },
      { src: maybachInterior, alt: "Mercedes Maybach starlight ceiling luxury interior" },
      { src: maybachPassengersBlue, alt: "VIP passengers in Mercedes Maybach blue ambient lighting" },
      { src: maybach3, alt: "Mercedes Maybach Minivan premium leather seats" },
      { src: meetTransferDubai, alt: "Meet Transfer Maybach luxury service Dubai" },
      { src: maybachInteriorPurple, alt: "Mercedes Maybach purple starlight ceiling with TV entertainment" },
      { src: maybach4, alt: "Mercedes Maybach Minivan first class comfort" },
      { src: maybach5, alt: "Mercedes Maybach Minivan exclusive VIP transfer Turkey" },
      { src: maybachInteriorOrange, alt: "Mercedes Maybach orange leather interior with starlight roof" },
    ],
    passengers: 4,
    luggage: 4,
  },
  "minibus": {
    images: [
      { src: sprinter1, alt: "Mercedes Sprinter VIP minibus group transfer" },
      { src: sprinterExteriorVip, alt: "Mercedes Sprinter VIP exterior luxury design" },
      { src: sprinter2, alt: "Mercedes Sprinter minibus comfortable seating" },
      { src: sprinterInteriorGrey, alt: "Mercedes Sprinter grey leather interior design" },
      { src: meetTransferDubai, alt: "Meet Transfer Sprinter minibus Dubai" },
      { src: sprinter3, alt: "Mercedes Sprinter spacious luggage compartment" },
      { src: sprinterInteriorTv, alt: "Mercedes Sprinter entertainment TV system" },
      { src: sprinterLuggage, alt: "Mercedes Sprinter large luggage capacity for groups" },
      { src: sprinterInteriorRed, alt: "Mercedes Sprinter red ambient lighting interior" },
      { src: sprinter4, alt: "Mercedes Sprinter executive group transfer" },
      { src: sprinterInteriorStarlight, alt: "Mercedes Sprinter starlight ceiling luxury" },
      { src: meetTransferCyprus, alt: "Meet Transfer Sprinter minibus Cyprus" },
      { src: sprinterInteriorBlue, alt: "Mercedes Sprinter blue LED interior lighting" },
      { src: sprinter5, alt: "Mercedes Sprinter VIP minibus Turkey transfer" },
      { src: sprinterExteriorDark, alt: "Mercedes Sprinter black exterior professional service" },
      { src: sprinterAirportFront, alt: "Mercedes Sprinter airport transfer front view" },
      { src: sprinterInteriorNeon, alt: "Mercedes Sprinter neon interior party atmosphere" },
      { src: sprinterAirportNight, alt: "Mercedes Sprinter night airport transfer service" },
    ],
    passengers: 16,
    luggage: 16,
  },
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

const vehicleTypes = [
  { value: 'mercedes-vito', label: 'Mercedes Vito' },
  { value: 'mercedes-vclass', label: 'VIP Vito' },
  { value: 'maybach', label: 'Maybach Minivan' },
  { value: 'minibus', label: 'Minibus' },
];

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
  
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [vehicleType, setVehicleType] = useState("mercedes-vito");
  const [passengers, setPassengers] = useState("1");
  const [preferredCurrency, setPreferredCurrency] = useState("EUR");
  const [submitting, setSubmitting] = useState(false);
  
  const [hasReturnTrip, setHasReturnTrip] = useState(false);
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTime, setReturnTime] = useState("");

const currencyOptions = [
  { value: 'EUR', label: '€ EUR', flag: '🇪🇺' },
  { value: 'USD', label: '$ USD', flag: '🇺🇸' },
  { value: 'GBP', label: '£ GBP', flag: '🇬🇧' },
  { value: 'TRY', label: '₺ TRY', flag: '🇹🇷' },
  { value: 'AED', label: 'د.إ AED', flag: '🇦🇪' },
];
  
  // Popover open states
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [returnDatePopoverOpen, setReturnDatePopoverOpen] = useState(false);

  const handleRequestPrice = async () => {
    const missingFields: string[] = [];
    if (!pickup) missingFields.push(t("pickupPoint") || "Pickup");
    if (!dropoff) missingFields.push(t("dropoffLocation") || "Drop-off");
    if (!date) missingFields.push(t("pickupDate") || "Date");
    if (!time) missingFields.push(t("pickupTime") || "Time");
    
    if (missingFields.length > 0) {
      toast.error(`${t("pleaseFilAllFields") || "Please fill in"}: ${missingFields.join(", ")}`);
      return;
    }
    
    if (hasReturnTrip && (!returnDate || !returnTime)) {
      toast.error(t("pleaseFilAllFields") || "Please fill in all required fields");
      return;
    }

    // If user is logged in, redirect to reservation form
    if (user) {
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

    // For anonymous users, use QuickBookingConfirm flow
    setSubmitting(true);
    try {
      const sessionId = getSessionId();
      
      const { data, error } = await supabase
        .from("quick_booking_requests")
        .insert({
          pickup,
          dropoff,
          pickup_date: format(date, "yyyy-MM-dd"),
          pickup_time: time,
          vehicle_type: vehicleType,
          passengers: parseInt(passengers),
          customer_session_id: sessionId,
          price_currency: preferredCurrency,
        })
        .select()
        .single();

      if (error) throw error;

      // Notify admin about new quick booking request via email
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
          },
        });
      } catch (notifyError) {
        console.error("Failed to notify admin:", notifyError);
        // Don't fail the user flow
      }

      let url = `/quick-booking-confirm?token=${data.confirmation_token}`;
      if (hasReturnTrip && returnDate && returnTime) {
        url += `&hasReturn=true&returnDate=${format(returnDate, "yyyy-MM-dd")}&returnTime=${returnTime}`;
      }
      navigate(url);
      toast.success(t("priceRequestSent") || "Your price request has been sent!");
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

              {/* Vehicle & Passengers */}
              <div className="relative">
                <label className="text-white/90 text-sm font-medium mb-2 block text-left">{t("vehicleType")}</label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger className="w-full h-12 bg-white border-0 text-foreground rounded-lg shadow-md">
                    <div className="flex items-center"><Car className="mr-2 h-5 w-5 text-primary" /><SelectValue placeholder={t("selectVehicle")} /></div>
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">{vehicleTypes.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Vehicle Image Carousel */}
              {vehicleType && vehicleImageData[vehicleType] && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
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
                      {vehicleImageData[vehicleType].images.map((img, idx) => (
                        <CarouselItem key={idx}>
                          <div className="overflow-hidden rounded-xl aspect-[4/3] bg-black/20">
                            <img
                              src={img.src}
                              alt={img.alt}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2 bg-white/80 hover:bg-white" />
                    <CarouselNext className="right-2 bg-white/80 hover:bg-white" />
                    <CarouselDots className="[&_button]:bg-white/40 [&_button.bg-primary]:bg-white" />
                  </Carousel>
                  
                  {/* Vehicle Info */}
                  <div className="flex justify-center gap-6 text-sm text-white/90">
                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                      <Users className="h-4 w-4" />
                      <span>{vehicleImageData[vehicleType].passengers} {t("passengers")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                      <Briefcase className="h-4 w-4" />
                      <span>{vehicleImageData[vehicleType].luggage} {t("luggage") || "Luggage"}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative">
                <label className="text-white/90 text-sm font-medium mb-2 block text-left">{t("passengers")}</label>
                <Select value={passengers} onValueChange={setPassengers}>
                  <SelectTrigger className="w-full h-12 bg-white border-0 text-foreground rounded-lg shadow-md">
                    <div className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /><SelectValue placeholder={t("selectPassengers")} /></div>
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50 max-h-[300px]">{Array.from({ length: 19 }, (_, i) => i + 1).map((num) => <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? t("passenger") : t("passengers")}</SelectItem>)}</SelectContent>
                </Select>
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
                  <div className="grid md:grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
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
                )}
                
                {hasReturnTrip && <p className="text-accent text-sm font-medium flex items-center gap-2">🎁 {t("returnTripDiscount")}</p>}
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