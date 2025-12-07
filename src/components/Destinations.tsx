import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";
import cappadociaTransfer from "@/assets/cappadocia-transfer.png";
import bodrumTransfer from "@/assets/bodrum-transfer.png";
import istanbulTransfer from "@/assets/istanbul-transfer.png";
import antalyaTransfer from "@/assets/antalya-transfer.png";

const destinations = [{
  route: "Istanbul ⇄ Hotels",
  airports: "IST / SAW",
  description: "Private VIP airport transfer with professional chauffeur service to all Istanbul hotels.",
  image: istanbulTransfer
}, {
  route: "Antalya ⇄ Resort Areas",
  airports: "AYT",
  description: "Luxury transfer to Lara, Belek, Kemer, Side and all major resort destinations.",
  image: antalyaTransfer
}, {
  route: "Bodrum ⇄ City Transfer",
  airports: "BJV",
  description: "Premium service to Bodrum Peninsula, Turgutreis, Gümbet and surrounding areas.",
  image: bodrumTransfer
}, {
  route: "Cappadocia Tours",
  airports: "NAV / ASR",
  description: "Exclusive transfers and tour services throughout the magical Cappadocia region.",
  image: cappadociaTransfer
}];
export const Destinations = () => {
  return <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">Top Destinations</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            Discover our most popular routes with professional drivers and luxury vehicles
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((destination, index) => <Card key={index} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer animate-in fade-in slide-in-from-bottom-8" style={{
          animationDelay: `${index * 100}ms`
        }}>
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={destination.image} 
                  alt={destination.route}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 text-white/90 text-xs mb-1">
                    <MapPin className="h-3 w-3" />
                    <span className="font-sans">{destination.airports}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg">{destination.route}</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">{destination.description}</p>
                <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  Book Now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Card>)}
        </div>
      </div>
    </section>;
};