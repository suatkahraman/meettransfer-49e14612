import * as React from "react";
import { Clock, Sparkles, Sun, Sunset, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatTimePickerProps {
  language: string;
  onSelectTime: (time: string, formattedTime: string) => void;
  disabled?: boolean;
  className?: string;
}

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
        TR: "Sabah",
        EN: "Morning",
        DE: "Morgen",
        FR: "Matin",
        RU: "Утро",
        AR: "صباح",
        ES: "Mañana",
        IT: "Mattina",
      }),
      className: "text-amber-500",
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      icon: Sun,
      label: getLocalizedText(language, {
        TR: "Öğlen",
        EN: "Afternoon",
        DE: "Nachmittag",
        FR: "Après-midi",
        RU: "День",
        AR: "ظهر",
        ES: "Tarde",
        IT: "Pomeriggio",
      }),
      className: "text-orange-500",
    };
  } else if (hour >= 18 && hour < 21) {
    return {
      icon: Sunset,
      label: getLocalizedText(language, {
        TR: "Akşam",
        EN: "Evening",
        DE: "Abend",
        FR: "Soir",
        RU: "Вечер",
        AR: "مساء",
        ES: "Noche",
        IT: "Sera",
      }),
      className: "text-purple-500",
    };
  } else {
    return {
      icon: Moon,
      label: getLocalizedText(language, {
        TR: "Gece",
        EN: "Night",
        DE: "Nacht",
        FR: "Nuit",
        RU: "Ночь",
        AR: "ليل",
        ES: "Noche",
        IT: "Notte",
      }),
      className: "text-indigo-500",
    };
  }
};

export function ChatTimePicker({
  language,
  onSelectTime,
  disabled = false,
  className,
}: ChatTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  // Popular quick time options
  const quickTimes = [
    { time: "09:00", label: "09:00" },
    { time: "12:00", label: "12:00" },
    { time: "15:00", label: "15:00" },
    { time: "18:00", label: "18:00" },
  ];

  const handleTimeSelect = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    const period = getTimePeriod(hour, language);
    const formattedTime = `${time} (${period.label})`;
    onSelectTime(time, formattedTime);
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
            TR: "Saat Seçin",
            EN: "Select Time",
            DE: "Zeit wählen",
            FR: "Choisir l'heure",
            RU: "Выберите время",
            AR: "اختر الوقت",
            ES: "Seleccionar hora",
            IT: "Seleziona orario",
          })}
        </span>
      </motion.div>

      {/* Quick time buttons */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {quickTimes.map((item, index) => {
          const hour = parseInt(item.time.split(':')[0]);
          const period = getTimePeriod(hour, language);
          const Icon = period.icon;
          
          return (
            <motion.div
              key={item.time}
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
                onClick={() => handleTimeSelect(item.time)}
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
                  <Icon className={cn("h-3.5 w-3.5", period.className)} />
                  {item.label}
                </motion.span>
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Full time picker button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
              delay: 0.2,
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
                  <Clock className="h-4 w-4 text-primary" />
                </motion.div>
                <span className="text-primary font-semibold">
                  {getLocalizedText(language, {
                    TR: "Tüm Saatler",
                    EN: "All Times",
                    DE: "Alle Zeiten",
                    FR: "Toutes les heures",
                    RU: "Все время",
                    AR: "جميع الأوقات",
                    ES: "Todas las horas",
                    IT: "Tutti gli orari",
                  })}
                </span>
              </motion.span>
            </Button>
          </motion.div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-64 p-0 z-[60]" 
          align="start"
          side="top"
          sideOffset={8}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="p-3 border-b border-border">
              <h4 className="font-medium text-sm text-center">
                {getLocalizedText(language, {
                  TR: "Saat Seçin",
                  EN: "Select Time",
                  DE: "Zeit wählen",
                  FR: "Choisir l'heure",
                  RU: "Выберите время",
                  AR: "اختر الوقت",
                  ES: "Seleccionar hora",
                  IT: "Seleziona orario",
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
                      onClick={() => handleTimeSelect(time)}
                      className={cn(
                        "h-9 text-xs font-medium rounded-lg",
                        "hover:bg-primary/10 hover:text-primary",
                        "flex items-center justify-center gap-1"
                      )}
                    >
                      <Icon className={cn("h-3 w-3", period.className)} />
                      {time}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
