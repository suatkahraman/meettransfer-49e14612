import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { Check, Award, Users, MapPin, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  { value: "10+", label: "Years Experience" },
  { value: "50,000+", label: "Transfers Completed" },
  { value: "8", label: "Cities Covered" },
  { value: "24/7", label: "Availability" },
];

const values = [
  {
    icon: Shield,
    title: "Safety First",
    description: "All our vehicles are regularly serviced and our drivers are professionally trained.",
  },
  {
    icon: Award,
    title: "Quality Service",
    description: "We pride ourselves on delivering exceptional service with attention to every detail.",
  },
  {
    icon: Clock,
    title: "Punctuality",
    description: "We monitor all flights and ensure your driver is always on time, every time.",
  },
  {
    icon: Users,
    title: "Customer Focus",
    description: "Your comfort and satisfaction are our top priorities throughout your journey.",
  },
];

const cities = [
  "Istanbul", "Antalya", "Bodrum", "Dalaman", "Izmir",
  "Cappadocia", "Fethiye", "Marmaris"
];

const AboutPage = () => {
  return (
    <WebsiteLayout>
      <PageHeader
        title="About Meet Transfer"
        subtitle="Your Trusted Partner for Premium Airport Transfers"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Intro */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Who We Are</h2>
          <p className="text-muted-foreground leading-relaxed">
            Meet Transfer is Turkey's leading premium airport transfer service,
            providing luxury transportation across the country's most popular
            tourist destinations. Founded with a vision to offer travelers a
            seamless and comfortable journey, we have grown to become the trusted
            choice for discerning travelers, families, and business executives
            alike.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Our commitment to excellence is reflected in every aspect of our
            service – from our immaculately maintained Mercedes fleet to our
            professional, English-speaking drivers who undergo rigorous training.
            We believe that your journey should be as enjoyable as your destination.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-accent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Values */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Why Choose Us</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <value.icon className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {value.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Cities */}
        <section className="bg-card rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Cities We Serve</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cities.map((city) => (
              <div
                key={city}
                className="flex items-center gap-2 bg-secondary p-3 rounded-lg"
              >
                <MapPin className="h-4 w-4 text-accent" />
                <span className="font-medium">{city}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Meet & Greet */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4">Our Meet & Greet Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            Every airport transfer includes our signature Meet & Greet service.
            Your driver will be waiting in the arrivals hall with a personalized
            name board. We monitor your flight in real-time, so even if there are
            delays, your driver will be there when you land. No waiting, no
            searching – just a warm welcome and a helping hand with your luggage.
          </p>
        </section>

        {/* Leadership */}
        <section className="bg-secondary rounded-xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <blockquote className="text-lg italic mb-4">
              "Our mission is to provide every guest with a travel experience
              that exceeds expectations. From the moment you book until you
              reach your destination, we are committed to your comfort and safety."
            </blockquote>
            <div className="font-bold">Suat Kahraman</div>
            <div className="text-sm text-muted-foreground">General Manager</div>
          </div>
        </section>

        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">Ready to Experience the Difference?</h3>
          <WhatsAppButton
            variant="large"
            message="Hello, I would like to learn more about Meet Transfer services."
          />
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default AboutPage;
