import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2, MapPin } from "lucide-react";
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

const AntalyaAirportTransferGuide = () => {
  const { getLocalizedPath } = useLanguage();

  const faqItems = [
    {
      question: "How far is Antalya Airport from city center?",
      answer: "Antalya Airport (AYT) is approximately 13 kilometers from the city center, which takes about 20-30 minutes by car depending on traffic."
    },
    {
      question: "How much does a transfer from Antalya Airport to Belek cost?",
      answer: "Private transfer from Antalya Airport to Belek costs approximately $40-55 depending on vehicle type. Belek is about 35 km from the airport."
    },
    {
      question: "Is there a shuttle from Antalya Airport to hotels?",
      answer: "Yes, some hotels offer shuttle services, and Havas buses run to the city center. However, for direct door-to-door service to resort areas, private transfer is recommended."
    },
    {
      question: "What's the best way to get from Antalya Airport to Lara Beach?",
      answer: "Private transfer is the most convenient option for Lara Beach, taking about 15-20 minutes. It's especially practical with beach luggage and family travel."
    },
    {
      question: "Can I book a transfer to Side from Antalya Airport?",
      answer: "Yes, we offer transfers to Side, which is about 65 km from the airport. Journey time is approximately 60-75 minutes. Private transfer costs around $55-70."
    },
    {
      question: "Do you offer child seats for Antalya transfers?",
      answer: "Yes, child seats and booster seats are available upon request at no extra charge. Please specify during booking for us to prepare the appropriate seat."
    }
  ];

  const destinations = [
    { area: "Antalya City Center", distance: "13 km", time: "20-25 min", price: "$35-45" },
    { area: "Lara Beach / Kundu", distance: "18 km", time: "20-30 min", price: "$35-45" },
    { area: "Belek", distance: "35 km", time: "35-45 min", price: "$40-55" },
    { area: "Side", distance: "65 km", time: "60-75 min", price: "$55-70" },
    { area: "Alanya", distance: "130 km", time: "120-150 min", price: "$95-120" },
    { area: "Kemer", distance: "60 km", time: "50-65 min", price: "$55-70" },
    { area: "Kaş", distance: "190 km", time: "180-210 min", price: "$140-180" },
    { area: "Kalkan", distance: "220 km", time: "210-240 min", price: "$160-200" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Antalya Airport Transfer to Hotels: Complete Guide 2025"
        description="Everything about Antalya Airport transfers. Prices to Lara, Belek, Side, Kemer, Alanya. Booking tips, journey times, and what to expect from your hotel transfer."
        keywords="Antalya airport transfer, AYT airport hotel transfer, Antalya to Belek transfer, Antalya to Side transfer, Lara Beach transfer, Antalya airport taxi, private transfer Antalya"
        canonicalPath="/blog/antalya-airport-transfer-to-hotels"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: 'Antalya Airport Transfer to Hotels: Complete Guide',
            description: 'Everything about Antalya Airport transfers. Prices to Lara, Belek, Side, Kemer, Alanya. Booking tips, journey times, and what to expect.',
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2024-11-28',
            dateModified: '2024-11-28',
            author: 'Meet Transfer',
            readingTime: '13',
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
          <Badge variant="secondary" className="mb-4">Antalya</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Antalya Airport Transfer to Hotels: Complete Guide
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Everything you need to know about getting from Antalya Airport to your hotel. 
            Covers Lara, Belek, Side, Kemer, and Alanya. Pricing, booking tips, and what to 
            expect from your transfer.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              November 28, 2024
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              13 min read
            </span>
          </div>
        </header>

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12">
          <img 
            src="/images/meet-transfer-vip-mercedes-vito.jpg" 
            alt="Private transfer from Antalya Airport"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>Introduction: Antalya Airport Overview</h2>
          <p>
            Antalya Airport (AYT) is Turkey's busiest tourist airport, serving millions of visitors 
            annually who come to enjoy the stunning Turkish Riviera. Whether you're heading to an 
            all-inclusive resort in Belek, a boutique hotel in Side, or a villa in Kaş, understanding 
            your transfer options is essential for a stress-free start to your holiday.
          </p>
          <p>
            In this comprehensive guide, we cover everything you need to know about Antalya Airport 
            transfers: from distances and journey times to pricing and booking tips. We'll help you 
            choose the best option for your specific destination and travel needs.
          </p>

          <h2>Antalya Airport: Key Information</h2>
          <p>
            Before diving into transfer options, here's what you need to know about Antalya Airport:
          </p>
          <ul>
            <li><strong>Airport Code:</strong> AYT</li>
            <li><strong>Location:</strong> 13 km east of Antalya city center</li>
            <li><strong>Terminals:</strong> 2 international terminals, 1 domestic terminal</li>
            <li><strong>Operating Hours:</strong> 24/7 arrivals and departures</li>
            <li><strong>Peak Season:</strong> May through October</li>
          </ul>

          <h2>Transfer Prices to All Major Destinations</h2>
          <p>
            Here's a complete price guide for private transfers from Antalya Airport to all major 
            resort areas and cities:
          </p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Journey Time</TableHead>
                  <TableHead>Private Transfer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {destinations.map((dest, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{dest.area}</TableCell>
                    <TableCell>{dest.distance}</TableCell>
                    <TableCell>{dest.time}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground">
            *Prices are for Mercedes Vito (up to 6 passengers). Prices may vary by season 
            and specific location within each area.
          </p>

          <h2>Detailed Area Guides</h2>

          <h3>Lara Beach & Kundu</h3>
          <p>
            Lara Beach is the closest major resort area to Antalya Airport, making it one of the 
            most convenient destinations for travelers. The area is known for its beautiful 
            sandy beaches and luxury all-inclusive resorts.
          </p>
          <ul>
            <li><strong>Distance:</strong> 18 km</li>
            <li><strong>Transfer time:</strong> 20-30 minutes</li>
            <li><strong>Type of hotels:</strong> Large all-inclusive resorts, 5-star hotels</li>
            <li><strong>Popular hotels:</strong> Titanic Hotels, Mardan Palace, IC Hotels</li>
          </ul>

          <h3>Belek</h3>
          <p>
            Belek is Turkey's premier golf destination, home to world-class golf courses and 
            luxury resorts. It's also popular with families due to its excellent beaches and 
            resort facilities.
          </p>
          <ul>
            <li><strong>Distance:</strong> 35 km</li>
            <li><strong>Transfer time:</strong> 35-45 minutes</li>
            <li><strong>Type of hotels:</strong> Golf resorts, luxury all-inclusive</li>
            <li><strong>Popular hotels:</strong> Regnum Carya, Cornelia Hotels, Maxx Royal</li>
          </ul>

          <h3>Side</h3>
          <p>
            Side offers a perfect blend of ancient history and modern beach resorts. The ancient 
            Roman ruins provide a unique backdrop to this charming coastal town.
          </p>
          <ul>
            <li><strong>Distance:</strong> 65 km</li>
            <li><strong>Transfer time:</strong> 60-75 minutes</li>
            <li><strong>Type of hotels:</strong> Mix of boutique hotels and large resorts</li>
            <li><strong>Popular areas:</strong> Side Old Town, Kumköy, Colakli</li>
          </ul>

          <h3>Kemer</h3>
          <p>
            Located on the western side of Antalya, Kemer offers stunning mountain scenery 
            alongside beautiful beaches. It's popular with European tourists and offers 
            excellent value for money.
          </p>
          <ul>
            <li><strong>Distance:</strong> 60 km</li>
            <li><strong>Transfer time:</strong> 50-65 minutes</li>
            <li><strong>Type of hotels:</strong> All-inclusive resorts, boutique hotels</li>
            <li><strong>Popular areas:</strong> Kemer Center, Göynük, Beldibi, Tekirova</li>
          </ul>

          <h3>Alanya</h3>
          <p>
            Alanya is located about 130 km east of Antalya, making it the furthest major resort 
            from the airport. However, its beautiful beaches, historic castle, and vibrant 
            nightlife make it worth the journey.
          </p>
          <ul>
            <li><strong>Distance:</strong> 130 km</li>
            <li><strong>Transfer time:</strong> 2-2.5 hours</li>
            <li><strong>Type of hotels:</strong> Mix of budget to luxury resorts</li>
            <li><strong>Note:</strong> Gazipaşa Airport (GZP) is closer for Alanya</li>
          </ul>

          <h2>What's Included in Private Transfers?</h2>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Our Antalya Transfer Service Includes
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Meet & Greet at arrivals with name board</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Luggage assistance</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Air-conditioned Mercedes vehicles</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Complimentary water</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Child seats (on request)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Flight monitoring</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>45 min free waiting time</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>24/7 customer support</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>Alternative Transfer Options</h2>

          <h3>1. Havas Bus Service</h3>
          <p>
            Havas operates regular bus services from Antalya Airport to the city center:
          </p>
          <ul>
            <li><strong>Price:</strong> Approximately 50-70 TL ($2-3)</li>
            <li><strong>Destinations:</strong> Antalya city center only</li>
            <li><strong>Frequency:</strong> Every 30 minutes</li>
            <li><strong>Limitation:</strong> No direct service to resort areas</li>
          </ul>

          <h3>2. Airport Taxi</h3>
          <p>
            Taxis are available outside the arrivals terminal:
          </p>
          <ul>
            <li><strong>Price:</strong> Metered, similar to private transfer for close destinations</li>
            <li><strong>Pros:</strong> No advance booking needed</li>
            <li><strong>Cons:</strong> No fixed price, variable vehicle quality, language barrier</li>
          </ul>

          <h3>3. Hotel Shuttle</h3>
          <p>
            Some resorts offer complimentary or paid shuttle services:
          </p>
          <ul>
            <li><strong>Price:</strong> Varies (often €10-30 per person)</li>
            <li><strong>Pros:</strong> Organized by your hotel</li>
            <li><strong>Cons:</strong> Shared with other guests, longer waiting times</li>
          </ul>

          <h2>Tips for a Smooth Transfer</h2>
          <ol>
            <li><strong>Book in advance:</strong> Especially during peak season (June-September)</li>
            <li><strong>Share flight details:</strong> Include flight number for real-time tracking</li>
            <li><strong>Provide exact address:</strong> Hotel name and full address for accurate pickup</li>
            <li><strong>Request child seats:</strong> Book in advance if traveling with young children</li>
            <li><strong>Have cash for tips:</strong> Small tip (10-20 TL) is appreciated but not required</li>
            <li><strong>Keep confirmation handy:</strong> Screenshot or print your booking confirmation</li>
          </ol>

          <h2>Best Time to Book</h2>
          <p>
            We recommend booking your Antalya Airport transfer at least 48 hours in advance, 
            especially during:
          </p>
          <ul>
            <li><strong>Peak season (June-September):</strong> High demand for all destinations</li>
            <li><strong>Religious holidays:</strong> Bayram periods are very busy</li>
            <li><strong>School holidays:</strong> European school breaks increase demand</li>
            <li><strong>Night arrivals:</strong> Ensure driver is arranged for late flights</li>
          </ul>

          <h2>Conclusion</h2>
          <p>
            Getting from Antalya Airport to your hotel doesn't have to be stressful. With 
            <Link to={getLocalizedPath("/antalya-transfer")} className="text-primary hover:underline"> Meet Transfer's 
            private transfer service</Link>, you can start your Turkish Riviera holiday in comfort 
            and style. Whether you're heading to nearby Lara Beach or the distant shores of Kaş, 
            we've got you covered with fixed prices and professional service.
          </p>
          <p>
            <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">Request your 
            price</Link> today and enjoy a seamless arrival at your Antalya destination.
          </p>
        </div>

        {/* Map Section */}
        <div className="my-12 p-6 bg-muted/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Popular Destinations from Antalya Airport</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {destinations.slice(0, 8).map((dest, index) => (
              <div key={index} className="text-center p-3 bg-background rounded-lg">
                <p className="font-medium text-sm">{dest.area}</p>
                <p className="text-xs text-muted-foreground">{dest.distance}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="my-12 p-8 bg-primary/5 rounded-2xl text-center">
          <h3 className="font-serif text-2xl font-bold mb-4">
            Book Your Antalya Airport Transfer
          </h3>
          <p className="text-muted-foreground mb-6">
            Fixed prices, professional drivers, 24/7 availability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/book")}>
              <Button size="lg" variant="accent" className="gap-2">
                Request Price
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={getLocalizedPath("/antalya-transfer")}>
              <Button size="lg" variant="outline">
                View Antalya Transfers
              </Button>
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="my-12">
          <h2 className="font-serif text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-border pb-6 last:border-0">
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Articles */}
        <section className="my-12">
          <h2 className="font-serif text-2xl font-bold mb-6">Related Articles</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link 
              to={getLocalizedPath("/blog/is-private-transfer-worth-it-turkey")}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <h4 className="font-semibold mb-1">Is Private Transfer Worth It in Turkey?</h4>
              <p className="text-sm text-muted-foreground">Cost-benefit analysis for travelers</p>
            </Link>
            <Link 
              to={getLocalizedPath("/blog/private-vs-taxi-transfer-turkey")}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <h4 className="font-semibold mb-1">Private Transfer vs Taxi in Turkey</h4>
              <p className="text-sm text-muted-foreground">Honest comparison of your options</p>
            </Link>
          </div>
        </section>
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default AntalyaAirportTransferGuide;
