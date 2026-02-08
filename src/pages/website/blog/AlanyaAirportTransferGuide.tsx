import { useLanguage } from "@/contexts/LanguageContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, MapPin } from "lucide-react";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";
import BlogImageGallery from "@/components/website/BlogImageGallery";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import vitoExteriorBlack from "@/assets/vito-exterior-black.jpg";
import vitoFamilyInterior from "@/assets/vito-family-interior.jpg";
import sprinterLuggage from "@/assets/sprinter-luggage.jpg";
import vitoVipPassengersDay from "@/assets/vito-vip-passengers-day.jpg";

const AlanyaAirportTransferGuide = () => {
  const { getLocalizedPath } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    { question: "How far is Alanya from Antalya Airport?", answer: "Alanya is approximately 130 km from Antalya Airport (AYT). The drive takes about 1.5-2 hours via the D400 highway. There's also Gazipaşa-Alanya Airport (GZP), only 40 km from the city center." },
    { question: "Which airport is closest to Alanya?", answer: "Gazipaşa-Alanya Airport (GZP) is the closest at just 40 km. However, Antalya Airport (AYT) has significantly more international flight connections. We provide transfers from both airports." },
    { question: "How much does a transfer from Antalya Airport to Alanya cost?", answer: "A private Mercedes Vito transfer from Antalya Airport to Alanya starts from €70. The price includes meet & greet, flight tracking, and door-to-door service. Round-trip bookings get 25% off the return." },
    { question: "Is there a night transfer service to Alanya?", answer: "Yes, we provide 24/7 transfers to Alanya from both Antalya and Gazipaşa airports. Night transfers have the same fixed price — no surge pricing. We track your flight for delays." },
    { question: "Can I book a transfer to Alanya hotels and resorts?", answer: "Absolutely! We offer door-to-door service to any hotel, resort, or address in Alanya including Cleopatra Beach, Damlataş, Mahmutlar, Oba, Tosmur, Kestel, and Kargıcak areas." },
    { question: "What vehicles are available for Alanya transfers?", answer: "We offer Standard Sedan, Mercedes Vito, VIP Mercedes Vito, Mercedes Maybach, and Mercedes Sprinter. All vehicles are air-conditioned with professional drivers." },
  ];

  const tocItems = [
    { id: "about-alanya", title: "About Alanya & Airports" },
    { id: "why-private", title: "Why Private Transfer?" },
    { id: "prices", title: "Transfer Prices" },
    { id: "destinations", title: "Popular Destinations" },
    { id: "included", title: "What's Included" },
  ];

  const routes = [
    { area: "Antalya Airport → Alanya Center", distance: "130 km", time: "1.5-2 hrs", price: "€70" },
    { area: "Antalya Airport → Mahmutlar", distance: "145 km", time: "2 hrs", price: "€75" },
    { area: "Antalya Airport → Oba/Tosmur", distance: "125 km", time: "1.5 hrs", price: "€68" },
    { area: "Gazipaşa Airport → Alanya Center", distance: "40 km", time: "40 min", price: "€40" },
    { area: "Gazipaşa Airport → Mahmutlar", distance: "25 km", time: "25 min", price: "€35" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title="Alanya Airport Transfer | Antalya & Gazipaşa"
        description="Private airport transfers to Alanya from Antalya and Gazipaşa airports. Fixed prices, Mercedes vehicles, meet & greet service. Book online instantly."
        keywords="Alanya airport transfer, Antalya to Alanya transfer, Gazipaşa Alanya transfer, Alanya private transfer, Alanya airport taxi, Mahmutlar transfer"
        canonicalPath="/blog/alanya-airport-transfer-guide"
        ogType="article"
        articlePublishedTime="2025-02-01"
        articleModifiedTime="2025-02-01"
        articleSection="Travel Guide"
      />
      <SchemaOrg schemas={[
        { type: 'LocalBusiness' },
        { type: 'Article', headline: "Alanya Airport Transfer Guide", description: "Complete guide to airport transfers to Alanya.", datePublished: '2025-02-01', dateModified: '2025-02-01', author: 'Meet Transfer', readingTime: '10', wordCount: 1600, keywords: ['Alanya airport transfer', 'Antalya to Alanya'] },
        { type: 'BreadcrumbList', items: [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: 'Alanya Airport Transfer', url: '/blog/alanya-airport-transfer-guide' }] },
        { type: 'FAQPage', questions: faqItems.map(item => ({ question: item.question, answer: item.answer })) }
      ]} />

      <article className="mx-auto max-w-4xl px-3 py-8 sm:px-4 md:py-12">
        <Link to={getLocalizedPath("/blog")} className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground md:mb-8">
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Back to Blog
        </Link>

        <header className="mb-8 md:mb-12">
          <Badge variant="secondary" className="mb-3 md:mb-4">Alanya</Badge>
          <h1 className="mb-4 font-serif text-2xl font-bold leading-tight sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl">
            Alanya Airport Transfer Guide: Antalya & Gazipaşa
          </h1>
          <p className="mb-4 text-base text-muted-foreground sm:text-lg md:mb-6 md:text-xl">
            Complete guide to private airport transfers to Alanya — one of Turkey's most popular resort destinations. Door-to-door service from both Antalya and Gazipaşa airports.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatBlogDate("2025-02-01")}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 10 min read</span>
          </div>
        </header>

        <ShareButtons title="Alanya Airport Transfer Guide" className="mb-8" />
        <OptimizedBlogImage src={vitoExteriorBlack} alt="Private transfer vehicle for Alanya airport transfers" aspectRatio="video" priority className="mb-6 rounded-lg md:mb-8 md:rounded-xl" />
        <TableOfContents items={tocItems} />

        <div className="prose prose-sm dark:prose-invert max-w-none sm:prose-base md:prose-lg">
          <h2 id="about-alanya">About Alanya & Airport Options</h2>
          <p>Alanya is a vibrant resort city on Turkey's southern Mediterranean coast, famous for its Cleopatra Beach, the historic Alanya Castle, and a bustling nightlife scene. With over 300 sunny days per year, it's a year-round destination for beach lovers.</p>
          <p>Two airports serve Alanya: <strong>Antalya Airport (AYT)</strong> — the main international hub at 130 km — and <strong>Gazipaşa-Alanya Airport (GZP)</strong> — a smaller regional airport only 40 km from the city center.</p>

          <h2 id="why-private">Why Choose a Private Transfer?</h2>
          <ul>
            <li><strong>Skip the hassle:</strong> No shared shuttles with multiple hotel stops</li>
            <li><strong>Fixed prices:</strong> Pay what you see — no meter, no surprises</li>
            <li><strong>Door-to-door:</strong> Direct to your hotel, resort, or villa</li>
            <li><strong>Flight tracking:</strong> Driver adjusts for delays automatically</li>
            <li><strong>24/7 service:</strong> Available for all flight arrival times</li>
          </ul>

          <h2 id="prices">Transfer Prices & Routes</h2>
          <div className="not-prose my-8 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Route</TableHead><TableHead>Distance</TableHead><TableHead>Duration</TableHead><TableHead>From</TableHead></TableRow></TableHeader>
              <TableBody>
                {routes.map((r, i) => (
                  <TableRow key={i}><TableCell className="font-medium">{r.area}</TableCell><TableCell>{r.distance}</TableCell><TableCell>{r.time}</TableCell><TableCell className="font-semibold text-primary">{r.price}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground">* Prices for Mercedes Vito. Sedan, VIP, and Sprinter options available.</p>

          <h2 id="destinations">Popular Alanya Destinations</h2>
          <p>We provide transfers to all Alanya neighborhoods and nearby areas including:</p>
          <ul>
            <li><strong>Cleopatra Beach & Damlataş:</strong> The heart of Alanya tourism</li>
            <li><strong>Mahmutlar:</strong> Popular residential area east of center</li>
            <li><strong>Oba & Tosmur:</strong> Modern hotel districts</li>
            <li><strong>Kestel & Kargıcak:</strong> Quieter beach areas</li>
            <li><strong>Konaklı & Avsallar:</strong> Resort areas between Antalya and Alanya</li>
          </ul>

          <h2 id="included">What's Included</h2>
          <div className="not-prose my-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> All Transfers Include</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {["Meet & greet at airport arrivals", "Free flight tracking & waiting", "Professional English-speaking driver", "Air-conditioned Mercedes vehicles", "Free child/baby seat on request", "No hidden fees — fixed price guaranteed"].map((item, i) => (
                  <div key={i} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" /><span>{item}</span></div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="not-prose my-8">
            <BlogImageGallery images={[
              { src: vitoFamilyInterior, alt: "Mercedes Vito interior", caption: "Spacious Mercedes Vito" },
              { src: vitoExteriorBlack, alt: "Mercedes Vito exterior", caption: "Mercedes Vito — your Alanya transfer" },
              { src: sprinterLuggage, alt: "Sprinter for groups", caption: "Sprinter for larger groups" },
              { src: vitoVipPassengersDay, alt: "VIP transfer", caption: "VIP transfer experience" },
            ]} columns={2} />
          </div>

          <h2>Book Your Alanya Transfer</h2>
          <p><Link to={getLocalizedPath("/book")} className="text-primary hover:underline">Book your Alanya airport transfer now</Link> with instant confirmation and fixed prices.</p>
        </div>

        <BlogCTA destination="Alanya" />

        <section className="my-8 md:my-12">
          <h2 className="mb-6 font-serif text-xl font-bold sm:text-2xl md:mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4 md:space-y-6">
            {faqItems.map((item, i) => (
              <div key={i} className="border-b border-border pb-6 last:border-0">
                <h3 className="mb-2 text-lg font-semibold">{item.question}</h3>
                <p className="text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <RelatedArticles currentArticleId="alanya-airport-transfer-guide" />
      </article>
      <Footer />
    </WebsiteLayout>
  );
};

export default AlanyaAirportTransferGuide;
