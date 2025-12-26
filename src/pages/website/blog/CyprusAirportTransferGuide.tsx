import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2, Plane, Palmtree, MapPin } from "lucide-react";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CyprusAirportTransferGuide = () => {
  const { getLocalizedPath } = useLanguage();

  const faqItems = [
    {
      question: "How many airports are in Cyprus?",
      answer: "Cyprus has two main airports: Larnaca International Airport (LCA) and Paphos International Airport (PFO). In North Cyprus, Ercan Airport (ECN) serves Turkish Cypriot territory."
    },
    {
      question: "How long does it take from Larnaca Airport to Limassol?",
      answer: "A private transfer from Larnaca Airport to Limassol takes approximately 45-55 minutes. The distance is about 70 km via the highway."
    },
    {
      question: "What is the best way to get from Paphos Airport to hotels?",
      answer: "Private VIP transfer is the most convenient option from Paphos Airport. Your driver meets you at arrivals and takes you directly to your hotel in Paphos or anywhere in Cyprus."
    },
    {
      question: "How much does an airport transfer cost in Cyprus?",
      answer: "Private transfers from Larnaca Airport start from €35-45 to Larnaca city, €60-75 to Limassol, and €90-110 to Paphos. From Paphos Airport, transfers to Paphos hotels start at €25-35."
    },
    {
      question: "Is there public transport from Cyprus airports?",
      answer: "Yes, but it's limited. Larnaca has some bus services, but they're infrequent and don't cover all destinations. Private transfer is more reliable, especially for beach resorts."
    },
    {
      question: "Can I book a transfer from Larnaca to North Cyprus?",
      answer: "Yes, we offer transfers to North Cyprus including Kyrenia and Famagusta. You'll need to pass through the border checkpoint, which usually takes 15-20 minutes."
    }
  ];

  const larnacaTransferPrices = [
    { destination: "Larnaca City / Hotels", duration: "10-15 min", price: "€35-45" },
    { destination: "Ayia Napa", duration: "40-50 min", price: "€50-65" },
    { destination: "Protaras", duration: "50-60 min", price: "€55-70" },
    { destination: "Limassol", duration: "45-55 min", price: "€60-75" },
    { destination: "Nicosia", duration: "35-45 min", price: "€50-65" },
    { destination: "Paphos", duration: "90-110 min", price: "€90-110" },
    { destination: "Kyrenia (North Cyprus)", duration: "60-75 min", price: "€75-90" },
  ];

  const paphosTransferPrices = [
    { destination: "Paphos City / Hotels", duration: "15-20 min", price: "€25-35" },
    { destination: "Coral Bay", duration: "25-30 min", price: "€30-40" },
    { destination: "Polis Chrysochous", duration: "45-55 min", price: "€50-65" },
    { destination: "Limassol", duration: "55-65 min", price: "€65-80" },
    { destination: "Larnaca", duration: "90-110 min", price: "€90-110" },
    { destination: "Ayia Napa", duration: "120-140 min", price: "€120-140" },
  ];

  const popularDestinations = [
    { name: "Ayia Napa", description: "Famous beaches and vibrant nightlife" },
    { name: "Protaras", description: "Family-friendly resorts and Fig Tree Bay" },
    { name: "Limassol", description: "Largest resort city with marina and old town" },
    { name: "Paphos", description: "UNESCO heritage sites and Tombs of the Kings" },
    { name: "Kyrenia", description: "Historic harbor and Bellapais Abbey (North Cyprus)" },
    { name: "Troodos Mountains", description: "Mountain villages and wine routes" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Cyprus Airport Transfer Guide 2025 | Larnaca & Paphos Private Transfers"
        description="Complete guide to Cyprus airport transfers. Book private transfers from Larnaca Airport to Ayia Napa, Limassol, Paphos. Fixed prices, 24/7 service, reliable drivers."
        keywords="Cyprus airport transfer, Larnaca airport transfer, Paphos airport transfer, Ayia Napa transfer, Limassol airport transfer, Cyprus private transfer, Cyprus taxi"
        canonicalPath="/blog/cyprus-airport-transfer-guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: 'Cyprus Airport Transfer Guide 2025: Larnaca & Paphos',
            description: 'Complete guide to Cyprus airport transfers. Book private transfers from Larnaca Airport to Ayia Napa, Limassol, Paphos.',
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2024-12-26',
            dateModified: '2024-12-26',
            author: 'Meet Transfer',
            readingTime: '15',
          },
          {
            type: 'FAQPage',
            questions: faqItems.map(item => ({
              question: item.question,
              answer: item.answer
            }))
          }
        ]}
      />

      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Back to Blog */}
        <Link 
          to={getLocalizedPath("/blog")} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <Badge variant="secondary" className="mb-4">Cyprus</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Cyprus Airport Transfer Guide 2025: Larnaca & Paphos
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Complete guide to Cyprus airport transportation. Compare private transfers, taxis, 
            and bus options from Larnaca and Paphos airports. Find the best way to reach 
            Ayia Napa, Limassol, Protaras, and other popular destinations.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              December 26, 2024
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              15 min read
            </span>
          </div>
        </header>

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
          <div className="text-center">
            <Palmtree className="h-20 w-20 text-cyan-500 mx-auto mb-4" />
            <p className="text-2xl font-bold">Cyprus Transfers</p>
            <p className="text-muted-foreground">Mediterranean Island Paradise</p>
          </div>
        </div>

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>Introduction: Discovering Cyprus</h2>
          <p>
            Cyprus, the sun-drenched Mediterranean island, welcomes millions of visitors each year 
            with its stunning beaches, ancient ruins, and legendary hospitality. With 320 days of 
            sunshine annually, it's no wonder Cyprus has become one of Europe's most popular 
            holiday destinations.
          </p>
          <p>
            Whether you're heading to the party beaches of Ayia Napa, the family resorts of Protaras, 
            the cosmopolitan city of Limassol, or the historic sites of Paphos, getting from the 
            airport to your destination efficiently is key to starting your vacation right.
          </p>

          <h2>Cyprus Airports Overview</h2>
          
          <h3>Larnaca International Airport (LCA)</h3>
          <p>
            Larnaca is Cyprus's main international gateway, handling over 7 million passengers 
            annually. It's conveniently located:
          </p>
          <ul>
            <li>4 km from Larnaca city center</li>
            <li>45 km from Limassol</li>
            <li>50 km from Ayia Napa</li>
            <li>135 km from Paphos</li>
          </ul>

          <h3>Paphos International Airport (PFO)</h3>
          <p>
            Paphos Airport primarily serves the western part of Cyprus:
          </p>
          <ul>
            <li>15 km from Paphos city center</li>
            <li>50 km from Limassol</li>
            <li>Ideal for visitors to Coral Bay, Polis, and the Akamas Peninsula</li>
          </ul>

          <h2>Larnaca Airport Transfer Prices</h2>
          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Private Transfer Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {larnacaTransferPrices.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.destination}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                    <TableCell>{item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h2>Paphos Airport Transfer Prices</h2>
          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Private Transfer Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paphosTransferPrices.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.destination}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                    <TableCell>{item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h2>Option 1: Private VIP Transfer (Recommended)</h2>
          <p>
            A <Link to={getLocalizedPath("/cyprus-transfer")} className="text-primary hover:underline">private VIP transfer</Link> is 
            the most comfortable way to travel from Cyprus airports. With limited public transport 
            options on the island, private transfers are especially valuable.
          </p>

          <h3>What's Included</h3>
          <ul>
            <li>Meet & Greet at arrivals with your name sign</li>
            <li>Professional English-speaking drivers</li>
            <li>Modern air-conditioned vehicles</li>
            <li>Child seats available on request</li>
            <li>Flight monitoring for delays</li>
            <li>Direct door-to-door service</li>
            <li>Fixed prices with no hidden fees</li>
          </ul>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Why Private Transfer in Cyprus?
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Limited public transport options</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Direct service to beach resorts</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Perfect for families with children</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>24/7 service for all flight times</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>Option 2: Airport Taxi</h2>
          <p>
            Official airport taxis are available outside both Larnaca and Paphos airports. 
            Prices are regulated but can vary:
          </p>
          <ul>
            <li>Taxis use meters with set rates</li>
            <li>Night rates (21:00-06:00) are higher</li>
            <li>Queues can be long during peak season</li>
            <li>Payment usually in Euros only</li>
          </ul>

          <h2>Option 3: Public Bus</h2>
          <p>
            Limited bus services operate from both airports:
          </p>
          <ul>
            <li><strong>Larnaca:</strong> Buses to Larnaca city center and some coastal areas</li>
            <li><strong>Paphos:</strong> Buses to Paphos city (Kato Paphos, Harbour)</li>
            <li><strong>Price:</strong> €1.50-3 per journey</li>
            <li><strong>Limitation:</strong> Infrequent schedules, no direct service to most resorts</li>
          </ul>

          <h2>Popular Cyprus Destinations</h2>
          <div className="not-prose my-8 grid md:grid-cols-2 gap-4">
            {popularDestinations.map((destination, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {destination.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{destination.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2>North Cyprus Transfers</h2>
          <p>
            We also offer transfers to North Cyprus (Turkish Republic of Northern Cyprus) 
            including popular destinations like:
          </p>
          <ul>
            <li><strong>Kyrenia (Girne):</strong> Historic harbor town with castle and mountains</li>
            <li><strong>Famagusta (Gazimağusa):</strong> Ancient walled city and beaches</li>
            <li><strong>Nicosia North:</strong> The northern part of the divided capital</li>
          </ul>
          <p>
            Transfers involve crossing the Green Line at a checkpoint (usually Nicosia or Strovilia). 
            The process typically takes 15-20 minutes with passport control on both sides.
          </p>

          <h2>Which Airport Should You Choose?</h2>
          
          <h3>Fly into Larnaca (LCA) if visiting:</h3>
          <ul>
            <li>Ayia Napa and Protaras</li>
            <li>Limassol (eastern side)</li>
            <li>Nicosia</li>
            <li>North Cyprus</li>
          </ul>

          <h3>Fly into Paphos (PFO) if visiting:</h3>
          <ul>
            <li>Paphos and Coral Bay</li>
            <li>Polis and Akamas Peninsula</li>
            <li>Limassol (western side)</li>
            <li>Troodos Mountains</li>
          </ul>

          <h2>Tips for Cyprus Arrival</h2>
          <ol>
            <li><strong>Pre-book your transfer:</strong> Essential during summer peak season (July-August)</li>
            <li><strong>Currency:</strong> Cyprus uses the Euro (€)</li>
            <li><strong>Driving:</strong> Left-hand traffic in Cyprus (British style)</li>
            <li><strong>Weather:</strong> Hot summers (35°C+), mild winters</li>
            <li><strong>Time zone:</strong> GMT+2 (GMT+3 in summer)</li>
          </ol>

          <h2>Book Your Cyprus Airport Transfer</h2>
          <p>
            Ready for your Mediterranean getaway? Book your private transfer and arrive at 
            your Cyprus destination relaxed and refreshed.
          </p>
        </div>

        {/* CTA Section */}
        <div className="not-prose my-12 p-8 bg-primary/5 rounded-xl text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">
            Book Your Cyprus Transfer Now
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Reliable private transfers from Larnaca and Paphos airports. Fixed prices, professional drivers, 24/7 service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/cyprus-transfer")}>
              <Button size="lg" variant="accent" className="gap-2">
                View Cyprus Transfers
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a 
              href="https://wa.me/905321748390?text=Hello, I need a transfer from Cyprus Airport."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="gap-2">
                WhatsApp Booking
              </Button>
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="not-prose mt-16">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-border pb-6 last:border-0">
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Posts */}
        <section className="not-prose mt-16 pt-8 border-t border-border">
          <h2 className="font-serif text-xl font-bold mb-6">Related Articles</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link 
              to={getLocalizedPath("/blog/dubai-airport-transfer-guide")}
              className="group p-4 border border-border rounded-lg hover:border-primary transition-colors"
            >
              <Badge variant="outline" className="mb-2">Dubai</Badge>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                Dubai Airport Transfer Guide 2025
              </h3>
            </Link>
            <Link 
              to={getLocalizedPath("/blog/antalya-airport-transfer-to-hotels")}
              className="group p-4 border border-border rounded-lg hover:border-primary transition-colors"
            >
              <Badge variant="outline" className="mb-2">Antalya</Badge>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                Antalya Airport Transfer to Hotels
              </h3>
            </Link>
          </div>
        </section>
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default CyprusAirportTransferGuide;