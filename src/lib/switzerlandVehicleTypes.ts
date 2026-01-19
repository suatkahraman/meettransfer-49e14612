// Switzerland-specific vehicle types configuration
// These vehicles are shown ONLY when Switzerland is detected as the transfer location
// Pricing is flat-rate: same price for S-Class and V-Class

import type { VehicleTypeInfo } from './vehicleTypes';

// Switzerland-specific vehicle types - flat pricing across all vehicles
export const SWITZERLAND_VEHICLE_TYPES: VehicleTypeInfo[] = [
  {
    value: 's_class',
    label: 'Mercedes S-Class',
    passengers: 3,
    luggage: 3,
    description: 'The epitome of luxury sedan travel. Perfect for executives and VIP guests seeking the ultimate comfort on Swiss alpine roads.',
    descriptionTr: 'Lüks sedan seyahatinin zirvesi. İsviçre alp yollarında en yüksek konforu arayan yöneticiler ve VIP misafirler için mükemmel.',
    features: [
      { icon: 'snowflake', label: 'Climate Control', labelTr: 'Klima Kontrolü' },
      { icon: 'armchair', label: 'Heated Massage Seats', labelTr: 'Isıtmalı Masaj Koltukları' },
      { icon: 'music', label: 'Burmester Sound', labelTr: 'Burmester Ses Sistemi' },
      { icon: 'sparkles', label: 'Ambient Lighting', labelTr: 'Ambiyans Aydınlatma' },
      { icon: 'shield', label: 'Privacy Glass', labelTr: 'Gizlilik Camı' },
      { icon: 'wifi', label: 'Free WiFi', labelTr: 'Ücretsiz WiFi' },
    ],
    images: [
      { src: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&auto=format&fit=crop', alt: 'Mercedes S-Class luxury sedan Switzerland airport transfer' },
      { src: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop', alt: 'Mercedes S-Class interior premium leather Swiss Alps transfer' },
    ],
  },
  {
    value: 'mercedes_vclass',
    label: 'Mercedes V-Class',
    passengers: 7,
    luggage: 7,
    description: 'Spacious luxury MPV ideal for families and ski groups traveling to Swiss ski resorts with all their equipment.',
    descriptionTr: 'İsviçre kayak merkezlerine tüm ekipmanlarıyla seyahat eden aileler ve kayak grupları için ideal geniş lüks MPV.',
    features: [
      { icon: 'snowflake', label: 'Dual-Zone Climate', labelTr: 'Çift Bölgeli Klima' },
      { icon: 'armchair', label: 'Leather Captain Seats', labelTr: 'Deri Kaptan Koltukları' },
      { icon: 'luggage', label: 'Ski Equipment Storage', labelTr: 'Kayak Ekipmanı Alanı' },
      { icon: 'battery-charging', label: 'USB Chargers', labelTr: 'USB Şarj' },
      { icon: 'sun', label: 'Panoramic Roof', labelTr: 'Panoramik Tavan' },
      { icon: 'wifi', label: 'Free WiFi', labelTr: 'Ücretsiz WiFi' },
    ],
    images: [
      { src: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop', alt: 'Mercedes V-Class luxury MPV Swiss ski resort transfer' },
      { src: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&auto=format&fit=crop', alt: 'Mercedes V-Class interior spacious Swiss Alps group transfer' },
    ],
  },
];

// Simple value-label pairs for select dropdowns
export const SWITZERLAND_VEHICLE_TYPE_OPTIONS = SWITZERLAND_VEHICLE_TYPES.map(v => ({
  value: v.value,
  label: v.label,
}));

// Map for quick lookup
export const SWITZERLAND_VEHICLE_TYPE_MAP = Object.fromEntries(
  SWITZERLAND_VEHICLE_TYPES.map(v => [v.value, v])
);

// Vehicle labels for display
export const SWITZERLAND_VEHICLE_LABELS: Record<string, string> = Object.fromEntries(
  SWITZERLAND_VEHICLE_TYPES.map(v => [v.value, v.label])
);

// Get Switzerland vehicle info by value
export function getSwitzerlandVehicleInfo(value: string) {
  return SWITZERLAND_VEHICLE_TYPE_MAP[value];
}
