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
  // Primary matches
  'mercedes-vito': ['mercedes-vito', 'vip-mercedes', 'minibus'],
  'vip-mercedes': ['vip-mercedes', 'mercedes-vito', 'maybach-minibus', 'minibus'],
  'maybach-minibus': ['maybach-minibus', 'vip-mercedes', 'mercedes-vito', 'minibus'],
  'minibus': ['minibus', 'vip-mercedes', 'mercedes-vito'],
  
  // Legacy vehicle type mappings (for backward compatibility)
  'mercedes-vclass': ['vip-mercedes', 'mercedes-vito', 'maybach-minibus'],
  'maybach': ['maybach-minibus', 'vip-mercedes'],
  
  // Common aliases
  'Mercedes Vito': ['mercedes-vito', 'vip-mercedes', 'minibus'],
  'Mercedes Vito VIP': ['vip-mercedes', 'mercedes-vito', 'maybach-minibus'],
  'VIP Vito': ['vip-mercedes', 'mercedes-vito', 'maybach-minibus'],
  'Mercedes V-Class': ['vip-mercedes', 'mercedes-vito', 'maybach-minibus'],
  'V-Class': ['vip-mercedes', 'mercedes-vito', 'maybach-minibus'],
  'Mercedes Sprinter': ['minibus', 'mercedes-vito'],
  'Mercedes Sprinter VIP': ['minibus', 'vip-mercedes'],
  'Mercedes Maybach': ['maybach-minibus', 'vip-mercedes'],
  'Maybach Minivan': ['maybach-minibus', 'vip-mercedes'],
  'VIP': ['vip-mercedes', 'maybach-minibus', 'mercedes-vito'],
  'Minivan': ['mercedes-vito', 'vip-mercedes'],
  'Minibus': ['minibus', 'mercedes-vito'],
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
