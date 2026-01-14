import * as React from "react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { tr, enUS, de, fr, ru, ar, es, it } from "date-fns/locale";
import { CalendarIcon, Sparkles, ArrowRight, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateSelection {
  departureDate: Date;
  returnDate?: Date;
}

interface ChatDatePickerProps {
  language: string;
  onSelectDate: (date: Date, formattedDate: string, returnDate?: Date, formattedReturnDate?: string) => void;
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

export function ChatDatePicker({
  language,
  onSelectDate,
  disabled = false,
  className,
  showReturnOption = true,
}: ChatDatePickerProps) {
  const [departureOpen, setDepartureOpen] = React.useState(false);
  const [returnOpen, setReturnOpen] = React.useState(false);
  const [departureDate, setDepartureDate] = React.useState<Date | undefined>(undefined);
  const [returnDate, setReturnDate] = React.useState<Date | undefined>(undefined);
  const [wantsReturn, setWantsReturn] = React.useState(false);
  const [step, setStep] = React.useState<"departure" | "return" | "done">("departure");
  
  const locale = getLocale(language);
  const today = startOfDay(new Date());
  
  // Quick date options for departure
  const quickDepartureDates = [
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
    { 
      label: getLocalizedText(language, { 
        TR: "3 Gün Sonra", EN: "In 3 Days", DE: "In 3 Tagen", FR: "Dans 3 jours", 
        RU: "Через 3 дня", AR: "بعد 3 أيام", ES: "En 3 días", IT: "Tra 3 giorni" 
      }), 
      date: addDays(today, 3) 
    },
  ];

  // Quick return date options (relative to departure)
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
    { 
      label: getLocalizedText(language, { 
        TR: "1 Hafta Sonra", EN: "1 Week Later", DE: "1 Woche später", FR: "1 semaine plus tard", 
        RU: "Через 1 неделю", AR: "بعد أسبوع", ES: "1 semana después", IT: "1 settimana dopo" 
      }), 
      date: addDays(depDate, 7) 
    },
  ];

  const handleDepartureDateSelect = (date: Date | undefined) => {
    if (date) {
      setDepartureDate(date);
      setDepartureOpen(false);
      
      if (wantsReturn) {
        setStep("return");
      } else {
        // Submit immediately if no return wanted
        const formattedDate = format(date, "d MMMM yyyy", { locale });
        onSelectDate(date, formattedDate);
        setStep("done");
      }
    }
  };

  const handleQuickDepartureSelect = (date: Date) => {
    setDepartureDate(date);
    
    if (wantsReturn) {
      setStep("return");
    } else {
      const formattedDate = format(date, "d MMMM yyyy", { locale });
      onSelectDate(date, formattedDate);
      setStep("done");
    }
  };

  const handleReturnDateSelect = (date: Date | undefined) => {
    if (date && departureDate) {
      setReturnDate(date);
      setReturnOpen(false);
      
      const formattedDeparture = format(departureDate, "d MMMM yyyy", { locale });
      const formattedReturn = format(date, "d MMMM yyyy", { locale });
      onSelectDate(departureDate, formattedDeparture, date, formattedReturn);
      setStep("done");
    }
  };

  const handleQuickReturnSelect = (date: Date) => {
    if (departureDate) {
      setReturnDate(date);
      
      const formattedDeparture = format(departureDate, "d MMMM yyyy", { locale });
      const formattedReturn = format(date, "d MMMM yyyy", { locale });
      onSelectDate(departureDate, formattedDeparture, date, formattedReturn);
      setStep("done");
    }
  };

  const handleToggleReturn = (wants: boolean) => {
    setWantsReturn(wants);
    if (!wants && departureDate) {
      // If they already selected departure and now say no return, submit
      const formattedDate = format(departureDate, "d MMMM yyyy", { locale });
      onSelectDate(departureDate, formattedDate);
      setStep("done");
    }
  };

  const resetSelection = () => {
    setDepartureDate(undefined);
    setReturnDate(undefined);
    setWantsReturn(false);
    setStep("departure");
  };

  return (
    <div className={cn("mt-3", className)}>
      {/* Header with sparkle */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1.5 mb-2"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-3 w-3 text-primary" />
        </motion.div>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {step === "departure" 
            ? getLocalizedText(language, {
                TR: "Gidiş Tarihi Seçin",
                EN: "Select Departure Date",
                DE: "Abfahrtsdatum wählen",
                FR: "Choisir la date de départ",
                RU: "Выберите дату отправления",
                AR: "اختر تاريخ المغادرة",
                ES: "Seleccionar fecha de ida",
                IT: "Seleziona data di partenza",
              })
            : step === "return"
            ? getLocalizedText(language, {
                TR: "Dönüş Tarihi Seçin",
                EN: "Select Return Date",
                DE: "Rückfahrtsdatum wählen",
                FR: "Choisir la date de retour",
                RU: "Выберите дату возвращения",
                AR: "اختر تاريخ العودة",
                ES: "Seleccionar fecha de regreso",
                IT: "Seleziona data di ritorno",
              })
            : getLocalizedText(language, {
                TR: "Tarihler Seçildi",
                EN: "Dates Selected",
                DE: "Daten ausgewählt",
                FR: "Dates sélectionnées",
                RU: "Даты выбраны",
                AR: "تم اختيار التواريخ",
                ES: "Fechas seleccionadas",
                IT: "Date selezionate",
              })
          }
        </span>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Step 1: Return trip question + Departure selection */}
        {step === "departure" && (
          <motion.div
            key="departure"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Return trip toggle - show first */}
            {showReturnOption && (
              <div className="flex gap-2 mb-3">
                <Button
                  variant={wantsReturn ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWantsReturn(true)}
                  disabled={disabled}
                  className={cn(
                    "h-9 px-3 rounded-xl text-xs font-medium flex-1",
                    wantsReturn && "bg-primary text-primary-foreground",
                    !wantsReturn && "border-2 border-border/60"
                  )}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  {getLocalizedText(language, {
                    TR: "Gidiş-Dönüş",
                    EN: "Round Trip",
                    DE: "Hin & Zurück",
                    FR: "Aller-Retour",
                    RU: "Туда-Обратно",
                    AR: "ذهاب وعودة",
                    ES: "Ida y Vuelta",
                    IT: "Andata e Ritorno",
                  })}
                </Button>
                <Button
                  variant={!wantsReturn ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWantsReturn(false)}
                  disabled={disabled}
                  className={cn(
                    "h-9 px-3 rounded-xl text-xs font-medium flex-1",
                    !wantsReturn && "bg-primary text-primary-foreground",
                    wantsReturn && "border-2 border-border/60"
                  )}
                >
                  <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                  {getLocalizedText(language, {
                    TR: "Sadece Gidiş",
                    EN: "One Way",
                    DE: "Nur Hinfahrt",
                    FR: "Aller Simple",
                    RU: "Только туда",
                    AR: "ذهاب فقط",
                    ES: "Solo Ida",
                    IT: "Solo Andata",
                  })}
                </Button>
              </div>
            )}

            {/* Quick departure date buttons */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickDepartureDates.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                    delay: index * 0.05,
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDepartureSelect(item.date)}
                    disabled={disabled}
                    className={cn(
                      "h-9 px-3 rounded-xl text-xs font-medium",
                      "border-2 border-border/60 bg-background/80 backdrop-blur-sm",
                      "hover:border-primary/50 hover:bg-primary/5",
                      "active:scale-95 transition-all duration-200",
                      "shadow-sm hover:shadow-md hover:shadow-primary/10"
                    )}
                  >
                    <motion.span
                      className="flex items-center gap-1.5"
                      whileHover={{ x: 2 }}
                    >
                      <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                      {item.label}
                      <span className="text-[10px] text-muted-foreground">
                        ({format(item.date, "dd/MM")})
                      </span>
                    </motion.span>
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Calendar picker button */}
            <Popover open={departureOpen} onOpenChange={setDepartureOpen}>
              <PopoverTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                    delay: 0.15,
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className={cn(
                      "h-10 px-4 rounded-xl text-xs font-medium",
                      "border-2 border-dashed border-primary/40 bg-primary/5",
                      "hover:border-primary hover:bg-primary/10",
                      "active:scale-95 transition-all duration-200",
                      "shadow-sm hover:shadow-lg hover:shadow-primary/20"
                    )}
                  >
                    <motion.span
                      className="flex items-center gap-2"
                      animate={{
                        scale: departureOpen ? 1.02 : 1,
                      }}
                    >
                      <motion.div
                        animate={{ rotate: departureOpen ? 360 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CalendarIcon className="h-4 w-4 text-primary" />
                      </motion.div>
                      <span className="text-primary font-semibold">
                        {getLocalizedText(language, {
                          TR: "Takvimden Seç",
                          EN: "Pick from Calendar",
                          DE: "Im Kalender wählen",
                          FR: "Choisir dans le calendrier",
                          RU: "Выбрать в календаре",
                          AR: "اختر من التقويم",
                          ES: "Elegir del calendario",
                          IT: "Scegli dal calendario",
                        })}
                      </span>
                    </motion.span>
                  </Button>
                </motion.div>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 z-[60]" 
                align="start"
                side="top"
                sideOffset={8}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <Calendar
                    mode="single"
                    selected={departureDate}
                    onSelect={handleDepartureDateSelect}
                    disabled={(date) => isBefore(date, today)}
                    locale={locale}
                    initialFocus
                    className="p-3 pointer-events-auto rounded-xl"
                  />
                </motion.div>
              </PopoverContent>
            </Popover>
          </motion.div>
        )}

        {/* Step 2: Return date selection */}
        {step === "return" && departureDate && (
          <motion.div
            key="return"
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
                <span className="font-medium text-foreground">
                  {format(departureDate, "d MMMM yyyy", { locale })}
                </span>
              </span>
            </div>

            {/* Quick return date buttons */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {getQuickReturnDates(departureDate).map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                    delay: index * 0.05,
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickReturnSelect(item.date)}
                    disabled={disabled}
                    className={cn(
                      "h-9 px-3 rounded-xl text-xs font-medium",
                      "border-2 border-border/60 bg-background/80 backdrop-blur-sm",
                      "hover:border-green-500/50 hover:bg-green-500/5",
                      "active:scale-95 transition-all duration-200",
                      "shadow-sm hover:shadow-md hover:shadow-green-500/10"
                    )}
                  >
                    <motion.span
                      className="flex items-center gap-1.5"
                      whileHover={{ x: 2 }}
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-green-600" />
                      {item.label}
                      <span className="text-[10px] text-muted-foreground">
                        ({format(item.date, "dd/MM")})
                      </span>
                    </motion.span>
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Calendar picker for return */}
            <Popover open={returnOpen} onOpenChange={setReturnOpen}>
              <PopoverTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                    delay: 0.15,
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className={cn(
                      "h-10 px-4 rounded-xl text-xs font-medium",
                      "border-2 border-dashed border-green-500/40 bg-green-500/5",
                      "hover:border-green-500 hover:bg-green-500/10",
                      "active:scale-95 transition-all duration-200",
                      "shadow-sm hover:shadow-lg hover:shadow-green-500/20"
                    )}
                  >
                    <motion.span
                      className="flex items-center gap-2"
                      animate={{
                        scale: returnOpen ? 1.02 : 1,
                      }}
                    >
                      <motion.div
                        animate={{ rotate: returnOpen ? 360 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CalendarIcon className="h-4 w-4 text-green-600" />
                      </motion.div>
                      <span className="text-green-600 font-semibold">
                        {getLocalizedText(language, {
                          TR: "Dönüş Takvimi",
                          EN: "Return Calendar",
                          DE: "Rückfahrt Kalender",
                          FR: "Calendrier Retour",
                          RU: "Календарь возврата",
                          AR: "تقويم العودة",
                          ES: "Calendario Regreso",
                          IT: "Calendario Ritorno",
                        })}
                      </span>
                    </motion.span>
                  </Button>
                </motion.div>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 z-[60]" 
                align="start"
                side="top"
                sideOffset={8}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <Calendar
                    mode="single"
                    selected={returnDate}
                    onSelect={handleReturnDateSelect}
                    disabled={(date) => isBefore(date, departureDate)}
                    locale={locale}
                    initialFocus
                    className="p-3 pointer-events-auto rounded-xl"
                  />
                </motion.div>
              </PopoverContent>
            </Popover>
          </motion.div>
        )}

        {/* Step 3: Done - show summary */}
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
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-foreground">
                    {departureDate && format(departureDate, "d MMM", { locale })}
                  </span>
                  {returnDate && (
                    <>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-green-600">
                        {format(returnDate, "d MMM", { locale })}
                      </span>
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
                  TR: "Değiştir",
                  EN: "Change",
                  DE: "Ändern",
                  FR: "Modifier",
                  RU: "Изменить",
                  AR: "تغيير",
                  ES: "Cambiar",
                  IT: "Cambia",
                })}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
