import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { Check, Star, Clock, Shield, Award, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";

const services = [
  {
    title: "Business Travel",
    description: "Professional chauffeur service for corporate executives and business travelers.",
    icon: Award,
  },
  {
    title: "Event Transportation",
    description: "Weddings, conferences, and special events with our luxury fleet.",
    icon: Star,
  },
  {
    title: "VIP Airport Service",
    description: "Meet & greet, fast-track, and lounge access arrangements.",
    icon: Shield,
  },
  {
    title: "Full-Day Hire",
    description: "Dedicated driver and vehicle at your disposal for the entire day.",
    icon: Clock,
  },
  {
    title: "City Tours",
    description: "Customized sightseeing tours with professional guides.",
    icon: Car,
  },
];

const features = [
  "Professional English-speaking chauffeurs",
  "Latest model Mercedes vehicles",
  "Complimentary WiFi and refreshments",
  "Flight monitoring and flexible scheduling",
  "24/7 customer support",
  "Fixed pricing with no hidden fees",
  "Child seats available upon request",
  "Meet & greet service at all airports",
];

const LuxuryChauffeur = () => {
  const { t } = useLanguage();
  
  return (
    <WebsiteLayout>
      <SEOHead
        title={t("seoLuxuryTitle")}
        description={t("seoLuxuryDesc")}
        keywords="luxury chauffeur Turkey, VIP private driver, business travel Turkey, event transportation, hourly chauffeur service, Mercedes chauffeur, private driver Istanbul, executive car service"
        canonicalPath="/luxury-chauffeur"
        ogImage="https://meettransfer.app/images/meet-transfer-vclass-interior.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Istanbul', 'Antalya', 'Bodrum', 'Izmir'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Services', url: '/services' },
              { name: 'Luxury Chauffeur', url: '/luxury-chauffeur' },
            ],
          },
        ]}
      />

      <PageHeader
        title="Luxury Chauffeur Service"
        subtitle="Premium Transportation for Discerning Travelers"
        backgroundImage="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Experience True Luxury Chauffeur Travel in Turkey
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            <strong>Meet Transfer's luxury chauffeur service</strong> offers an unparalleled
            travel experience across Turkey. Whether you need <strong>airport transfers</strong>,
            <strong> business travel</strong>, or a <strong>full-day dedicated service</strong>, our professional
            chauffeurs and premium <strong>Mercedes fleet</strong> ensure you travel in comfort
            and style. Every journey is tailored to your needs with meticulous
            attention to detail.
          </p>
        </section>

        <FeatureList />

        <section>
          <h2 className="text-2xl font-bold mb-6">Our Luxury Chauffeur Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <service.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{service.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-card rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-6">What's Included in Our Chauffeur Service</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-secondary rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Book Your Luxury Chauffeur</h2>
          <p className="text-muted-foreground mb-4">
            Contact us for personalized service and pricing
          </p>
          <WhatsAppButton
            variant="large"
            message="Hello, I would like to inquire about your luxury chauffeur service."
          />
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default LuxuryChauffeur;
