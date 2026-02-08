import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TimePickerAMPMProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  dataTrigger?: string;
  labels?: {
    hour: string;
    minute: string;
    save: string;
  };
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
const parseTime = (time: string): { hour24: number; minute: number } => {
  const [hourStr, minuteStr] = time.split(":");
  const hour24 = parseInt(hourStr) || 0;
  const minute = parseInt(minuteStr) || 0;
  return { hour24, minute };
};

// Format display time based on mode
const formatDisplayTime = (hour24: number, minute: number, is24h: boolean): string => {
  if (is24h) {
    return `${hour24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  }
  const { hour, period } = to12Hour(hour24);
  return `${hour}:${minute.toString().padStart(2, "0")} ${period}`;
};

// All minute options (every 5 minutes)
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i); // 0-23
const HOURS_12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const VISIBLE_ITEMS = 5;
const CENTER_INDEX = Math.floor(VISIBLE_ITEMS / 2); // 2

// Scroll wheel column component
const ScrollWheelColumn = React.memo(({
  items,
  selectedValue,
  onSelect,
  formatItem,
}: {
  items: number[];
  selectedValue: number;
  onSelect: (value: number) => void;
  formatItem: (v: number) => string;
}) => {
  const selectedIndex = items.indexOf(selectedValue);
  
  // Calculate visible window centered on selected item
  const getVisibleItems = () => {
    const result: (number | null)[] = [];
    for (let i = -CENTER_INDEX; i <= CENTER_INDEX; i++) {
      const idx = selectedIndex + i;
      if (idx >= 0 && idx < items.length) {
        result.push(items[idx]);
      } else {
        result.push(null); // empty slot for padding
      }
    }
    return result;
  };

  const visibleItems = getVisibleItems();
  const canScrollUp = selectedIndex > 0;
  const canScrollDown = selectedIndex < items.length - 1;

  const scrollUp = () => {
    if (canScrollUp) onSelect(items[selectedIndex - 1]);
  };

  const scrollDown = () => {
    if (canScrollDown) onSelect(items[selectedIndex + 1]);
  };

  return (
    <div className="flex flex-col items-center w-20">
      {/* Up arrow */}
      <button
        onClick={scrollUp}
        disabled={!canScrollUp}
        className={cn(
          "p-1 rounded transition-colors",
          canScrollUp ? "text-foreground hover:bg-muted" : "text-muted-foreground/30"
        )}
        aria-label="Scroll up"
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      {/* Items */}
      <div className="flex flex-col items-center gap-0.5">
        {visibleItems.map((item, i) => {
          const isSelected = item !== null && item === selectedValue;
          return (
            <button
              key={`${i}-${item}`}
              onClick={() => item !== null && onSelect(item)}
              disabled={item === null}
              className={cn(
                "w-14 h-10 flex items-center justify-center rounded-md text-lg font-semibold transition-all",
                item === null && "invisible",
                isSelected
                  ? "bg-amber-400 text-black"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {item !== null ? formatItem(item) : ""}
            </button>
          );
        })}
      </div>

      {/* Down arrow */}
      <button
        onClick={scrollDown}
        disabled={!canScrollDown}
        className={cn(
          "p-1 rounded transition-colors",
          canScrollDown ? "text-foreground hover:bg-muted" : "text-muted-foreground/30"
        )}
        aria-label="Scroll down"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
});

ScrollWheelColumn.displayName = "ScrollWheelColumn";

export const TimePickerAMPM = React.memo(({
  value,
  onValueChange,
  disabled,
  className,
  triggerClassName,
  dataTrigger,
  labels,
}: TimePickerAMPMProps) => {
  const saveLabel = labels?.save || "Save";
  const [open, setOpen] = React.useState(false);
  const [is24h, setIs24h] = React.useState(true);

  const { hour24, minute } = React.useMemo(() => parseTime(value), [value]);
  
  // Temporary state for selection before save
  const [tempHour24, setTempHour24] = React.useState(hour24);
  const [tempMinute, setTempMinute] = React.useState(minute);
  const [tempPeriod, setTempPeriod] = React.useState<"AM" | "PM">(() => to12Hour(hour24).period);

  // Sync temp state when value changes externally or popover opens
  React.useEffect(() => {
    setTempHour24(hour24);
    setTempMinute(minute);
    setTempPeriod(to12Hour(hour24).period);
  }, [hour24, minute, open]);

  // Get the appropriate hour value for the current mode
  const currentDisplayHour = is24h ? tempHour24 : to12Hour(tempHour24).hour;
  const currentHours = is24h ? HOURS_24 : HOURS_12;

  const handleHourSelect = (h: number) => {
    if (is24h) {
      setTempHour24(h);
    } else {
      setTempHour24(to24Hour(h, tempPeriod));
    }
  };

  const handlePeriodChange = (p: "AM" | "PM") => {
    setTempPeriod(p);
    const hour12 = to12Hour(tempHour24).hour;
    setTempHour24(to24Hour(hour12, p));
  };

  const handleSave = React.useCallback(() => {
    const timeStr = `${tempHour24.toString().padStart(2, "0")}:${tempMinute.toString().padStart(2, "0")}`;
    onValueChange(timeStr);
    setOpen(false);
  }, [tempHour24, tempMinute, onValueChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          data-time-trigger={dataTrigger}
          className={cn(
            "text-base font-semibold text-foreground bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity",
            triggerClassName
          )}
        >
          {formatDisplayTime(hour24, minute, is24h)}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[100] bg-background border-2 border-border shadow-xl rounded-xl" 
        align="start"
      >
        <div className="flex flex-col p-3 min-w-[220px]">
          {/* 24h / 12h Toggle */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setIs24h(true)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-semibold transition-all",
                is24h
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              24h
            </button>
            <button
              onClick={() => setIs24h(false)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-semibold transition-all",
                !is24h
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              12h
            </button>
          </div>

          {/* Scroll Wheels */}
          <div className="flex items-center justify-center">
            {/* Hours */}
            <ScrollWheelColumn
              items={currentHours}
              selectedValue={currentDisplayHour}
              onSelect={handleHourSelect}
              formatItem={(v) => v.toString()}
            />

            {/* Divider */}
            <div className="w-px h-48 bg-border mx-1" />

            {/* Minutes */}
            <ScrollWheelColumn
              items={MINUTES}
              selectedValue={tempMinute}
              onSelect={setTempMinute}
              formatItem={(v) => v.toString().padStart(2, "0")}
            />

            {/* AM/PM toggle (only in 12h mode) */}
            {!is24h && (
              <>
                <div className="w-px h-48 bg-border mx-1" />
                <div className="flex flex-col items-center gap-1 w-16">
                  {(["AM", "PM"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePeriodChange(p)}
                      className={cn(
                        "w-14 h-10 rounded-md text-sm font-bold transition-all",
                        tempPeriod === p
                          ? "bg-amber-400 text-black"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="mt-3 w-full py-2.5 bg-foreground text-background font-bold rounded-lg transition-all hover:opacity-90"
          >
            {saveLabel}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
});

TimePickerAMPM.displayName = "TimePickerAMPM";
