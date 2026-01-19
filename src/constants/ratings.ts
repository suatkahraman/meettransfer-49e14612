/**
 * Centralized rating constants for the application.
 * All rating displays should use these values or the useGoogleReviewStats hook.
 * 
 * The hook fetches live data from Google Reviews API.
 * These constants serve as fallback values when the API is unavailable.
 */

// Default rating value (used as fallback when API unavailable)
export const DEFAULT_RATING = 4.7;

// Default total reviews count (used as fallback when API unavailable)
export const DEFAULT_TOTAL_REVIEWS = 2847;

// Formatted rating string for display
export const DEFAULT_RATING_DISPLAY = "4.7";

// Rating with denominator for display (e.g., "4.7/5")
export const DEFAULT_RATING_WITH_MAX = "4.7/5";

// Platform-specific ratings (these are independent and verified per platform)
export const PLATFORM_RATINGS = {
  google: {
    rating: DEFAULT_RATING,
    reviews: DEFAULT_TOTAL_REVIEWS,
  },
  tripadvisor: {
    rating: 4.7,
    reviews: 492,
  },
  appStore: {
    rating: 4.8,
    reviews: 1200,
  },
  googlePlay: {
    rating: 4.7,
    reviews: 3400,
  },
  trustpilot: {
    rating: 4.8,
    reviews: 980,
  },
} as const;

// Helper function to format rating with reviews count
export const formatRatingDisplay = (rating: number, reviews: number): string => {
  return `${rating.toFixed(1)}/5 (${reviews.toLocaleString()}+ ${reviews === 1 ? 'review' : 'reviews'})`;
};

// Helper function to format rating only
export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};
