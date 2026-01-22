import { memo, useCallback, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { GooglePlacesAutocomplete, PlaceDetails } from '@/components/ui/google-places-autocomplete';
import { GoogleRouteMap } from '@/components/ui/google-route-map';
import { LocationDisplay } from '@/components/ui/location-display';
import { cn } from '@/lib/utils';

/**
 * Location data structure for pickup or dropoff
 */
export interface LocationData {
  address: string;
  placeName: string;
  lat: number | null;
  lng: number | null;
}

/**
 * Props for the AddressMapSection component
 */
export interface AddressMapSectionProps {
  /** Pickup location data */
  pickup: LocationData;
  /** Dropoff location data */
  dropoff: LocationData;
  /** Callback when pickup location changes */
  onPickupChange: (location: LocationData) => void;
  /** Callback when dropoff location changes */
  onDropoffChange: (location: LocationData) => void;
  /** Labels for the inputs */
  labels?: {
    pickup?: string;
    dropoff?: string;
    sectionTitle?: string;
  };
  /** Placeholders for the inputs */
  placeholders?: {
    pickup?: string;
    dropoff?: string;
  };
  /** Whether to show the route map preview */
  showMap?: boolean;
  /**
   * How to commit manual typing to parent state.
   * - 'debounce' (default): commit after user pauses typing (legacy behavior)
   * - 'blur': commit only on input blur (recommended for heavy parent forms like Admin)
   */
  manualCommitMode?: 'debounce' | 'blur';
  /** Whether to show navigation buttons on the map */
  showNavigationButtons?: boolean;
  /** Customer phone for map navigation (optional) */
  customerPhone?: string;
  /** Additional CSS classes */
  className?: string;
  /** Error messages for validation */
  errors?: {
    pickup?: string;
    dropoff?: string;
  };
  /** Whether fields are disabled */
  disabled?: boolean;
  /** Render a changed field indicator (for edit forms) */
  changedFields?: {
    pickup?: boolean;
    dropoff?: boolean;
  };
  /** Custom label component for showing change indicators */
  renderLabel?: (label: string, isChanged?: boolean) => React.ReactNode;
  /** Layout mode */
  layout?: 'horizontal' | 'vertical';
}

/**
 * Unified Address & Map section component for reservation forms.
 * Used across Admin, Agency, and Customer panels for consistent UX.
 * 
 * Features:
 * - Pickup/dropoff Google Places Autocomplete inputs
 * - LocationDisplay preview after selection
 * - GoogleRouteMap with distance/duration when both addresses are set
 * - Support for validation errors and change indicators (for edit forms)
 */
const AddressMapSectionComponent = ({
  pickup,
  dropoff,
  onPickupChange,
  onDropoffChange,
  labels = {},
  placeholders = {},
  showMap = true,
  manualCommitMode = 'debounce',
  showNavigationButtons = false,
  customerPhone,
  className,
  errors = {},
  disabled = false,
  changedFields = {},
  renderLabel,
  layout = 'horizontal',
}: AddressMapSectionProps) => {
  const {
    pickup: pickupLabel = 'Alış Noktası',
    dropoff: dropoffLabel = 'Bırakış Noktası',
    sectionTitle = 'Transfer Detayları',
  } = labels;

  const {
    pickup: pickupPlaceholder = 'Alış noktasını girin',
    dropoff: dropoffPlaceholder = 'Bırakış noktası / otel',
  } = placeholders;

  // IMPORTANT:
  // Some panels allow manual typing (without selecting a suggestion).
  // If we push every keystroke to parent state, the whole form re-renders and may freeze.
  // So we debounce manual typing updates and only commit after the user pauses.
  // We also use latest refs for callbacks to avoid stale closures and unnecessary re-renders.
  const pickupTypingTimerRef = useRef<number | undefined>(undefined);
  const dropoffTypingTimerRef = useRef<number | undefined>(undefined);

  // Keep callback refs up-to-date (avoids re-creating child callbacks on every parent render)
  const onPickupChangeRef = useRef(onPickupChange);
  const onDropoffChangeRef = useRef(onDropoffChange);
  useEffect(() => { onPickupChangeRef.current = onPickupChange; }, [onPickupChange]);
  useEffect(() => { onDropoffChangeRef.current = onDropoffChange; }, [onDropoffChange]);

  const commitManualPickup = useCallback(
    (val: string) => {
      onPickupChangeRef.current({
        address: val,
        placeName: '',
        lat: null,
        lng: null,
      });
    },
    []
  );

  const commitManualDropoff = useCallback(
    (val: string) => {
      onDropoffChangeRef.current({
        address: val,
        placeName: '',
        lat: null,
        lng: null,
      });
    },
    []
  );

  // Handle pickup place selection (use ref to avoid stale closure)
  const handlePickupSelect = useCallback((value: string, details?: PlaceDetails) => {
    if (pickupTypingTimerRef.current) {
      window.clearTimeout(pickupTypingTimerRef.current);
      pickupTypingTimerRef.current = undefined;
    }
    onPickupChangeRef.current({
      address: details?.formattedAddress || value,
      placeName: details?.placeName || '',
      lat: details?.lat || null,
      lng: details?.lng || null,
    });
  }, []);

  // Handle dropoff place selection (use ref to avoid stale closure)
  const handleDropoffSelect = useCallback((value: string, details?: PlaceDetails) => {
    if (dropoffTypingTimerRef.current) {
      window.clearTimeout(dropoffTypingTimerRef.current);
      dropoffTypingTimerRef.current = undefined;
    }
    onDropoffChangeRef.current({
      address: details?.formattedAddress || value,
      placeName: details?.placeName || '',
      lat: details?.lat || null,
      lng: details?.lng || null,
    });
  }, []);

  const handlePickupInputChange = useCallback(
    (val: string) => {
      // In heavy parent forms (Admin), avoid committing on every typing pause.
      // We'll commit on blur instead to prevent large re-renders / perceived freezing.
      if (manualCommitMode !== 'debounce') return;

      if (pickupTypingTimerRef.current) window.clearTimeout(pickupTypingTimerRef.current);
      pickupTypingTimerRef.current = window.setTimeout(() => commitManualPickup(val), 600);
    },
    [commitManualPickup, manualCommitMode]
  );

  const handleDropoffInputChange = useCallback(
    (val: string) => {
      if (manualCommitMode !== 'debounce') return;

      if (dropoffTypingTimerRef.current) window.clearTimeout(dropoffTypingTimerRef.current);
      dropoffTypingTimerRef.current = window.setTimeout(() => commitManualDropoff(val), 600);
    },
    [commitManualDropoff, manualCommitMode]
  );

  const handlePickupBlur = useCallback(
    (val: string) => {
      if (pickupTypingTimerRef.current) {
        window.clearTimeout(pickupTypingTimerRef.current);
        pickupTypingTimerRef.current = undefined;
      }
      if (manualCommitMode === 'blur') commitManualPickup(val);
    },
    [commitManualPickup, manualCommitMode]
  );

  const handleDropoffBlur = useCallback(
    (val: string) => {
      if (dropoffTypingTimerRef.current) {
        window.clearTimeout(dropoffTypingTimerRef.current);
        dropoffTypingTimerRef.current = undefined;
      }
      if (manualCommitMode === 'blur') commitManualDropoff(val);
    },
    [commitManualDropoff, manualCommitMode]
  );

  // Default label renderer
  const defaultRenderLabel = (label: string, isChanged?: boolean) => (
    <div className="flex items-center gap-2">
      <Label>{label} *</Label>
      {isChanged && (
        <span className="text-xs bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded">
          Değiştirildi
        </span>
      )}
    </div>
  );

  const labelRenderer = renderLabel || defaultRenderLabel;

  const gridClass = layout === 'horizontal' 
    ? 'grid grid-cols-1 md:grid-cols-2 gap-4' 
    : 'space-y-4';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Section Header */}
      {sectionTitle && (
        <div className="flex items-center gap-2 border-b pb-2">
          <div className="p-2 rounded-lg bg-green-500/10">
            <MapPin className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="font-semibold text-lg">{sectionTitle}</h3>
        </div>
      )}

      {/* Address Inputs */}
      <div className={gridClass}>
        {/* Pickup Field */}
        <div 
          className={cn(
            'space-y-2 p-3 rounded-lg transition-colors',
            changedFields.pickup && 'bg-amber-500/10 border border-amber-500/30'
          )}
        >
          {labelRenderer(pickupLabel, changedFields.pickup)}
          
          {/* Show selected location preview */}
          {pickup.placeName && (
            <div className="mb-2 p-2 bg-muted/50 rounded-lg">
              <LocationDisplay
                placeName={pickup.placeName}
                address={pickup.address}
                type="pickup"
                size="sm"
                showAddress={true}
              />
            </div>
          )}
          
          <GooglePlacesAutocomplete
            onPlaceSelected={handlePickupSelect}
            onInputChange={handlePickupInputChange}
            onBlurValue={handlePickupBlur}
            placeholder={pickupPlaceholder}
            initialValue={pickup.placeName || pickup.address}
            disabled={disabled}
            className={errors.pickup ? 'border-destructive' : ''}
          />
          
          {errors.pickup && (
            <p className="text-sm text-destructive">{errors.pickup}</p>
          )}
        </div>

        {/* Dropoff Field */}
        <div 
          className={cn(
            'space-y-2 p-3 rounded-lg transition-colors',
            changedFields.dropoff && 'bg-amber-500/10 border border-amber-500/30'
          )}
        >
          {labelRenderer(dropoffLabel, changedFields.dropoff)}
          
          {/* Show selected location preview */}
          {dropoff.placeName && (
            <div className="mb-2 p-2 bg-muted/50 rounded-lg">
              <LocationDisplay
                placeName={dropoff.placeName}
                address={dropoff.address}
                type="dropoff"
                size="sm"
                showAddress={true}
              />
            </div>
          )}
          
          <GooglePlacesAutocomplete
            onPlaceSelected={handleDropoffSelect}
            onInputChange={handleDropoffInputChange}
            onBlurValue={handleDropoffBlur}
            placeholder={dropoffPlaceholder}
            initialValue={dropoff.placeName || dropoff.address}
            disabled={disabled}
            className={errors.dropoff ? 'border-destructive' : ''}
          />
          
          {errors.dropoff && (
            <p className="text-sm text-destructive">{errors.dropoff}</p>
          )}
        </div>
      </div>

      {/* Route Map Preview */}
      {showMap && pickup.address && dropoff.address && (
        <div className="pt-2">
          <GoogleRouteMap
            pickup={pickup.address}
            dropoff={dropoff.address}
            showNavigationButtons={showNavigationButtons}
            customerPhone={customerPhone}
          />
        </div>
      )}
    </div>
  );
};

export const AddressMapSection = memo(AddressMapSectionComponent);
export default AddressMapSection;
