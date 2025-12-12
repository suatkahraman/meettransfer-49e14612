import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Car, Anchor, Waves, Building, Gift } from "lucide-react";
import { SEOHead, SchemaOrg } from "@/components/seo";

const services = [
  {
    id: "istanbul",
    title: "Istanbul Airport Transfer (IST & SAW)",
    emoji: "🇹🇷",
    icon: Building,
    features: [
      "VIP Airport → Hotel Transfers",
      "Taksim, Sultanahmet, Galataport Cruise Port",
      "Business Chauffeur Service",
      "Mercedes Vito & V-Class VIP Minivans",
      "24/7 Service + Flight Tracking + Meet & Greet",
    ],
  },
  {
    id: "antalya",
    title: "Antalya Airport Transfer (AYT)",
    emoji: "🏖️",
    icon: Plane,
    features: [
      "Lara, Kundu, Belek, Side, Alanya, Kaş, Kemer",
      "Golf Hotel Transfers",
      "Family & Group Minibus Options",
      "Resort & Villa Transfers",
    ],
  },
  {
    id: "bodrum",
    title: "Bodrum Airport Transfer (BJV)",
    emoji: "⚓",
    icon: Anchor,
    features: [
      "Yalıkavak Marina, Türkbükü, Gündoğan, Torba",
      "Luxury Villa & Hotel Transfers",
      "VIP Mercedes Vito, V-Class, and Minibus",
    ],
  },
  {
    id: "dalaman",
    title: "Dalaman Airport Transfer (DLM)",
    emoji: "🌊",
    icon: Waves,
    features: [
      "Fethiye, Ölüdeniz, Göcek Marina, Marmaris",
      "Yacht Transfers + Villa Transfers",
      "24/7 Private Chauffeur Service",
    ],
  },
  {
    id: "izmir",
    title: "Izmir Airport Transfer (ADB)",
    emoji: "🏛️",
    icon: Building,
    features: [
      "Ephesus, Çeşme, Alaçatı, Kusadasi",
      "Hotel, Resort & Cruise Port Transfers",
    ],
  },
  {
    id: "cappadocia",
    title: "Cappadocia Airport Transfer (NAV & ASR)",
    emoji: "🎈",
    icon: Gift,
    features: [
      "Göreme, Ürgüp, Avanos, Uçhisar",
      "Cave Hotels & Balloon Tour Transfers",
      "VIP private chauffeur for tours",
    ],
  },
];

const ServicesPage = () => {
  return (
    <WebsiteLayout>
      <SEOHead
        title="VIP Airport Transfer Services in Turkey - Meet Transfer"
        description="Premium VIP airport transfer and private chauffeur services across Turkey. Istanbul, Antalya, Bodrum, Dalaman, Izmir, Cappadocia. Mercedes fleet, 24/7 service."
        keywords="VIP airport transfer Turkey, private chauffeur service, luxury transfer service, Istanbul airport transfer, Antalya airport transfer, Bodrum airport transfer, Turkey transfer services, Mercedes VIP transfer"
        canonicalPath="/services"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['Istanbul', 'Antalya', 'Bodrum', 'Dalaman', 'Izmir', 'Cappadocia'] },
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
        title="Premium VIP Airport & Chauffeur Services"
        subtitle="Luxury transfers across Turkey's top destinations"
      />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main H1 */}
        <section className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            VIP Airport Transfer Services Across Turkey
          </h1>
          <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-lg p-8 border border-border">
            <div className="flex justify-center gap-4 text-4xl mb-6">
              <span>🚘</span>
              <span>✈️</span>
              <span>🏝️</span>
              <span>⭐</span>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              <strong>Meet Transfer</strong> provides <strong>luxury airport transfers</strong>, <strong>private chauffeur service</strong>, and <strong>VIP minivan 
              transportation</strong> across Turkey's most important airports and holiday destinations. Our fleet includes 
              <span className="text-foreground font-medium"> Mercedes Vito, Mercedes V-Class, VIP Minibuses, and Maybach </span> 
              options. All transfers include professional chauffeurs, flight tracking, meet & greet, bottled water, and 24/7 support.
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
              Ready to Book Your VIP Transfer?
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-2xl mx-auto">
              Contact us via WhatsApp for instant booking and personalized service. 
              Our team is available 24/7 to assist you.
            </p>
            <WhatsAppButton 
              message="Hello! I would like to book a VIP transfer service." 
              className="inline-flex"
            />
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default ServicesPage;
