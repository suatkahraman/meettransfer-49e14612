import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { MapPin, Plane, Building, Anchor, CheckCircle2 } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/contact";
import athensCity from "@/assets/destinations/athens-city.jpg";

const GreeceTransfer = () => {
  const { t, getLocalizedPath } = useLanguage();

  const airports = [
    {
      code: "ATH",
      name: "Athens International Airport",
      city: "Athens",
      destinations: ["City Center", "Piraeus Port", "Glyfada", "Vouliagmeni", "Cape Sounion", "Delphi"],
    },
    {
      code: "SKG",
      name: "Thessaloniki Airport",
      city: "Thessaloniki",
      destinations: ["City Center", "Halkidiki", "Kavala", "Olympus", "Pella"],
    },
    {
      code: "HER",
      name: "Heraklion Airport",
      city: "Crete",
      destinations: ["Heraklion City", "Chania", "Rethymno", "Agios Nikolaos", "Elounda"],
    },
    {
      code: "RHO",
      name: "Rhodes Airport",
      city: "Rhodes",
      destinations: ["Rhodes City", "Lindos", "Faliraki", "Ixia", "Kallithea"],
    },
  ];

  const features = [
    t("greeceFeature1"),
    t("greeceFeature2"),
    t("greeceFeature3"),
    t("greeceFeature4"),
    t("greeceFeature5"),
    t("greeceFeature6"),
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("greeceSeoTitle")}
        description={t("greeceSeoDesc")}
        keywords="Greece airport transfer, Athens airport transfer, Thessaloniki transfer, Piraeus port transfer, Greece VIP transfer, Athens taxi, Greek islands transfer, Crete airport transfer, Rhodes airport transfer, Greece chauffeur service"
        canonicalPath="/greece-transfer"
        ogImage="https://meettransfer.app/og/greece-transfer-og.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Athens', 'Thessaloniki', 'Piraeus', 'Crete', 'Rhodes', 'Santorini', 'Mykonos'] },
          { type: 'LocalBusiness' },
          {
            type: 'BreadcrumbList',
            items: [
              { name: t("home"), url: '/' },
              { name: t("destinations"), url: '/destinations' },
              { name: 'Greece Transfer', url: '/greece-transfer' },
            ],
          },
        ]}
      />

      {/* Hero Section */}
      <div className="relative h-[50vh] overflow-hidden">
        <img
          src={athensCity}
          alt="Athens Acropolis Greece"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">🇬🇷 Greece</Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              {t("greeceHeroTitle")}
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              {t("greeceHeroSubtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Features Grid */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            {t("whyChooseGreeceTransfer")}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Airports Grid */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            {t("greeceAirportsTitle")}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {airports.map((airport) => (
              <Card key={airport.code} className="overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="h-5 w-5 text-primary" />
                      {airport.city}
                    </CardTitle>
                    <Badge variant="outline">{airport.code}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{airport.name}</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    {t("popularDestinations")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {airport.destinations.map((dest, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {dest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Port Transfers */}
        <section className="mb-16">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Anchor className="h-5 w-5 text-primary" />
                {t("greecePortTransfers")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t("greecePortTransfersDesc")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge>Piraeus Port</Badge>
                <Badge>Rafina Port</Badge>
                <Badge>Thessaloniki Port</Badge>
                <Badge>Patras Port</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-muted rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {t("readyToBookGreece")}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            {t("readyToBookGreeceDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to={getLocalizedPath("/book")}>
                {t("bookNow")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a
                href={getWhatsAppUrl("Hello, I would like to book a Greece airport transfer.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("contactWhatsApp")}
              </a>
            </Button>
          </div>
        </section>
      </div>

      <Footer />
    </WebsiteLayout>
  );
};

export default GreeceTransfer;
