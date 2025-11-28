import { Shield, Clock, Star, Headphones } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "Fully licensed, insured vehicles with professional, vetted drivers",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Round-the-clock service for arrivals and departures at any time",
  },
  {
    icon: Star,
    title: "Premium Fleet",
    description: "Modern, comfortable vehicles maintained to the highest standards",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated customer service team available whenever you need us",
  },
];

export const Features = () => {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Why Choose Us
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            Experience the difference with our premium transfer service
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center space-y-4 p-6 rounded-xl bg-card hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">
                {feature.title}
              </h3>
              <p className="text-muted-foreground font-sans leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};