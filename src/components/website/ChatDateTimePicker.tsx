import * as React from "react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { tr, enUS, de, fr, ru, ar, es, it } from "date-fns/locale";
import { CalendarIcon, Clock, Sparkles, ArrowRight, RotateCcw, Check, Sun, Sunset, Moon, ChevronRight } from "lucide-react";
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

interface DateTimeSelection {
  date: Date;
  time: string;
}

interface ChatDateTimePickerProps {
  language: string;
  onSelectDateTime: (
    date: Date, 
    formattedDate: string, 
    time: string, 
    formattedTime: string,
    returnDate?: Date,
    formattedReturnDate?: string,
    returnTime?: string,
    formattedReturnTime?: string
  ) => void;
  disabled?: boolean;
  className?: string;
  showReturnOption?: boolean;
}

const getLocale = (lang: string) => {
  const localeMap: Record<string, typeof enUS> = {
    TR: tr,
    EN: enUS,
    DE: de,
    FR: fr,
    RU: ru,
    AR: ar,
    ES: es,
    IT: it,
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

export function ChatDateTimePicker({
  language,
  onSelectDateTime,
  disabled = false,
  className,
  showReturnOption = true,
}: ChatDateTimePickerProps) {
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [timeOpen, setTimeOpen] = React.useState(false);
  const [returnCalendarOpen, setReturnCalendarOpen] = React.useState(false);
  const [returnTimeOpen, setReturnTimeOpen] = React.useState(false);
  
  const [departureDate, setDepartureDate] = React.useState<Date | undefined>(undefined);
  const [departureTime, setDepartureTime] = React.useState<string | undefined>(undefined);
  const [returnDate, setReturnDate] = React.useState<Date | undefined>(undefined);
  const [returnTime, setReturnTime] = React.useState<string | undefined>(undefined);
  const [wantsReturn, setWantsReturn] = React.useState(false);
  
  type Step = "trip-type" | "departure-date" | "departure-time" | "return-date" | "return-time" | "done";
  const [step, setStep] = React.useState<Step>("trip-type");
  
  const locale = getLocale(language);
  const today = startOfDay(new Date());
  
  // Quick date options
  const quickDates = [
    { 
      label: getLocalizedText(language, { 
        TR: "Bugün", EN: "Today", DE: "Heute", FR: "Aujourd'hui", 
        RU: "Сегодня", AR: "اليوم", ES: "Hoy", IT: "Oggi" 
      }), 
      date: today 
    },
    { 
      label: getLocalizedText(language, { 
        TR: "Yarın", EN: "Tomorrow", DE: "Morgen", FR: "Demain", 
        RU: "Завтра", AR: "غداً", ES: "Mañana", IT: "Domani" 
      }), 
      date: addDays(today, 1) 
    },
  ];

  // Quick time options
  const quickTimes = ["09:00", "12:00", "15:00", "18:00"];

  // Quick return date options
  const getQuickReturnDates = (depDate: Date) => [
    { 
      label: getLocalizedText(language, { 
        TR: "Aynı Gün", EN: "Same Day", DE: "Gleicher Tag", FR: "Même jour", 
        RU: "В тот же день", AR: "نفس اليوم", ES: "Mismo día", IT: "Stesso giorno" 
      }), 
      date: depDate 
    },
    { 
      label: getLocalizedText(language, { 
        TR: "Ertesi Gün", EN: "Next Day", DE: "Nächster Tag", FR: "Lendemain", 
        RU: "На следующий день", AR: "اليوم التالي", ES: "Día siguiente", IT: "Giorno dopo" 
      }), 
      date: addDays(depDate, 1) 
    },
  ];

  const handleTripTypeSelect = (isReturn: boolean) => {
    setWantsReturn(isReturn);
    setStep("departure-date");
  };

  const handleDepartureDateSelect = (date: Date) => {
    setDepartureDate(date);
    setCalendarOpen(false);
    setStep("departure-time");
  };

  const handleDepartureTimeSelect = (time: string) => {
    setDepartureTime(time);
    setTimeOpen(false);
    
    if (wantsReturn) {
      setStep("return-date");
    } else {
      // Complete without return
      completeSelection(departureDate!, time);
    }
  };

  const handleReturnDateSelect = (date: Date) => {
    setReturnDate(date);
    setReturnCalendarOpen(false);
    setStep("return-time");
  };

  const handleReturnTimeSelect = (time: string) => {
    setReturnTime(time);
    setReturnTimeOpen(false);
    completeSelection(departureDate!, departureTime!, returnDate, time);
  };

  const completeSelection = (
    depDate: Date, 
    depTime: string, 
    retDate?: Date, 
    retTime?: string
  ) => {
    const formattedDate = format(depDate, "d MMMM yyyy", { locale });
    const depHour = parseInt(depTime.split(':')[0]);
    const depPeriod = getTimePeriod(depHour, language);
    const formattedTime = `${depTime} (${depPeriod.label})`;

    let formattedReturnDate: string | undefined;
    let formattedReturnTime: string | undefined;

    if (retDate && retTime) {
      formattedReturnDate = format(retDate, "d MMMM yyyy", { locale });
      const retHour = parseInt(retTime.split(':')[0]);
      const retPeriod = getTimePeriod(retHour, language);
      formattedReturnTime = `${retTime} (${retPeriod.label})`;
    }

    onSelectDateTime(
      depDate, 
      formattedDate, 
      depTime, 
      formattedTime,
      retDate,
      formattedReturnDate,
      retTime,
      formattedReturnTime
    );
    setStep("done");
  };

  const resetSelection = () => {
    setDepartureDate(undefined);
    setDepartureTime(undefined);
    setReturnDate(undefined);
    setReturnTime(undefined);
    setWantsReturn(false);
    setStep("trip-type");
  };

  const getStepTitle = () => {
    switch (step) {
      case "trip-type":
        return getLocalizedText(language, {
          TR: "Transfer Tipi", EN: "Transfer Type", DE: "Transfertyp", FR: "Type de transfert",
          RU: "Тип трансфера", AR: "نوع النقل", ES: "Tipo de traslado", IT: "Tipo di trasferimento",
        });
      case "departure-date":
        return getLocalizedText(language, {
          TR: "Gidiş Tarihi", EN: "Departure Date", DE: "Abfahrtsdatum", FR: "Date de départ",
          RU: "Дата отправления", AR: "تاريخ المغادرة", ES: "Fecha de ida", IT: "Data di partenza",
        });
      case "departure-time":
        return getLocalizedText(language, {
          TR: "Gidiş Saati", EN: "Departure Time", DE: "Abfahrtszeit", FR: "Heure de départ",
          RU: "Время отправления", AR: "وقت المغادرة", ES: "Hora de ida", IT: "Orario di partenza",
        });
      case "return-date":
        return getLocalizedText(language, {
          TR: "Dönüş Tarihi", EN: "Return Date", DE: "Rückfahrtsdatum", FR: "Date de retour",
          RU: "Дата возвращения", AR: "تاريخ العودة", ES: "Fecha de regreso", IT: "Data di ritorno",
        });
      case "return-time":
        return getLocalizedText(language, {
          TR: "Dönüş Saati", EN: "Return Time", DE: "Rückfahrtszeit", FR: "Heure de retour",
          RU: "Время возвращения", AR: "وقت العودة", ES: "Hora de regreso", IT: "Orario di ritorno",
        });
      case "done":
        return getLocalizedText(language, {
          TR: "Seçim Tamamlandı", EN: "Selection Complete", DE: "Auswahl abgeschlossen", FR: "Sélection terminée",
          RU: "Выбор завершен", AR: "اكتمل الاختيار", ES: "Selección completa", IT: "Selezione completata",
        });
    }
  };

  // Progress indicator
  const getProgress = () => {
    if (!showReturnOption || !wantsReturn) {
      switch (step) {
        case "trip-type": return 1;
        case "departure-date": return 2;
        case "departure-time": return 3;
        case "done": return 3;
        default: return 1;
      }
    }
    switch (step) {
      case "trip-type": return 1;
      case "departure-date": return 2;
      case "departure-time": return 3;
      case "return-date": return 4;
      case "return-time": return 5;
      case "done": return 5;
      default: return 1;
    }
  };

  const totalSteps = (!showReturnOption || !wantsReturn) ? 3 : 5;

  return (
    <div className={cn("mt-3", className)}>
      {/* Header with progress */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-2 mb-3"
      >
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-3 w-3 text-primary" />
          </motion.div>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {getStepTitle()}
          </span>
        </div>
        
        {/* Progress dots */}
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i < getProgress() ? "bg-primary w-3" : "bg-border w-1.5"
              )}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            />
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Step 1: Trip type selection */}
        {step === "trip-type" && showReturnOption && (
          <motion.div
            key="trip-type"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-2"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTripTypeSelect(true)}
              disabled={disabled}
              className={cn(
                "h-11 px-4 rounded-xl text-xs font-medium flex-1",
                "border-2 border-border/60 bg-background/80",
                "hover:border-primary/50 hover:bg-primary/5",
                "active:scale-95 transition-all duration-200"
              )}
            >
              <RotateCcw className="h-4 w-4 mr-2 text-primary" />
              {getLocalizedText(language, {
                TR: "Gidiş-Dönüş", EN: "Round Trip", DE: "Hin & Zurück", FR: "Aller-Retour",
                RU: "Туда-Обратно", AR: "ذهاب وعودة", ES: "Ida y Vuelta", IT: "Andata e Ritorno",
              })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTripTypeSelect(false)}
              disabled={disabled}
              className={cn(
                "h-11 px-4 rounded-xl text-xs font-medium flex-1",
                "border-2 border-border/60 bg-background/80",
                "hover:border-primary/50 hover:bg-primary/5",
                "active:scale-95 transition-all duration-200"
              )}
            >
              <ArrowRight className="h-4 w-4 mr-2 text-primary" />
              {getLocalizedText(language, {
                TR: "Sadece Gidiş", EN: "One Way", DE: "Nur Hinfahrt", FR: "Aller Simple",
                RU: "Только туда", AR: "ذهاب فقط", ES: "Solo Ida", IT: "Solo Andata",
              })}
            </Button>
          </motion.div>
        )}

        {/* Skip trip type if showReturnOption is false */}
        {step === "trip-type" && !showReturnOption && (
          <motion.div
            key="skip-trip-type"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onAnimationComplete={() => setStep("departure-date")}
          />
        )}

        {/* Step 2: Departure date selection */}
        {step === "departure-date" && (
          <motion.div
            key="departure-date"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickDates.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDepartureDateSelect(item.date)}
                    disabled={disabled}
                    className={cn(
                      "h-9 px-3 rounded-xl text-xs font-medium",
                      "border-2 border-border/60 bg-background/80",
                      "hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-primary" />
                    {item.label}
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ({format(item.date, "dd/MM")})
                    </span>
                  </Button>
                </motion.div>
              ))}
            </div>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  className={cn(
                    "h-10 px-4 rounded-xl text-xs font-medium",
                    "border-2 border-dashed border-primary/40 bg-primary/5",
                    "hover:border-primary hover:bg-primary/10"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                  {getLocalizedText(language, {
                    TR: "Takvimden Seç", EN: "Pick from Calendar", DE: "Im Kalender wählen", FR: "Choisir dans le calendrier",
                    RU: "Выбрать в календаре", AR: "اختر من التقويم", ES: "Elegir del calendario", IT: "Scegli dal calendario",
                  })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="start" side="top" sideOffset={8}>
                <Calendar
                  mode="single"
                  selected={departureDate}
                  onSelect={(date) => date && handleDepartureDateSelect(date)}
                  disabled={(date) => isBefore(date, today)}
                  locale={locale}
                  initialFocus
                  className="p-3 pointer-events-auto rounded-xl"
                />
              </PopoverContent>
            </Popover>
          </motion.div>
        )}

        {/* Step 3: Departure time selection */}
        {step === "departure-time" && departureDate && (
          <motion.div
            key="departure-time"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Show selected date */}
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-xs">
                <span className="text-muted-foreground">
                  {getLocalizedText(language, { TR: "Tarih:", EN: "Date:", DE: "Datum:", FR: "Date:", RU: "Дата:", AR: "التاريخ:", ES: "Fecha:", IT: "Data:" })}
                </span>
                {" "}
                <span className="font-medium">{format(departureDate, "d MMMM yyyy", { locale })}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickTimes.map((time, index) => {
                const hour = parseInt(time.split(':')[0]);
                const period = getTimePeriod(hour, language);
                const Icon = period.icon;
                
                return (
                  <motion.div
                    key={time}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDepartureTimeSelect(time)}
                      disabled={disabled}
                      className={cn(
                        "h-9 px-3 rounded-xl text-xs font-medium",
                        "border-2 border-border/60 bg-background/80",
                        "hover:border-primary/50 hover:bg-primary/5"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5 mr-1.5", period.className)} />
                      {time}
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            <Popover open={timeOpen} onOpenChange={setTimeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  className={cn(
                    "h-10 px-4 rounded-xl text-xs font-medium",
                    "border-2 border-dashed border-primary/40 bg-primary/5",
                    "hover:border-primary hover:bg-primary/10"
                  )}
                >
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  {getLocalizedText(language, {
                    TR: "Tüm Saatler", EN: "All Times", DE: "Alle Zeiten", FR: "Toutes les heures",
                    RU: "Все время", AR: "جميع الأوقات", ES: "Todas las horas", IT: "Tutti gli orari",
                  })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 z-[60]" align="start" side="top" sideOffset={8}>
                <div className="p-3 border-b border-border">
                  <h4 className="font-medium text-sm text-center">
                    {getLocalizedText(language, {
                      TR: "Saat Seçin", EN: "Select Time", DE: "Zeit wählen", FR: "Choisir l'heure",
                      RU: "Выберите время", AR: "اختر الوقت", ES: "Seleccionar hora", IT: "Seleziona orario",
                    })}
                  </h4>
                </div>
                <ScrollArea className="h-64 pointer-events-auto">
                  <div className="p-2 grid grid-cols-3 gap-1">
                    {TIME_SLOTS.map((time) => {
                      const hour = parseInt(time.split(':')[0]);
                      const period = getTimePeriod(hour, language);
                      const Icon = period.icon;
                      
                      return (
                        <Button
                          key={time}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDepartureTimeSelect(time)}
                          className={cn(
                            "h-9 text-xs font-medium rounded-lg",
                            "hover:bg-primary/10 hover:text-primary"
                          )}
                        >
                          <Icon className={cn("h-3 w-3 mr-1", period.className)} />
                          {time}
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </motion.div>
        )}

        {/* Step 4: Return date selection */}
        {step === "return-date" && departureDate && departureTime && (
          <motion.div
            key="return-date"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Show selected departure */}
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-xs">
                <span className="text-muted-foreground">
                  {getLocalizedText(language, { TR: "Gidiş:", EN: "Departure:", DE: "Hinfahrt:", FR: "Départ:", RU: "Отъезд:", AR: "المغادرة:", ES: "Ida:", IT: "Partenza:" })}
                </span>
                {" "}
                <span className="font-medium">{format(departureDate, "d MMM", { locale })} {departureTime}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {getQuickReturnDates(departureDate).map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReturnDateSelect(item.date)}
                    disabled={disabled}
                    className={cn(
                      "h-9 px-3 rounded-xl text-xs font-medium",
                      "border-2 border-border/60 bg-background/80",
                      "hover:border-green-500/50 hover:bg-green-500/5"
                    )}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                    {item.label}
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ({format(item.date, "dd/MM")})
                    </span>
                  </Button>
                </motion.div>
              ))}
            </div>

            <Popover open={returnCalendarOpen} onOpenChange={setReturnCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  className={cn(
                    "h-10 px-4 rounded-xl text-xs font-medium",
                    "border-2 border-dashed border-green-500/40 bg-green-500/5",
                    "hover:border-green-500 hover:bg-green-500/10"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 mr-2 text-green-600" />
                  {getLocalizedText(language, {
                    TR: "Dönüş Takvimi", EN: "Return Calendar", DE: "Rückfahrt Kalender", FR: "Calendrier Retour",
                    RU: "Календарь возврата", AR: "تقويم العودة", ES: "Calendario Regreso", IT: "Calendario Ritorno",
                  })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="start" side="top" sideOffset={8}>
                <Calendar
                  mode="single"
                  selected={returnDate}
                  onSelect={(date) => date && handleReturnDateSelect(date)}
                  disabled={(date) => isBefore(date, departureDate)}
                  locale={locale}
                  initialFocus
                  className="p-3 pointer-events-auto rounded-xl"
                />
              </PopoverContent>
            </Popover>
          </motion.div>
        )}

        {/* Step 5: Return time selection */}
        {step === "return-time" && returnDate && (
          <motion.div
            key="return-time"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Show selected dates */}
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-gradient-to-r from-primary/10 to-green-500/10 border border-primary/20">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-xs">
                <span className="font-medium">{format(departureDate!, "d MMM", { locale })} {departureTime}</span>
                <ArrowRight className="h-3 w-3 inline mx-1.5 text-muted-foreground" />
                <span className="font-medium text-green-600">{format(returnDate, "d MMM", { locale })}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickTimes.map((time, index) => {
                const hour = parseInt(time.split(':')[0]);
                const period = getTimePeriod(hour, language);
                const Icon = period.icon;
                
                return (
                  <motion.div
                    key={time}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReturnTimeSelect(time)}
                      disabled={disabled}
                      className={cn(
                        "h-9 px-3 rounded-xl text-xs font-medium",
                        "border-2 border-border/60 bg-background/80",
                        "hover:border-green-500/50 hover:bg-green-500/5"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5 mr-1.5", period.className)} />
                      {time}
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            <Popover open={returnTimeOpen} onOpenChange={setReturnTimeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  className={cn(
                    "h-10 px-4 rounded-xl text-xs font-medium",
                    "border-2 border-dashed border-green-500/40 bg-green-500/5",
                    "hover:border-green-500 hover:bg-green-500/10"
                  )}
                >
                  <Clock className="h-4 w-4 mr-2 text-green-600" />
                  {getLocalizedText(language, {
                    TR: "Tüm Saatler", EN: "All Times", DE: "Alle Zeiten", FR: "Toutes les heures",
                    RU: "Все время", AR: "جميع الأوقات", ES: "Todas las horas", IT: "Tutti gli orari",
                  })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 z-[60]" align="start" side="top" sideOffset={8}>
                <div className="p-3 border-b border-border">
                  <h4 className="font-medium text-sm text-center">
                    {getLocalizedText(language, {
                      TR: "Dönüş Saati", EN: "Return Time", DE: "Rückfahrtszeit", FR: "Heure de retour",
                      RU: "Время возвращения", AR: "وقت العودة", ES: "Hora de regreso", IT: "Orario di ritorno",
                    })}
                  </h4>
                </div>
                <ScrollArea className="h-64 pointer-events-auto">
                  <div className="p-2 grid grid-cols-3 gap-1">
                    {TIME_SLOTS.map((time) => {
                      const hour = parseInt(time.split(':')[0]);
                      const period = getTimePeriod(hour, language);
                      const Icon = period.icon;
                      
                      return (
                        <Button
                          key={time}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReturnTimeSelect(time)}
                          className={cn(
                            "h-9 text-xs font-medium rounded-lg",
                            "hover:bg-green-500/10 hover:text-green-600"
                          )}
                        >
                          <Icon className={cn("h-3 w-3 mr-1", period.className)} />
                          {time}
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </motion.div>
        )}

        {/* Done state */}
        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-xl bg-gradient-to-r from-primary/10 to-green-500/10 border border-primary/20"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  <span className="font-medium">
                    {departureDate && format(departureDate, "d MMM", { locale })}
                  </span>
                  <span className="text-muted-foreground">{departureTime}</span>
                  {returnDate && returnTime && (
                    <>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-green-600">
                        {format(returnDate, "d MMM", { locale })}
                      </span>
                      <span className="text-muted-foreground">{returnTime}</span>
                    </>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetSelection}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                {getLocalizedText(language, {
                  TR: "Değiştir", EN: "Change", DE: "Ändern", FR: "Modifier",
                  RU: "Изменить", AR: "تغيير", ES: "Cambiar", IT: "Cambia",
                })}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
