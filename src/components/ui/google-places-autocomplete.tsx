import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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

const GOOGLE_MAPS_API_KEY = 'AIzaSyDMyk24Ow1FzZpuvy4fGBNLApQwaKfIRuU';

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
      loadCallbacks.forEach(cb => cb());
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
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
}

export const GooglePlacesAutocomplete = ({
  value,
  onChange,
  placeholder = 'Enter location',
  className,
  disabled = false,
  maxLength = 200,
}: GooglePlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref updated so parent handler is always current
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Debug: log renders to verify no re-render on each keystroke
  console.log('[GooglePlacesAutocomplete] render');

  // Initialize Google Places script & autocomplete once (per mount)
  useEffect(() => {
    if (!inputRef.current) return;

    let isCancelled = false;

    const setupAutocomplete = async () => {
      try {
        await loadGoogleMapsScript();

        if (
          isCancelled ||
          !inputRef.current ||
          autocompleteRef.current ||
          !window.google?.maps?.places
        ) {
          return;
        }

        console.log('[GooglePlacesAutocomplete] initializing autocomplete');

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

            console.log('[GooglePlacesAutocomplete] place_changed', address);

            // Notify parent ONLY when a place is selected
            onChangeRef.current(address);
          }
        });

        autocompleteRef.current = autocomplete;
      } catch (error) {
        console.error('Failed to initialize Google Places Autocomplete:', error);
      }
    };

    setupAutocomplete();

    return () => {
      isCancelled = true;
      if (autocompleteRef.current && window.google?.maps?.event) {
        console.log('[GooglePlacesAutocomplete] cleanup autocomplete instance');
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
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
    />
  );
};

export default GooglePlacesAutocomplete;
