import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Car, Anchor, Waves, Building, Gift } from "lucide-react";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { PWAPromoBanner } from "@/components/website/PWAPromoBanner";

const ServicesPage = () => {
  const { t } = useLanguage();

  const services = [
    {
      id: "istanbul",
      title: t("istanbulService"),
      emoji: "🇹🇷",
      icon: Building,
      features: [
        t("istanbulFeature1"),
        t("istanbulFeature2"),
        t("istanbulFeature3"),
        t("istanbulFeature4"),
        t("istanbulFeature5"),
      ],
    },
    {
      id: "antalya",
      title: t("antalyaService"),
      emoji: "🏖️",
      icon: Plane,
      features: [
        t("antalyaFeature1"),
        t("antalyaFeature2"),
        t("antalyaFeature3"),
        t("antalyaFeature4"),
      ],
    },
    {
      id: "bodrum",
      title: t("bodrumService"),
      emoji: "⚓",
      icon: Anchor,
      features: [
        t("bodrumFeature1"),
        t("bodrumFeature2"),
        t("bodrumFeature3"),
      ],
    },
    {
      id: "dalaman",
      title: t("dalamanService"),
      emoji: "🌊",
      icon: Waves,
      features: [
        t("dalamanFeature1"),
        t("dalamanFeature2"),
        t("dalamanFeature3"),
      ],
    },
    {
      id: "izmir",
      title: t("izmirService"),
      emoji: "🏛️",
      icon: Building,
      features: [
        t("izmirFeature1"),
        t("izmirFeature2"),
      ],
    },
    {
      id: "cappadocia",
      title: t("cappadociaService"),
      emoji: "🎈",
      icon: Gift,
      features: [
        t("cappadociaFeature1"),
        t("cappadociaFeature2"),
        t("cappadociaFeature3"),
      ],
    },
    {
      id: "dubai",
      title: "Dubai Airport Transfer (DXB)",
      emoji: "🌆",
      icon: Building,
      features: [
        "Downtown Dubai, Palm Jumeirah, Marina",
        "Business Bay & JBR Beach Transfers",
        "Mercedes Maybach Minivan & VIP Mercedes Fleet",
      ],
    },
    {
      id: "cyprus",
      title: "Cyprus Airport Transfer (LCA, PFO)",
      emoji: "🏖️",
      icon: Anchor,
      features: [
        "Larnaca, Paphos, Ayia Napa, Limassol",
        "Kyrenia & Famagusta Transfers",
        "24/7 VIP Service",
      ],
    },
    {
      id: "frankfurt",
      title: "Frankfurt Airport Transfer (FRA)",
      emoji: "🏙️",
      icon: Building,
      features: [
        "City Center & Messe Frankfurt",
        "Financial District Transfers",
        "Business Chauffeur Service",
      ],
    },
    {
      id: "greece",
      title: "Greece Airport Transfer (ATH, SKG)",
      emoji: "🇬🇷",
      icon: Plane,
      features: [
        "Athens, Piraeus Port, Thessaloniki",
        "Greek Islands & Cruise Port Transfers",
        "VIP Mercedes Vito Fleet",
      ],
    },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoServicesTitle")}
        description={t("seoServicesDesc")}
        keywords="VIP airport transfer Turkey, private chauffeur service, luxury transfer service, Istanbul airport transfer, Antalya airport transfer, Bodrum airport transfer, Turkey transfer services, Mercedes VIP transfer"
        canonicalPath="/services"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Istanbul', 'Antalya', 'Bodrum', 'Dalaman', 'Izmir', 'Cappadocia', 'Dubai', 'Cyprus', 'Frankfurt', 'Athens', 'Greece'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Services', url: '/services' },
            ],
          },
        ]}
      />

      <PageHeader
        title={t("servicesTitle")}
        subtitle={t("servicesSubtitle")}
      />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main H1 */}
        <section className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            {t("servicesMainTitle")}
          </h1>
          <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-lg p-8 border border-border">
            <div className="flex justify-center gap-4 text-4xl mb-6">
              <span>🚘</span>
              <span>✈️</span>
              <span>🏝️</span>
              <span>⭐</span>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("servicesIntro")}
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const IconComponent = service.icon;
            return (
              <Card
                key={service.id}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border bg-card"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="text-3xl">{service.emoji}</span>
                  </div>
                  <CardTitle className="text-xl font-serif leading-tight">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-muted-foreground"
                      >
                        <Car className="h-4 w-4 mt-1 text-accent shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-primary rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary-foreground mb-4">
              {t("readyToBook")}
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-2xl mx-auto">
              {t("contactViaWhatsApp")}
            </p>
            <WhatsAppButton 
              message="Hello! I would like to book a VIP transfer service." 
              className="inline-flex"
            />
          </div>
        </div>

        {/* PWA Install Banner */}
        <PWAPromoBanner />
      </div>
    </WebsiteLayout>
  );
};

export default ServicesPage;