import * as React from "react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { tr, enUS, de, fr, ru, ar, es, it } from "date-fns/locale";
import { 
  Car, CreditCard, Banknote, Calendar as CalendarIcon, Clock, 
  Send, Sparkles, Check, Users, Sun, Sunset, Moon, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Vehicle type constants
const VEHICLE_TYPES = [
  { id: "sedan", passengers: "1-3", icon: Car },
  { id: "vip-mercedes", passengers: "4-6", icon: Car },
  { id: "minibus", passengers: "7-14", icon: Users },
] as const;

// Payment methods
const PAYMENT_METHODS = [
  { id: "card", icon: CreditCard },
  { id: "cash", icon: Banknote },
] as const;

interface ChatCombinedQuickPanelProps {
  language: string;
  onSubmit: (selections: {
    vehicleType: string;
    paymentMethod: "card" | "cash";
    date?: Date;
    time?: string;
    formattedDate?: string;
    formattedTime?: string;
  }) => void;
  disabled?: boolean;
  className?: string;
  showDatePicker?: boolean; // Only show if date not already specified
  showTimePicker?: boolean; // Only show if time not already specified
  currentVehicle?: string;
  currentPayment?: "card" | "cash";
}

const getLocale = (lang: string) => {
  const localeMap: Record<string, typeof enUS> = {
    TR: tr, EN: enUS, DE: de, FR: fr, RU: ru, AR: ar, ES: es, IT: it,
  };
  return localeMap[lang] || enUS;
};

const getLocalizedText = (language: string, translations: Record<string, string>): string => {
  return translations[language] || translations["EN"];
};

// Generate time slots from 00:00 to 23:30 in 30-minute intervals
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Get time period icon and label
const getTimePeriod = (hour: number, language: string) => {
  if (hour >= 6 && hour < 12) {
    return {
      icon: Sun,
      label: getLocalizedText(language, {
        TR: "Sabah", EN: "Morning", DE: "Morgen", FR: "Matin",
        RU: "Утро", AR: "صباح", ES: "Mañana", IT: "Mattina",
      }),
      className: "text-amber-500",
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      icon: Sun,
      label: getLocalizedText(language, {
        TR: "Öğlen", EN: "Afternoon", DE: "Nachmittag", FR: "Après-midi",
        RU: "День", AR: "ظهر", ES: "Tarde", IT: "Pomeriggio",
      }),
      className: "text-orange-500",
    };
  } else if (hour >= 18 && hour < 21) {
    return {
      icon: Sunset,
      label: getLocalizedText(language, {
        TR: "Akşam", EN: "Evening", DE: "Abend", FR: "Soir",
        RU: "Вечер", AR: "مساء", ES: "Noche", IT: "Sera",
      }),
      className: "text-purple-500",
    };
  } else {
    return {
      icon: Moon,
      label: getLocalizedText(language, {
        TR: "Gece", EN: "Night", DE: "Nacht", FR: "Nuit",
        RU: "Ночь", AR: "ليل", ES: "Noche", IT: "Notte",
      }),
      className: "text-indigo-500",
    };
  }
};

export function ChatCombinedQuickPanel({
  language,
  onSubmit,
  disabled = false,
  className,
  showDatePicker = true,
  showTimePicker = true,
  currentVehicle,
  currentPayment,
}: ChatCombinedQuickPanelProps) {
  // State for selections
  const [selectedVehicle, setSelectedVehicle] = React.useState<string>(currentVehicle || "vip-mercedes");
  const [selectedPayment, setSelectedPayment] = React.useState<"card" | "cash">(currentPayment || "card");
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = React.useState<string | undefined>(undefined);
  
  // Popover states
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [timeOpen, setTimeOpen] = React.useState(false);

  const locale = getLocale(language);
  const today = startOfDay(new Date());

  // Quick date options
  const quickDates = [
    { 
      label: getLocalizedText(language, { TR: "Bugün", EN: "Today", DE: "Heute", FR: "Aujourd'hui", RU: "Сегодня", AR: "اليوم", ES: "Hoy", IT: "Oggi" }), 
      date: today 
    },
    { 
      label: getLocalizedText(language, { TR: "Yarın", EN: "Tomorrow", DE: "Morgen", FR: "Demain", RU: "Завтра", AR: "غداً", ES: "Mañana", IT: "Domani" }), 
      date: addDays(today, 1) 
    },
  ];

  // Quick time options
  const quickTimes = ["09:00", "12:00", "15:00", "18:00"];

  // Localized labels
  const labels = {
    vehicle: getLocalizedText(language, { TR: "Araç Tipi", EN: "Vehicle Type", DE: "Fahrzeugtyp", FR: "Type de véhicule", RU: "Тип транспорта", AR: "نوع السيارة", ES: "Tipo de vehículo", IT: "Tipo di veicolo" }),
    payment: getLocalizedText(language, { TR: "Ödeme", EN: "Payment", DE: "Zahlung", FR: "Paiement", RU: "Оплата", AR: "الدفع", ES: "Pago", IT: "Pagamento" }),
    date: getLocalizedText(language, { TR: "Tarih", EN: "Date", DE: "Datum", FR: "Date", RU: "Дата", AR: "التاريخ", ES: "Fecha", IT: "Data" }),
    time: getLocalizedText(language, { TR: "Saat", EN: "Time", DE: "Zeit", FR: "Heure", RU: "Время", AR: "الوقت", ES: "Hora", IT: "Ora" }),
    submit: getLocalizedText(language, { TR: "Rezervasyonu Oluştur", EN: "Create Booking", DE: "Buchung erstellen", FR: "Créer la réservation", RU: "Создать бронирование", AR: "إنشاء الحجز", ES: "Crear reserva", IT: "Crea prenotazione" }),
    sedan: getLocalizedText(language, { TR: "Sedan", EN: "Sedan", DE: "Limousine", FR: "Berline", RU: "Седан", AR: "سيدان", ES: "Sedán", IT: "Berlina" }),
    vip: getLocalizedText(language, { TR: "VIP Minivan", EN: "VIP Minivan", DE: "VIP Minivan", FR: "Minivan VIP", RU: "VIP минивэн", AR: "ميني فان VIP", ES: "Minivan VIP", IT: "Minivan VIP" }),
    minibus: getLocalizedText(language, { TR: "Minibüs", EN: "Minibus", DE: "Kleinbus", FR: "Minibus", RU: "Минибус", AR: "ميني باص", ES: "Minibús", IT: "Minibus" }),
    card: getLocalizedText(language, { TR: "Kart", EN: "Card", DE: "Karte", FR: "Carte", RU: "Карта", AR: "بطاقة", ES: "Tarjeta", IT: "Carta" }),
    cash: getLocalizedText(language, { TR: "Nakit", EN: "Cash", DE: "Bargeld", FR: "Espèces", RU: "Наличные", AR: "نقداً", ES: "Efectivo", IT: "Contanti" }),
    selectDate: getLocalizedText(language, { TR: "Tarih Seç", EN: "Select Date", DE: "Datum wählen", FR: "Choisir une date", RU: "Выбрать дату", AR: "اختر التاريخ", ES: "Elegir fecha", IT: "Seleziona data" }),
    selectTime: getLocalizedText(language, { TR: "Saat Seç", EN: "Select Time", DE: "Zeit wählen", FR: "Choisir une heure", RU: "Выбрать время", AR: "اختر الوقت", ES: "Elegir hora", IT: "Seleziona ora" }),
    pickFromCalendar: getLocalizedText(language, { TR: "Takvimden Seç", EN: "Pick from Calendar", DE: "Im Kalender wählen", FR: "Choisir dans le calendrier", RU: "Выбрать в календаре", AR: "اختر من التقويم", ES: "Elegir del calendario", IT: "Scegli dal calendario" }),
    allTimes: getLocalizedText(language, { TR: "Tüm Saatler", EN: "All Times", DE: "Alle Zeiten", FR: "Tous les horaires", RU: "Все часы", AR: "كل الأوقات", ES: "Todos los horarios", IT: "Tutti gli orari" }),
  };

  const vehicleLabels: Record<string, string> = {
    "sedan": labels.sedan,
    "vip-mercedes": labels.vip,
    "minibus": labels.minibus,
  };

  const handleSubmit = () => {
    // Validation
    const needsDate = showDatePicker && !selectedDate;
    const needsTime = showTimePicker && !selectedTime;

    if (needsDate || needsTime) {
      // Could add toast here
      return;
    }

    let formattedDate: string | undefined;
    let formattedTime: string | undefined;

    if (selectedDate) {
      formattedDate = format(selectedDate, "d MMMM yyyy", { locale });
    }

    if (selectedTime) {
      const hour = parseInt(selectedTime.split(':')[0]);
      const period = getTimePeriod(hour, language);
      formattedTime = `${selectedTime} (${period.label})`;
    }

    onSubmit({
      vehicleType: selectedVehicle,
      paymentMethod: selectedPayment,
      date: selectedDate,
      time: selectedTime,
      formattedDate,
      formattedTime,
    });
  };

  // Check if form is complete enough to submit
  const canSubmit = React.useMemo(() => {
    if (showDatePicker && !selectedDate) return false;
    if (showTimePicker && !selectedTime) return false;
    return true;
  }, [showDatePicker, showTimePicker, selectedDate, selectedTime]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "mt-4 p-4 rounded-2xl bg-gradient-to-br from-background via-background to-muted/30",
        "border border-border/60 shadow-xl backdrop-blur-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-4 w-4 text-primary" />
        </motion.div>
        <span className="text-sm font-semibold text-foreground">
          {getLocalizedText(language, { 
            TR: "Hızlı Seçim", EN: "Quick Selection", DE: "Schnellauswahl", 
            FR: "Sélection rapide", RU: "Быстрый выбор", AR: "اختيار سريع", 
            ES: "Selección rápida", IT: "Selezione rapida" 
          })}
        </span>
      </div>

      {/* Vehicle Selection */}
      <div className="mb-4">
        <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
          <Car className="h-3.5 w-3.5" />
          {labels.vehicle}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {VEHICLE_TYPES.map((vehicle) => {
            const Icon = vehicle.icon;
            const isSelected = selectedVehicle === vehicle.id;
            return (
              <motion.button
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle.id)}
                disabled={disabled}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl text-xs font-medium transition-all duration-200",
                  "border-2",
                  isSelected
                    ? vehicle.id === "vip-mercedes"
                      ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-lg shadow-amber-500/20"
                      : "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20"
                    : "border-border/60 bg-background hover:border-primary/40 hover:bg-primary/5"
                )}
              >
                <Icon className={cn("h-5 w-5 mb-1", isSelected && vehicle.id === "vip-mercedes" && "text-amber-500")} />
                <span className="font-semibold">{vehicleLabels[vehicle.id]}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">({vehicle.passengers})</span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5"
                  >
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Payment Selection */}
      <div className="mb-4">
        <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5" />
          {labels.payment}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((payment) => {
            const Icon = payment.icon;
            const isSelected = selectedPayment === payment.id;
            return (
              <motion.button
                key={payment.id}
                onClick={() => setSelectedPayment(payment.id)}
                disabled={disabled}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all duration-200",
                  "border-2",
                  isSelected
                    ? payment.id === "card"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-lg shadow-emerald-500/20"
                      : "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 shadow-lg shadow-green-500/20"
                    : "border-border/60 bg-background hover:border-primary/40 hover:bg-primary/5"
                )}
              >
                <Icon className={cn("h-4 w-4", isSelected && (payment.id === "card" ? "text-emerald-500" : "text-green-500"))} />
                {payment.id === "card" ? labels.card : labels.cash}
                {isSelected && (
                  <Check className="h-3.5 w-3.5 ml-auto" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Date Selection - Only if needed */}
      {showDatePicker && (
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            {labels.date}
          </label>
          
          {/* Quick dates */}
          <div className="flex flex-wrap gap-2 mb-2">
            {quickDates.map((item) => {
              const isSelected = selectedDate && format(selectedDate, "yyyy-MM-dd") === format(item.date, "yyyy-MM-dd");
              return (
                <motion.button
                  key={item.label}
                  onClick={() => setSelectedDate(item.date)}
                  disabled={disabled}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                    "border-2",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-background hover:border-primary/40"
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {item.label}
                  <span className="text-[10px] text-muted-foreground">({format(item.date, "dd/MM")})</span>
                  {isSelected && <Check className="h-3 w-3 ml-1" />}
                </motion.button>
              );
            })}
          </div>

          {/* Calendar picker */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                className={cn(
                  "w-full h-10 px-4 rounded-xl text-xs font-medium justify-start",
                  "border-2 border-dashed border-primary/40 bg-primary/5",
                  "hover:border-primary hover:bg-primary/10",
                  selectedDate && "border-solid border-primary bg-primary/10"
                )}
              >
                <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                {selectedDate 
                  ? format(selectedDate, "d MMMM yyyy", { locale })
                  : labels.pickFromCalendar
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[60]" align="start" side="top" sideOffset={8}>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }
                }}
                disabled={(date) => isBefore(date, today)}
                locale={locale}
                initialFocus
                className="p-3 pointer-events-auto rounded-xl"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Time Selection - Only if needed */}
      {showTimePicker && (
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {labels.time}
          </label>
          
          {/* Quick times */}
          <div className="flex flex-wrap gap-2 mb-2">
            {quickTimes.map((time) => {
              const isSelected = selectedTime === time;
              const hour = parseInt(time.split(':')[0]);
              const period = getTimePeriod(hour, language);
              const PeriodIcon = period.icon;
              return (
                <motion.button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  disabled={disabled}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                    "border-2",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-background hover:border-primary/40"
                  )}
                >
                  <PeriodIcon className={cn("h-3.5 w-3.5", period.className)} />
                  {time}
                  {isSelected && <Check className="h-3 w-3 ml-1" />}
                </motion.button>
              );
            })}
          </div>

          {/* Full time picker */}
          <Popover open={timeOpen} onOpenChange={setTimeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                className={cn(
                  "w-full h-10 px-4 rounded-xl text-xs font-medium justify-start",
                  "border-2 border-dashed border-primary/40 bg-primary/5",
                  "hover:border-primary hover:bg-primary/10",
                  selectedTime && "border-solid border-primary bg-primary/10"
                )}
              >
                <Clock className="h-4 w-4 mr-2 text-primary" />
                {selectedTime 
                  ? `${selectedTime} (${getTimePeriod(parseInt(selectedTime.split(':')[0]), language).label})`
                  : labels.allTimes
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 z-[60]" align="start" side="top" sideOffset={8}>
              <ScrollArea className="h-64 p-2">
                <div className="grid grid-cols-3 gap-1">
                  {TIME_SLOTS.map((time) => {
                    const isSelected = selectedTime === time;
                    const hour = parseInt(time.split(':')[0]);
                    const period = getTimePeriod(hour, language);
                    return (
                      <Button
                        key={time}
                        variant={isSelected ? "default" : "ghost"}
                        size="sm"
                        onClick={() => {
                          setSelectedTime(time);
                          setTimeOpen(false);
                        }}
                        className={cn(
                          "h-8 text-xs font-medium",
                          isSelected && "bg-primary text-primary-foreground"
                        )}
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={handleSubmit}
          disabled={disabled || !canSubmit}
          className={cn(
            "w-full h-12 rounded-xl text-sm font-semibold",
            "bg-gradient-to-r from-primary to-primary/80",
            "hover:from-primary/90 hover:to-primary/70",
            "shadow-lg shadow-primary/30",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Send className="h-4 w-4 mr-2" />
          {labels.submit}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>

      {/* Selection Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 p-2 rounded-lg bg-muted/50 border border-border/40"
      >
        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-background border border-border/60">
            <Car className="h-3 w-3" />
            {vehicleLabels[selectedVehicle]}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-background border border-border/60">
            {selectedPayment === "card" ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
            {selectedPayment === "card" ? labels.card : labels.cash}
          </span>
          {selectedDate && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-background border border-border/60">
              <CalendarIcon className="h-3 w-3" />
              {format(selectedDate, "dd/MM", { locale })}
            </span>
          )}
          {selectedTime && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-background border border-border/60">
              <Clock className="h-3 w-3" />
              {selectedTime}
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
