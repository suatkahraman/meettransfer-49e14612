import { useState, useEffect, useRef, useCallback, lazy, Suspense, memo } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: {
              types?: string[];
              fields?: string[];
              componentRestrictions?: { country: string | string[] };
            }
          ) => GoogleMapsAutocomplete;
        };
        event: {
          clearInstanceListeners: (instance: GoogleMapsAutocomplete) => void;
        };
      };
    };
    __googleMapsLoading?: boolean;
    __googleMapsLoaded?: boolean;
    __googleMapsCallbacks?: (() => void)[];
  }
}

interface GoogleMapsAutocomplete {
  addListener: (event: string, callback: () => void) => void;
  getPlace: () => {
    formatted_address?: string;
    name?: string;
    address_components?: unknown[];
    place_id?: string;
    geometry?: {
      location?: {
        lat: () => number;
        lng: () => number;
      };
    };
  };
}

// Place details returned by the component
export interface PlaceDetails {
  placeName: string;
  formattedAddress: string;
  displayText: string;
  lat: number | null;
  lng: number | null;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCk_A1D5LOqb2TuIFuOiVVjGDSAprap38M';

// Lazy load Google Maps script
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.__googleMapsLoaded && window.google?.maps?.places) {
      resolve();
      return;
    }

    // Currently loading - add to callback queue
    if (window.__googleMapsLoading) {
      window.__googleMapsCallbacks = window.__googleMapsCallbacks || [];
      window.__googleMapsCallbacks.push(resolve);
      return;
    }

    // Start loading
    window.__googleMapsLoading = true;
    window.__googleMapsCallbacks = [resolve];

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.__googleMapsLoaded = true;
      window.__googleMapsLoading = false;
      window.__googleMapsCallbacks?.forEach(cb => cb());
      window.__googleMapsCallbacks = [];
    };

    script.onerror = () => {
      window.__googleMapsLoading = false;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });
};

export interface LazyGooglePlacesAutocompleteProps {
  onPlaceSelected?: (value: string, details?: PlaceDetails) => void;
  onPlaceSelect?: (place: { name?: string; formatted_address: string; lat?: number | null; lng?: number | null }) => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  initialValue?: string;
  value?: string;
  floatingLabel?: boolean;
  icon?: React.ReactNode;
  debounceMs?: number;
}

