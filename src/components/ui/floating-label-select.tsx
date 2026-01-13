import * as React from "react";
import { cn } from "@/lib/utils";
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

export const FloatingLabelSelect = React.memo(React.forwardRef<
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

  // Optimized handlers with RAF for smoother updates
  const handleFocus = React.useCallback(() => {
    requestAnimationFrame(() => setIsFocused(true));
  }, []);
  
  const handleBlur = React.useCallback(() => {
    requestAnimationFrame(() => setIsFocused(false));
  }, []);

  // Memoize the selected option label lookup
  const selectedLabel = React.useMemo(() => {
    if (!hasValue) return placeholder || label;
    return options.find(o => o.value === value)?.label || value;
  }, [hasValue, value, options, placeholder, label]);

  return (
    <div className={cn("relative", className)}>
      {/* Floating Label - CSS transition instead of framer-motion */}
      <label
        className={cn(
          "absolute left-11 md:left-10 pointer-events-none z-10 origin-left",
          "text-base md:text-sm font-medium bg-card px-1",
          "transition-all duration-200 ease-out",
          isFloating 
            ? "-translate-y-[24px] md:-translate-y-[22px] -translate-x-1 scale-75 text-xs" 
            : "top-1/2 -translate-y-1/2",
          isFocused ? "text-primary" : "text-muted-foreground"
        )}
      >
        {label}
      </label>

      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger 
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "h-14 md:h-12 min-h-[56px] md:min-h-[48px] bg-muted/50 border-border rounded-xl text-base md:text-sm touch-manipulation",
            "transition-all duration-200 ease-out",
            "focus:ring-2 focus:ring-primary/20 focus:border-primary active:bg-muted/80",
            isFocused && "border-primary shadow-sm shadow-primary/10",
            triggerClassName
          )}
        >
          <div className="flex items-center gap-2.5 md:gap-2 pl-0.5">
            {icon && (
              <span
                className={cn(
                  "flex-shrink-0 transition-all duration-150 [&>svg]:h-5 [&>svg]:w-5 md:[&>svg]:h-4 md:[&>svg]:w-4",
                  isFocused && "text-primary scale-110"
                )}
              >
                {icon}
              </span>
            )}
            <span className={cn("truncate text-base md:text-sm", !hasValue && "text-transparent")}>
              {selectedLabel}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[250px] z-50 bg-popover border border-border shadow-lg">
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="cursor-pointer active:bg-primary/20 focus:bg-accent touch-manipulation text-base md:text-sm py-3 md:py-2"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Focus line indicator - CSS transition */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full origin-center",
          "transition-transform duration-200",
          isFocused ? "scale-x-100" : "scale-x-0"
        )}
      />
    </div>
  );
}));

FloatingLabelSelect.displayName = "FloatingLabelSelect";
