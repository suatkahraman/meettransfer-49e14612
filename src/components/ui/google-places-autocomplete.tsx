import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { loadGoogleMapsScript, preloadGoogleMaps } from '@/utils/googleMapsLoader';

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

// Preload Google Maps script during idle time (not blocking)
if (typeof window !== 'undefined') {
  preloadGoogleMaps(['places']);
}

export interface GooglePlacesAutocompleteProps {
  /** Called ONLY when a place is selected from suggestions */
  onPlaceSelected?: (value: string, details?: PlaceDetails) => void;
  /** Shorthand alias for onPlaceSelected with simplified signature */
  onPlaceSelect?: (place: { name?: string; formatted_address: string; lat?: number | null; lng?: number | null }) => void;
  /** Called whenever the user types (manual input). */
  onInputChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  /** Initial value to display in the input */
  initialValue?: string;
  /** Controlled value - updates input when changed externally */
  value?: string;
  /** Enable floating label effect */
  floatingLabel?: boolean;
  /** Icon to show on the left */
  icon?: React.ReactNode;
}

export const GooglePlacesAutocomplete = ({
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
}: GooglePlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const hasInitializedRef = useRef(false); // StrictMode + "only once" guard
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!initialValue || !!value);

  // Keep callback refs up to date (prevents infinite re-initialization)
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  // Set initial value once
  useEffect(() => {
    if (initialValue && inputRef.current && !inputRef.current.value) {
      inputRef.current.value = initialValue;
    }
  }, [initialValue]);

  // Update input value when controlled value prop changes
  useEffect(() => {
    if (value !== undefined && inputRef.current) {
      inputRef.current.value = value;
      setHasValue(!!value);
    }
  }, [value]);

  useEffect(() => {
    let isCancelled = false;
    let retryCount = 0;
    const maxRetries = 3;
    let currentInput: HTMLInputElement | null = null;

    const getInputEl = () => currentInput ?? inputRef.current;

    const setupAutocomplete = async () => {
      // Wait until the input ref is actually bound (some panels render inputs conditionally)
      const inputEl = getInputEl();
      if (!inputEl) {
        if (!isCancelled) {
          setTimeout(setupAutocomplete, 50);
        }
        return;
      }

      currentInput = inputEl;

      // Skip if already attached to this specific input
      if (autocompleteRef.current || hasInitializedRef.current) {
        return;
      }

      try {
        await loadGoogleMapsScript();
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        // Retry loading
        if (retryCount < maxRetries && !isCancelled) {
          retryCount++;
          setTimeout(setupAutocomplete, 1000);
        }
        return;
      }

      if (isCancelled || !currentInput || !window.google?.maps?.places) {
        return;
      }

      // Double check we haven't already attached
      if (autocompleteRef.current || hasInitializedRef.current) {
        return;
      }

      console.log('Initializing Google Places Autocomplete');

      let autocomplete: GoogleMapsAutocomplete;
      try {
        autocomplete = new window.google.maps.places.Autocomplete(
          currentInput,
          {
            types: ['establishment', 'geocode'],
            fields: ['formatted_address', 'name', 'address_components', 'place_id', 'geometry'],
            componentRestrictions: { country: ['tr', 'ae', 'cy', 'de', 'gr', 'ch', 'it'] },
          }
        );
      } catch (error) {
        console.error('Failed to create Google Autocomplete instance:', error);
        return;
      }

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && currentInput) {
          const placeName = place.name || '';
          const formattedAddress = place.formatted_address || '';
          
          // Create display text: if we have both name and address, show name first
          // If name is already part of address, just use address
          let displayText = formattedAddress;
          if (placeName && formattedAddress && !formattedAddress.toLowerCase().startsWith(placeName.toLowerCase())) {
            displayText = `${placeName}, ${formattedAddress}`;
          } else if (placeName && !formattedAddress) {
            displayText = placeName;
          }

          // Get coordinates
          const lat = place.geometry?.location?.lat() || null;
          const lng = place.geometry?.location?.lng() || null;

          // Create place details object
          const details: PlaceDetails = {
            placeName,
            formattedAddress,
            displayText,
            lat,
            lng,
          };

          // Let Google / DOM control the input value directly
          // Show place name prominently if available
          currentInput.value = placeName || formattedAddress;

          // React state update ONLY here (if parent uses it)
          onPlaceSelectedRef.current?.(displayText, details);
          
          // Also call simplified onPlaceSelect if provided (use ref to prevent stale closure)
          onPlaceSelectRef.current?.({
            name: placeName,
            formatted_address: formattedAddress,
            lat,
            lng,
          });
        }
      });

      autocompleteRef.current = autocomplete;
      hasInitializedRef.current = true;
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(setupAutocomplete, 50);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      hasInitializedRef.current = false;
    };
  // Empty dependency array - initialize only once per mount
  // Callbacks are accessed via refs to stay current
  }, []);

  const isFloating = isFocused || hasValue;

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
              scale: isFocused ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
        )}

        <Input
          ref={inputRef}
          type="text"
          className={cn(
            "h-12 transition-all duration-200",
            icon && "pl-10",
            isFloating && "pt-5 pb-1",
            isFocused && "border-primary ring-2 ring-primary/20",
            className
          )}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete="off"
          placeholder=""
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onInput={(e) => {
            const val = (e.currentTarget as HTMLInputElement).value;
            setHasValue(!!val);
            onInputChange?.(val);
          }}
        />

        {/* Floating Label */}
        <motion.label
          className={cn(
            "absolute pointer-events-none transition-all duration-200 text-muted-foreground",
            icon ? "left-10" : "left-3"
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
              animate={{ opacity: 1, boxShadow: "0 0 0 3px hsl(var(--primary) / 0.1)" }}
              exit={{ opacity: 0, boxShadow: "0 0 0 0 hsl(var(--primary) / 0)" }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <Input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className={cn(className)}
      disabled={disabled}
      maxLength={maxLength}
      autoComplete="off"
      onInput={(e) => onInputChange?.((e.currentTarget as HTMLInputElement).value)}
      // CRITICAL: NO value, defaultValue, or onChange here
    />
  );
};

export default GooglePlacesAutocomplete;
