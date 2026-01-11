// Centralized vehicle types configuration
// Used by Hero.tsx, AdminRegionPrices.tsx, QuickBookingConfirm.tsx, and edge functions

import vitoAirportAnime from "@/assets/vito-airport-anime.jpg";
import vitoAirportWelcome from "@/assets/vito-airport-welcome.jpg";
import vitoCappadociaBalloon from "@/assets/vito-cappadocia-balloon.jpg";
import vitoFamilyInterior from "@/assets/vito-family-interior.jpg";
import vitoInteriorLeather from "@/assets/vito-interior-leather.jpg";
import vitoExteriorBlack from "@/assets/vito-exterior-black.jpg";
import vitoPassengerOrange from "@/assets/vito-passenger-orange.jpg";
import vitoExteriorOpendoor from "@/assets/vito-exterior-opendoor.jpg";
import vitoPassengerNight from "@/assets/vito-passenger-night.jpg";
import vitoPassengerCouple from "@/assets/vito-passenger-couple.jpg";
import vitoVipPassengers1 from "@/assets/vito-vip-passengers-1.jpg";
import vitoVipPassengers2 from "@/assets/vito-vip-passengers-2.jpg";
import vitoVipStarlightPurple from "@/assets/vito-vip-starlight-purple.jpg";
import vitoVipStarlightRoof from "@/assets/vito-vip-starlight-roof.jpg";
import vitoVipLuxuryWhite from "@/assets/vito-vip-luxury-white.jpg";
import vitoVipCoupleStarlight from "@/assets/vito-vip-couple-starlight.jpg";
import vitoVipPassengersDay from "@/assets/vito-vip-passengers-day.jpg";
import maybachInterior from "@/assets/maybach-interior-starlight.jpg";
import maybachPassengersBlue from "@/assets/maybach-passengers-blue.jpg";
import maybachInteriorPurple from "@/assets/maybach-interior-purple.jpg";
import maybachInteriorOrange from "@/assets/maybach-interior-orange.jpg";
import sprinterLuggage from "@/assets/sprinter-luggage.jpg";
import sprinterExteriorVip from "@/assets/sprinter-exterior-vip.jpg";
import sprinterAirportFront from "@/assets/sprinter-airport-front.jpg";
import sprinterInteriorGrey from "@/assets/sprinter-interior-grey.jpg";
import sprinterInteriorTv from "@/assets/sprinter-interior-tv.jpg";
import sprinterInteriorRed from "@/assets/sprinter-interior-red.jpg";
import sprinterInteriorStarlight from "@/assets/sprinter-interior-starlight.jpg";
import sprinterInteriorBlue from "@/assets/sprinter-interior-blue.jpg";
import sprinterExteriorDark from "@/assets/sprinter-exterior-dark.jpg";
import sprinterInteriorNeon from "@/assets/sprinter-interior-neon.jpg";
import sprinterAirportNight from "@/assets/sprinter-airport-night.jpg";
import meetTransferCyprus from "@/assets/meet-transfer-cyprus.png";
import meetTransferDubai from "@/assets/meet-transfer-dubai.png";

// New premium images
import vitoAirportPremium from "@/assets/vito-airport-premium.jpg";
import vitoLuxuryInterior from "@/assets/vito-luxury-interior.jpg";
import vipVitoStarlightLuxury from "@/assets/vip-vito-starlight-luxury.jpg";
import maybachUltraLuxury from "@/assets/maybach-ultra-luxury.jpg";
import sprinterHotelArrival from "@/assets/sprinter-hotel-arrival.jpg";
import sprinterVipInterior from "@/assets/sprinter-vip-interior.jpg";

