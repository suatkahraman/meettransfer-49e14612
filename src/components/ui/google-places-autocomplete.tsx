/**
 * UNIFIED Google Places Autocomplete
 * 
 * This file re-exports the LazyGooglePlacesAutocomplete component as the single source of truth.
 * All panels (Admin, Agency, Customer) now use the exact same implementation as Quick Booking (Hero).
 * 
 * This ensures:
 * - Consistent behavior across all forms
 * - Single initialization logic
 * - No duplicate auth-failure handling conflicts
 * - Identical dropdown behavior everywhere
 */

// Re-export everything from the lazy version (used by Quick Booking / Hero)
export {
  LazyGooglePlacesAutocomplete as GooglePlacesAutocomplete,
  LazyGooglePlacesAutocomplete as default,
  type PlaceDetails,
  type LazyGooglePlacesAutocompleteProps as GooglePlacesAutocompleteProps,
} from './lazy-google-places-autocomplete';
