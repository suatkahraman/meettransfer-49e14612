import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2 } from "lucide-react";
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

const IstanbulTransferPriceGuide = () => {
  const { getLocalizedPath } = useLanguage();

  const faqItems = [
    {
      question: "How much does a private transfer from Istanbul Airport cost?",
      answer: "Private transfer prices from Istanbul Airport range from $55-75 for standard destinations like Taksim or Sultanahmet. Prices vary based on vehicle type and destination distance."
    },
    {
      question: "Are Istanbul Airport transfer prices fixed?",
      answer: "Yes, reputable transfer companies like Meet Transfer offer fixed prices with no hidden fees. The price you're quoted is the price you pay, regardless of traffic conditions."
    },
    {
      question: "Is it cheaper to take a taxi or private transfer?",
      answer: "Taxis appear cheaper at first ($20-30) but can vary with traffic. Private transfers ($55-75) offer fixed pricing, better service, and are more cost-effective for groups of 2 or more."
    },
    {
      question: "Do private transfers include all fees?",
      answer: "Yes, our prices include meet & greet service, luggage assistance, parking fees, tolls, and complimentary water. There are no additional charges."
    },
    {
      question: "What factors affect transfer prices?",
      answer: "Main factors include: destination distance, vehicle type (sedan, van, minibus), time of booking, and number of passengers. Group bookings often offer better value per person."
    },
    {
      question: "Are there discounts for round-trip bookings?",
      answer: "Yes, most transfer companies offer discounts for round-trip bookings. Contact us directly for the best rates on return transfers."
    }
  ];

  const priceData = [
    { destination: "Taksim / Beyoğlu", taxi: "600-800 TL ($20-25)", private: "$55-65", bus: "150 TL ($5)" },
    { destination: "Sultanahmet", taxi: "650-850 TL ($21-27)", private: "$55-65", bus: "150 TL ($5)" },
    { destination: "Kadıköy", taxi: "800-1000 TL ($26-32)", private: "$70-85", bus: "180 TL ($6)" },
    { destination: "Beşiktaş", taxi: "600-750 TL ($19-24)", private: "$55-65", bus: "150 TL ($5)" },
    { destination: "Galataport Cruise Terminal", taxi: "600-800 TL ($20-25)", private: "$55-65", bus: "N/A" },
    { destination: "Sabiha Gökçen Airport", taxi: "1500-2000 TL ($48-65)", private: "$120-150", bus: "N/A" },
    { destination: "Bursa (via ferry)", taxi: "N/A", private: "$180-220", bus: "N/A" },
  ];

  const vehiclePrices = [
    { vehicle: "Mercedes Vito (up to 6 pax)", toTaksim: "$55-65", toKadikoy: "$70-85", toBursa: "$180-220" },
    { vehicle: "Mercedes V-Class VIP (up to 6 pax)", toTaksim: "$75-90", toKadikoy: "$90-110", toBursa: "$220-280" },
    { vehicle: "Mercedes Maybach (up to 3 pax)", toTaksim: "$150-200", toKadikoy: "$180-220", toBursa: "$350-450" },
    { vehicle: "Mercedes Sprinter (up to 16 pax)", toTaksim: "$120-150", toKadikoy: "$140-180", toBursa: "$300-380" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Istanbul Airport Transfer Price Guide 2025 | Compare All Options"
        description="Updated Istanbul Airport transfer prices for 2025. Compare private transfer, taxi, and bus costs. Fixed pricing, no hidden fees. Prices to Taksim, Sultanahmet, Kadıköy and more."
        keywords="Istanbul Airport transfer price, IST transfer cost, Istanbul taxi fare, private transfer Istanbul price, Istanbul Airport to Taksim price, airport transfer pricing Turkey"
        canonicalPath="/blog/istanbul-airport-transfer-price-guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: 'Istanbul Airport Transfer Price Guide 2025',
            description: 'Updated Istanbul Airport transfer prices for 2025. Compare private transfer, taxi, and bus costs. Fixed pricing, no hidden fees.',
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2024-12-10',
            dateModified: '2025-12-31',
            author: 'Meet Transfer',
            readingTime: '10',
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
          <Badge variant="secondary" className="mb-4">Price Guide</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Istanbul Airport Transfer Price Guide 2025
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Complete pricing breakdown for Istanbul Airport transfers. Compare private transfers, 
            taxis, and shuttle buses. Updated prices for all major destinations with no hidden fees.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              December 10, 2024
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              10 min read
            </span>
          </div>
        </header>

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12">
          <img 
            src="/images/meet-transfer-vip-mercedes-vito.jpg" 
            alt="Mercedes Vito VIP Transfer Istanbul"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>Understanding Istanbul Airport Transfer Pricing</h2>
          <p>
            Planning your transportation from Istanbul Airport (IST) to the city? Understanding the 
            true cost of different transfer options is crucial for budgeting your trip. In this 
            comprehensive guide, we break down all pricing options, hidden fees to watch for, and 
            how to get the best value for your money.
          </p>
          <p>
            Istanbul Airport is located approximately 40 kilometers from the city center, and transfer 
            prices can vary significantly depending on your chosen method of transportation, time of 
            day, and final destination.
          </p>

          <h2>Complete Price Comparison by Destination</h2>
          <p>
            Here's a detailed breakdown of prices from Istanbul Airport to all major destinations:
          </p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead>Taxi (Metered)</TableHead>
                  <TableHead>Private Transfer</TableHead>
                  <TableHead>Havaist Bus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.destination}</TableCell>
                    <TableCell>{row.taxi}</TableCell>
                    <TableCell className="text-primary font-semibold">{row.private}</TableCell>
                    <TableCell>{row.bus}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground">
            *Prices are approximate and may vary. Taxi prices are estimates based on typical traffic conditions. 
            Private transfer prices are fixed regardless of traffic.
          </p>

          <h2>Private Transfer Pricing by Vehicle Type</h2>
          <p>
            At <Link to={getLocalizedPath("/fleet")} className="text-primary hover:underline">Meet Transfer</Link>, 
            we offer a range of vehicles to suit every need and budget. Here's our complete vehicle pricing:
          </p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>To Taksim</TableHead>
                  <TableHead>To Kadıköy</TableHead>
                  <TableHead>To Bursa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehiclePrices.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.vehicle}</TableCell>
                    <TableCell>{row.toTaksim}</TableCell>
                    <TableCell>{row.toKadikoy}</TableCell>
                    <TableCell>{row.toBursa}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h2>What's Included in Private Transfer Prices?</h2>
          <p>
            When you book a private transfer with Meet Transfer, our prices include everything:
          </p>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  All-Inclusive Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Meet & Greet with name board</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Luggage assistance</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>All tolls and parking fees</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Complimentary water</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Free WiFi onboard</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Flight tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Up to 60 min free waiting time</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Child seats (on request)</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>Hidden Costs to Watch For</h2>
          <p>
            When comparing prices, be aware of potential hidden costs with other options:
          </p>

          <h3>Taxi Hidden Costs</h3>
          <ul>
            <li><strong>Night tariff:</strong> 50% surcharge between 00:00-06:00</li>
            <li><strong>Traffic delays:</strong> Meter keeps running in traffic jams</li>
            <li><strong>Wrong routes:</strong> Some drivers take longer routes</li>
            <li><strong>Bridge tolls:</strong> May be added on top of meter fare</li>
            <li><strong>Payment fees:</strong> Some charge extra for card payments</li>
          </ul>

          <h3>Bus Hidden Costs</h3>
          <ul>
            <li><strong>Last mile transport:</strong> Need taxi/metro to final destination</li>
            <li><strong>Luggage handling:</strong> No assistance provided</li>
            <li><strong>Time cost:</strong> Significantly longer journey times</li>
          </ul>

          <h2>When is Private Transfer Most Cost-Effective?</h2>
          <p>
            Private transfers become more economical in several situations:
          </p>
          <ul>
            <li><strong>Groups of 2+:</strong> Split the cost and it's comparable to taxi per person</li>
            <li><strong>Night arrivals:</strong> Taxi night tariff makes private transfer better value</li>
            <li><strong>Peak traffic times:</strong> Fixed price vs. running meter</li>
            <li><strong>Distant destinations:</strong> Especially Bursa, Sapanca, or Asian side</li>
            <li><strong>Family travel:</strong> Child seats, extra luggage, comfort</li>
          </ul>

          <h2>How to Get the Best Price</h2>
          <p>
            Follow these tips to get the best value for your Istanbul Airport transfer:
          </p>
          <ol>
            <li><strong>Book in advance:</strong> Last-minute bookings may cost more</li>
            <li><strong>Book round-trip:</strong> Discounts available for return transfers</li>
            <li><strong>Choose appropriate vehicle:</strong> Don't overpay for a larger vehicle you don't need</li>
            <li><strong>Request direct quotes:</strong> Some companies offer better prices via WhatsApp</li>
            <li><strong>Check reviews:</strong> Cheapest isn't always best - quality matters</li>
          </ol>

          <h2>Price Updates and Currency</h2>
          <p>
            Our prices are quoted in USD for international travelers' convenience. However, we accept 
            payment in:
          </p>
          <ul>
            <li>USD (US Dollars)</li>
            <li>EUR (Euros)</li>
            <li>GBP (British Pounds)</li>
            <li>TRY (Turkish Lira)</li>
            <li>Credit/Debit Cards</li>
          </ul>
          <p>
            Exchange rates for cash payments are calculated at the day's rate. Card payments are processed 
            in your home currency by your bank.
          </p>

          <h2>Conclusion: Getting the Best Value</h2>
          <p>
            When it comes to Istanbul Airport transfers, the "cheapest" option isn't always the best value. 
            Consider the total experience: comfort, reliability, safety, and stress-free travel. A 
            <Link to={getLocalizedPath("/istanbul-transfer")} className="text-primary hover:underline"> private 
            transfer</Link> offers the best overall value, especially for families, groups, and anyone 
            who values their time and comfort.
          </p>
          <p>
            <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">Request your 
            personalized quote</Link> today and discover why thousands of travelers choose Meet Transfer 
            for their Istanbul Airport transportation needs.
          </p>
        </div>

        {/* CTA Section */}
        <div className="my-12 p-8 bg-primary/5 rounded-2xl text-center">
          <h3 className="font-serif text-2xl font-bold mb-4">
            Get Your Personalized Quote
          </h3>
          <p className="text-muted-foreground mb-6">
            Fixed prices, no hidden fees. Response within minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/book")}>
              <Button size="lg" variant="accent" className="gap-2">
                Request Price
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a 
              href="https://wa.me/905321748390?text=Hello, I need a price quote for Istanbul Airport transfer."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline">
                WhatsApp Quote
              </Button>
            </a>
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
              to={getLocalizedPath("/blog/istanbul-airport-to-city-best-way")}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <h4 className="font-semibold mb-1">Best Way to Get from Istanbul Airport to City</h4>
              <p className="text-sm text-muted-foreground">Compare all transportation options</p>
            </Link>
            <Link 
              to={getLocalizedPath("/blog/is-private-transfer-worth-it-turkey")}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <h4 className="font-semibold mb-1">Is Private Transfer Worth It in Turkey?</h4>
              <p className="text-sm text-muted-foreground">Cost-benefit analysis for travelers</p>
            </Link>
          </div>
        </section>
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default IstanbulTransferPriceGuide;
