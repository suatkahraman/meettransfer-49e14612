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
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const saveFormData = useCallback((data: SavedFormData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
