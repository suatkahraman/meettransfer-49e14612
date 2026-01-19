// Shared vehicle configuration for edge functions
// Keep in sync with src/lib/vehicleTypes.ts, src/lib/dubaiVehicleTypes.ts, and src/lib/switzerlandVehicleTypes.ts

export interface VehicleTypeConfig {
  value: string;
  label: string;
  passengers: number;
  luggage: number;
}

// Supported regions - add new regions here
export type VehicleRegion = 'turkey' | 'dubai' | 'switzerland' | 'default';

// Central vehicle types - matches frontend (Turkey/Standard)
export const VEHICLE_TYPES: VehicleTypeConfig[] = [
  { value: 'sedan', label: 'Sedan', passengers: 3, luggage: 2 },
  { value: 'mercedes-vito', label: 'Mercedes Vito', passengers: 6, luggage: 6 },
  { value: 'vip-mercedes', label: 'VIP Mercedes Vito', passengers: 5, luggage: 5 },
  { value: 'maybach-minibus', label: 'Mercedes Maybach Minivan', passengers: 4, luggage: 4 },
  { value: 'minibus', label: 'Mercedes Sprinter', passengers: 16, luggage: 16 },
];

// Dubai-specific vehicle types
export const DUBAI_VEHICLE_TYPES: VehicleTypeConfig[] = [
  { value: 'dubai-private-sedan', label: 'Private Standard Sedan', passengers: 3, luggage: 2 },
  { value: 'dubai-v-class', label: 'Mercedes V Class', passengers: 6, luggage: 6 },
  { value: 'dubai-premium-van', label: 'Mercedes Premium Van', passengers: 6, luggage: 6 },
  { value: 'dubai-suburban-suv', label: 'Mercedes Suburban SUV', passengers: 6, luggage: 6 },
  { value: 'dubai-vip-sprinter', label: 'VIP Mercedes Sprinter', passengers: 12, luggage: 12 },
];

// Switzerland-specific vehicle types - flat pricing
export const SWITZERLAND_VEHICLE_TYPES: VehicleTypeConfig[] = [
  { value: 's_class', label: 'Mercedes S-Class', passengers: 3, luggage: 3 },
  { value: 'mercedes_vclass', label: 'Mercedes V-Class', passengers: 7, luggage: 7 },
];

// Region to vehicle types mapping - ADD NEW REGIONS HERE
const REGION_VEHICLE_MAP: Record<VehicleRegion, VehicleTypeConfig[]> = {
  'turkey': VEHICLE_TYPES,
  'dubai': DUBAI_VEHICLE_TYPES,
  'switzerland': SWITZERLAND_VEHICLE_TYPES,
  'default': VEHICLE_TYPES,
};

// Vehicle labels lookup
export const VEHICLE_LABELS: Record<string, string> = Object.fromEntries(
  [...VEHICLE_TYPES, ...DUBAI_VEHICLE_TYPES, ...SWITZERLAND_VEHICLE_TYPES].map(v => [v.value, v.label])
);

// Get vehicle label for display
export function getVehicleLabel(vehicleType: string): string {
  return VEHICLE_LABELS[vehicleType] || vehicleType;
}

// Check if location is in Dubai/UAE
export function isDubaiLocation(location: string): boolean {
  if (!location) return false;
  const normalizedLocation = location.toLowerCase();
  
  const dubaiKeywords = [
    'dubai', 'دبي', 'burj khalifa', 'palm jumeirah', 'dubai mall', 'dubai marina',
    'dxb', 'dubai international', 'al maktoum', 'dwc', 'jebel ali', 'jumeirah',
    'downtown dubai', 'business bay', 'deira', 'bur dubai', 'sheikh zayed',
    'emirates hills', 'arabian ranches', 'jbr', 'jumeirah beach', 'jvc',
    'jumeirah village', 'sports city', 'motor city', 'silicon oasis', 'al barsha',
    'discovery gardens', 'international city', 'dubai investment park',
    'difc', 'dubai international financial centre', 'creek harbour', 'dubai creek harbour',
    'city walk', 'al quoz', 'mirdif', 'al nahda', 'al mamzar', 'dubai hills',
    'damac hills', 'town square', 'mudon', 'remraam', 'meydan', 'nad al sheba',
    'al khawaneej', 'warsan', 'dubai south', 'expo city',
    'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'fujairah', 'uae', 'united arab emirates',
  ];
  
  return dubaiKeywords.some(keyword => normalizedLocation.includes(keyword));
}

