/**
 * Secure Pre-Login Booking Storage
 * 
 * This hook manages booking data BEFORE user authentication.
 * Data is stored ONLY in sessionStorage (client-side, not in database)
 * until user logs in, then it can be persisted with user_id.
 * 
 * Security principle: No sensitive booking data in database without authentication.
 */

import { useCallback } from "react";

const PENDING_BOOKING_KEY = 'pending_booking_data';
const PENDING_TOKEN_KEY = 'pending_booking_token';

export interface PendingBookingData {
  // Route info
  pickup?: string;
  dropoff?: string;
  pickupPlaceName?: string;
  dropoffPlaceName?: string;
  
  // Schedule
  date?: string;
  time?: string;
  
  // Passengers
  passengers?: number;
  passengerNames?: string[];
  
  // Vehicle
  vehicleType?: string;
  
  // Pricing (calculated, not from database)
  estimatedPrice?: number;
  currency?: string;
  allVehiclePrices?: Record<string, number>;
  
  // Extras
  babySeatCount?: number;
  luggageCount?: number;
  
  // Return trip
  hasReturnTrip?: boolean;
  returnDate?: string;
  returnTime?: string;
  returnPrice?: number;
  
  // Promo
  promoCode?: string;
  discountPercentage?: number;
  
  // Payment preference
  paymentMethod?: string;
  
  // Service type
  serviceType?: 'airport_transfer' | 'intercity_transfer' | 'hourly_rental' | 'transfer' | 'hourly' | string;
  
  // Hourly rental specific
  city?: string;
  durationHours?: number;
  
  // Customer info (optional - only if user provided before login)
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerNotes?: string;
  flightNumber?: string;
  
  // Metadata
  language?: string;
  savedAt?: string;
}

// Safe sessionStorage access with error handling
function safeSessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    console.warn('Failed to save to sessionStorage:', key);
    return false;
  }
}

function safeSessionRemove(key: string): boolean {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function usePendingBookingStorage() {
  /**
   * Save booking data to sessionStorage (NOT database)
   * This should be used for all pre-login booking state
   */
  const savePendingBooking = useCallback((data: PendingBookingData): boolean => {
    const dataWithTimestamp = {
      ...data,
      savedAt: new Date().toISOString(),
    };
    return safeSessionSet(PENDING_BOOKING_KEY, JSON.stringify(dataWithTimestamp));
  }, []);

  /**
   * Load pending booking data from sessionStorage
   */
  const loadPendingBooking = useCallback((): PendingBookingData | null => {
    const saved = safeSessionGet(PENDING_BOOKING_KEY);
    if (!saved) return null;
    
    try {
      const parsed = JSON.parse(saved) as PendingBookingData;
      
      // Check if data is older than 24 hours - expire it
      if (parsed.savedAt) {
        const savedTime = new Date(parsed.savedAt).getTime();
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (now - savedTime > twentyFourHours) {
          clearPendingBooking();
          return null;
        }
      }
      
      return parsed;
    } catch {
      return null;
    }
  }, []);

  /**
   * Clear all pending booking data after successful reservation
   */
  const clearPendingBooking = useCallback((): void => {
    safeSessionRemove(PENDING_BOOKING_KEY);
    safeSessionRemove(PENDING_TOKEN_KEY);
    // Also clear localStorage legacy keys
    try {
      localStorage.removeItem('pending_booking_token');
      localStorage.removeItem('pending_booking_data');
    } catch {
      // Ignore
    }
  }, []);

  /**
   * Update specific fields of pending booking
   */
  const updatePendingBooking = useCallback((updates: Partial<PendingBookingData>): boolean => {
    const existing = loadPendingBooking() || {};
    return savePendingBooking({
      ...existing,
      ...updates,
    });
  }, [loadPendingBooking, savePendingBooking]);

  /**
   * Check if there is pending booking data
   */
  const hasPendingBooking = useCallback((): boolean => {
    return loadPendingBooking() !== null;
  }, [loadPendingBooking]);

  /**
   * Migrate from localStorage to sessionStorage (for backward compatibility)
   */
  const migrateFromLocalStorage = useCallback((): PendingBookingData | null => {
    try {
      // Check localStorage for legacy data
      const legacyData = localStorage.getItem('pending_booking_data');
      const legacyToken = localStorage.getItem('pending_booking_token');
      
      if (legacyData || legacyToken) {
        let data: PendingBookingData = {};
        
        if (legacyData) {
          try {
            data = JSON.parse(legacyData);
          } catch {
            // Invalid JSON
          }
        }
        
        // Save to sessionStorage and clear localStorage
        savePendingBooking(data);
        localStorage.removeItem('pending_booking_data');
        localStorage.removeItem('pending_booking_token');
        
        return data;
      }
    } catch {
      // Ignore localStorage errors
    }
    
    return null;
  }, [savePendingBooking]);

  return {
    savePendingBooking,
    loadPendingBooking,
    clearPendingBooking,
    updatePendingBooking,
    hasPendingBooking,
    migrateFromLocalStorage,
  };
}

/**
 * Static utility functions for use outside of React components
 */
export const PendingBookingStorage = {
  save: (data: PendingBookingData): boolean => {
    const dataWithTimestamp = {
      ...data,
      savedAt: new Date().toISOString(),
    };
    return safeSessionSet(PENDING_BOOKING_KEY, JSON.stringify(dataWithTimestamp));
  },
  
  load: (): PendingBookingData | null => {
    const saved = safeSessionGet(PENDING_BOOKING_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  },
  
  clear: (): void => {
    safeSessionRemove(PENDING_BOOKING_KEY);
    safeSessionRemove(PENDING_TOKEN_KEY);
    try {
      localStorage.removeItem('pending_booking_token');
      localStorage.removeItem('pending_booking_data');
    } catch {
      // Ignore
    }
  },
  
  has: (): boolean => {
    return safeSessionGet(PENDING_BOOKING_KEY) !== null;
  },
};
