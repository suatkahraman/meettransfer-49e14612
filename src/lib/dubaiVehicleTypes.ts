// Dubai-specific vehicle types configuration
// These vehicles are shown ONLY when Dubai is detected as the transfer location

import dubaiStandardSedan from "@/assets/dubai/dubai-standard-sedan.jpg";
import dubaiStandardSedanInterior from "@/assets/dubai/dubai-standard-sedan-interior.jpg";
import dubaiSuburban from "@/assets/dubai/dubai-suburban.jpg";
import dubaiSuburbanInterior from "@/assets/dubai/dubai-suburban-interior.jpg";
import dubaiVipMercedesVan from "@/assets/dubai/dubai-vip-mercedes-van.jpg";
import dubaiVipVanExterior from "@/assets/dubai/dubai-vip-van-exterior.jpg";
import dubaiVClass from "@/assets/dubai/dubai-v-class.jpg";
import dubaiVClassInterior from "@/assets/dubai/dubai-v-class-interior.jpg";

import type { VehicleTypeInfo } from './vehicleTypes';

// Dubai-specific vehicle types
export const DUBAI_VEHICLE_TYPES: VehicleTypeInfo[] = [
  {
    value: 'dubai-private-sedan',
    label: 'Private Standard Sedan',
    passengers: 3,
    luggage: 2,
    description: 'Elegant private sedan for solo travelers or couples. Perfect for executive business meetings and intimate airport transfers in Dubai with professional chauffeur.',
    descriptionTr: 'Tek yolcular veya çiftler için zarif özel sedan. Dubai\'de iş toplantıları ve profesyonel şoförle havalimanı transferleri için mükemmel.',
    features: [
      { icon: 'snowflake', label: 'Climate Control', labelTr: 'Klima Kontrolü' },
      { icon: 'armchair', label: 'Premium Leather', labelTr: 'Premium Deri' },
      { icon: 'wifi', label: 'Free WiFi', labelTr: 'Ücretsiz WiFi' },
      { icon: 'battery-charging', label: 'USB Charging', labelTr: 'USB Şarj' },
      { icon: 'droplets', label: 'Bottled Water', labelTr: 'Su İkramı' },
    ],
    images: [
      { src: dubaiStandardSedan, alt: "Standard sedan Toyota Camry Dubai airport transfer" },
      { src: dubaiStandardSedanInterior, alt: "Standard sedan clean interior Dubai transfer service" },
    ],
  },
  {
    value: 'dubai-premium-van',
    label: 'Mercedes Premium Van',
    passengers: 6,
    luggage: 6,
    description: 'Premium Mercedes van for families and groups. Spacious interior with luxury amenities for comfortable Dubai airport transfers.',
    descriptionTr: 'Aileler ve gruplar için premium Mercedes van. Dubai havalimanı transferleri için lüks donanımlarla geniş iç mekan.',
    features: [
      { icon: 'snowflake', label: 'Dual-Zone Climate', labelTr: 'Çift Bölgeli Klima' },
      { icon: 'armchair', label: 'Leather Captain Seats', labelTr: 'Deri Kaptan Koltuk' },
      { icon: 'wifi', label: 'High-Speed WiFi', labelTr: 'Yüksek Hızlı WiFi' },
      { icon: 'battery-charging', label: 'USB Charging', labelTr: 'USB Şarj' },
      { icon: 'luggage', label: 'Extra Luggage Space', labelTr: 'Ekstra Bagaj Alanı' },
      { icon: 'droplets', label: 'Refreshments', labelTr: 'İkramlar' },
    ],
    images: [
      { src: dubaiVClass, alt: "Mercedes Premium Van luxury Dubai airport transfer with Burj Al Arab" },
      { src: dubaiVClassInterior, alt: "Mercedes Premium Van leather interior with ambient lighting" },
    ],
  },
  {
    value: 'dubai-suburban-suv',
    label: 'Mercedes Suburban SUV',
    passengers: 6,
    luggage: 6,
    description: 'Spacious luxury SUV for families and groups. Perfect for Dubai airport transfers with ample luggage space and premium comfort.',
    descriptionTr: 'Aileler ve gruplar için geniş lüks SUV. Bol bagaj alanı ve premium konforla Dubai havalimanı transferleri için ideal.',
    features: [
      { icon: 'snowflake', label: 'Dual-Zone Climate', labelTr: 'Çift Bölgeli Klima' },
      { icon: 'armchair', label: 'Leather Captain Seats', labelTr: 'Deri Kaptan Koltuk' },
      { icon: 'wifi', label: 'High-Speed WiFi', labelTr: 'Yüksek Hızlı WiFi' },
      { icon: 'battery-charging', label: 'USB Charging', labelTr: 'USB Şarj' },
      { icon: 'luggage', label: 'Extra Luggage Space', labelTr: 'Ekstra Bagaj Alanı' },
      { icon: 'droplets', label: 'Refreshments', labelTr: 'İkramlar' },
    ],
    images: [
      { src: dubaiSuburban, alt: "Mercedes Suburban SUV luxury Dubai airport transfer with Burj Al Arab" },
      { src: dubaiSuburbanInterior, alt: "Mercedes Suburban premium black leather interior with ambient lighting" },
    ],
  },
  {
    value: 'dubai-vip-sprinter',
    label: 'VIP Mercedes Sprinter',
    passengers: 12,
    luggage: 12,
    description: 'Ultimate VIP Sprinter with starlight ceiling and luxurious interior. The pinnacle of luxury for VIP group transfers in Dubai with professional chauffeur service.',
    descriptionTr: 'Yıldızlı tavan ve lüks iç mekanla ultimate VIP Sprinter. Profesyonel şoför hizmeti ile Dubai\'de VIP grup transferleri için lüksün zirvesi.',
    features: [
      { icon: 'snowflake', label: 'Climate Control', labelTr: 'Klima Kontrolü' },
      { icon: 'armchair', label: 'VIP Leather Seats', labelTr: 'VIP Deri Koltuk' },
      { icon: 'stars', label: 'Starlight Ceiling', labelTr: 'Yıldızlı Tavan' },
      { icon: 'wifi', label: 'Premium WiFi', labelTr: 'Premium WiFi' },
      { icon: 'battery-charging', label: 'Wireless Charging', labelTr: 'Kablosuz Şarj' },
      { icon: 'sparkles', label: 'Ambient Lighting', labelTr: 'Ambiyans Aydınlatma' },
      { icon: 'wine', label: 'VIP Refreshments', labelTr: 'VIP İkramlar' },
    ],
    images: [
      { src: dubaiVipMercedesVan, alt: "VIP Mercedes Sprinter starlight ceiling Dubai Marina skyline" },
      { src: dubaiVipVanExterior, alt: "Mercedes VIP Sprinter exterior Dubai airport professional chauffeur" },
    ],
  },
];