// Meet Transfer service images
import meetTransferFamilyWelcome from "@/assets/meet-transfer-family-welcome.jpg";
import bodrumAirportPassengers from "@/assets/bodrum-airport-passengers.jpg";
import meetTransferFamilyGreeting from "@/assets/meet-transfer-family-greeting.jpg";
import bodrumAirportCartoon from "@/assets/bodrum-airport-cartoon.jpg";
import meetTransferHandshake from "@/assets/meet-transfer-handshake.jpg";

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
    value: 'mercedes-vito',
    label: 'Mercedes Vito',
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
    images: [
      { src: vitoAirportPremium, alt: "Mercedes Vito VIP airport transfer with professional chauffeur" },
      { src: vitoLuxuryInterior, alt: "Mercedes Vito luxury white leather interior passengers" },
      { src: vitoAirportAnime, alt: "Mercedes Vito private transfer at airport terminal" },
      { src: meetTransferFamilyWelcome, alt: "Meet Transfer airport family welcome service" },
      { src: vitoAirportWelcome, alt: "Mercedes Vito airport pickup with welcome service" },
      { src: meetTransferCyprus, alt: "Meet Transfer VIP service in Cyprus" },
      { src: bodrumAirportPassengers, alt: "Bodrum Airport passengers with Meet Transfer" },
      { src: vitoCappadociaBalloon, alt: "Mercedes Vito transfer to Cappadocia hot air balloons" },
      { src: vitoFamilyInterior, alt: "Mercedes Vito spacious family interior with leather seats" },
      { src: meetTransferHandshake, alt: "Meet Transfer professional greeting handshake" },
      { src: vitoInteriorLeather, alt: "Mercedes Vito premium leather interior detail" },
      { src: meetTransferDubai, alt: "Meet Transfer luxury service in Dubai" },
      { src: bodrumAirportCartoon, alt: "Bodrum Airport Meet Transfer family illustration" },
      { src: vitoExteriorBlack, alt: "Mercedes Vito black exterior professional transfer" },
      { src: meetTransferFamilyGreeting, alt: "Meet Transfer family greeting at airport" },
      { src: vitoPassengerOrange, alt: "Mercedes Vito passengers enjoying comfortable ride" },
      { src: vitoExteriorOpendoor, alt: "Mercedes Vito with open door welcoming passengers" },
      { src: vitoPassengerNight, alt: "Mercedes Vito night transfer service with ambient lighting" },
      { src: vitoPassengerCouple, alt: "Mercedes Vito romantic transfer for couples" },
    ],
  },
  {
    value: 'vip-mercedes',
    label: 'VIP Mercedes',
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
    images: [
      { src: vipVitoStarlightLuxury, alt: "Mercedes VIP Vito couple champagne starlight ceiling luxury" },
      { src: meetTransferHandshake, alt: "Meet Transfer professional VIP greeting" },
      { src: vitoVipStarlightPurple, alt: "Mercedes VIP Vito purple starlight roof interior" },
      { src: meetTransferDubai, alt: "Meet Transfer VIP service in Dubai UAE" },
      { src: vitoVipStarlightRoof, alt: "Mercedes VIP Vito starlight ceiling ambient lighting" },
      { src: bodrumAirportPassengers, alt: "VIP passengers at Bodrum Airport Meet Transfer" },
      { src: vitoVipPassengers1, alt: "VIP passengers enjoying Mercedes Vito luxury transfer" },
      { src: vitoVipLuxuryWhite, alt: "Mercedes VIP Vito white leather luxury interior" },
      { src: meetTransferFamilyWelcome, alt: "Meet Transfer VIP family welcome service" },
      { src: meetTransferCyprus, alt: "Meet Transfer VIP chauffeur service Cyprus" },
      { src: vitoVipCoupleStarlight, alt: "Couple enjoying Mercedes VIP Vito starlight transfer" },
      { src: vitoVipPassengers2, alt: "Business travelers in Mercedes VIP Vito" },
      { src: vitoVipPassengersDay, alt: "Mercedes VIP Vito daytime luxury transfer service" },
    ],
  },
  {
    value: 'maybach-minibus',
    label: 'Maybach Minivan',
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
    images: [
      { src: maybachUltraLuxury, alt: "Mercedes Maybach ultra luxury orange leather galaxy starlight ceiling" },
      { src: meetTransferHandshake, alt: "Meet Transfer Maybach VIP greeting service" },
      { src: maybachInterior, alt: "Mercedes Maybach starlight ceiling luxury interior" },
      { src: maybachPassengersBlue, alt: "VIP passengers in Mercedes Maybach blue ambient lighting" },
      { src: meetTransferFamilyWelcome, alt: "Meet Transfer Maybach family welcome" },
      { src: maybachInteriorPurple, alt: "Mercedes Maybach purple starlight ceiling with TV entertainment" },
      { src: maybachInteriorOrange, alt: "Mercedes Maybach orange leather interior with starlight roof" },
    ],
  },
  {
    value: 'minibus',
    label: 'Mercedes Sprinter',
    passengers: 16,
    luggage: 16,
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
    images: [
      { src: sprinterHotelArrival, alt: "Mercedes Sprinter VIP red carpet hotel arrival luxury" },
      { src: bodrumAirportPassengers, alt: "Bodrum Airport group transfer with Meet Transfer" },
      { src: sprinterVipInterior, alt: "Mercedes Sprinter VIP blue starlight interior seats" },
      { src: sprinterExteriorVip, alt: "Mercedes Sprinter VIP exterior luxury design" },
      { src: meetTransferFamilyWelcome, alt: "Meet Transfer Sprinter group family welcome" },
      { src: sprinterInteriorGrey, alt: "Mercedes Sprinter grey leather interior design" },
      { src: meetTransferDubai, alt: "Meet Transfer Sprinter minibus Dubai" },
      { src: bodrumAirportCartoon, alt: "Meet Transfer Bodrum Airport family illustration" },
      { src: sprinterInteriorTv, alt: "Mercedes Sprinter entertainment TV system" },
      { src: sprinterLuggage, alt: "Mercedes Sprinter large luggage capacity for groups" },
      { src: meetTransferHandshake, alt: "Meet Transfer professional Sprinter greeting" },
      { src: sprinterInteriorRed, alt: "Mercedes Sprinter red ambient lighting interior" },
      { src: sprinterInteriorStarlight, alt: "Mercedes Sprinter starlight ceiling luxury" },
      { src: meetTransferCyprus, alt: "Meet Transfer Sprinter minibus Cyprus" },
      { src: meetTransferFamilyGreeting, alt: "Meet Transfer Sprinter family greeting" },
      { src: sprinterInteriorBlue, alt: "Mercedes Sprinter blue LED interior lighting" },
      { src: sprinterExteriorDark, alt: "Mercedes Sprinter black exterior professional service" },
      { src: sprinterAirportFront, alt: "Mercedes Sprinter airport transfer front view" },
      { src: sprinterInteriorNeon, alt: "Mercedes Sprinter neon interior party atmosphere" },
      { src: sprinterAirportNight, alt: "Mercedes Sprinter night airport transfer service" },
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
