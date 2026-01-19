import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Car, Anchor, Mountain, Building2, Waves, Landmark, ArrowRight, Palmtree, Trees, Snowflake } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { PWAPromoBanner } from "@/components/website/PWAPromoBanner";

const DestinationsPage = () => {
  const { t, getLocalizedPath } = useLanguage();

  const destinations = [
    {
      id: 1,
      name: "Istanbul",
      airports: "IST & SAW",
      tagline: t("cityAirportTransfers"),
      icon: "✨",
      IconComponent: Building2,
      locations: ["Taksim", "Sultanahmet", "Beşiktaş", "Levent", "Galataport Cruise Port", "Bosphorus Hotels"],
      vehicles: "Mercedes Vito, V-Class, VIP Minibus",
      link: "/istanbul-airport-transfer",
      extraLinks: [
        { label: "Hotel Transfer", path: "/istanbul-airport-hotel-transfer" },
        { label: "VIP Transfer", path: "/ist-city-center-vip-transfer" },
        { label: "Sabiha Gökçen", path: "/sabiha-gokcen-private-transfer" },
      ],
    },
    {
      id: 2,
      name: "Antalya",
      airports: "AYT",
      tagline: t("resortDestinations"),
      icon: "🏝️",
      IconComponent: Waves,
      locations: ["Lara", "Kundu", "Belek", "Side", "Alanya", "Kaş", "Kemer", "Golf Hotels & Resorts"],
      vehicles: "Mercedes Vito, VIP Minibus",
      link: "/antalya-airport-transfer",
    },
    {
      id: 3,
      name: "Bodrum",
      airports: "BJV",
      tagline: t("luxuryMarinas"),
      icon: "⚓",
      IconComponent: Anchor,
      locations: ["Yalıkavak Marina", "Türkbükü", "Gündoğan", "Torba", "Bodrum City Center"],
      vehicles: "VIP V-Class & Minibus",
      link: "/bodrum-airport-transfer",
    },
    {
      id: 4,
      name: "Dalaman",
      airports: "DLM",
      tagline: t("coastalAreas"),
      icon: "🌊",
      IconComponent: Waves,
      locations: ["Fethiye", "Ölüdeniz", "Göcek", "Marmaris", "Yacht Marina Transfers", "Villa & Resort Transport"],
      vehicles: "VIP Mercedes Vito fleet",
      link: "/dalaman-airport-transfer",
    },
    {
      id: 5,
      name: "Izmir",
      airports: "ADB",
      tagline: t("aegeanCoast"),
      icon: "🏛️",
      IconComponent: Landmark,
      locations: ["Çeşme", "Alaçatı", "Ephesus", "Kuşadası", "Port & Hotel Transfers"],
      vehicles: t("luxuryService"),
      link: "/izmir-airport-transfer",
    },
    {
      id: 6,
      name: "Cappadocia",
      airports: "NAV & ASR",
      tagline: t("caveHotelsBalloon"),
      icon: "🎈",
      IconComponent: Mountain,
      locations: ["Göreme", "Ürgüp", "Avanos", "Uçhisar", "Airport Transfers"],
      vehicles: "VIP tour chauffeurs",
      link: "/cappadocia-airport-transfer",
    },
    {
      id: 7,
      name: "Dubai",
      airports: "DXB & DWC",
      tagline: t("luxuryCity"),
      icon: "🌆",
      IconComponent: Building2,
      locations: ["Downtown Dubai", "Palm Jumeirah", "Dubai Marina", "JBR Beach", "Business Bay", "Burj Khalifa"],
      vehicles: "Mercedes Vito, V-Class, Maybach",
      link: "/dubai-transfer",
    },
    {
      id: 8,
      name: "Cyprus",
      airports: "LCA, PFO & ECN",
      tagline: t("mediterraneanIsland"),
      icon: "🏖️",
      IconComponent: Palmtree,
      locations: ["Larnaca", "Paphos", "Ayia Napa", "Limassol", "Kyrenia", "Famagusta", "Nicosia"],
      vehicles: "Mercedes Vito VIP",
      link: "/cyprus-transfer",
    },
    {
      id: 9,
      name: "Bursa",
      airports: "IST & SAW",
      tagline: t("historicOttomanCapital"),
      icon: "🏔️",
      IconComponent: Mountain,
      locations: ["Bursa City", "Uludağ", "Cumalıkızık", "Grand Mosque", "Mudanya", "Iznik", "Thermal Springs"],
      vehicles: "Mercedes Vito VIP",
      link: "/bursa-transfer",
      extraLinks: [
        { label: "Day Tours", path: "/bursa-transfer#tours" },
      ],
    },
    {
      id: 10,
      name: "Frankfurt",
      airports: "FRA",
      tagline: t("europeanFinanceHub"),
      icon: "🏙️",
      IconComponent: Building2,
      locations: ["City Center", "Messe Frankfurt", "Financial District", "Main Tower", "Palmengarten", "Sachsenhausen"],
      vehicles: "Mercedes Vito, V-Class, Maybach",
      link: "/frankfurt-transfer",
    },
    {
      id: 11,
      name: "Greece",
      airports: "ATH, SKG, HER",
      tagline: t("ancientCivilization"),
      icon: "🇬🇷",
      IconComponent: Landmark,
      locations: ["Athens", "Piraeus Port", "Thessaloniki", "Crete", "Rhodes", "Santorini"],
      vehicles: "Mercedes Vito, V-Class VIP",
      link: "/greece-transfer",
    },
    {
      id: 12,
      name: "Adana",
      airports: "ADA",
      tagline: t("southernTurkeysGateway"),
      icon: "🌶️",
      IconComponent: Building2,
      locations: ["Adana City Center", "Seyhan", "Çukurova", "Mersin", "Tarsus", "Antakya"],
      vehicles: "Mercedes Vito VIP",
      link: "/adana-transfer",
    },
    {
      id: 13,
      name: "Switzerland",
      airports: "ZRH, GVA, BSL & MXP",
      tagline: t("alpineSkiResorts"),
      icon: "🇨🇭",
      IconComponent: Snowflake,
      locations: ["St. Moritz", "Zermatt", "Verbier", "Gstaad", "Davos", "Arosa", "Crans-Montana"],
      vehicles: "Mercedes S-Class, V-Class VIP",
      link: "/switzerland-transfer",
      extraLinks: [
        { label: "Ski Resort Guide", path: "/blog/switzerland-airport-transfer-guide" },
      ],
    },
  ];
  
  return (
    <WebsiteLayout>
      <SEOHead
        title="Airport Transfer Destinations | Turkey, Dubai, Cyprus, Germany, Switzerland VIP Transfers | Meet Transfer"
        description="Premium airport transfer service across Turkey, Dubai, Cyprus, Germany and Switzerland. VIP transfers from Istanbul, Antalya, Bodrum, Dubai, Larnaca, Paphos, Frankfurt, Zurich, Geneva airports. Swiss ski resort transfers. Mercedes fleet, 24/7 meet & greet service."
        keywords="airport transfer destinations, Turkey airport transfer, Istanbul transfer, Antalya transfer, Bodrum transfer, Dalaman transfer, Izmir transfer, Cappadocia transfer, Dubai airport transfer, Cyprus airport transfer, Larnaca airport transfer, Paphos airport transfer, Frankfurt airport transfer, Germany transfer, Switzerland airport transfer, Zurich airport transfer, Geneva airport transfer, St Moritz transfer, Zermatt transfer, ski resort transfer, VIP transfer, private chauffeur, Mercedes transfer"
        canonicalPath="/destinations"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Istanbul', 'Antalya', 'Bodrum', 'Dalaman', 'Izmir', 'Cappadocia', 'Dubai', 'Cyprus', 'Larnaca', 'Paphos', 'Bursa', 'Uludağ', 'Frankfurt', 'Germany', 'Athens', 'Greece', 'Thessaloniki', 'Switzerland', 'Zurich', 'Geneva', 'Basel', 'St. Moritz', 'Zermatt', 'Verbier', 'Davos'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Destinations', url: '/destinations' },
            ],
          },
          { type: 'LocalBusiness' },
        ]}
      />

      <PageHeader
        title={t("vipDestinationsWorldwide")}
        subtitle={t("premiumAirportTransfersGlobal")}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Main H1 */}
        <section className="text-center mb-10 md:mb-14">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("vipAirportTransferDestinations")}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("destinationsPageDescription")}
          </p>
        </section>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination) => {
            const IconComponent = destination.IconComponent;
            return (
              <Card 
                key={destination.id} 
                className="group overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-foreground">
                          {destination.icon} {destination.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{destination.tagline}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="font-medium">{destination.airports}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Locations */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      {t("keyLocations")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {destination.locations.slice(0, 5).map((location, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                        >
                          {location}
                        </span>
                      ))}
                      {destination.locations.length > 5 && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs">
                          +{destination.locations.length - 5} {t("more")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vehicles */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Car className="h-4 w-4 text-primary" />
                    <span>{destination.vehicles}</span>
                  </div>

                  {/* Extra Links for Istanbul */}
                  {'extraLinks' in destination && destination.extraLinks && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                      {destination.extraLinks.map((extraLink, idx) => (
                        <Link 
                          key={idx}
                          to={getLocalizedPath(extraLink.path)}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <ArrowRight className="h-3 w-3" />
                          {extraLink.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* View Details Button */}
                  <Button 
                    asChild 
                    className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    variant="outline"
                  >
                    <Link to={getLocalizedPath(destination.link)}>
                      {t("bookTransfer")} {destination.name} {t("transfer")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-12 md:mt-16 text-center bg-muted/50 rounded-2xl p-6 md:p-10">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
            {t("premiumVipFleet")}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            {t("premiumVipFleetDesc")}
          </p>
          <Button asChild size="lg">
            <Link to="/whatsapp-booking">
              {t("bookViaWhatsApp")}
            </Link>
          </Button>
        </div>

        {/* PWA Install Banner */}
        <PWAPromoBanner />
      </div>
    </WebsiteLayout>
  );
};

export default DestinationsPage;