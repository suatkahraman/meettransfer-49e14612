// Centralized vehicle types configuration
// Used by Hero.tsx, AdminRegionPrices.tsx, QuickBookingConfirm.tsx, and edge functions

// ========== SEDAN IMAGES - Only sedan vehicles (Toyota Corolla, Renault Megane) ==========
import sedanHero from "@/assets/vehicles/sedan-hero.webp";
import sedanInterior from "@/assets/vehicles/sedan-interior-premium.webp";
import sedanExterior from "@/assets/vehicles/sedan-standard-exterior.webp";
import sedanRear from "@/assets/vehicles/sedan-standard-interior.webp";
import sedanAirport from "@/assets/vehicles/sedan-airport.webp";

// ========== MERCEDES VITO IMAGES - Only Vito vehicles ==========
import vitoHero from "@/assets/vehicles/vito-hero.webp";
import vitoInterior from "@/assets/vehicles/vito-interior.webp";
import vitoExterior from "@/assets/vehicles/vito-exterior.webp";
import vitoRear from "@/assets/vehicles/vito-premium-interior.webp";
import vitoPremium from "@/assets/vehicles/vito-premium-exterior.webp";

// ========== VIP MERCEDES IMAGES - Only VIP Vito vehicles ==========
import vipVitoHero from "@/assets/vehicles/vito-vip-hero.webp";
import vipVitoInterior from "@/assets/vehicles/vip-mercedes-interior.webp";
import vipVitoExterior from "@/assets/vehicles/vip-mercedes-exterior.webp";
import vipVitoStarlight from "@/assets/vehicles/vip-vito-starlight.webp";
import vipVitoNight from "@/assets/vehicles/vip-vito-night.jpg";

// ========== MAYBACH MINIVAN IMAGES - Only Maybach vehicles ==========
import maybachHero from "@/assets/vehicles/maybach-hero.webp";
import maybachInterior from "@/assets/vehicles/maybach-interior-luxury.webp";
import maybachExterior from "@/assets/vehicles/maybach-minivan-exterior.webp";
import maybachRear from "@/assets/vehicles/maybach-interior-rear.webp";
import maybachStarlight from "@/assets/vehicles/maybach-starlight.jpg";

// ========== SPRINTER MINIBUS IMAGES - Only Sprinter vehicles ==========
import sprinterHero from "@/assets/vehicles/sprinter-hero.webp";
import sprinterInterior from "@/assets/vehicles/sprinter-interior.webp";
import sprinterExterior from "@/assets/vehicles/sprinter-exterior.webp";
import sprinterRear from "@/assets/vehicles/sprinter-arrival.webp";
import sprinterDark from "@/assets/vehicles/sprinter-dark.jpg";

export interface VehicleImage {
  src: string;
  alt: string;
}

export interface VehicleFeature {
  icon: string;
  label: string;
  labelTr: string;
}

export interface VehicleTypeInfo {
  value: string;
  label: string;
  labelTranslations?: Record<string, string>; // Multi-language labels
  passengers: number;
  luggage: number;
  images: VehicleImage[];
  features: VehicleFeature[];
  description: string;
  descriptionTr: string;
}