// Check if location is in Turkey
export function isTurkeyLocation(location: string): boolean {
  if (!location) return false;
  const normalizedLocation = location.toLowerCase();
  
  const turkeyKeywords = [
    'turkey', 'türkiye', 'turkiye', 'türkei',
    'ist', 'istanbul', 'saw', 'sabiha', 'ayt', 'antalya', 'bjv', 'bodrum',
    'dlm', 'dalaman', 'adb', 'izmir', 'ankara', 'bursa', 'konya', 'adana',
    'cappadocia', 'kapadokya', 'goreme', 'göreme', 'fethiye', 'marmaris',
    'kusadasi', 'kuşadası', 'cesme', 'çeşme', 'alanya', 'belek', 'side',
    'taksim', 'sultanahmet', 'kadikoy', 'kadıköy', 'besiktas', 'beşiktaş',
  ];
  
  return turkeyKeywords.some(keyword => normalizedLocation.includes(keyword));
}

// Switzerland defined airports
const SWITZERLAND_AIRPORTS = ['zrh', 'zurich airport', 'zürich flughafen', 'gva', 'geneva airport', 'genève aéroport', 'bsl', 'basel airport', 'euroairport', 'basel-mulhouse', 'mxp', 'milan malpensa', 'malpensa'];

// Switzerland defined ski resorts (only these have prices)
const SWITZERLAND_SKI_RESORTS = [
  'st. moritz', 'st moritz', 'saint moritz', 'sankt moritz',
  'gstaad',
  'davos',
  'arosa',
  'zermatt',
  'verbier',
  'crans-montana', 'crans montana',
];

// Check if location matches Switzerland airports
export function isSwitzerlandAirport(location: string): boolean {
  if (!location) return false;
  const normalizedLocation = location.toLowerCase();
  return SWITZERLAND_AIRPORTS.some(keyword => normalizedLocation.includes(keyword));
}

// Check if location matches Switzerland defined ski resorts
export function isSwitzerlandSkiResort(location: string): boolean {
  if (!location) return false;
  const normalizedLocation = location.toLowerCase();
  return SWITZERLAND_SKI_RESORTS.some(keyword => normalizedLocation.includes(keyword));
}

// Check if a Switzerland route is valid (airport ↔ ski resort only)
export function isValidSwitzerlandRoute(pickup: string, dropoff: string): boolean {
  const pickupIsAirport = isSwitzerlandAirport(pickup);
  const dropoffIsAirport = isSwitzerlandAirport(dropoff);
  const pickupIsSkiResort = isSwitzerlandSkiResort(pickup);
  const dropoffIsSkiResort = isSwitzerlandSkiResort(dropoff);
  
  // Valid routes: Airport → Ski Resort OR Ski Resort → Airport
  return (pickupIsAirport && dropoffIsSkiResort) || (pickupIsSkiResort && dropoffIsAirport);
}

// Check if location is in Switzerland
export function isSwitzerlandLocation(location: string): boolean {
  if (!location) return false;
  const normalizedLocation = location.toLowerCase();
  
  const switzerlandKeywords = [
    // Country
    'switzerland', 'schweiz', 'suisse', 'svizzera', 'swiss',
    // Airports
    'zrh', 'zurich airport', 'zürich flughafen',
    'gva', 'geneva airport', 'genève aéroport',
    'bsl', 'basel airport', 'euroairport', 'basel-mulhouse',
    'mxp', 'milan malpensa', 'malpensa',
    // Ski resorts
    'st. moritz', 'st moritz', 'saint moritz', 'zermatt', 'verbier', 'gstaad',
    'davos', 'arosa', 'crans-montana', 'crans montana', 'klosters',
    'grindelwald', 'wengen', 'lauterbrunnen', 'interlaken', 'saas-fee',
    'laax', 'flims', 'engelberg', 'andermatt', 'leukerbad', 'champéry', 'nendaz',
    // Cities
    'zurich', 'zürich', 'geneva', 'genève', 'genf', 'basel', 'bâle',
    'bern', 'berne', 'lausanne', 'lucerne', 'luzern', 'lugano', 'montreux',
    // Regions
    'graubünden', 'graubunden', 'grisons', 'valais', 'wallis', 'engadin', 'engadine',
    'swiss alps', 'matterhorn', 'jungfrau',
  ];
  
  return switzerlandKeywords.some(keyword => normalizedLocation.includes(keyword));
}

