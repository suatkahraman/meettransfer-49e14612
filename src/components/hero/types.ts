import { PlaceDetails } from "@/components/ui/lazy-google-places-autocomplete";

export interface CityVideo {
  src: string;
  srcMp4?: string; // Fallback MP4 for browsers that don't support WebM
  label: string;
  labelTR: string;
  poster: string;
}

export interface VehiclePrice {
  vehicleType: string;
  price: number;
  currency?: string;
}

export interface HeroFormState {
  // Ride form
  pickup: string;
  dropoff: string;
  date: Date | undefined;
  time: string;
  passengers: string;
  vehicleType: string;
  // Hourly form
  hourlyCity: string;
  hourlyDate: Date | undefined;
  hourlyTime: string;
  hourlyDuration: string;
  hourlyPassengers: string;
  hourlyVehicleType: string;
  customHours: string;
}

export interface BookingData {
  pickup?: string | null;
  dropoff?: string | null;
  date?: string | null;
  time?: string | null;
  passengers?: number | null;
  vehicleType?: string | null;
}

export type PlaceSelectedHandler = (value: string, details?: PlaceDetails) => void;