// Central vehicle type configuration - SYNC WITH edge functions _shared/vehicleConfig.ts
export const VEHICLE_TYPES: VehicleTypeInfo[] = [
  {
    value: 'sedan',
    label: 'Standart Sedan',
    labelTranslations: {
      en: 'Standard Sedan',
      tr: 'Standart Sedan',
      de: 'Standard Limousine',
      fr: 'Berline Standard',
      ru: 'Стандартный Седан',
      it: 'Berlina Standard',
      es: 'Sedán Estándar',
      ar: 'سيدان قياسي',
      uk: 'Стандартний Седан',
      ja: 'スタンダードセダン',
      pt: 'Sedan Padrão',
    },
    passengers: 3,
    luggage: 2,
    description: 'Elegant sedan for solo travelers or couples. Perfect for business meetings and intimate airport transfers with professional chauffeur.',
    descriptionTr: 'Tek yolcular veya çiftler için zarif sedan. İş toplantıları ve profesyonel şoförle samimi havalimanı transferleri için mükemmel.',
    features: [
      { icon: 'snowflake', label: 'Air Conditioning', labelTr: 'Klima' },
      { icon: 'armchair', label: 'Leather Seats', labelTr: 'Deri Koltuk' },
      { icon: 'wifi', label: 'Free WiFi', labelTr: 'Ücretsiz WiFi' },
      { icon: 'battery-charging', label: 'USB Charging', labelTr: 'USB Şarj' },
      { icon: 'droplets', label: 'Bottled Water', labelTr: 'Su İkramı' },
    ],
    // SEDAN ONLY IMAGES - Renault Megane, Toyota Corolla - NO Mercedes, NO Vito, NO Maybach, NO Sprinter
    images: [
      { src: sedanHero, alt: "Black Standard Sedan Exterior Side View" },
      { src: sedanInterior, alt: "Black Standard Sedan Interior" },
      { src: sedanExterior, alt: "Black Standard Sedan Front View" },
      { src: sedanRear, alt: "Black Standard Sedan Rear Interior" },
      { src: sedanAirport, alt: "Black Standard Sedan Rear View" },
    ],
  },
  {
    value: 'mercedes-vito',
    label: 'Mercedes Vito or Similar',
    labelTranslations: {
      en: 'Mercedes Vito or Similar',
      tr: 'Mercedes Vito veya Benzeri',
      de: 'Mercedes Vito oder Ähnlich',
      fr: 'Mercedes Vito ou Similaire',
      ru: 'Mercedes Vito или Аналог',
      it: 'Mercedes Vito o Simile',
      es: 'Mercedes Vito o Similar',
      ar: 'مرسيدس فيتو أو ما شابه',
      uk: 'Mercedes Vito або Аналог',
      ja: 'Mercedes Vitoまたは同等',
      pt: 'Mercedes Vito ou Similar',
    },
    passengers: 6,
    luggage: 6,
    description: 'Comfortable family minivan with spacious interior, perfect for airport transfers and city tours. Professional chauffeur service with meet & greet.',
    descriptionTr: 'Konforlu aile minivan, geniş iç mekan, havalimanı transferleri ve şehir turları için ideal. Karşılama hizmeti dahil profesyonel şoför.',
    features: [
      { icon: 'snowflake', label: 'Air Conditioning', labelTr: 'Klima' },
      { icon: 'armchair', label: 'Leather Seats', labelTr: 'Deri Koltuk' },
      { icon: 'wifi', label: 'Free WiFi', labelTr: 'Ücretsiz WiFi' },
      { icon: 'battery-charging', label: 'USB Charging', labelTr: 'USB Şarj' },
      { icon: 'droplets', label: 'Bottled Water', labelTr: 'Su İkramı' },
      { icon: 'luggage', label: 'Large Luggage Space', labelTr: 'Geniş Bagaj Alanı' },
    ],
    // MERCEDES VITO ONLY IMAGES - BLACK Vito only, NO grey, NO Sedan, NO Maybach, NO Sprinter, NO VIP Vito starlight
    images: [
      { src: vitoHero, alt: "Black Mercedes Vito Exterior Side View" },
      { src: vitoInterior, alt: "Black Mercedes Vito Interior" },
      { src: vitoExterior, alt: "Black Mercedes Vito Front View" },
      { src: vitoRear, alt: "Black Mercedes Vito Rear Interior" },
      { src: vitoPremium, alt: "Black Mercedes Vito Rear Exterior View" },
    ],
  },
  {
    value: 'vip-mercedes',
    label: 'VIP Mercedes Vito',
    passengers: 5,
    luggage: 5,
    description: 'Premium VIP transfer with starlight ceiling, ambient lighting, and luxurious leather interior. Ultimate comfort for business and leisure travelers.',
    descriptionTr: 'Yıldızlı tavan, ambiyans aydınlatma ve lüks deri iç mekan ile premium VIP transfer. İş ve tatil yolculukları için üstün konfor.',
    features: [
      { icon: 'snowflake', label: 'Climate Control', labelTr: 'Klima Kontrolü' },
      { icon: 'armchair', label: 'Premium Leather', labelTr: 'Premium Deri' },
      { icon: 'stars', label: 'Starlight Ceiling', labelTr: 'Yıldızlı Tavan' },
      { icon: 'wifi', label: 'High-Speed WiFi', labelTr: 'Yüksek Hızlı WiFi' },
      { icon: 'battery-charging', label: 'USB & Wireless Charging', labelTr: 'USB & Kablosuz Şarj' },
      { icon: 'wine', label: 'Refreshments', labelTr: 'İkramlar' },
      { icon: 'sparkles', label: 'Ambient Lighting', labelTr: 'Ambiyans Aydınlatma' },
    ],
    // VIP MERCEDES VITO ONLY IMAGES - Starlight ceiling VIP Vito - NO Sedan, NO Maybach, NO Sprinter, NO regular Vito
    images: [
      { src: vipVitoHero, alt: "Black VIP Mercedes Vito Exterior" },
      { src: vipVitoInterior, alt: "Black VIP Mercedes Vito Ultra Luxury Interior" },
      { src: vipVitoExterior, alt: "Black VIP Mercedes Vito Front View" },
      { src: vipVitoStarlight, alt: "Black VIP Mercedes Vito Rear Interior with TV" },
      { src: vipVitoNight, alt: "Black VIP Mercedes Vito Rear Exterior" },
    ],
  },
  {
    value: 'maybach-minibus',
    label: 'Mercedes Maybach Minivan',
    passengers: 4,
    luggage: 4,
    description: 'Ultra-luxury Maybach class minivan with exclusive starlight roof, entertainment system, and first-class seating. The pinnacle of private transfers.',
    descriptionTr: 'Özel yıldızlı tavan, eğlence sistemi ve birinci sınıf koltuklar ile ultra lüks Maybach sınıfı minivan. Özel transferlerin zirvesi.',
    features: [
      { icon: 'snowflake', label: 'Dual-Zone Climate', labelTr: 'Çift Bölgeli Klima' },
      { icon: 'crown', label: 'First-Class Seats', labelTr: 'Birinci Sınıf Koltuk' },
      { icon: 'stars', label: 'Starlight Ceiling', labelTr: 'Yıldızlı Tavan' },
      { icon: 'tv', label: 'Entertainment System', labelTr: 'Eğlence Sistemi' },
      { icon: 'wifi', label: 'Premium WiFi', labelTr: 'Premium WiFi' },
      { icon: 'battery-charging', label: 'Wireless Charging', labelTr: 'Kablosuz Şarj' },
      { icon: 'champagne', label: 'Champagne Service', labelTr: 'Şampanya Servisi' },
      { icon: 'sparkles', label: 'RGB Ambient Lighting', labelTr: 'RGB Ambiyans' },
    ],
    // MAYBACH MINIVAN ONLY IMAGES - NO Sedan, NO Vito, NO VIP Vito, NO Sprinter
    images: [
      { src: maybachHero, alt: "Black Mercedes Maybach Exterior Side View" },
      { src: maybachInterior, alt: "Black Mercedes Maybach First Class Interior" },
      { src: maybachExterior, alt: "Black Mercedes Maybach Front View" },
      { src: maybachRear, alt: "Black Mercedes Maybach Rear Interior with Screens" },
      { src: maybachStarlight, alt: "Black Mercedes Maybach Rear Exterior" },
    ],
  },
  {
    value: 'minibus',
    label: 'Mercedes Sprinter or Similar',
    labelTranslations: {
      en: 'Mercedes Sprinter or Similar',
      tr: 'Mercedes Sprinter veya Benzeri',
      de: 'Mercedes Sprinter oder Ähnlich',
      fr: 'Mercedes Sprinter ou Similaire',
      ru: 'Mercedes Sprinter или Аналог',
      it: 'Mercedes Sprinter o Simile',
      es: 'Mercedes Sprinter o Similar',
      ar: 'مرسيدس سبرينتر أو ما شابه',
      uk: 'Mercedes Sprinter або Аналог',
      ja: 'Mercedes Sprinterまたは同等',
      pt: 'Mercedes Sprinter ou Similar',
    },
    passengers: 20,
    luggage: 20,
    description: 'Spacious VIP minibus perfect for large groups, corporate events, and airport transfers. Premium comfort with entertainment and ample luggage space.',
    descriptionTr: 'Büyük gruplar, kurumsal etkinlikler ve havalimanı transferleri için ideal geniş VIP minibüs. Eğlence sistemi ve bol bagaj alanı ile premium konfor.',
    features: [
      { icon: 'snowflake', label: 'Full Climate Control', labelTr: 'Tam Klima Kontrolü' },
      { icon: 'armchair', label: 'VIP Leather Seats', labelTr: 'VIP Deri Koltuk' },
      { icon: 'tv', label: 'LED TV Entertainment', labelTr: 'LED TV Eğlence' },
      { icon: 'wifi', label: 'High-Speed WiFi', labelTr: 'Yüksek Hızlı WiFi' },
      { icon: 'battery-charging', label: 'Multiple USB Ports', labelTr: 'Çoklu USB Port' },
      { icon: 'luggage', label: 'Extra Large Luggage', labelTr: 'Ekstra Geniş Bagaj' },
      { icon: 'sparkles', label: 'Starlight Ceiling', labelTr: 'Yıldızlı Tavan' },
      { icon: 'droplets', label: 'Refreshment Bar', labelTr: 'İkram Barı' },
    ],
    // SPRINTER MINIBUS ONLY IMAGES - NO Sedan, NO Vito, NO VIP Vito, NO Maybach
    images: [
      { src: sprinterHero, alt: "Black Mercedes Sprinter Exterior Side View" },
      { src: sprinterInterior, alt: "Black Mercedes Sprinter Ultra Luxury Interior" },
      { src: sprinterExterior, alt: "Black Mercedes Sprinter Front View" },
      { src: sprinterRear, alt: "Black Mercedes Sprinter Rear Interior View" },
      { src: sprinterDark, alt: "Black Mercedes Sprinter Rear Exterior View" },
    ],
  },
];

