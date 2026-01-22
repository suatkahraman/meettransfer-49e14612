import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { loadGoogleMapsScript, preloadGoogleMaps, isGoogleMapsAuthFailed } from '@/utils/googleMapsLoader';

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
  /** Called when input loses focus (useful to commit manual typing without re-rendering on each keystroke). */
  onBlurValue?: (value: string) => void;
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
  onBlurValue,
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
  const [authFailed, setAuthFailed] = useState(isGoogleMapsAuthFailed());

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

  // Listen for auth failure events
  useEffect(() => {
    const handleAuthFailure = () => {
      // Only set authFailed if Google Maps API is truly not available
      // If it's already loaded and working, ignore the failure event
      if (!window.google?.maps?.places?.Autocomplete) {
        setAuthFailed(true);
      }
    };
    window.addEventListener('google-maps-auth-failure', handleAuthFailure);
    return () => window.removeEventListener('google-maps-auth-failure', handleAuthFailure);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let retryCount = 0;
    const maxRetries = 5;
    let pollAttempts = 0;
    const maxPollAttempts = 50; // 50 * 100ms = 5 seconds max waiting for input

    const setupAutocomplete = async () => {
      // CRITICAL FIX: Check if Google Maps is ACTUALLY available first
      // Even if authFailed flag is set, the API might already be loaded and working
      // (e.g., Quick Booking loaded it successfully before some later auth check failed)
      const mapsAlreadyLoaded = !!window.google?.maps?.places?.Autocomplete;
      
      if (mapsAlreadyLoaded) {
        console.log('[GooglePlacesAutocomplete] Google Maps already loaded, proceeding...');
        // Clear any previous auth failure state since API is working
        setAuthFailed(false);
      } else if (isGoogleMapsAuthFailed()) {
        // Only show auth failure if Maps is NOT already loaded
        console.warn('[GooglePlacesAutocomplete] Auth failed and Maps not loaded, showing warning');
        setAuthFailed(true);
        return;
      }

      // Wait until the input ref is actually bound (some panels render inputs conditionally)
      const inputEl = inputRef.current;
      if (!inputEl) {
        pollAttempts++;
        if (!isCancelled && pollAttempts < maxPollAttempts) {
          setTimeout(setupAutocomplete, 100);
        } else {
          console.warn('[GooglePlacesAutocomplete] Input ref never bound after max attempts');
        }
        return;
      }

      // Skip if already attached to this specific input
      if (autocompleteRef.current || hasInitializedRef.current) {
        console.log('[GooglePlacesAutocomplete] Already initialized, skipping');
        return;
      }

      console.log('[GooglePlacesAutocomplete] Starting initialization...');

      // Only load script if not already available
      if (!window.google?.maps?.places?.Autocomplete) {
        try {
          await loadGoogleMapsScript(['places']);
        } catch (error) {
          console.error('[GooglePlacesAutocomplete] Failed to load Google Maps:', error);
          // Check if it's auth failure AND maps still not available
          if (!window.google?.maps?.places?.Autocomplete) {
            if (isGoogleMapsAuthFailed()) {
              setAuthFailed(true);
              return;
            }
            // Retry loading
            if (retryCount < maxRetries && !isCancelled) {
              retryCount++;
              console.log(`[GooglePlacesAutocomplete] Retrying... (${retryCount}/${maxRetries})`);
              setTimeout(setupAutocomplete, 1000);
            }
            return;
          }
          // Maps loaded despite error (race condition), continue
          console.log('[GooglePlacesAutocomplete] Maps available despite load error, continuing...');
        }
      }

      if (isCancelled) {
        console.log('[GooglePlacesAutocomplete] Cancelled before completion');
        return;
      }
      
      // Re-check input ref after async operation
      const currentInput = inputRef.current;
      if (!currentInput) {
        console.warn('[GooglePlacesAutocomplete] Input ref lost after script load');
        return;
      }
      
      if (!window.google?.maps?.places?.Autocomplete) {
        console.error('[GooglePlacesAutocomplete] Google Places API not available');
        return;
      }

      // Double check we haven't already attached
      if (autocompleteRef.current || hasInitializedRef.current) {
        return;
      }

      console.log('[GooglePlacesAutocomplete] Creating Autocomplete instance...');

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
        console.log('[GooglePlacesAutocomplete] Autocomplete instance created successfully');
      } catch (error) {
        console.error('[GooglePlacesAutocomplete] Failed to create instance:', error);
        return;
      }

      // Mark as initialized BEFORE adding listener to prevent race conditions
      hasInitializedRef.current = true;
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const input = inputRef.current;
        if (place && input) {
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

           // Let Google / DOM control the input value directly.
           // IMPORTANT: Admin panel expects the full address to appear in the field.
           // Prefer formatted address; fall back to displayText; then placeName.
           input.value = formattedAddress || displayText || placeName;

          console.log('[GooglePlacesAutocomplete] Place selected:', placeName || formattedAddress);

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

  // Auth failure warning UI - but ONLY if Maps is truly not available
  // Double-check at render time in case Maps loaded after initial check
  const showAuthWarning = authFailed && !window.google?.maps?.places?.Autocomplete;
  
  if (showAuthWarning) {
    return (
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className={cn("pr-10 border-amber-500", className)}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete="off"
          onInput={(e) => onInputChange?.((e.currentTarget as HTMLInputElement).value)}
          onBlur={(e) => onBlurValue?.((e.currentTarget as HTMLInputElement).value)}
        />
        <div 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500"
          title="Google Maps yüklenemedi. Adres önerileri kullanılamıyor, elle yazabilirsiniz."
        >
          <AlertTriangle className="h-4 w-4" />
        </div>
      </div>
    );
  }

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
          onBlur={(e) => {
            setIsFocused(false);
            onBlurValue?.((e.currentTarget as HTMLInputElement).value);
          }}
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
      onBlur={(e) => onBlurValue?.((e.currentTarget as HTMLInputElement).value)}
      // CRITICAL: NO value, defaultValue, or onChange here
    />
  );
};

export default GooglePlacesAutocomplete;
