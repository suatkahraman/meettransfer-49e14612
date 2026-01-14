import * as React from "react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { tr, enUS, de, fr, ru, ar, es, it } from "date-fns/locale";
import { CalendarIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatDatePickerProps {
  language: string;
  onSelectDate: (date: Date, formattedDate: string) => void;
  disabled?: boolean;
  className?: string;
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
}: ChatDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  
  const locale = getLocale(language);
  const today = startOfDay(new Date());
  
  // Quick date options
  const quickDates = [
    { 
      label: getLocalizedText(language, { 
        TR: "Bugün", 
        EN: "Today", 
        DE: "Heute", 
        FR: "Aujourd'hui", 
        RU: "Сегодня", 
        AR: "اليوم", 
        ES: "Hoy", 
        IT: "Oggi" 
      }), 
      date: today 
    },
    { 
      label: getLocalizedText(language, { 
        TR: "Yarın", 
        EN: "Tomorrow", 
        DE: "Morgen", 
        FR: "Demain", 
        RU: "Завтра", 
        AR: "غداً", 
        ES: "Mañana", 
        IT: "Domani" 
      }), 
      date: addDays(today, 1) 
    },
    { 
      label: getLocalizedText(language, { 
        TR: "Bu Hafta", 
        EN: "This Week", 
        DE: "Diese Woche", 
        FR: "Cette semaine", 
        RU: "На этой неделе", 
        AR: "هذا الأسبوع", 
        ES: "Esta semana", 
        IT: "Questa settimana" 
      }), 
      date: addDays(today, 3) 
    },
  ];

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const formattedDate = format(date, "d MMMM yyyy", { locale });
      onSelectDate(date, formattedDate);
      setOpen(false);
    }
  };

  const handleQuickSelect = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = format(date, "d MMMM yyyy", { locale });
    onSelectDate(date, formattedDate);
    setOpen(false);
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
          {getLocalizedText(language, {
            TR: "Tarih Seçin",
            EN: "Select Date",
            DE: "Datum wählen",
            FR: "Choisir la date",
            RU: "Выберите дату",
            AR: "اختر التاريخ",
            ES: "Seleccionar fecha",
            IT: "Seleziona data",
          })}
        </span>
      </motion.div>

      {/* Quick date buttons */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {quickDates.map((item, index) => (
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
              onClick={() => handleQuickSelect(item.date)}
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
      <Popover open={open} onOpenChange={setOpen}>
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
                  scale: open ? 1.02 : 1,
                }}
              >
                <motion.div
                  animate={{ rotate: open ? 360 : 0 }}
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
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => isBefore(date, today)}
              locale={locale}
              initialFocus
              className="p-3 pointer-events-auto rounded-xl"
            />
          </motion.div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