// Simple value-label pairs for select dropdowns
export const DUBAI_VEHICLE_TYPE_OPTIONS = DUBAI_VEHICLE_TYPES.map(v => ({
  value: v.value,
  label: v.label,
}));

// Map for quick lookup
export const DUBAI_VEHICLE_TYPE_MAP = Object.fromEntries(
  DUBAI_VEHICLE_TYPES.map(v => [v.value, v])
);

// Vehicle labels for display
export const DUBAI_VEHICLE_LABELS: Record<string, string> = Object.fromEntries(
  DUBAI_VEHICLE_TYPES.map(v => [v.value, v.label])
);

// Get Dubai vehicle info by value
export function getDubaiVehicleInfo(value: string) {
  return DUBAI_VEHICLE_TYPE_MAP[value];
}

// Check if a location is in Dubai
export function isDubaiLocation(location: string): boolean {
  if (!location) return false;
  const normalizedLocation = location.toLowerCase();
  
  const dubaiKeywords = [
    'dubai',
    'دبي', // Arabic for Dubai
    'burj khalifa',
    'palm jumeirah',
    'dubai mall',
    'dubai marina',
    'dxb', // Dubai airport code
    'dubai international',
    'al maktoum',
    'dwc', // Al Maktoum airport code
    'jebel ali',
    'jumeirah',
    'downtown dubai',
    'business bay',
    'deira',
    'bur dubai',
    'sheikh zayed',
    'emirates hills',
    'arabian ranches',
    'jbr',
    'jumeirah beach',
  ];
  
  return dubaiKeywords.some(keyword => normalizedLocation.includes(keyword));
}
