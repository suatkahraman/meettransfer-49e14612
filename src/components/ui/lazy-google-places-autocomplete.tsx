import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { 
  loadGoogleMapsScript, 
  preloadGoogleMaps, 
  getGoogleMaps 
} from '@/utils/googleMapsLoader';

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

// Preload Google Maps script during idle time
if (typeof window !== 'undefined') {
  preloadGoogleMaps(['places']);
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
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const hasInitializedRef = useRef(false);
  
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!initialValue || !!value);
  const [inputValue, setInputValue] = useState('');
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  
  // Debounce input changes
  const debouncedInputValue = useDebounce(inputValue, debounceMs);

  // Keep callback refs up to date (prevents stale closures)
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

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
    if (hasInitializedRef.current || autocompleteRef.current) {
      console.log('[LazyGooglePlacesAutocomplete] Already initialized, skipping');
      return;
    }
    
    const inputEl = inputRef.current;
    if (!inputEl) {
      console.warn('[LazyGooglePlacesAutocomplete] Input ref not available');
      return;
    }

    setIsScriptLoading(true);
    console.log('[LazyGooglePlacesAutocomplete] Starting initialization...');

    try {
      await loadGoogleMapsScript(['places']);

      const maps = getGoogleMaps();
      if (!maps?.places?.Autocomplete) {
        console.error('[LazyGooglePlacesAutocomplete] Google Places API not available');
        return;
      }

      // Re-check input ref after async operation
      const currentInput = inputRef.current;
      if (!currentInput) {
        console.warn('[LazyGooglePlacesAutocomplete] Input ref lost after script load');
        return;
      }

      let autocomplete: GoogleMapsAutocomplete;
      try {
        autocomplete = new maps.places.Autocomplete(
          currentInput,
          {
            types: ['establishment', 'geocode'],
            fields: ['formatted_address', 'name', 'address_components', 'place_id', 'geometry'],
            componentRestrictions: { country: ['tr', 'ae', 'cy', 'de', 'gr', 'ch', 'it'] },
          }
        );
        console.log('[LazyGooglePlacesAutocomplete] Autocomplete instance created successfully');
      } catch (error) {
        console.error('[LazyGooglePlacesAutocomplete] Failed to create instance:', error);
        return;
      }

      // Mark as initialized BEFORE adding listener
      hasInitializedRef.current = true;
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const input = inputRef.current;
        if (place && input) {
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

          input.value = placeName || formattedAddress;
          setHasValue(true);

          console.log('[LazyGooglePlacesAutocomplete] Place selected:', placeName || formattedAddress);

          onPlaceSelectedRef.current?.(displayText, details);
          
          // Use ref to access current callback (prevents stale closure)
          onPlaceSelectRef.current?.({
            name: placeName,
            formatted_address: formattedAddress,
            lat,
            lng,
          });
        }
      });
    } catch (error) {
      console.error('[LazyGooglePlacesAutocomplete] Failed to initialize:', error);
    } finally {
      setIsScriptLoading(false);
    }
  // Empty dependency - initialize only once, callbacks accessed via refs
  }, []);

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
      const maps = getGoogleMaps();
      if (autocompleteRef.current && maps?.event) {
        maps.event.clearInstanceListeners(autocompleteRef.current);
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
