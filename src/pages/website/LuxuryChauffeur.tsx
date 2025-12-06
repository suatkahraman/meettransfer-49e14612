import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { Check, Star, Clock, Shield, Award, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
  return (
    <WebsiteLayout>
      <PageHeader
        title="Luxury Chauffeur Service"
        subtitle="Premium Transportation for Discerning Travelers"
        backgroundImage="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">
            Experience True Luxury Travel
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Meet Transfer's luxury chauffeur service offers an unparalleled
            travel experience across Turkey. Whether you need airport transfers,
            business travel, or a full-day dedicated service, our professional
            chauffeurs and premium Mercedes fleet ensure you travel in comfort
            and style. Every journey is tailored to your needs with meticulous
            attention to detail.
          </p>
        </section>

        <FeatureList />

        <section>
          <h2 className="text-2xl font-bold mb-6">Our Services</h2>
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
          <h2 className="text-2xl font-bold mb-6">What's Included</h2>
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
          <h3 className="text-xl font-bold mb-2">Book Your Luxury Chauffeur</h3>
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
