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
  placeName: string;       // Establishment/place name (e.g., "Regnum Carya Golf & Resort")
  formattedAddress: string; // Full formatted address
  displayText: string;     // Combined text for display (name + address or just address)
  lat: number | null;
  lng: number | null;
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
  onPlaceSelected?: (value: string, details?: PlaceDetails) => void;
  /** Shorthand alias for onPlaceSelected with simplified signature */
  onPlaceSelect?: (place: { name?: string; formatted_address: string; lat?: number | null; lng?: number | null }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  /** Initial value to display in the input */
  initialValue?: string;
}

export const GooglePlacesAutocomplete = ({
  onPlaceSelected,
  onPlaceSelect,
  placeholder = 'Enter location',
  className,
  disabled = false,
  maxLength = 200,
  initialValue,
}: GooglePlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  const hasInitializedRef = useRef(false); // StrictMode + "only once" guard

  // Keep callback ref up to date
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  // Set initial value once
  useEffect(() => {
    if (initialValue && inputRef.current && !inputRef.current.value) {
      inputRef.current.value = initialValue;
    }
  }, [initialValue]);

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
          inputRef.current.value = placeName || formattedAddress;

          // React state update ONLY here (if parent uses it)
          onPlaceSelectedRef.current?.(displayText, details);
          
          // Also call simplified onPlaceSelect if provided
          onPlaceSelect?.({
            name: placeName,
            formatted_address: formattedAddress,
            lat,
            lng,
          });
        }
      });

      autocompleteRef.current = autocomplete;
    };

    setupAutocomplete();

    return () => {
      isCancelled = true;
      if (autocompleteRef.current && window.google?.maps?.event) {
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
