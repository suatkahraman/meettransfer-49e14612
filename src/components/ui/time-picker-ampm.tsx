import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimePickerAMPMProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

// Convert 24h to 12h format
const to12Hour = (hour24: number): { hour: number; period: "AM" | "PM" } => {
  if (hour24 === 0) return { hour: 12, period: "AM" };
  if (hour24 === 12) return { hour: 12, period: "PM" };
  if (hour24 > 12) return { hour: hour24 - 12, period: "PM" };
  return { hour: hour24, period: "AM" };
};

// Convert 12h to 24h format
const to24Hour = (hour12: number, period: "AM" | "PM"): number => {
  if (period === "AM") {
    return hour12 === 12 ? 0 : hour12;
  }
  return hour12 === 12 ? 12 : hour12 + 12;
};

// Parse time string (HH:MM) to components
const parseTime = (time: string): { hour: number; minute: number; period: "AM" | "PM" } => {
  const [hourStr, minuteStr] = time.split(":");
  const hour24 = parseInt(hourStr) || 0;
  const minute = parseInt(minuteStr) || 0;
  const { hour, period } = to12Hour(hour24);
  return { hour, minute, period };
};

// Format time to 24h string
const formatTime = (hour12: number, minute: number, period: "AM" | "PM"): string => {
  const hour24 = to24Hour(hour12, period);
  return `${hour24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
};

// Format display time (12h format)
const formatDisplayTime = (hour: number, minute: number, period: "AM" | "PM"): string => {
  return `${hour}:${minute.toString().padStart(2, "0")} ${period}`;
};

export const TimePickerAMPM = React.memo(({
  value,
  onValueChange,
  disabled,
  className,
  triggerClassName,
}: TimePickerAMPMProps) => {
  const [open, setOpen] = React.useState(false);
  
  const { hour, minute, period } = React.useMemo(() => parseTime(value), [value]);
  
  // Temporary state for selection before save
  const [tempHour, setTempHour] = React.useState(hour);
  const [tempMinute, setTempMinute] = React.useState(minute);
  const [tempPeriod, setTempPeriod] = React.useState(period);
  
  // Sync temp state when value changes externally or popover opens
  React.useEffect(() => {
    setTempHour(hour);
    setTempMinute(minute);
    setTempPeriod(period);
  }, [hour, minute, period, open]);

  // All 12 hours (1-12) for scrollable list
  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  // 5 minute options
  const minutes = [0, 15, 30, 45, 55];

  const handleSave = React.useCallback(() => {
    onValueChange(formatTime(tempHour, tempMinute, tempPeriod));
    setOpen(false);
  }, [tempHour, tempMinute, tempPeriod, onValueChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "text-base font-semibold text-foreground bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity",
            triggerClassName
          )}
        >
          {formatDisplayTime(hour, minute, period)}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[100] bg-zinc-900 border border-zinc-700 shadow-xl" 
        align="start"
      >
        <div className="flex flex-col">
          <div className="flex gap-0">
            {/* Hours Column - Scrollable */}
            <div className="flex flex-col">
              <div className="text-xs font-medium text-zinc-400 text-center py-2 border-b border-zinc-700">
                Saat
              </div>
              <ScrollArea className="h-[200px]">
                <div className="flex flex-col p-1">
                  {hours.map((h) => (
                    <button
                      key={h}
                      onClick={() => setTempHour(h)}
                      className={cn(
                        "w-12 h-10 rounded-lg text-base font-semibold transition-all",
                        tempHour === h
                          ? "bg-yellow-500 text-black"
                          : "text-white hover:bg-zinc-700"
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Minutes Column */}
            <div className="flex flex-col border-l border-zinc-700">
              <div className="text-xs font-medium text-zinc-400 text-center py-2 border-b border-zinc-700">
                Dakika
              </div>
              <div className="flex flex-col p-1 h-[200px] justify-start">
                {minutes.map((m) => (
                  <button
                    key={m}
                    onClick={() => setTempMinute(m)}
                    className={cn(
                      "w-12 h-10 rounded-lg text-base font-semibold transition-all",
                      tempMinute === m
                        ? "bg-yellow-500 text-black"
                        : "text-white hover:bg-zinc-700"
                    )}
                  >
                    {m.toString().padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM Column */}
            <div className="flex flex-col border-l border-zinc-700">
              <div className="text-xs font-medium text-zinc-400 text-center py-2 border-b border-zinc-700">
                &nbsp;
              </div>
              <div className="flex flex-col p-1 h-[200px] justify-start">
                {(["AM", "PM"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setTempPeriod(p)}
                    className={cn(
                      "w-14 h-10 rounded-lg text-base font-bold transition-all",
                      tempPeriod === p
                        ? "bg-yellow-500 text-black"
                        : "text-white hover:bg-zinc-700"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <div className="border-t border-zinc-700 p-2">
            <button
              onClick={handleSave}
              className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-all"
            >
              Kaydet
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

TimePickerAMPM.displayName = "TimePickerAMPM";
