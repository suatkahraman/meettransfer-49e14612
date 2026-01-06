// Shared vehicle configuration for edge functions
// Keep in sync with src/lib/vehicleTypes.ts

export interface VehicleTypeConfig {
  value: string;
  label: string;
  passengers: number;
  luggage: number;
}

// Central vehicle types - matches frontend
export const VEHICLE_TYPES: VehicleTypeConfig[] = [
  { value: 'mercedes-vito', label: 'Mercedes Vito', passengers: 6, luggage: 6 },
  { value: 'vip-mercedes', label: 'VIP Mercedes', passengers: 5, luggage: 5 },
  { value: 'maybach-minibus', label: 'Maybach Minibus', passengers: 4, luggage: 4 },
  { value: 'minibus', label: 'Mercedes Sprinter', passengers: 16, luggage: 16 },
];

// Vehicle labels lookup
export const VEHICLE_LABELS: Record<string, string> = Object.fromEntries(
  VEHICLE_TYPES.map(v => [v.value, v.label])
);

// Get vehicle label for display
export function getVehicleLabel(vehicleType: string): string {
  return VEHICLE_LABELS[vehicleType] || vehicleType;
}

// Vehicle fallback order for price matching
// When exact vehicle not found, try these in order
export const VEHICLE_FALLBACK_ORDER: Record<string, string[]> = {
  // Primary vehicle types (new naming convention)
  'mercedes-vito': ['mercedes-vito'],
  'mercedes-vito-vip': ['mercedes-vito-vip'],
  'mercedes-maybach': ['mercedes-maybach'],
  'mercedes-sprinter': ['mercedes-sprinter'],
  
  // Legacy vehicle type mappings (for backward compatibility with old DB entries)
  'vip-mercedes': ['mercedes-vito-vip', 'vip-mercedes'],
  'maybach-minibus': ['mercedes-maybach', 'maybach-minibus'],
  'minibus': ['mercedes-sprinter', 'minibus'],
  'mercedes-vclass': ['mercedes-vito-vip', 'vip-mercedes'],
  'maybach': ['mercedes-maybach', 'maybach-minibus'],
  
  // Common aliases
  'Mercedes Vito': ['mercedes-vito'],
  'Mercedes Vito VIP': ['mercedes-vito-vip', 'vip-mercedes'],
  'VIP Vito': ['mercedes-vito-vip', 'vip-mercedes'],
  'Mercedes V-Class': ['mercedes-vito-vip', 'vip-mercedes'],
  'V-Class': ['mercedes-vito-vip', 'vip-mercedes'],
  'Mercedes Sprinter': ['mercedes-sprinter', 'minibus'],
  'Mercedes Sprinter VIP': ['mercedes-sprinter', 'minibus'],
  'Mercedes Maybach': ['mercedes-maybach', 'maybach-minibus'],
  'Maybach Minivan': ['mercedes-maybach', 'maybach-minibus'],
  'VIP': ['mercedes-vito-vip', 'vip-mercedes'],
  'Minivan': ['mercedes-vito'],
  'Minibus': ['mercedes-sprinter', 'minibus'],
};

// Get vehicle fallback list for price matching
export function getVehicleFallbackList(requestedVehicle: string): string[] {
  // Direct match
  if (VEHICLE_FALLBACK_ORDER[requestedVehicle]) {
    return VEHICLE_FALLBACK_ORDER[requestedVehicle];
  }
  
  // Partial match
  const normalized = requestedVehicle.toLowerCase();
  for (const [vehicle, fallbacks] of Object.entries(VEHICLE_FALLBACK_ORDER)) {
    if (normalized.includes(vehicle.toLowerCase()) || vehicle.toLowerCase().includes(normalized)) {
      return fallbacks;
    }
  }
  
  // Default fallback - try all
  return [requestedVehicle, 'mercedes-vito', 'vip-mercedes', 'minibus'];
}
