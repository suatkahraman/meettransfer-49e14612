import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2, Plane, Building, Sun } from "lucide-react";
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

const DubaiAirportTransferGuide = () => {
  const { getLocalizedPath } = useLanguage();

  const faqItems = [
    {
      question: "How long does it take from Dubai Airport to Downtown?",
      answer: "A private transfer from Dubai International Airport (DXB) to Downtown Dubai takes approximately 15-25 minutes depending on traffic. To Palm Jumeirah, expect 25-35 minutes."
    },
    {
      question: "What is the best way to get from Dubai Airport to hotels?",
      answer: "Private VIP transfer is the most convenient option. Your driver meets you at arrivals with a name sign, helps with luggage, and takes you directly to your hotel in a luxury vehicle."
    },
    {
      question: "How much does a private transfer cost in Dubai?",
      answer: "Private transfers from Dubai Airport start from $45-60 USD to Downtown Dubai. Prices vary based on vehicle type (sedan, SUV, or luxury) and destination."
    },
    {
      question: "Is Dubai Airport transfer available 24/7?",
      answer: "Yes, Meet Transfer offers 24/7 private transfer services in Dubai with flight tracking. We monitor your flight and adjust pickup time automatically for any delays."
    },
    {
      question: "Which Dubai Airport terminal should I use?",
      answer: "Dubai has two airports: Dubai International (DXB) with Terminals 1, 2, and 3, and Dubai World Central (DWC). Most international flights use DXB Terminal 3."
    },
    {
      question: "Can I book a transfer to Abu Dhabi from Dubai Airport?",
      answer: "Yes, we offer private transfers from Dubai Airport to Abu Dhabi. The journey takes approximately 1 hour 15 minutes and costs around $120-150 USD."
    }
  ];

  const transferPrices = [
    { destination: "Downtown Dubai / Burj Khalifa", duration: "15-25 min", price: "$45-60" },
    { destination: "Palm Jumeirah", duration: "25-35 min", price: "$55-70" },
    { destination: "Dubai Marina / JBR", duration: "30-40 min", price: "$55-70" },
    { destination: "Jumeirah Beach Hotels", duration: "20-30 min", price: "$50-65" },
    { destination: "Business Bay", duration: "15-25 min", price: "$45-60" },
    { destination: "Abu Dhabi", duration: "75-90 min", price: "$120-150" },
  ];

  const popularAttractions = [
    { name: "Burj Khalifa", description: "World's tallest building at 828 meters" },
    { name: "Palm Jumeirah", description: "Iconic palm-shaped artificial island" },
    { name: "Dubai Mall", description: "One of the world's largest shopping malls" },
    { name: "Dubai Marina", description: "Stunning waterfront promenade and skyline" },
    { name: "Burj Al Arab", description: "Luxury sail-shaped hotel landmark" },
    { name: "Dubai Frame", description: "150m tall picture frame structure" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Dubai Airport Transfer Guide 2025 | DXB to Downtown, Palm Jumeirah, Marina | Meet Transfer"
        description="Complete Dubai Airport transfer guide. Private VIP transfers from DXB to Downtown Dubai, Palm Jumeirah, Dubai Marina from $45. Compare private transfer, taxi, metro options. 24/7 meet & greet, luxury Mercedes vehicles."
        keywords="Dubai airport transfer, DXB private transfer, Dubai Airport to Downtown, Palm Jumeirah transfer, Dubai VIP transfer, Dubai Airport taxi, Dubai luxury transfer, Dubai Marina transfer, Burj Khalifa transfer, JBR transfer, Business Bay transfer, Dubai Airport to hotel, DWC airport transfer, Al Maktoum airport"
        canonicalPath="/blog/dubai-airport-transfer-guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: 'Dubai Airport Transfer Guide 2025: Best Ways to Get to Downtown, Palm Jumeirah & Marina',
            description: 'Complete guide to Dubai Airport transfers. Compare private VIP transfers, taxis, metro, and ride-hailing. Fixed prices from $45 to Downtown Dubai, 24/7 service.',
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2024-12-26',
            dateModified: '2025-01-01',
            author: 'Meet Transfer',
            readingTime: '14',
          },
          {
            type: 'FAQPage',
            questions: faqItems.map(item => ({
              question: item.question,
              answer: item.answer
            }))
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Dubai Airport Transfer Guide', url: '/blog/dubai-airport-transfer-guide' },
            ],
          },
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
          <Badge variant="secondary" className="mb-4">Dubai</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Dubai Airport Transfer Guide 2025: Best Ways to Get to Your Hotel
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Complete guide to Dubai Airport transportation. Compare private VIP transfers, taxis, 
            metro, and ride-hailing options. Find the most comfortable way to reach Downtown Dubai, 
            Palm Jumeirah, or Dubai Marina.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              December 26, 2024
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              14 min read
            </span>
          </div>
        </header>

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
          <div className="text-center">
            <Sun className="h-20 w-20 text-amber-500 mx-auto mb-4" />
            <p className="text-2xl font-bold">Dubai VIP Transfers</p>
            <p className="text-muted-foreground">Luxury Airport Transportation</p>
          </div>
        </div>

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>Introduction: Welcome to Dubai</h2>
          <p>
            Dubai International Airport (DXB) is one of the busiest airports in the world, serving as 
            a major hub for international travel. Located just 4.6 kilometers from the city center, 
            DXB handles over 80 million passengers annually. Whether you're visiting for business, 
            luxury shopping, or to experience the city's world-famous attractions, choosing the right 
            airport transfer is essential for starting your Dubai journey on the right note.
          </p>
          <p>
            In this comprehensive guide, we'll explore all transportation options from Dubai Airport 
            to popular destinations including Downtown Dubai, Palm Jumeirah, Dubai Marina, and beyond. 
            We'll help you choose the best option for your needs and budget.
          </p>

          <h2>Dubai Airport Overview</h2>
          <p>
            Dubai has two international airports:
          </p>
          <ul>
            <li><strong>Dubai International Airport (DXB):</strong> The main airport with 3 terminals. Terminal 3 is the world's largest building by floor space and serves as Emirates Airlines' hub.</li>
            <li><strong>Dubai World Central (DWC):</strong> Also known as Al Maktoum International, this newer airport is located 37km from the city center and handles some budget airlines.</li>
          </ul>

          <h2>Transfer Prices from Dubai Airport</h2>
          <p>
            Here are the current private transfer prices from Dubai International Airport:
          </p>

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
                {transferPrices.map((item, index) => (
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
            A <Link to={getLocalizedPath("/dubai-transfer")} className="text-primary hover:underline">private VIP transfer</Link> is 
            the most comfortable and efficient way to travel from Dubai Airport. This premium service 
            is particularly popular among business travelers, families, and those seeking a seamless 
            arrival experience.
          </p>

          <h3>What's Included in Private Transfer</h3>
          <ul>
            <li>Meet & Greet at the arrivals hall with your name sign</li>
            <li>Professional English-speaking driver</li>
            <li>Luxury Mercedes or BMW vehicles</li>
            <li>Complimentary water and WiFi</li>
            <li>Real-time flight tracking</li>
            <li>Child seats available upon request</li>
            <li>No waiting, no meter, fixed price</li>
          </ul>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Why Choose Private Transfer in Dubai?
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Skip the taxi queue (can be 30+ minutes)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Air-conditioned luxury vehicle</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Perfect for Dubai's hot weather</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>24/7 availability</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>Option 2: Dubai Metro</h2>
          <p>
            The Dubai Metro Red Line connects Dubai Airport to the city center. It's an affordable 
            option but has limitations:
          </p>
          <ul>
            <li><strong>Terminals:</strong> Metro stations at Terminal 1 and Terminal 3 only</li>
            <li><strong>Operating Hours:</strong> 5:00 AM - Midnight (Friday: 10:00 AM start)</li>
            <li><strong>Price:</strong> AED 6-15 ($1.60-4 USD) depending on distance</li>
            <li><strong>Limitation:</strong> No direct access to Palm Jumeirah or Dubai Marina JBR</li>
          </ul>

          <h2>Option 3: Taxi</h2>
          <p>
            Official RTA taxis are available outside all terminals. They use meters with regulated fares:
          </p>
          <ul>
            <li><strong>Airport flag charge:</strong> AED 25 ($7 USD)</li>
            <li><strong>Per km:</strong> AED 2.19 ($0.60 USD)</li>
            <li><strong>To Downtown:</strong> AED 60-80 ($16-22 USD)</li>
            <li><strong>To Palm Jumeirah:</strong> AED 100-130 ($27-35 USD)</li>
          </ul>

          <h2>Option 4: Ride-Hailing Apps</h2>
          <p>
            Uber and Careem operate in Dubai and can be booked from the airport. Prices are similar 
            to taxis but with the convenience of app-based booking.
          </p>

          <h2>Popular Dubai Destinations</h2>
          <div className="not-prose my-8 grid md:grid-cols-2 gap-4">
            {popularAttractions.map((attraction, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    {attraction.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{attraction.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2>Which Option Should You Choose?</h2>
          
          <h3>Choose Private Transfer If:</h3>
          <ul>
            <li>You're traveling with family or a group</li>
            <li>You have heavy luggage</li>
            <li>You're arriving during hot summer months (40°C+)</li>
            <li>You value comfort and convenience</li>
            <li>Your hotel is in Palm Jumeirah or Dubai Marina</li>
          </ul>

          <h3>Choose Metro If:</h3>
          <ul>
            <li>You're on a tight budget</li>
            <li>You're traveling solo with light luggage</li>
            <li>Your hotel is near a metro station</li>
            <li>You're arriving during metro operating hours</li>
          </ul>

          <h2>Tips for Dubai Airport Arrival</h2>
          <ol>
            <li><strong>Pre-book your transfer:</strong> Especially during peak season (November-March)</li>
            <li><strong>Check visa requirements:</strong> Most nationalities get visa on arrival</li>
            <li><strong>Dress code:</strong> Dubai is liberal but respect local customs</li>
            <li><strong>Currency:</strong> UAE Dirham (AED), USD widely accepted</li>
            <li><strong>Time zone:</strong> GMT+4</li>
          </ol>

          <h2>Book Your Dubai Airport Transfer</h2>
          <p>
            Ready to experience luxury transportation in Dubai? Book your private VIP transfer 
            today and start your Dubai adventure in style.
          </p>
        </div>

        {/* CTA Section */}
        <div className="not-prose my-12 p-8 bg-primary/5 rounded-xl text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">
            Book Your Dubai Transfer Now
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Experience luxury VIP transfers in Dubai. Fixed prices, 24/7 service, and premium vehicles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/dubai-transfer")}>
              <Button size="lg" variant="accent" className="gap-2">
                View Dubai Transfers
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a 
              href="https://wa.me/15558051101?text=Hello, I need a transfer from Dubai Airport."
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
              to={getLocalizedPath("/blog/cyprus-airport-transfer-guide")}
              className="group p-4 border border-border rounded-lg hover:border-primary transition-colors"
            >
              <Badge variant="outline" className="mb-2">Cyprus</Badge>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                Cyprus Airport Transfer Guide 2025
              </h3>
            </Link>
            <Link 
              to={getLocalizedPath("/blog/istanbul-airport-to-city-best-way")}
              className="group p-4 border border-border rounded-lg hover:border-primary transition-colors"
            >
              <Badge variant="outline" className="mb-2">Istanbul</Badge>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                Best Way to Get from Istanbul Airport to City Center
              </h3>
            </Link>
          </div>
        </section>
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default DubaiAirportTransferGuide;