import * as React from "react";
import { cn } from "@/lib/utils";

export interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, label, icon, error, value, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const hasValue = value !== undefined && value !== "";
    const isFloating = isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div 
        className={cn(
          "relative transition-transform duration-200 ease-out",
          isFocused && "scale-[1.01]"
        )}
      >
        {/* Icon */}
        {icon && (
          <div 
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 z-10 transition-all duration-150",
              isFocused ? "text-primary scale-110" : "text-muted-foreground"
            )}
          >
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "flex h-14 md:h-12 min-h-[56px] md:min-h-[48px] w-full rounded-xl border bg-muted/50 px-3 py-2 text-base md:text-sm transition-all duration-200 touch-manipulation",
            "placeholder:text-transparent border-border",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
            "active:bg-muted/70 active:scale-[0.995]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-11 md:pl-10",
            isFloating && "pt-5 pb-1",
            error && "border-destructive focus:border-destructive focus:ring-destructive/20",
            className
          )}
          placeholder={label}
          {...props}
        />

        {/* Floating Label - CSS transitions */}
        <label
          className={cn(
            "absolute pointer-events-none transition-all duration-200 ease-out origin-left",
            icon ? "left-10" : "left-3",
            isFloating 
              ? "top-1 text-[10px] font-medium" 
              : "top-1/2 -translate-y-1/2 text-sm font-normal",
            isFocused ? "text-primary" : "text-muted-foreground"
          )}
        >
          {label}
        </label>

        {/* Focus glow effect - CSS */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl pointer-events-none transition-all duration-200",
            isFocused 
              ? "opacity-100 shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]" 
              : "opacity-0"
          )}
        />

        {/* Error message - CSS transitions */}
        {error && (
          <p
            className={cn(
              "text-xs text-destructive mt-1 transition-all duration-200",
              error ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
            )}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";

export { FloatingLabelInput };