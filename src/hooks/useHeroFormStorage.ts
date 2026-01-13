import { useCallback, useEffect } from "react";

const STORAGE_KEY = 'hero_form_data';

export interface SavedFormData {
  activeTab?: "ride" | "hourly";
  pickup?: string;
  dropoff?: string;
  date?: string;
  time?: string;
  passengers?: string;
  vehicleType?: string;
  hourlyCity?: string;
  hourlyDate?: string;
  hourlyTime?: string;
  hourlyDuration?: string;
  hourlyPassengers?: string;
  hourlyVehicleType?: string;
  customHours?: string;
}

export function useHeroFormStorage() {
  const loadSavedFormData = useCallback((): SavedFormData | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      
      const parsed = JSON.parse(saved);
      
      // IMPORTANT: Always return empty pickup/dropoff - don't remember route locations
      // This ensures the form always starts fresh for new bookings
      return {
        ...parsed,
        pickup: "", // Never remember pickup location
        dropoff: "", // Never remember dropoff location
        hourlyCity: "", // Never remember hourly city
      };
    } catch {
      return null;
    }
  }, []);

  const saveFormData = useCallback((data: SavedFormData) => {
    try {
      // Save form data but exclude pickup/dropoff to ensure fresh start
      const dataToSave = {
        ...data,
        pickup: "", // Don't save pickup location
        dropoff: "", // Don't save dropoff location
        hourlyCity: "", // Don't save hourly city
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // Ignore storage errors
    }
  }, []);

  return { loadSavedFormData, saveFormData };
}

// Helper to parse saved date
export function parseSavedDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  try {
    const parsedDate = new Date(dateStr);
    return parsedDate > new Date() ? parsedDate : undefined;
  } catch {
    return undefined;
  }
}
