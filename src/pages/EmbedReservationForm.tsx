/**
 * Embeddable Reservation Form for External Websites
 * 
 * This page is designed to be embedded as an iframe on partner websites.
 * When the user fills the form and clicks "Get Quote", they are redirected
 * to the main meettransfer.app/book page with all the form data.
 * 
 * Usage:
 * <iframe src="https://meettransfer.app/embed" width="100%" height="600" frameborder="0"></iframe>
 * 
 * Optional URL parameters:
 * - ?lang=TR|EN|DE|FR|RU|ES|IT|AR|PL|PT|NL (default: EN)
 * - ?theme=light|dark (default: light)
 */

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Car, Timer, MapPin, Calendar, Clock, Users, ArrowRight, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

// Import UI components
import { LazyGooglePlacesAutocomplete, type PlaceDetails } from "@/components/ui/lazy-google-places-autocomplete";
import { FloatingLabelDatePicker } from "@/components/ui/floating-label-datepicker";
import { TimePickerAMPM } from "@/components/ui/time-picker-ampm";

// Translations for the embed form
const EMBED_TRANSLATIONS: Record<string, Record<string, string>> = {
  EN: {
    transfer: "Transfer",
    hourly: "Hourly",
    pickupLocation: "Pickup Location",
    dropoffLocation: "Drop-off Location",
    pickupDate: "Pickup Date",
    pickupTime: "Pickup Time",
    passengers: "Passengers",
    getQuote: "Get Quote",
    pleaseWait: "Please wait...",
    pleaseComplete: "Please fill in all required fields",
    poweredBy: "Powered by Meet Transfer",
    city: "City",
    duration: "Duration",
    hours: "hours",
    days: "days",
  },
  TR: {
    transfer: "Transfer",
    hourly: "Saatlik",
    pickupLocation: "Alış Noktası",
    dropoffLocation: "Varış Noktası",
    pickupDate: "Tarih",
    pickupTime: "Saat",
    passengers: "Yolcu",
    getQuote: "Fiyat Al",
    pleaseWait: "Lütfen bekleyin...",
    pleaseComplete: "Lütfen tüm alanları doldurun",
    poweredBy: "Meet Transfer ile güçlendirildi",
    city: "Şehir",
    duration: "Süre",
    hours: "saat",
    days: "gün",
  },
  DE: {
    transfer: "Transfer",
    hourly: "Stündlich",
    pickupLocation: "Abholort",
    dropoffLocation: "Zielort",
    pickupDate: "Datum",
    pickupTime: "Zeit",
    passengers: "Passagiere",
    getQuote: "Preis erhalten",
    pleaseWait: "Bitte warten...",
    pleaseComplete: "Bitte füllen Sie alle Felder aus",
    poweredBy: "Powered by Meet Transfer",
    city: "Stadt",
    duration: "Dauer",
    hours: "Stunden",
    days: "Tage",
  },
  FR: {
    transfer: "Transfert",
    hourly: "À l'heure",
    pickupLocation: "Lieu de prise en charge",
    dropoffLocation: "Lieu de dépose",
    pickupDate: "Date",
    pickupTime: "Heure",
    passengers: "Passagers",
    getQuote: "Obtenir un devis",
    pleaseWait: "Veuillez patienter...",
    pleaseComplete: "Veuillez remplir tous les champs",
    poweredBy: "Propulsé par Meet Transfer",
    city: "Ville",
    duration: "Durée",
    hours: "heures",
    days: "jours",
  },
  RU: {
    transfer: "Трансфер",
    hourly: "Почасовой",
    pickupLocation: "Место посадки",
    dropoffLocation: "Место высадки",
    pickupDate: "Дата",
    pickupTime: "Время",
    passengers: "Пассажиры",
    getQuote: "Получить цену",
    pleaseWait: "Пожалуйста, подождите...",
    pleaseComplete: "Пожалуйста, заполните все поля",
    poweredBy: "Работает на Meet Transfer",
    city: "Город",
    duration: "Длительность",
    hours: "часов",
    days: "дней",
  },
  ES: {
    transfer: "Traslado",
    hourly: "Por hora",
    pickupLocation: "Punto de recogida",
    dropoffLocation: "Destino",
    pickupDate: "Fecha",
    pickupTime: "Hora",
    passengers: "Pasajeros",
    getQuote: "Obtener precio",
    pleaseWait: "Por favor espere...",
    pleaseComplete: "Por favor complete todos los campos",
    poweredBy: "Desarrollado por Meet Transfer",
    city: "Ciudad",
    duration: "Duración",
    hours: "horas",
    days: "días",
  },
  IT: {
    transfer: "Trasferimento",
    hourly: "Orario",
    pickupLocation: "Punto di ritiro",
    dropoffLocation: "Destinazione",
    pickupDate: "Data",
    pickupTime: "Ora",
    passengers: "Passeggeri",
    getQuote: "Ottieni preventivo",
    pleaseWait: "Attendere...",
    pleaseComplete: "Compilare tutti i campi",
    poweredBy: "Powered by Meet Transfer",
    city: "Città",
    duration: "Durata",
    hours: "ore",
    days: "giorni",
  },
  AR: {
    transfer: "نقل",
    hourly: "بالساعة",
    pickupLocation: "موقع الالتقاط",
    dropoffLocation: "موقع الوصول",
    pickupDate: "التاريخ",
    pickupTime: "الوقت",
    passengers: "الركاب",
    getQuote: "احصل على السعر",
    pleaseWait: "يرجى الانتظار...",
    pleaseComplete: "يرجى ملء جميع الحقول",
    poweredBy: "مدعوم من Meet Transfer",
    city: "المدينة",
    duration: "المدة",
    hours: "ساعات",
    days: "أيام",
  },
  PL: {
    transfer: "Transfer",
    hourly: "Godzinowy",
    pickupLocation: "Miejsce odbioru",
    dropoffLocation: "Miejsce docelowe",
    pickupDate: "Data",
    pickupTime: "Godzina",
    passengers: "Pasażerowie",
    getQuote: "Uzyskaj wycenę",
    pleaseWait: "Proszę czekać...",
    pleaseComplete: "Proszę wypełnić wszystkie pola",
    poweredBy: "Obsługiwane przez Meet Transfer",
    city: "Miasto",
    duration: "Czas trwania",
    hours: "godzin",
    days: "dni",
  },
  PT: {
    transfer: "Transferência",
    hourly: "Por hora",
    pickupLocation: "Local de partida",
    dropoffLocation: "Destino",
    pickupDate: "Data",
    pickupTime: "Hora",
    passengers: "Passageiros",
    getQuote: "Obter cotação",
    pleaseWait: "Por favor aguarde...",
    pleaseComplete: "Por favor preencha todos os campos",
    poweredBy: "Desenvolvido por Meet Transfer",
    city: "Cidade",
    duration: "Duração",
    hours: "horas",
    days: "dias",
  },
  NL: {
    transfer: "Transfer",
    hourly: "Per uur",
    pickupLocation: "Ophaallocatie",
    dropoffLocation: "Bestemming",
    pickupDate: "Datum",
    pickupTime: "Tijd",
    passengers: "Passagiers",
    getQuote: "Offerte aanvragen",
    pleaseWait: "Even geduld...",
    pleaseComplete: "Vul alle velden in",
    poweredBy: "Powered by Meet Transfer",
    city: "Stad",
    duration: "Duur",
    hours: "uur",
    days: "dagen",
  },
};