// Simple value-label pairs for select dropdowns
export const VEHICLE_TYPE_OPTIONS = VEHICLE_TYPES.map(v => ({
  value: v.value,
  label: v.label,
}));

// Map for quick lookup
export const VEHICLE_TYPE_MAP = Object.fromEntries(
  VEHICLE_TYPES.map(v => [v.value, v])
);

// Vehicle labels for display
export const VEHICLE_LABELS: Record<string, string> = Object.fromEntries(
  VEHICLE_TYPES.map(v => [v.value, v.label])
);

// Get vehicle info by value
export function getVehicleInfo(value: string): VehicleTypeInfo | undefined {
  return VEHICLE_TYPE_MAP[value];
}

// Get localized vehicle label
export function getLocalizedVehicleLabel(value: string, language: string = 'en'): string {
  const vehicle = VEHICLE_TYPE_MAP[value];
  if (!vehicle) return value;
  
  // Check if vehicle has translations and the language exists
  if (vehicle.labelTranslations && vehicle.labelTranslations[language]) {
    return vehicle.labelTranslations[language];
  }
  
  // Fallback to default label
  return vehicle.label;
}

// Get available vehicles based on passenger/luggage count
// For 7+ passengers or 7+ luggage, only minibus is available
export function getAvailableVehicles(passengerCount: number, luggageCount: number): VehicleTypeInfo[] {
  if (passengerCount >= 7 || luggageCount >= 7) {
    return VEHICLE_TYPES.filter(v => v.value === 'minibus');
  }
  return VEHICLE_TYPES;
}

// Check if minibus is required
export function isMinibusRequired(passengerCount: number, luggageCount: number): boolean {
  return passengerCount >= 7 || luggageCount >= 7;
}
