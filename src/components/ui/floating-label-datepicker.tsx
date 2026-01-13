import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
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
      {/* Floating Label */}
      <AnimatePresence>
        <motion.label
          initial={false}
          animate={{
            y: isFloating ? -22 : 0,
            x: isFloating ? -4 : 0,
            scale: isFloating ? 0.75 : 1,
            color: (isFocused || open) ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none z-10 origin-left",
            "text-sm font-medium bg-card px-1",
            isFloating && "text-xs"
          )}
        >
          {label}
        </motion.label>
      </AnimatePresence>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "w-full h-12 justify-start bg-muted/50 border-border rounded-xl text-sm transition-all duration-200",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary hover:bg-muted/70",
              (isFocused || open) && "border-primary shadow-sm shadow-primary/10",
              !hasValue && "text-transparent"
            )}
          >
            <motion.span
              animate={{ color: (isFocused || open) ? "hsl(var(--primary))" : undefined }}
              className="mr-2 flex-shrink-0"
            >
              {icon || <CalendarIcon className="h-4 w-4" />}
            </motion.span>
            <span className={cn("truncate", !hasValue && "text-muted-foreground")}>
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

      {/* Focus line indicator */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: (isFocused || open) ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full origin-center"
      />
    </div>
  );
});

FloatingLabelDatePicker.displayName = "FloatingLabelDatePicker";
