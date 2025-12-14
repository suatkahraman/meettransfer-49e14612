import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { logGooglePlacesEvent } from '@/components/ui/google-places-debug';

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
  };
}

// NEW API KEY (publishable)
const GOOGLE_MAPS_API_KEY = 'AIzaSyCk_A1D5LOqb2TuIFuOiVVjGDSAprap38M';

// Track script loading globally
let isScriptLoading = false;
let isScriptLoaded = false;
const loadCallbacks: (() => void)[] = [];

const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (isScriptLoaded && window.google?.maps?.places) {
      resolve();
      return;
    }

    if (isScriptLoading) {
      loadCallbacks.push(resolve);
      return;
    }

    isScriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      resolve();
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    script.onerror = () => {
      isScriptLoading = false;
      console.error('Failed to load Google Maps script');
    };

    document.head.appendChild(script);
  });
};

interface GooglePlacesAutocompleteProps {
  /** Called ONLY when a place is selected from suggestions */
  onPlaceSelected?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
}

export const GooglePlacesAutocomplete = ({
  onPlaceSelected,
  placeholder = 'Enter location',
  className,
  disabled = false,
  maxLength = 200,
}: GooglePlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  const hasInitializedRef = useRef(false); // StrictMode + "only once" guard

  // Keep callback ref up to date
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  useEffect(() => {
    let isCancelled = false;

    const setupAutocomplete = async () => {
      if (hasInitializedRef.current) {
        // Prevent double-init under StrictMode
        return;
      }

      await loadGoogleMapsScript();

      if (
        isCancelled ||
        !inputRef.current ||
        autocompleteRef.current || // already attached
        !window.google?.maps?.places
      ) {
        return;
      }

      hasInitializedRef.current = true;
      logGooglePlacesEvent('init', 'Autocomplete initialized');

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['establishment', 'geocode'],
          fields: ['formatted_address', 'name', 'address_components'],
          componentRestrictions: { country: 'tr' },
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && inputRef.current) {
          const address = place.formatted_address || place.name || '';

          // Let Google / DOM control the input value directly
          inputRef.current.value = address;

          logGooglePlacesEvent('place_changed', address);

          // React state update ONLY here (if parent uses it)
          onPlaceSelectedRef.current?.(address);
        }
      });

      autocompleteRef.current = autocomplete;
    };

    setupAutocomplete();

    return () => {
      isCancelled = true;
      if (autocompleteRef.current && window.google?.maps?.event) {
        logGooglePlacesEvent('cleanup', 'Autocomplete instance cleaned up');
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
        hasInitializedRef.current = false;
      }
    };
  }, []);

  return (
    <Input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className={cn(className)}
      disabled={disabled}
      maxLength={maxLength}
      autoComplete="off"
      // CRITICAL: NO value, defaultValue, or onChange here
    />
  );
};

export default GooglePlacesAutocomplete;
