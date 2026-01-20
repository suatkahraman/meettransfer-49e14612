"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Lazy load actual Select components
const LazySelectContent = React.lazy(() =>
  import("@/components/ui/select").then((mod) => ({
    default: mod.SelectContent,
  }))
);

interface LazyFloatingLabelSelectProps {
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

// Skeleton that matches FloatingLabelSelect appearance
const SelectSkeleton = React.memo(({ 
  label, 
  icon, 
  className,
  triggerClassName 
}: { 
  label: string; 
  icon?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
}) => (
  <div className={cn("relative", className)}>
    <label className="absolute left-11 md:left-10 pointer-events-none z-10 origin-left text-base md:text-sm font-medium bg-card px-1 top-1/2 -translate-y-1/2 text-muted-foreground">
      {label}
    </label>
    <div 
      className={cn(
        "h-14 md:h-12 min-h-[56px] md:min-h-[48px] bg-muted/50 border border-border rounded-xl",
        "flex items-center px-3",
        triggerClassName
      )}
    >
      {icon && (
        <span className="flex-shrink-0 text-muted-foreground [&>svg]:h-5 [&>svg]:w-5 md:[&>svg]:h-4 md:[&>svg]:w-4">
          {icon}
        </span>
      )}
    </div>
  </div>
));

SelectSkeleton.displayName = "SelectSkeleton";

/**
 * LazyFloatingLabelSelect - Defers Select component loading
 * Shows skeleton immediately, loads full component on interaction or after idle
 */
export const LazyFloatingLabelSelect = React.memo(React.forwardRef<
  HTMLButtonElement,
  LazyFloatingLabelSelectProps
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
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [FloatingLabelSelect, setFloatingLabelSelect] = React.useState<React.ComponentType<any> | null>(null);

  // Load component on mount using requestIdleCallback for non-blocking load
  React.useEffect(() => {
    const loadComponent = () => {
      import("@/components/ui/floating-label-select").then((mod) => {
        setFloatingLabelSelect(() => mod.FloatingLabelSelect);
        setIsLoaded(true);
      });
    };

    // Use requestIdleCallback if available, otherwise use setTimeout
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(loadComponent, { timeout: 150 });
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(loadComponent, 50);
      return () => clearTimeout(id);
    }
  }, []);

  // Show skeleton while loading
  if (!isLoaded || !FloatingLabelSelect) {
    return (
      <SelectSkeleton 
        label={label} 
        icon={icon} 
        className={className}
        triggerClassName={triggerClassName}
      />
    );
  }

  return (
    <FloatingLabelSelect
      ref={ref}
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={options}
      icon={icon}
      disabled={disabled}
      className={className}
      triggerClassName={triggerClassName}
      placeholder={placeholder}
    />
  );
}));

LazyFloatingLabelSelect.displayName = "LazyFloatingLabelSelect";

export default LazyFloatingLabelSelect;
