import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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

// Lazy load Google Maps script with loading=async parameter
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If Places is already available (script loaded by another component), just resolve.
    if (window.google?.maps?.places) {
      window.__googleMapsLoaded = true;
      window.__googleMapsLoading = false;
      resolve();
      return;
    }

    // Already loaded (our own flags)
    if (window.__googleMapsLoaded) {
      resolve();
      return;
    }

    // If a script tag already exists, avoid injecting a duplicate. Just wait for it.
    const existingScript =
      document.querySelector<HTMLScriptElement>('script[data-google-maps="places"]') ||
      document.querySelector<HTMLScriptElement>('script[src*="maps.googleapis.com/maps/api/js"]');

    if (existingScript) {
      const startedAt = Date.now();
      const poll = () => {
        if (window.google?.maps?.places) {
          window.__googleMapsLoaded = true;
          window.__googleMapsLoading = false;
          resolve();
          return;
        }
        if (Date.now() - startedAt > 12000) {
          reject(new Error('Google Maps script present but Places API not available'));
          return;
        }
        setTimeout(poll, 50);
      };
      poll();
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
    script.setAttribute('data-google-maps', 'places');
    // Add loading=async to prevent the Google Maps warning
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.__googleMapsLoaded = true;
      window.__googleMapsLoading = false;
      window.__googleMapsCallbacks?.forEach((cb) => cb());
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

// Preload Google Maps script shortly after page load so first input suggestions appear instantly
if (typeof window !== 'undefined') {
  const preload = () => {
    loadGoogleMapsScript().catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preload, { timeout: 2000 });
  } else {
    setTimeout(preload, 600);
  }
}

// Pure CSS animated input component - no framer-motion for better performance
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
      <div 
        className={cn(
          "relative transition-transform duration-150 ease-out",
          isFocused && "scale-[1.01]"
        )}
      >
        {/* Icon with CSS transitions */}
        {icon && (
          <div 
            className={cn(
              "absolute left-3.5 md:left-3 top-1/2 -translate-y-1/2 z-10 transition-all duration-150",
              isFocused ? "text-primary scale-115" : "text-muted-foreground scale-100"
            )}
            style={{ transform: `translateY(-50%) scale(${isFocused ? 1.15 : 1})` }}
          >
            {icon}
          </div>
        )}

        {/* Loading indicator with CSS transitions */}
        <div
          className={cn(
            "absolute right-3.5 md:right-3 top-1/2 -translate-y-1/2 z-10 transition-opacity duration-150",
            isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <Loader2 className="h-5 w-5 md:h-4 md:w-4 animate-spin text-muted-foreground" />
        </div>

        <Input
          ref={inputRef}
          type="text"
          className={cn(
            "h-14 md:h-12 min-h-[56px] md:min-h-[48px] transition-all duration-150 touch-manipulation text-base md:text-sm",
            "active:bg-muted/70 active:scale-[0.995]",
            icon && "pl-12 md:pl-10",
            isLoading && "pr-12 md:pr-10",
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

        {/* Floating Label with CSS transitions */}
        <label
          className={cn(
            "absolute pointer-events-none transition-all duration-200 ease-out",
            icon ? "left-12 md:left-10" : "left-3.5 md:left-3",
            isFloating 
              ? "top-1 text-[10px] font-medium" 
              : "top-1/2 -translate-y-1/2 text-base",
            isFocused ? "text-primary" : "text-muted-foreground"
          )}
        >
          {placeholder}
        </label>

        {/* Focus glow effect with CSS */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl pointer-events-none transition-all duration-150",
            isFocused 
              ? "opacity-100 shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]" 
              : "opacity-0"
          )}
        />
      </div>
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
      <div
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 transition-opacity duration-150",
          isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
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
          componentRestrictions: { country: ['tr', 'ae', 'cy', 'de', 'gr', 'ch', 'it'] },
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
