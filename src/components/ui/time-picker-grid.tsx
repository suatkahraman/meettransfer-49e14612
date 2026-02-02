import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Clock, X, Maximize2 } from "lucide-react";

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

// Square Grid Time Picker Content
const TimePickerContent = React.memo(({
  tempHour,
  tempMinute,
  tempPeriod,
  setTempHour,
  setTempMinute,
  setTempPeriod,
  onSave,
  onClose,
  isFullscreen,
}: {
  tempHour: number;
  tempMinute: number;
  tempPeriod: "AM" | "PM";
  setTempHour: (h: number) => void;
  setTempMinute: (m: number) => void;
  setTempPeriod: (p: "AM" | "PM") => void;
  onSave: () => void;
  onClose?: () => void;
  isFullscreen?: boolean;
}) => {
  // Hours 1-12 in 4x3 grid
  const hours = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
  ];

  // Minutes 00-55 in 4x3 grid (every 5 min)
  const minutes = [
    [0, 5, 10, 15],
    [20, 25, 30, 35],
    [40, 45, 50, 55],
  ];

  const buttonSize = isFullscreen ? "w-16 h-14 text-xl" : "w-11 h-10 text-sm";

  return (
    <div className={cn(
      "flex flex-col bg-zinc-900",
      isFullscreen && "fixed inset-0 z-[200] p-4 overflow-auto"
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

      <div className={cn(
        "flex gap-4",
        isFullscreen ? "flex-col items-center justify-center flex-1" : "flex-row"
      )}>
        {/* Hours Grid */}
        <div className="flex flex-col items-center">
          <div className="text-xs font-medium text-zinc-400 mb-2">Hour</div>
          <div className="grid grid-cols-4 gap-1.5">
            {hours.flat().map((h) => (
              <button
                key={h}
                onClick={() => setTempHour(h)}
                className={cn(
                  buttonSize,
                  "rounded-lg font-semibold transition-all",
                  tempHour === h
                    ? "bg-yellow-500 text-black"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                )}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Minutes Grid */}
        <div className="flex flex-col items-center">
          <div className="text-xs font-medium text-zinc-400 mb-2">Minute</div>
          <div className="grid grid-cols-4 gap-1.5">
            {minutes.flat().map((m) => (
              <button
                key={m}
                onClick={() => setTempMinute(m)}
                className={cn(
                  buttonSize,
                  "rounded-lg font-semibold transition-all",
                  tempMinute === m
                    ? "bg-yellow-500 text-black"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                )}
              >
                {m.toString().padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>

        {/* AM/PM */}
        <div className="flex flex-col items-center">
          <div className="text-xs font-medium text-zinc-400 mb-2">&nbsp;</div>
          <div className={cn("flex gap-1.5", isFullscreen ? "flex-row" : "flex-col")}>
            {(["AM", "PM"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setTempPeriod(p)}
                className={cn(
                  isFullscreen ? "w-20 h-14 text-xl" : "w-14 h-10 text-sm",
                  "rounded-lg font-bold transition-all",
                  tempPeriod === p
                    ? "bg-yellow-500 text-black"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Selection Display */}
      <div className={cn(
        "text-center py-3 border-t border-zinc-700",
        isFullscreen ? "mt-6" : "mt-3"
      )}>
        <span className={cn(
          "font-bold text-yellow-500",
          isFullscreen ? "text-3xl" : "text-xl"
        )}>
          {formatDisplayTime(tempHour, tempMinute, tempPeriod)}
        </span>
      </div>

      {/* Save Button */}
      <div className={cn("pt-2", isFullscreen && "pb-4")}>
        <button
          onClick={onSave}
          className={cn(
            "w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-all",
            isFullscreen ? "py-4 text-lg" : "py-2.5"
          )}
        >
          OK
        </button>
      </div>
    </div>
  );
});

TimePickerContent.displayName = "TimePickerContent";

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
  }, [hour, minute, period, open, isFullscreen]);

  const handleSave = React.useCallback(() => {
    onValueChange(formatTime(tempHour, tempMinute, tempPeriod));
    setOpen(false);
    setIsFullscreen(false);
  }, [tempHour, tempMinute, tempPeriod, onValueChange]);

  const handleOpenFullscreen = React.useCallback(() => {
    setOpen(false);
    setIsFullscreen(true);
  }, []);

  const handleCloseFullscreen = React.useCallback(() => {
    setIsFullscreen(false);
  }, []);

  // Fullscreen modal
  if (isFullscreen) {
    return (
      <>
        {/* Trigger button (invisible when fullscreen) */}
        <div className={cn(
          "flex h-[60px] flex-col justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 transition-all hover:bg-amber-100 dark:border-zinc-700 dark:bg-zinc-800",
          className
        )}>
          <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {label}
          </label>
          <span className="text-sm font-medium">
            {formatDisplayTime(hour, minute, period)}
          </span>
        </div>

        {/* Fullscreen modal */}
        <div className="fixed inset-0 z-[200] bg-zinc-900">
          <TimePickerContent
            tempHour={tempHour}
            tempMinute={tempMinute}
            tempPeriod={tempPeriod}
            setTempHour={setTempHour}
            setTempMinute={setTempMinute}
            setTempPeriod={setTempPeriod}
            onSave={handleSave}
            onClose={handleCloseFullscreen}
            isFullscreen
          />
        </div>
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
            {formatDisplayTime(hour, minute, period)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-3 z-[100] bg-zinc-900 border border-zinc-700 shadow-xl" 
        align="center"
        sideOffset={8}
      >
        {/* Fullscreen button */}
        {allowFullscreen && (
          <div className="flex justify-end mb-2">
            <button
              onClick={handleOpenFullscreen}
              className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        )}
        
        <TimePickerContent
          tempHour={tempHour}
          tempMinute={tempMinute}
          tempPeriod={tempPeriod}
          setTempHour={setTempHour}
          setTempMinute={setTempMinute}
          setTempPeriod={setTempPeriod}
          onSave={handleSave}
        />
      </PopoverContent>
    </Popover>
  );
});

TimePickerGrid.displayName = "TimePickerGrid";
