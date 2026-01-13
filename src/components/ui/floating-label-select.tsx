import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FloatingLabelSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
}

export const FloatingLabelSelect = React.forwardRef<
  HTMLButtonElement,
  FloatingLabelSelectProps
>(({ 
  label, 
  value, 
  onValueChange, 
  options, 
  icon, 
  disabled,
  className,
  triggerClassName,
  placeholder
}, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const hasValue = value && value.length > 0;
  const isFloating = isFocused || hasValue;

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
            color: isFocused ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
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

      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger 
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "h-12 bg-muted/50 border-border rounded-xl text-sm transition-all duration-200 touch-manipulation",
            "focus:ring-2 focus:ring-primary/20 focus:border-primary active:bg-muted/80",
            isFocused && "border-primary shadow-sm shadow-primary/10",
            triggerClassName
          )}
        >
          <div className="flex items-center gap-2">
            {icon && (
              <motion.span
                animate={{ color: isFocused ? "hsl(var(--primary))" : undefined }}
                className="flex-shrink-0"
              >
                {icon}
              </motion.span>
            )}
            <span className={cn("truncate", !hasValue && "text-transparent")}>
              {hasValue ? options.find(o => o.value === value)?.label || value : (placeholder || label)}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[250px] z-50">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Focus line indicator */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isFocused ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full origin-center"
      />
    </div>
  );
});

FloatingLabelSelect.displayName = "FloatingLabelSelect";