// Available cities for hourly rentals
const HOURLY_CITIES = [
  { value: "istanbul", label: "Istanbul" },
  { value: "antalya", label: "Antalya" },
  { value: "izmir", label: "Izmir" },
  { value: "cappadocia", label: "Cappadocia" },
  { value: "bodrum", label: "Bodrum" },
];

// Duration options
const DURATION_OPTIONS = [
  { value: "4h", label: "4", type: "hours" },
  { value: "6h", label: "6", type: "hours" },
  { value: "8h", label: "8", type: "hours" },
  { value: "12h", label: "12", type: "hours" },
  { value: "1d", label: "1", type: "days" },
  { value: "2d", label: "2", type: "days" },
  { value: "3d", label: "3", type: "days" },
];

// Base URL for redirects
const BASE_URL = "https://meettransfer.app";

const EmbedReservationForm = () => {
  const [searchParams] = useSearchParams();
  
  // Get language from URL params (default: EN)
  const langParam = (searchParams.get("lang") || "EN").toUpperCase();
  const language = EMBED_TRANSLATIONS[langParam] ? langParam : "EN";
  const t = EMBED_TRANSLATIONS[language];
  
  // Theme from URL params
  const theme = searchParams.get("theme") || "light";
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"ride" | "hourly">("ride");
  
  // Transfer form state
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState(() => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? 30 : 0;
    const hours = minutes < 30 ? now.getHours() : now.getHours() + 1;
    return `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
  });
  const [passengers, setPassengers] = useState("2");
  
  // Hourly form state
  const [hourlyCity, setHourlyCity] = useState("");
  const [hourlyDuration, setHourlyDuration] = useState("4h");
  const [hourlyDate, setHourlyDate] = useState<Date | undefined>(new Date());
  const [hourlyTime, setHourlyTime] = useState(() => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? 30 : 0;
    const hours = minutes < 30 ? now.getHours() : now.getHours() + 1;
    return `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
  });
  const [hourlyPassengers, setHourlyPassengers] = useState("2");
  
  const [submitting, setSubmitting] = useState(false);
  
  // Apply theme
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);
  
  // Handle transfer form continue - redirect to meettransfer.app
  const handleTransferContinue = useCallback(() => {
    if (!pickup || !dropoff || !date || !time) {
      toast.error(t.pleaseComplete);
      return;
    }
    
    setSubmitting(true);
    
    // Build URL params
    const params = new URLSearchParams();
    params.set("pickup", pickup);
    params.set("dropoff", dropoff);
    params.set("date", format(date, "yyyy-MM-dd"));
    params.set("time", time);
    params.set("passengers", passengers);
    params.set("showVehicleSelection", "true");
    
    // Language prefix for URL
    const langPrefix = language === "EN" ? "" : `/${language.toLowerCase()}`;
    
    // Redirect to main site - open in parent window (breaks out of iframe)
    const targetUrl = `${BASE_URL}${langPrefix}/book?${params.toString()}`;
    
    // Use window.open with _top target to reliably break out of iframe (cross-origin safe)
    window.open(targetUrl, '_top');
  }, [pickup, dropoff, date, time, passengers, language, t.pleaseComplete]);
  
  // Handle hourly form continue - redirect to meettransfer.app
  const handleHourlyContinue = useCallback(() => {
    if (!hourlyCity || !hourlyDate || !hourlyTime) {
      toast.error(t.pleaseComplete);
      return;
    }
    
    setSubmitting(true);
    
    // Build URL params for hourly
    const params = new URLSearchParams();
    params.set("city", hourlyCity);
    params.set("duration", hourlyDuration);
    params.set("date", format(hourlyDate, "yyyy-MM-dd"));
    params.set("time", hourlyTime);
    params.set("passengers", hourlyPassengers);
    params.set("serviceType", "hourly");
    params.set("showVehicleSelection", "true");
    
    // Language prefix for URL
    const langPrefix = language === "EN" ? "" : `/${language.toLowerCase()}`;
    
    // Redirect to main site - use window.open with _top target (cross-origin safe)
    const targetUrl = `${BASE_URL}${langPrefix}/book?${params.toString()}`;
    
    window.open(targetUrl, '_top');
  }, [hourlyCity, hourlyDuration, hourlyDate, hourlyTime, hourlyPassengers, language, t.pleaseComplete]);
  
  // Handle place selection
  const handlePickupSelected = useCallback((value: string, details?: PlaceDetails) => {
    setPickup(details?.displayText || value);
  }, []);
  
  const handleDropoffSelected = useCallback((value: string, details?: PlaceDetails) => {
    setDropoff(details?.displayText || value);
  }, []);

  // RTL support for Arabic
  const isRTL = language === "AR";
  
  return (
    <div 
      className={cn(
        "min-h-screen bg-background p-3 sm:p-4",
        isRTL && "rtl"
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Toaster />
      
      {/* Form Card */}
      <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg border overflow-hidden">
        {/* Tabs */}
        <div className="flex bg-muted/50 relative">
          <div 
            className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300"
            style={{ 
              left: isRTL 
                ? (activeTab === "ride" ? "50%" : "0%") 
                : (activeTab === "ride" ? "0%" : "50%"), 
              width: "50%" 
            }}
          />
          <button 
            onClick={() => setActiveTab("ride")} 
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3.5 px-4 font-medium transition-all text-sm relative",
              activeTab === "ride" ? "text-primary bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Car className="h-4 w-4" />
            <span>{t.transfer}</span>
          </button>
          <button 
            onClick={() => setActiveTab("hourly")} 
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3.5 px-4 font-medium transition-all text-sm",
              activeTab === "hourly" ? "text-primary bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Timer className="h-4 w-4" />
            <span>{t.hourly}</span>
          </button>
        </div>
        
        {/* Form Content */}
        <div className="p-4 space-y-3">
          {activeTab === "ride" ? (
            <>
              {/* Pickup Location */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-zinc-700 dark:bg-zinc-800 transition-all hover:bg-amber-100 dark:hover:bg-zinc-700">
                <LazyGooglePlacesAutocomplete
                  initialValue={pickup}
                  onPlaceSelected={handlePickupSelected}
                  placeholder={t.pickupLocation}
                  className="border-0 bg-transparent h-14 text-base"
                />
              </div>
              
              {/* Dropoff Location */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-zinc-700 dark:bg-zinc-800 transition-all hover:bg-amber-100 dark:hover:bg-zinc-700">
                <LazyGooglePlacesAutocomplete
                  initialValue={dropoff}
                  onPlaceSelected={handleDropoffSelected}
                  placeholder={t.dropoffLocation}
                  className="border-0 bg-transparent h-14 text-base"
                />
              </div>
              
              {/* Date, Time, Passengers Row */}
              <div className="grid grid-cols-3 gap-2">
                {/* Date */}
                <FloatingLabelDatePicker
                  date={date}
                  onSelect={setDate}
                  label={t.pickupDate}
                  disabledDates={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="h-[60px]"
                />
                
                {/* Time */}
                <TimePickerAMPM
                  value={time}
                  onValueChange={setTime}
                />
                
                {/* Passengers */}
                <div className="flex h-[60px] flex-col justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 transition-all hover:bg-amber-100 dark:border-zinc-700 dark:bg-zinc-800">
                  <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {t.passengers}
                  </label>
                  <select 
                    value={passengers} 
                    onChange={(e) => setPassengers(e.target.value)}
                    className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) => (
                      <option key={n} value={n.toString()}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Get Quote Button */}
              <Button 
                onClick={handleTransferContinue}
                disabled={submitting}
                className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {t.pleaseWait}
                  </>
                ) : (
                  <>
                    {t.getQuote}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* City Selection */}
              <div className="flex h-[60px] flex-col justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 transition-all hover:bg-amber-100 dark:border-zinc-700 dark:bg-zinc-800">
                <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {t.city}
                </label>
                <select 
                  value={hourlyCity} 
                  onChange={(e) => setHourlyCity(e.target.value)}
                  className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                >
                  <option value="">--</option>
                  {HOURLY_CITIES.map((city) => (
                    <option key={city.value} value={city.value}>{city.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Duration */}
              <div className="flex h-[60px] flex-col justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 transition-all hover:bg-amber-100 dark:border-zinc-700 dark:bg-zinc-800">
                <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {t.duration}
                </label>
                <select 
                  value={hourlyDuration} 
                  onChange={(e) => setHourlyDuration(e.target.value)}
                  className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} {t[opt.type as keyof typeof t]}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Date, Time, Passengers Row */}
              <div className="grid grid-cols-3 gap-2">
                {/* Date */}
                <FloatingLabelDatePicker
                  date={hourlyDate}
                  onSelect={setHourlyDate}
                  label={t.pickupDate}
                  disabledDates={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="h-[60px]"
                />
                
                {/* Time */}
                <TimePickerAMPM
                  value={hourlyTime}
                  onValueChange={setHourlyTime}
                />
                
                {/* Passengers */}
                <div className="flex h-[60px] flex-col justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 transition-all hover:bg-amber-100 dark:border-zinc-700 dark:bg-zinc-800">
                  <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {t.passengers}
                  </label>
                  <select 
                    value={hourlyPassengers} 
                    onChange={(e) => setHourlyPassengers(e.target.value)}
                    className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) => (
                      <option key={n} value={n.toString()}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Get Quote Button */}
              <Button 
                onClick={handleHourlyContinue}
                disabled={submitting}
                className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {t.pleaseWait}
                  </>
                ) : (
                  <>
                    {t.getQuote}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-muted/30 border-t text-center">
          <a 
            href="https://meettransfer.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {t.poweredBy}
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmbedReservationForm;
