import { useLanguage } from "@/contexts/LanguageContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2 } from "lucide-react";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import vitoExteriorBlack from "@/assets/vito-exterior-black.jpg";

const BelekAirportTransferGuide = () => {
  const { getLocalizedPath } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    { question: "How far is Belek from Antalya Airport?", answer: "Belek is only 30-35 km from Antalya Airport (AYT). The drive takes approximately 25-35 minutes via the highway, making it one of the quickest airport transfers in the Antalya region." },
    { question: "How much is a private transfer from Antalya Airport to Belek?", answer: "A Mercedes Vito transfer from Antalya Airport to Belek starts from €40. Fixed price includes meet & greet, flight tracking, and door-to-door service. Book a round trip for 25% discount." },
    { question: "Is there a shuttle from Antalya Airport to Belek?", answer: "While shared shuttles exist, they make multiple hotel stops adding 1-2 hours. A private transfer gets you to Belek in 25-35 minutes with door-to-door service at a competitive fixed price." },
    { question: "Can I pre-book a transfer to Belek golf resorts?", answer: "Yes! We provide direct transfers to all Belek golf resorts including Regnum Carya, Cornelia, Sueno, Gloria, Calista, and more. Your driver will drop you directly at the resort entrance." },
    { question: "What vehicles are available for Belek transfers?", answer: "Standard Sedan (3 pax), Mercedes Vito (6 pax), VIP Mercedes Vito (6 pax), Mercedes Maybach (3 pax), and Mercedes Sprinter (13 pax). Perfect for golf groups!" },
    { question: "Is there a night transfer to Belek?", answer: "Yes, we operate 24/7 with no surge pricing. Late-night and early-morning transfers to Belek are available at the same fixed price." },
  ];

  const tocItems = [
    { id: "about", title: "About Belek" },
    { id: "why-private", title: "Why Private Transfer?" },
    { id: "prices", title: "Prices & Routes" },
    { id: "resorts", title: "Belek Resorts & Golf" },
    { id: "included", title: "What's Included" },
  ];

  const routes = [
    { area: "Antalya Airport → Belek Center", distance: "33 km", time: "25-30 min", price: "€40" },
    { area: "Antalya Airport → Belek Golf Zone", distance: "35 km", time: "30-35 min", price: "€42" },
    { area: "Antalya Airport → Kadriye", distance: "30 km", time: "25 min", price: "€38" },
    { area: "Antalya Airport → Bogazkent", distance: "40 km", time: "35 min", price: "€44" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title="Belek Airport Transfer | Antalya Airport to Belek"
        description="Book private transfers from Antalya Airport to Belek in 25 minutes. Fixed prices to all Belek hotels, golf resorts, and beaches. Mercedes vehicles, 24/7 service."
        keywords="Belek airport transfer, Antalya to Belek transfer, Belek golf resort transfer, Belek private transfer, Antalya airport taxi Belek"
        canonicalPath="/blog/belek-airport-transfer-guide"
        ogType="article" articlePublishedTime="2025-02-01" articleModifiedTime="2025-02-01" articleSection="Travel Guide"
      />
      <SchemaOrg schemas={[
        { type: 'LocalBusiness' },
        { type: 'Article', headline: "Belek Airport Transfer Guide", description: "Guide to Antalya Airport to Belek transfers.", datePublished: '2025-02-01', dateModified: '2025-02-01', author: 'Meet Transfer', readingTime: '8', wordCount: 1400, keywords: ['Belek airport transfer', 'Antalya to Belek'] },
        { type: 'BreadcrumbList', items: [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: 'Belek Transfer', url: '/blog/belek-airport-transfer-guide' }] },
        { type: 'FAQPage', questions: faqItems.map(i => ({ question: i.question, answer: i.answer })) }
      ]} />

      <article className="mx-auto max-w-4xl px-3 py-8 sm:px-4 md:py-12">
        <Link to={getLocalizedPath("/blog")} className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground md:mb-8"><ArrowLeft className="h-4 w-4" /> Back to Blog</Link>

        <header className="mb-8 md:mb-12">
          <Badge variant="secondary" className="mb-3">Belek</Badge>
          <h1 className="mb-4 font-serif text-2xl font-bold leading-tight sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl">Belek Airport Transfer: Antalya Airport to Belek in 25 Minutes</h1>
          <p className="mb-4 text-base text-muted-foreground sm:text-lg md:mb-6 md:text-xl">Fast, comfortable private transfers from Antalya Airport directly to your Belek hotel or golf resort. Fixed prices with no hidden fees.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatBlogDate("2025-02-01")}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 8 min read</span>
          </div>
        </header>

        <ShareButtons title="Belek Airport Transfer Guide" className="mb-8" />
        <OptimizedBlogImage src={vitoExteriorBlack} alt="Private transfer to Belek golf resorts" aspectRatio="video" priority className="mb-6 rounded-lg md:mb-8 md:rounded-xl" />
        <TableOfContents items={tocItems} />

        <div className="prose prose-sm dark:prose-invert max-w-none sm:prose-base md:prose-lg">
          <h2 id="about">About Belek</h2>
          <p>Belek is Turkey's premier golf and luxury resort destination, located just 30 km east of Antalya Airport. Known for its world-class golf courses, 5-star all-inclusive resorts, and pristine sandy beaches, Belek attracts visitors from across Europe year-round.</p>

          <h2 id="why-private">Why Choose a Private Transfer?</h2>
          <ul>
            <li><strong>Fastest option:</strong> Direct 25-minute ride vs 1-2 hour shared shuttle</li>
            <li><strong>Golf-friendly:</strong> Spacious vehicles for golf bags and equipment</li>
            <li><strong>Fixed prices:</strong> No surprises — pay what you see</li>
            <li><strong>Resort drop-off:</strong> Directly to your resort lobby</li>
            <li><strong>Flight tracking:</strong> We adjust for delays automatically</li>
          </ul>

          <h2 id="prices">Transfer Prices</h2>
          <div className="not-prose my-8 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Route</TableHead><TableHead>Distance</TableHead><TableHead>Duration</TableHead><TableHead>From</TableHead></TableRow></TableHeader>
              <TableBody>{routes.map((r, i) => (<TableRow key={i}><TableCell className="font-medium">{r.area}</TableCell><TableCell>{r.distance}</TableCell><TableCell>{r.time}</TableCell><TableCell className="font-semibold text-primary">{r.price}</TableCell></TableRow>))}</TableBody>
            </Table>
          </div>

          <h2 id="resorts">Popular Belek Resorts We Serve</h2>
          <p>We provide transfers to all Belek resorts including Regnum Carya, Cornelia Golf Resort, Sueno Hotels, Gloria Golf Resort, Calista Luxury Resort, Maxx Royal, Rixos Premium, and many more.</p>

          <h2 id="included">What's Included</h2>
          <div className="not-prose my-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> All Transfers Include</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {["Meet & greet at arrivals", "Free flight tracking", "Professional driver", "Mercedes vehicles", "Free baby seat", "Fixed price guaranteed"].map((item, i) => (
                  <div key={i} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" /><span>{item}</span></div>
                ))}
              </CardContent>
            </Card>
          </div>

          <h2>Book Your Belek Transfer</h2>
          <p><Link to={getLocalizedPath("/book")} className="text-primary hover:underline">Book now</Link> — instant confirmation, fixed prices.</p>
        </div>

        <BlogCTA destination="Belek" />

        <section className="my-8 md:my-12">
          <h2 className="mb-6 font-serif text-xl font-bold sm:text-2xl md:mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4 md:space-y-6">
            {faqItems.map((item, i) => (<div key={i} className="border-b border-border pb-6 last:border-0"><h3 className="mb-2 text-lg font-semibold">{item.question}</h3><p className="text-muted-foreground">{item.answer}</p></div>))}
          </div>
        </section>
        <RelatedArticles currentArticleId="belek-airport-transfer-guide" />
      </article>
      <Footer />
    </WebsiteLayout>
  );
};

export default BelekAirportTransferGuide;
