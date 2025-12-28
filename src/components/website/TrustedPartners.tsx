import { useLanguage } from "@/contexts/LanguageContext";

// Import partner logos
import viatorLogo from "@/assets/partners/viator-logo.png";
import bookingLogo from "@/assets/partners/booking-logo.png";
import tripadvisorLogo from "@/assets/partners/tripadvisor-logo.png";
import trustpilotLogo from "@/assets/partners/trustpilot-logo.png";
import expediaLogo from "@/assets/partners/expedia-logo.png";
import getyourguideLogo from "@/assets/partners/getyourguide-logo.svg";
import klookLogo from "@/assets/partners/klook-logo.png";
import tiqetsLogo from "@/assets/partners/tiqets-logo.png";
import aaaLogo from "@/assets/partners/aaa-logo.png";
import hotelsLogo from "@/assets/partners/hotels-logo.png";

const partners = [
  { name: "Viator", logo: viatorLogo },
  { name: "Booking.com", logo: bookingLogo },
  { name: "TripAdvisor", logo: tripadvisorLogo },
  { name: "Trustpilot", logo: trustpilotLogo },
  { name: "Expedia", logo: expediaLogo },
  { name: "GetYourGuide", logo: getyourguideLogo },
  { name: "Klook", logo: klookLogo },
  { name: "Tiqets", logo: tiqetsLogo },
  { name: "AAA Travel", logo: aaaLogo },
  { name: "Hotels.com", logo: hotelsLogo },
];

const TrustedPartners = () => {
  const { t } = useLanguage();

  return (
    <section className="py-12 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground">
          {t("trustedPartnersTitle") || "Some Of Our Trusted Partners"}
        </h2>
      </div>
      
      <div className="relative">
        {/* Gradient overlays for smooth fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling container */}
        <div className="flex animate-marquee">
          {/* First set of logos */}
          {partners.map((partner, index) => (
            <div
              key={`first-${index}`}
              className="flex-shrink-0 mx-6 md:mx-10 flex items-center justify-center"
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-10 md:h-14 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                loading="lazy"
              />
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {partners.map((partner, index) => (
            <div
              key={`second-${index}`}
              className="flex-shrink-0 mx-6 md:mx-10 flex items-center justify-center"
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-10 md:h-14 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedPartners;
