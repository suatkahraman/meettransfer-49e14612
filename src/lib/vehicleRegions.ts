// Centralized vehicle region configuration
// This file manages which vehicles are shown for each geographic region
// To add a new region: 1) Add region type, 2) Add vehicle types, 3) Add to getRegionVehicles

import { VehicleTypeInfo, VEHICLE_TYPES } from './vehicleTypes';
import { DUBAI_VEHICLE_TYPES } from './dubaiVehicleTypes';

// Supported regions - add new regions here
export type VehicleRegion = 'turkey' | 'dubai' | 'default';

// Map of region to vehicle types
const REGION_VEHICLE_MAP: Record<VehicleRegion, VehicleTypeInfo[]> = {
  'turkey': VEHICLE_TYPES,
  'dubai': DUBAI_VEHICLE_TYPES,
  'default': VEHICLE_TYPES, // Fallback to Turkey/standard vehicles
};

// Get vehicle types for a specific region
export function getRegionVehicles(region: VehicleRegion | string): VehicleTypeInfo[] {
  const normalizedRegion = (region || 'default').toLowerCase() as VehicleRegion;
  return REGION_VEHICLE_MAP[normalizedRegion] || REGION_VEHICLE_MAP['default'];
}

// Get default vehicle for a region
export function getDefaultVehicle(region: VehicleRegion | string): string {
  const vehicles = getRegionVehicles(region);
  return vehicles[0]?.value || 'mercedes-vito';
}

// Check if a vehicle type is valid for a region
export function isVehicleValidForRegion(vehicleType: string, region: VehicleRegion | string): boolean {
  const vehicles = getRegionVehicles(region);
  return vehicles.some(v => v.value === vehicleType);
}

// Get a suitable vehicle for passenger count in a region
export function getSuitableVehicle(
  region: VehicleRegion | string, 
  passengers: number, 
  currentVehicle?: string
): string {
  const vehicles = getRegionVehicles(region);
  
  // If current vehicle is valid and can accommodate passengers, keep it
  if (currentVehicle) {
    const current = vehicles.find(v => v.value === currentVehicle);
    if (current && current.passengers >= passengers) {
      return currentVehicle;
    }
  }
  
  // Find first vehicle that can accommodate passengers
  const suitable = vehicles.find(v => v.passengers >= passengers);
  return suitable?.value || vehicles[0]?.value || 'mercedes-vito';
}

// Export region types for type safety
export const SUPPORTED_REGIONS: VehicleRegion[] = ['turkey', 'dubai'];
