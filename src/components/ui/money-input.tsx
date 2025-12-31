import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { sanitizeMoneyInput, type MoneyParseOptions } from "@/lib/money";

type MoneyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> & {
  value: string;
  onValueChange: (value: string) => void;
  currencySymbol?: string;
  parseOptions?: MoneyParseOptions;
};

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      className,
      currencySymbol,
      value,
      onValueChange,
      parseOptions,
      inputMode,
      autoComplete,
      autoCapitalize,
      autoCorrect,
      spellCheck,
      ...props
    },
    ref,
  ) => {
    const sanitizedValue = sanitizeMoneyInput(value ?? "", parseOptions);

    return (
      <div className="relative">
        {currencySymbol ? (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {currencySymbol}
          </span>
        ) : null}

        <Input
          ref={ref}
          type="text"
          inputMode={inputMode ?? "decimal"}
          autoComplete={autoComplete ?? "off"}
          autoCapitalize={autoCapitalize ?? "off"}
          autoCorrect={autoCorrect ?? "off"}
          spellCheck={spellCheck ?? false}
          pattern="[0-9]*[.,]?[0-9]*"
          value={sanitizedValue}
          onChange={(e) => {
            onValueChange(sanitizeMoneyInput(e.target.value, parseOptions));
          }}
          className={cn(currencySymbol ? "pl-8" : "", className)}
          {...props}
        />
      </div>
    );
  },
);
MoneyInput.displayName = "MoneyInput";
