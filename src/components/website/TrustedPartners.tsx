import { useLanguage } from "@/contexts/LanguageContext";

const partners = [
  { name: "Viator", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Viator_2022_logo.svg/200px-Viator_2022_logo.svg.png" },
  { name: "Booking.com", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Booking.com_logo.svg/200px-Booking.com_logo.svg.png" },
  { name: "TripAdvisor", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Tripadvisor_Logo_2020.svg/200px-Tripadvisor_Logo_2020.svg.png" },
  { name: "Trustpilot", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Trustpilot_Logo_%282022%29.svg/200px-Trustpilot_Logo_%282022%29.svg.png" },
  { name: "Expedia", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Expedia_2012_logo.svg/200px-Expedia_2012_logo.svg.png" },
  { name: "GetYourGuide", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/GetYourGuide_logo.svg/200px-GetYourGuide_logo.svg.png" },
  { name: "Klook", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Klook_logo.svg/200px-Klook_logo.svg.png" },
  { name: "Tiqets", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Tiqets_logo.svg/200px-Tiqets_logo.svg.png" },
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
                className="h-8 md:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100"
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
                className="h-8 md:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100"
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
