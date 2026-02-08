import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Clock, X } from "lucide-react";
import { ScrollWheelColumn } from "@/components/ui/scroll-wheel-column";

interface TimePickerGridProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  label?: string;
  allowFullscreen?: boolean;
}

// Convert 24h to 12h format
const to12Hour = (hour24: number): { hour: number; period: "AM" | "PM" } => {
  if (hour24 === 0) return { hour: 12, period: "AM" };
  if (hour24 === 12) return { hour: 12, period: "PM" };
  if (hour24 > 12) return { hour: hour24 - 12, period: "PM" };
  return { hour: hour24, period: "AM" };
};

const to24Hour = (hour12: number, period: "AM" | "PM"): number => {
  if (period === "AM") return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
};

const parseTime = (time: string): { hour24: number; minute: number } => {
  const [hourStr, minuteStr] = time.split(":");
  return { hour24: parseInt(hourStr) || 0, minute: parseInt(minuteStr) || 0 };
};

const formatDisplayTime = (hour24: number, minute: number, is24h: boolean): string => {
  if (is24h) {
    return `${hour24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  }
  const { hour, period } = to12Hour(hour24);
  return `${hour}:${minute.toString().padStart(2, "0")} ${period}`;
};

const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const HOURS_12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Shared wheel content for both popover and fullscreen
const TimePickerWheelContent = React.memo(({
  tempHour24,
  tempMinute,
  is24h,
  setIs24h,
  onHourSelect,
  onMinuteSelect,
  tempPeriod,
  onPeriodChange,
  onSave,
  onClose,
  isFullscreen,
}: {
  tempHour24: number;
  tempMinute: number;
  is24h: boolean;
  setIs24h: (v: boolean) => void;
  onHourSelect: (h: number) => void;
  onMinuteSelect: (m: number) => void;
  tempPeriod: "AM" | "PM";
  onPeriodChange: (p: "AM" | "PM") => void;
  onSave: () => void;
  onClose?: () => void;
  isFullscreen?: boolean;
}) => {
  const currentDisplayHour = is24h ? tempHour24 : to12Hour(tempHour24).hour;
  const currentHours = is24h ? HOURS_24 : HOURS_12;

  return (
    <div className={cn(
      "flex flex-col",
      isFullscreen ? "fixed inset-0 z-[200] bg-zinc-900 p-4 overflow-auto" : "p-3 min-w-[200px]"
    )}>
      {/* Header for fullscreen */}
      {isFullscreen && onClose && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-700">
          <span className="text-lg font-semibold text-white">Select Time</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* 24h / 12h Toggle */}
      <div className={cn("flex gap-0 mb-3 rounded-lg p-1", isFullscreen ? "bg-zinc-800" : "bg-muted")}>
        <button
          onClick={() => setIs24h(true)}
          className={cn(
            "flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all",
            is24h
              ? (isFullscreen ? "bg-white text-black shadow-sm" : "bg-foreground text-background shadow-sm")
              : (isFullscreen ? "text-zinc-400 hover:text-white" : "text-muted-foreground hover:text-foreground")
          )}
        >
          24h
        </button>
        <button
          onClick={() => setIs24h(false)}
          className={cn(
            "flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all",
            !is24h
              ? (isFullscreen ? "bg-white text-black shadow-sm" : "bg-foreground text-background shadow-sm")
              : (isFullscreen ? "text-zinc-400 hover:text-white" : "text-muted-foreground hover:text-foreground")
          )}
        >
          12h
        </button>
      </div>

      {/* Scroll Wheels */}
      <div className={cn("flex items-center justify-center", isFullscreen && "flex-1")}>
        <ScrollWheelColumn
          items={currentHours}
          selectedValue={currentDisplayHour}
          onSelect={onHourSelect}
          formatItem={(v) => v.toString()}
          isFullscreen={isFullscreen}
        />

        <div className={cn("w-px bg-border mx-1", isFullscreen ? "h-[280px] bg-zinc-700" : "h-[220px]")} />

        <ScrollWheelColumn
          items={MINUTES}
          selectedValue={tempMinute}
          onSelect={onMinuteSelect}
          formatItem={(v) => v.toString().padStart(2, "0")}
          isFullscreen={isFullscreen}
        />

        {!is24h && (
          <>
            <div className={cn("w-px bg-border mx-1", isFullscreen ? "h-[280px] bg-zinc-700" : "h-[220px]")} />
            <div className="flex flex-col items-center gap-1 w-16">
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => onPeriodChange(p)}
                  className={cn(
                    "w-14 rounded-md font-bold transition-all",
                    isFullscreen ? "h-14 text-xl" : "h-10 text-sm",
                    tempPeriod === p
                      ? "bg-amber-400 text-black"
                      : (isFullscreen ? "text-white hover:bg-zinc-700" : "text-foreground hover:bg-muted")
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
      <div className={cn(isFullscreen ? "mt-6 pb-4" : "mt-3")}>
        <button
          onClick={onSave}
          className={cn(
            "w-full font-bold rounded-lg transition-all",
            isFullscreen
              ? "py-4 text-lg bg-amber-400 hover:bg-amber-300 text-black"
              : "py-2.5 bg-foreground text-background hover:opacity-90"
          )}
        >
          {isFullscreen ? "OK" : "Save"}
        </button>
      </div>
    </div>
  );
});

TimePickerWheelContent.displayName = "TimePickerWheelContent";

export const TimePickerGrid = React.memo(({
  value,
  onValueChange,
  disabled,
  className,
  triggerClassName,
  label = "Time",
  allowFullscreen = false,
}: TimePickerGridProps) => {
  const [open, setOpen] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [is24h, setIs24h] = React.useState(true);

  const { hour24, minute } = React.useMemo(() => parseTime(value), [value]);

  const [tempHour24, setTempHour24] = React.useState(hour24);
  const [tempMinute, setTempMinute] = React.useState(minute);
  const [tempPeriod, setTempPeriod] = React.useState<"AM" | "PM">(() => to12Hour(hour24).period);

  React.useEffect(() => {
    setTempHour24(hour24);
    setTempMinute(minute);
    setTempPeriod(to12Hour(hour24).period);
  }, [hour24, minute, open, isFullscreen]);

  const handleHourSelect = React.useCallback((h: number) => {
    if (is24h) {
      setTempHour24(h);
    } else {
      setTempHour24(to24Hour(h, tempPeriod));
    }
  }, [is24h, tempPeriod]);

  const handlePeriodChange = React.useCallback((p: "AM" | "PM") => {
    setTempPeriod(p);
    const hour12 = to12Hour(tempHour24).hour;
    setTempHour24(to24Hour(hour12, p));
  }, [tempHour24]);

  const handleSave = React.useCallback(() => {
    onValueChange(`${tempHour24.toString().padStart(2, "0")}:${tempMinute.toString().padStart(2, "0")}`);
    setOpen(false);
    setIsFullscreen(false);
  }, [tempHour24, tempMinute, onValueChange]);

  const handleCloseFullscreen = React.useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const triggerContent = (
    <div className={cn(
      "flex h-[60px] flex-col justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 transition-all hover:bg-amber-100 dark:border-zinc-700 dark:bg-zinc-800",
      className
    )}>
      <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {label}
      </label>
      <span className="text-sm font-medium">
        {formatDisplayTime(hour24, minute, is24h)}
      </span>
    </div>
  );

  if (isFullscreen) {
    return (
      <>
        {triggerContent}
        <TimePickerWheelContent
          tempHour24={tempHour24}
          tempMinute={tempMinute}
          is24h={is24h}
          setIs24h={setIs24h}
          onHourSelect={handleHourSelect}
          onMinuteSelect={setTempMinute}
          tempPeriod={tempPeriod}
          onPeriodChange={handlePeriodChange}
          onSave={handleSave}
          onClose={handleCloseFullscreen}
          isFullscreen
        />
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex h-[60px] w-full flex-col justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 text-left transition-all hover:bg-amber-100 dark:border-zinc-700 dark:bg-zinc-800",
            disabled && "opacity-50 cursor-not-allowed",
            triggerClassName,
            className
          )}
        >
          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {label}
          </span>
          <span className="text-sm font-medium">
            {formatDisplayTime(hour24, minute, is24h)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 z-[100] bg-background border-2 border-border shadow-xl rounded-xl"
        align="center"
        sideOffset={8}
      >
        <TimePickerWheelContent
          tempHour24={tempHour24}
          tempMinute={tempMinute}
          is24h={is24h}
          setIs24h={setIs24h}
          onHourSelect={handleHourSelect}
          onMinuteSelect={setTempMinute}
          tempPeriod={tempPeriod}
          onPeriodChange={handlePeriodChange}
          onSave={handleSave}
        />
      </PopoverContent>
    </Popover>
  );
});

TimePickerGrid.displayName = "TimePickerGrid";
