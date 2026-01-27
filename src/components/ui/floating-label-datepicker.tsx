import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FloatingLabelDatePickerProps {
  label: string;
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  disabledDates?: (date: Date) => boolean;
  dateFormat?: string;
}

export const FloatingLabelDatePicker = React.forwardRef<
  HTMLButtonElement,
  FloatingLabelDatePickerProps
>(({ 
  label, 
  date, 
  onSelect, 
  icon,
  disabled,
  className,
  triggerClassName,
  disabledDates,
  dateFormat = "dd MMM"
}, ref) => {
  const [open, setOpen] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const hasValue = !!date;
  const isFloating = isFocused || hasValue || open;

  const handleSelect = (selectedDate: Date | undefined) => {
    onSelect(selectedDate);
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Floating Label - CSS transitions */}
      <label
        className={cn(
          "absolute left-11 md:left-10 top-1/2 pointer-events-none z-10 origin-left",
          "text-base md:text-sm font-medium bg-card px-1",
          "transition-all duration-200 ease-out",
          isFloating 
            ? "-translate-y-[24px] md:-translate-y-[22px] -translate-x-1 scale-75 text-xs" 
            : "-translate-y-1/2",
          (isFocused || open) ? "text-primary" : "text-muted-foreground"
        )}
      >
        {label}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "w-full h-14 md:h-12 min-h-[56px] md:min-h-[48px] justify-start bg-card border-2 rounded-xl text-base md:text-sm transition-all duration-200 touch-manipulation",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary hover:bg-muted/30 active:bg-muted/50",
              hasValue ? "border-primary shadow-md shadow-primary/15" : "border-border",
              (isFocused || open) && "border-primary shadow-md shadow-primary/20",
              !hasValue && "text-transparent",
              triggerClassName
            )}
          >
            <span
              className={cn(
                "mr-2.5 md:mr-2 flex-shrink-0 [&>svg]:h-5 [&>svg]:w-5 md:[&>svg]:h-4 md:[&>svg]:w-4 transition-all duration-150 text-primary",
                (isFocused || open || hasValue) && "scale-110"
              )}
            >
              {icon || <CalendarIcon className="h-5 w-5 md:h-4 md:w-4" />}
            </span>
            <span className={cn("truncate text-base md:text-sm", !hasValue && "text-muted-foreground")}>
              {hasValue ? format(date, dateFormat) : label}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-50" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={disabledDates}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Focus line indicator - CSS transitions */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full origin-center",
          "transition-transform duration-200",
          (isFocused || open) ? "scale-x-100" : "scale-x-0"
        )}
      />
    </div>
  );
});

FloatingLabelDatePicker.displayName = "FloatingLabelDatePicker";