// Detect region from pickup/dropoff locations
export function detectRegion(pickup: string, dropoff: string): VehicleRegion {
  // Check Switzerland first (most specific for ski transfers)
  if (isSwitzerlandLocation(pickup) || isSwitzerlandLocation(dropoff)) {
    return 'switzerland';
  }
  // Check Dubai
  if (isDubaiLocation(pickup) || isDubaiLocation(dropoff)) {
    return 'dubai';
  }
  // Check Turkey
  if (isTurkeyLocation(pickup) || isTurkeyLocation(dropoff)) {
    return 'turkey';
  }
  // Default to Turkey/standard vehicles
  return 'default';
}

// Get vehicle types for a region
export function getVehicleTypesForRegion(region: VehicleRegion): VehicleTypeConfig[] {
  return REGION_VEHICLE_MAP[region] || REGION_VEHICLE_MAP['default'];
}

// Get vehicle types based on location (convenience function)
export function getVehicleTypesForLocation(pickup: string, dropoff: string): VehicleTypeConfig[] {
  const region = detectRegion(pickup, dropoff);
  return getVehicleTypesForRegion(region);
}

// Vehicle fallback order for price matching
// When exact vehicle not found, try these in order
export const VEHICLE_FALLBACK_ORDER: Record<string, string[]> = {
  // Primary vehicle types (new naming convention)
  'sedan': ['sedan', 'mercedes-vito'],
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
  
  // Dubai vehicle mappings
  'dubai-private-sedan': ['dubai-private-sedan', 'sedan'],
  'dubai-v-class': ['dubai-v-class', 'mercedes-vito'],
  'dubai-premium-van': ['dubai-premium-van', 'mercedes-vito'],
  'dubai-suburban-suv': ['dubai-suburban-suv', 'mercedes-vito'],
  'dubai-vip-sprinter': ['dubai-vip-sprinter', 'minibus'],
  
  // Switzerland vehicle mappings
  's_class': ['s_class'],
  'mercedes_vclass': ['mercedes_vclass'],
  'Mercedes S-Class': ['s_class'],
  'Mercedes V-Class': ['mercedes_vclass'],
  's-class': ['s_class'],
  'v-class': ['mercedes_vclass'],
  
  // Common aliases
  'Mercedes Vito': ['mercedes-vito'],
  'Mercedes Vito VIP': ['mercedes-vito-vip', 'vip-mercedes'],
  'VIP Vito': ['mercedes-vito-vip', 'vip-mercedes'],
  'V-Class': ['mercedes_vclass', 'mercedes-vito-vip', 'vip-mercedes'],
  'Mercedes Sprinter': ['mercedes-sprinter', 'minibus'],
  'Mercedes Sprinter VIP': ['mercedes-sprinter', 'minibus'],
  'Mercedes Maybach': ['mercedes-maybach', 'maybach-minibus'],
  'Maybach Minivan': ['mercedes-maybach', 'maybach-minibus'],
  'VIP': ['mercedes-vito-vip', 'vip-mercedes'],
  'Minivan': ['mercedes-vito'],
  'Minibus': ['mercedes-sprinter', 'minibus'],
  'Sedan': ['sedan', 'mercedes-vito'],
  // Dubai aliases
  'Private Sedan': ['dubai-private-sedan', 'sedan'],
  'V Class': ['dubai-v-class', 'mercedes-vito'],
  'Premium Van': ['dubai-premium-van', 'mercedes-vito'],
  'Suburban SUV': ['dubai-suburban-suv', 'mercedes-vito'],
  'VIP Sprinter': ['dubai-vip-sprinter', 'minibus'],
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
