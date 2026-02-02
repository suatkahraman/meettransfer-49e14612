// Cyprus (KKTC) specific vehicle types configuration
// These vehicles are shown ONLY when Northern Cyprus/KKTC is detected as the transfer location

import type { VehicleTypeInfo } from './vehicleTypes';

// Cyprus-specific vehicle types - Mercedes Sedan and Mercedes Vito Similar
export const CYPRUS_VEHICLE_TYPES: VehicleTypeInfo[] = [
  {
    value: 'standard_sedan',
    label: 'Mercedes Sedan',
    passengers: 3,
    luggage: 3,
    description: 'Elegant Mercedes sedan for comfortable airport transfers. Perfect for couples or solo travelers visiting Northern Cyprus.',
    descriptionTr: 'Konforlu havalimanı transferleri için zarif Mercedes sedan. Kuzey Kıbrıs\'ı ziyaret eden çiftler veya tek yolcular için mükemmel.',
    features: [
      { icon: 'snowflake', label: 'Climate Control', labelTr: 'Klima Kontrolü' },
      { icon: 'armchair', label: 'Leather Seats', labelTr: 'Deri Koltuk' },
      { icon: 'wifi', label: 'Free WiFi', labelTr: 'Ücretsiz WiFi' },
      { icon: 'battery-charging', label: 'USB Charging', labelTr: 'USB Şarj' },
      { icon: 'droplets', label: 'Bottled Water', labelTr: 'Su İkramı' },
    ],
    images: [
      { src: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&auto=format&fit=crop', alt: 'Mercedes Sedan luxury Cyprus airport transfer' },
      { src: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop', alt: 'Mercedes Sedan interior leather Cyprus transfer' },
    ],
  },
  {
    value: 'minivan',
    label: 'Mercedes Vito Similar',
    passengers: 7,
    luggage: 7,
    description: 'Spacious Mercedes Vito or similar minivan for families and groups. Ideal for comfortable Northern Cyprus airport transfers with extra luggage space.',
    descriptionTr: 'Aileler ve gruplar için geniş Mercedes Vito veya benzer minivan. Ekstra bagaj alanıyla Kuzey Kıbrıs havalimanı transferleri için ideal.',
    features: [
      { icon: 'snowflake', label: 'Dual-Zone Climate', labelTr: 'Çift Bölgeli Klima' },
      { icon: 'armchair', label: 'Comfortable Seats', labelTr: 'Konforlu Koltuklar' },
      { icon: 'luggage', label: 'Extra Luggage Space', labelTr: 'Ekstra Bagaj Alanı' },
      { icon: 'battery-charging', label: 'USB Charging', labelTr: 'USB Şarj' },
      { icon: 'wifi', label: 'Free WiFi', labelTr: 'Ücretsiz WiFi' },
      { icon: 'droplets', label: 'Bottled Water', labelTr: 'Su İkramı' },
    ],
    images: [
      { src: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop', alt: 'Mercedes Vito minivan Cyprus airport transfer' },
      { src: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&auto=format&fit=crop', alt: 'Mercedes Vito interior spacious Cyprus group transfer' },
    ],
  },
];

// Simple value-label pairs for select dropdowns
export const CYPRUS_VEHICLE_TYPE_OPTIONS = CYPRUS_VEHICLE_TYPES.map(v => ({
  value: v.value,
  label: v.label,
}));

// Map for quick lookup
export const CYPRUS_VEHICLE_TYPE_MAP = Object.fromEntries(
  CYPRUS_VEHICLE_TYPES.map(v => [v.value, v])
);

// Vehicle labels for display
export const CYPRUS_VEHICLE_LABELS: Record<string, string> = Object.fromEntries(
  CYPRUS_VEHICLE_TYPES.map(v => [v.value, v.label])
);

// Get Cyprus vehicle info by value
export function getCyprusVehicleInfo(value: string) {
  return CYPRUS_VEHICLE_TYPE_MAP[value];
}