// Memoized input component for better performance
const AutocompleteInput = memo(({
  inputRef,
  className,
  disabled,
  maxLength,
  isFocused,
  isFloating,
  onFocus,
  onBlur,
  onInput,
  icon,
  placeholder,
  floatingLabel,
  isLoading
}: {
  inputRef: React.RefObject<HTMLInputElement>;
  className?: string;
  disabled: boolean;
  maxLength: number;
  isFocused: boolean;
  isFloating: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onInput: (val: string) => void;
  icon?: React.ReactNode;
  placeholder: string;
  floatingLabel: boolean;
  isLoading: boolean;
}) => {
  if (floatingLabel) {
    return (
      <motion.div 
        className="relative"
        animate={{ scale: isFocused ? 1.01 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Icon */}
        {icon && (
          <motion.div 
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
            animate={{
              color: isFocused ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              scale: isFocused ? 1.15 : 1,
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {icon}
          </motion.div>
        )}

        {/* Loading indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
            >
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </motion.div>
          )}
        </AnimatePresence>

        <Input
          ref={inputRef}
          type="text"
          className={cn(
            "h-14 md:h-12 min-h-[56px] md:min-h-[48px] transition-all duration-150 touch-manipulation text-base md:text-sm",
            "active:bg-muted/70 active:scale-[0.995]",
            icon && "pl-11 md:pl-10",
            isLoading && "pr-10",
            isFloating && "pt-5 pb-1",
            isFocused && "border-primary ring-2 ring-primary/20",
            className
          )}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete="off"
          placeholder=""
          onFocus={onFocus}
          onBlur={onBlur}
          onInput={(e) => onInput((e.currentTarget as HTMLInputElement).value)}
        />

        {/* Floating Label */}
        <motion.label
          className={cn(
            "absolute pointer-events-none transition-all duration-200 text-muted-foreground",
            icon ? "left-11 md:left-10" : "left-3"
          )}
          initial={false}
          animate={{
            top: isFloating ? "4px" : "50%",
            y: isFloating ? 0 : "-50%",
            fontSize: isFloating ? "10px" : "14px",
            color: isFocused ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            fontWeight: isFloating ? 500 : 400,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {placeholder}
        </motion.label>

        {/* Focus glow effect */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              initial={{ opacity: 0, boxShadow: "0 0 0 0 hsl(var(--primary) / 0)" }}
              animate={{ opacity: 1, boxShadow: "0 0 0 4px hsl(var(--primary) / 0.15)" }}
              exit={{ opacity: 0, boxShadow: "0 0 0 0 hsl(var(--primary) / 0)" }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className={cn(isLoading && "pr-10", className)}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete="off"
        onInput={(e) => onInput((e.currentTarget as HTMLInputElement).value)}
      />
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

AutocompleteInput.displayName = 'AutocompleteInput';

export const LazyGooglePlacesAutocomplete = memo(({
  onPlaceSelected,
  onPlaceSelect,
  onInputChange,
  placeholder = 'Enter location',
  className,
  disabled = false,
  maxLength = 200,
  initialValue,
  value,
  floatingLabel = false,
  icon,
  debounceMs = 300,
}: LazyGooglePlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  const hasInitializedRef = useRef(false);
  
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!initialValue || !!value);
  const [inputValue, setInputValue] = useState('');
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  
  // Debounce input changes
  const debouncedInputValue = useDebounce(inputValue, debounceMs);

  // Keep callback ref up to date
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  // Notify parent of debounced input changes
  useEffect(() => {
    if (debouncedInputValue) {
      onInputChange?.(debouncedInputValue);
    }
  }, [debouncedInputValue, onInputChange]);

  // Set initial value once
  useEffect(() => {
    if (initialValue && inputRef.current && !inputRef.current.value) {
      inputRef.current.value = initialValue;
      setHasValue(true);
    }
  }, [initialValue]);

  // Update input value when controlled value prop changes
  useEffect(() => {
    if (value !== undefined && inputRef.current) {
      inputRef.current.value = value;
      setHasValue(!!value);
    }
  }, [value]);

  // Lazy load Google Maps only when input is focused
  const initializeAutocomplete = useCallback(async () => {
    if (hasInitializedRef.current || autocompleteRef.current || !inputRef.current) {
      return;
    }

    setIsScriptLoading(true);

    try {
      await loadGoogleMapsScript();

      if (!inputRef.current || !window.google?.maps?.places) {
        return;
      }

      hasInitializedRef.current = true;

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['establishment', 'geocode'],
          fields: ['formatted_address', 'name', 'address_components', 'place_id', 'geometry'],
          componentRestrictions: { country: ['tr', 'ae', 'cy'] },
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && inputRef.current) {
          const placeName = place.name || '';
          const formattedAddress = place.formatted_address || '';
          
          let displayText = formattedAddress;
          if (placeName && formattedAddress && !formattedAddress.toLowerCase().startsWith(placeName.toLowerCase())) {
            displayText = `${placeName}, ${formattedAddress}`;
          } else if (placeName && !formattedAddress) {
            displayText = placeName;
          }

          const lat = place.geometry?.location?.lat() || null;
          const lng = place.geometry?.location?.lng() || null;

          const details: PlaceDetails = {
            placeName,
            formattedAddress,
            displayText,
            lat,
            lng,
          };

          inputRef.current.value = placeName || formattedAddress;
          setHasValue(true);

          onPlaceSelectedRef.current?.(displayText, details);
          
          onPlaceSelect?.({
            name: placeName,
            formatted_address: formattedAddress,
            lat,
            lng,
          });
        }
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error('Failed to initialize Google Places Autocomplete:', error);
    } finally {
      setIsScriptLoading(false);
    }
  }, [onPlaceSelect]);

  // Initialize on focus (lazy loading)
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    initializeAutocomplete();
  }, [initializeAutocomplete]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleInput = useCallback((val: string) => {
    setInputValue(val);
    setHasValue(!!val);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
        hasInitializedRef.current = false;
      }
    };
  }, []);

  const isFloating = isFocused || hasValue;

  return (
    <AutocompleteInput
      inputRef={inputRef}
      className={className}
      disabled={disabled}
      maxLength={maxLength}
      isFocused={isFocused}
      isFloating={isFloating}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onInput={handleInput}
      icon={icon}
      placeholder={placeholder}
      floatingLabel={floatingLabel}
      isLoading={isScriptLoading}
    />
  );
});

LazyGooglePlacesAutocomplete.displayName = 'LazyGooglePlacesAutocomplete';

export default LazyGooglePlacesAutocomplete;

