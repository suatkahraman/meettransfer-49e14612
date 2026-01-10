import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: "TR", name: "Turkey", dialCode: "+90", flag: "🇹🇷" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", dialCode: "+32", flag: "🇧🇪" },
  { code: "AT", name: "Austria", dialCode: "+43", flag: "🇦🇹" },
  { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭" },
  { code: "RU", name: "Russia", dialCode: "+7", flag: "🇷🇺" },
  { code: "UA", name: "Ukraine", dialCode: "+380", flag: "🇺🇦" },
  { code: "PL", name: "Poland", dialCode: "+48", flag: "🇵🇱" },
  { code: "GR", name: "Greece", dialCode: "+30", flag: "🇬🇷" },
  { code: "CZ", name: "Czech Republic", dialCode: "+420", flag: "🇨🇿" },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
  { code: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norway", dialCode: "+47", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", dialCode: "+45", flag: "🇩🇰" },
  { code: "FI", name: "Finland", dialCode: "+358", flag: "🇫🇮" },
  { code: "AE", name: "UAE", dialCode: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼" },
  { code: "BH", name: "Bahrain", dialCode: "+973", flag: "🇧🇭" },
  { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲" },
  { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬" },
  { code: "IL", name: "Israel", dialCode: "+972", flag: "🇮🇱" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳" },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷" },
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽" },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
  { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { code: "CY", name: "Cyprus", dialCode: "+357", flag: "🇨🇾" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  defaultCountry?: string;
  error?: boolean;
  minLength?: number;
  onValidationError?: (error: string | null) => void;
  disabled?: boolean;
}

// Validation helper
export const validatePhoneNumber = (phone: string, minLength: number = 7): { isValid: boolean; error: string | null } => {
  // Remove dial code and get just the number
  const cleanNumber = phone.replace(/^\+\d+\s*/, "").replace(/[\s\-]/g, "");
  
  if (!cleanNumber) {
    return { isValid: false, error: "phoneRequired" };
  }
  
  // Check if contains only digits
  if (!/^\d+$/.test(cleanNumber)) {
    return { isValid: false, error: "phoneDigitsOnly" };
  }
  
  // Check minimum length
  if (cleanNumber.length < minLength) {
    return { isValid: false, error: "phoneMinLength" };
  }
  
  return { isValid: true, error: null };
};

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, placeholder, className, inputClassName, defaultCountry = "TR", error, minLength = 7, onValidationError, disabled }, ref) => {
    // Parse existing value to extract country code
    const getInitialCountry = () => {
      if (value) {
        for (const country of COUNTRY_CODES) {
          if (value.startsWith(country.dialCode)) {
            return country.code;
          }
        }
      }
      return defaultCountry;
    };

    const [selectedCountry, setSelectedCountry] = React.useState(getInitialCountry);
    const [phoneNumber, setPhoneNumber] = React.useState(() => {
      if (value) {
        const country = COUNTRY_CODES.find(c => value.startsWith(c.dialCode));
        if (country) {
          return value.slice(country.dialCode.length).trim();
        }
      }
      return value.replace(/^\+\d+\s*/, "");
    });

    const selectedCountryData = COUNTRY_CODES.find(c => c.code === selectedCountry) || COUNTRY_CODES[0];

    const handleCountryChange = (countryCode: string) => {
      setSelectedCountry(countryCode);
      const country = COUNTRY_CODES.find(c => c.code === countryCode);
      if (country && phoneNumber) {
        const newValue = `${country.dialCode} ${phoneNumber}`;
        onChange(newValue);
        // Validate on country change
        if (onValidationError) {
          const validation = validatePhoneNumber(newValue, minLength);
          onValidationError(validation.error);
        }
      } else if (country) {
        onChange(country.dialCode);
      }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow digits, spaces, and hyphens
      const newPhone = e.target.value.replace(/[^\d\s\-]/g, "");
      setPhoneNumber(newPhone);
      
      let newValue = "";
      if (newPhone) {
        newValue = `${selectedCountryData.dialCode} ${newPhone}`;
        onChange(newValue);
      } else {
        onChange("");
      }
      
      // Validate and report error
      if (onValidationError) {
        const validation = validatePhoneNumber(newValue, minLength);
        onValidationError(validation.error);
      }
    };

    return (
      <div className={cn("flex gap-2", className)}>
        <Select value={selectedCountry} onValueChange={handleCountryChange} disabled={disabled}>
          <SelectTrigger className={cn("w-[110px] shrink-0", inputClassName)}>
            <SelectValue>
              <span className="flex items-center gap-1.5">
                <span>{selectedCountryData.flag}</span>
                <span className="text-xs text-muted-foreground">{selectedCountryData.dialCode}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-popover z-50">
            {COUNTRY_CODES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <span className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span className="text-sm">{country.name}</span>
                  <span className="text-xs text-muted-foreground">{country.dialCode}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          ref={ref}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder || "555 123 4567"}
          disabled={disabled}
          className={cn(
            "flex-1",
            inputClassName,
            error && "ring-2 ring-destructive animate-shake"
          )}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
