// Centralized vehicle types configuration
// Used by Hero.tsx, AdminRegionPrices.tsx, QuickBookingConfirm.tsx, and edge functions

// ========== SEDAN IMAGES - Only sedan vehicles (Toyota Corolla, Renault Megane) ==========
import futuristicSedan1 from "@/assets/vehicles/futuristic-sedan-1.svg";
import futuristicSedan2 from "@/assets/vehicles/futuristic-sedan-2.svg";
import futuristicSedan3 from "@/assets/vehicles/futuristic-sedan-3.svg";
import futuristicSedan4 from "@/assets/vehicles/futuristic-sedan-4.svg";
import futuristicSedan5 from "@/assets/vehicles/futuristic-sedan-5.svg";

// ========== MERCEDES VITO IMAGES - Only Vito vehicles ==========
import futuristicVito1 from "@/assets/vehicles/futuristic-vito-1.svg";
import futuristicVito2 from "@/assets/vehicles/futuristic-vito-2.svg";
import futuristicVito3 from "@/assets/vehicles/futuristic-vito-3.svg";
import futuristicVito4 from "@/assets/vehicles/futuristic-vito-4.svg";
import futuristicVito5 from "@/assets/vehicles/futuristic-vito-5.svg";

// ========== VIP MERCEDES IMAGES - Only VIP Vito vehicles ==========
import futuristicVipVito1 from "@/assets/vehicles/futuristic-vip-vito-1.svg";
import futuristicVipVito2 from "@/assets/vehicles/futuristic-vip-vito-2.svg";
import futuristicVipVito3 from "@/assets/vehicles/futuristic-vip-vito-3.svg";
import futuristicVipVito4 from "@/assets/vehicles/futuristic-vip-vito-4.svg";
import futuristicVipVito5 from "@/assets/vehicles/futuristic-vip-vito-5.svg";

// ========== MAYBACH MINIVAN IMAGES - Only Maybach vehicles ==========
import futuristicMaybach1 from "@/assets/vehicles/futuristic-maybach-1.svg";
import futuristicMaybach2 from "@/assets/vehicles/futuristic-maybach-2.svg";
import futuristicMaybach3 from "@/assets/vehicles/futuristic-maybach-3.svg";
import futuristicMaybach4 from "@/assets/vehicles/futuristic-maybach-4.svg";
import futuristicMaybach5 from "@/assets/vehicles/futuristic-maybach-5.svg";

// ========== SPRINTER MINIBUS IMAGES - Only Sprinter vehicles ==========
import futuristicSprinter1 from "@/assets/vehicles/futuristic-sprinter-1.svg";
import futuristicSprinter2 from "@/assets/vehicles/futuristic-sprinter-2.svg";
import futuristicSprinter3 from "@/assets/vehicles/futuristic-sprinter-3.svg";
import futuristicSprinter4 from "@/assets/vehicles/futuristic-sprinter-4.svg";
import futuristicSprinter5 from "@/assets/vehicles/futuristic-sprinter-5.svg";

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
      { src: futuristicSedan1, alt: "Black Standard Sedan Exterior Side View" },
      { src: futuristicSedan2, alt: "Black Standard Sedan Interior" },
      { src: futuristicSedan3, alt: "Black Standard Sedan Front View" },
      { src: futuristicSedan4, alt: "Black Standard Sedan Rear Interior" },
      { src: futuristicSedan5, alt: "Black Standard Sedan Rear View" },
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
      { src: futuristicVito1, alt: "Black Mercedes Vito Exterior Side View" },
      { src: futuristicVito2, alt: "Black Mercedes Vito Interior" },
      { src: futuristicVito3, alt: "Black Mercedes Vito Front View" },
      { src: futuristicVito4, alt: "Black Mercedes Vito Rear Interior" },
      { src: futuristicVito5, alt: "Black Mercedes Vito Rear Exterior View" },
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
      { src: futuristicVipVito1, alt: "Black VIP Mercedes Vito Exterior" },
      { src: futuristicVipVito2, alt: "Black VIP Mercedes Vito Ultra Luxury Interior" },
      { src: futuristicVipVito3, alt: "Black VIP Mercedes Vito Front View" },
      { src: futuristicVipVito4, alt: "Black VIP Mercedes Vito Rear Interior with TV" },
      { src: futuristicVipVito5, alt: "Black VIP Mercedes Vito Rear Exterior" },
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
      { src: futuristicMaybach1, alt: "Black Mercedes Maybach Exterior Side View" },
      { src: futuristicMaybach2, alt: "Black Mercedes Maybach First Class Interior" },
      { src: futuristicMaybach3, alt: "Black Mercedes Maybach Front View" },
      { src: futuristicMaybach4, alt: "Black Mercedes Maybach Rear Interior with Screens" },
      { src: futuristicMaybach5, alt: "Black Mercedes Maybach Rear Exterior" },
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
      { src: futuristicSprinter1, alt: "Black Mercedes Sprinter Exterior Side View" },
      { src: futuristicSprinter2, alt: "Black Mercedes Sprinter Ultra Luxury Interior" },
      { src: futuristicSprinter3, alt: "Black Mercedes Sprinter Front View" },
      { src: futuristicSprinter4, alt: "Black Mercedes Sprinter Rear Interior View" },
      { src: futuristicSprinter5, alt: "Black Mercedes Sprinter Rear Exterior View" },
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
