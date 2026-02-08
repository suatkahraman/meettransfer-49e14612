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

const SideAirportTransferGuide = () => {
  const { getLocalizedPath } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    { question: "How far is Side from Antalya Airport?", answer: "Side is approximately 65 km from Antalya Airport (AYT). The transfer takes about 50-70 minutes via the D400 highway." },
    { question: "How much does a private transfer from Antalya to Side cost?", answer: "A Mercedes Vito transfer starts from €55. Fixed price with no hidden fees, meet & greet, and flight tracking included." },
    { question: "Can I get a transfer to Manavgat?", answer: "Yes, we provide transfers to Side, Manavgat, Sorgun, Titreyengöl, Evrenseki, Çolaklı, and Kumköy areas." },
    { question: "Is there a night transfer to Side?", answer: "Yes, 24/7 transfers with no surge pricing. We track your flight for delays." },
    { question: "What's the fastest way from Antalya Airport to Side?", answer: "A private transfer is the fastest option at 50-70 minutes. Shared shuttles can take 2-3 hours with multiple stops." },
    { question: "Do you transfer to Side hotels?", answer: "Yes, door-to-door service to all Side hotels, resorts, and any address. Just provide the name and we'll take you there." },
  ];

  const tocItems = [
    { id: "about", title: "About Side" },
    { id: "why-private", title: "Why Private Transfer?" },
    { id: "prices", title: "Prices" },
    { id: "areas", title: "Side Areas" },
    { id: "included", title: "What's Included" },
  ];

  const routes = [
    { area: "Antalya Airport → Side Center", distance: "65 km", time: "50-60 min", price: "€55" },
    { area: "Antalya Airport → Manavgat", distance: "70 km", time: "55-65 min", price: "€55" },
    { area: "Antalya Airport → Sorgun", distance: "68 km", time: "55 min", price: "€55" },
    { area: "Antalya Airport → Titreyengöl", distance: "72 km", time: "60 min", price: "€58" },
    { area: "Antalya Airport → Evrenseki", distance: "75 km", time: "60-70 min", price: "€58" },
    { area: "Antalya Airport → Çolaklı/Kumköy", distance: "60 km", time: "50 min", price: "€52" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title="Side Airport Transfer | Antalya Airport to Side"
        description="Private airport transfers from Antalya to Side, Manavgat & Sorgun. Fixed prices, Mercedes vehicles, meet & greet. Book online for instant confirmation."
        keywords="Side airport transfer, Antalya to Side transfer, Side private transfer, Manavgat transfer, Sorgun transfer, Antalya airport taxi Side"
        canonicalPath="/blog/side-airport-transfer-guide"
        ogType="article" articlePublishedTime="2025-02-01" articleModifiedTime="2025-02-01" articleSection="Travel Guide"
      />
      <SchemaOrg schemas={[
        { type: 'LocalBusiness' },
        { type: 'Article', headline: "Side Airport Transfer Guide", description: "Guide to Antalya Airport to Side transfers.", datePublished: '2025-02-01', dateModified: '2025-02-01', author: 'Meet Transfer', readingTime: '8', wordCount: 1400, keywords: ['Side airport transfer', 'Antalya to Side'] },
        { type: 'BreadcrumbList', items: [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: 'Side Transfer', url: '/blog/side-airport-transfer-guide' }] },
        { type: 'FAQPage', questions: faqItems.map(i => ({ question: i.question, answer: i.answer })) }
      ]} />

      <article className="mx-auto max-w-4xl px-3 py-8 sm:px-4 md:py-12">
        <Link to={getLocalizedPath("/blog")} className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground md:mb-8"><ArrowLeft className="h-4 w-4" /> Back to Blog</Link>

        <header className="mb-8 md:mb-12">
          <Badge variant="secondary" className="mb-3">Side</Badge>
          <h1 className="mb-4 font-serif text-2xl font-bold leading-tight sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl">Side Airport Transfer: Antalya Airport to Side & Manavgat</h1>
          <p className="mb-4 text-base text-muted-foreground sm:text-lg md:mb-6 md:text-xl">Private transfers from Antalya Airport to Side's ancient ruins, beautiful beaches, and all-inclusive resorts. Fixed prices, professional service.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatBlogDate("2025-02-01")}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 8 min read</span>
          </div>
        </header>

        <ShareButtons title="Side Airport Transfer Guide" className="mb-8" />
        <OptimizedBlogImage src={vitoExteriorBlack} alt="Private transfer to Side, Turkey" aspectRatio="video" priority className="mb-6 rounded-lg md:mb-8 md:rounded-xl" />
        <TableOfContents items={tocItems} />

        <div className="prose prose-sm dark:prose-invert max-w-none sm:prose-base md:prose-lg">
          <h2 id="about">About Side</h2>
          <p>Side is one of Turkey's most enchanting ancient cities, where Greco-Roman ruins meet golden beaches on the Mediterranean coast. The iconic Temple of Apollo, ancient theatre, and charming old town create a magical backdrop for your Turkish Riviera holiday.</p>

          <h2 id="why-private">Why Private Transfer?</h2>
          <ul>
            <li><strong>Direct route:</strong> 50-60 minutes vs 2-3 hour shared shuttles</li>
            <li><strong>Door-to-door:</strong> Straight to your hotel entrance</li>
            <li><strong>Fixed prices:</strong> No meter, no bargaining</li>
            <li><strong>Flight tracking:</strong> Automatic delay adjustments</li>
          </ul>

          <h2 id="prices">Transfer Prices</h2>
          <div className="not-prose my-8 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Route</TableHead><TableHead>Distance</TableHead><TableHead>Duration</TableHead><TableHead>From</TableHead></TableRow></TableHeader>
              <TableBody>{routes.map((r, i) => (<TableRow key={i}><TableCell className="font-medium">{r.area}</TableCell><TableCell>{r.distance}</TableCell><TableCell>{r.time}</TableCell><TableCell className="font-semibold text-primary">{r.price}</TableCell></TableRow>))}</TableBody>
            </Table>
          </div>

          <h2 id="areas">Side & Manavgat Areas</h2>
          <ul>
            <li><strong>Side Old Town:</strong> Ancient ruins, boutique hotels, seafood restaurants</li>
            <li><strong>Sorgun:</strong> Pine forest resort area, luxury hotels</li>
            <li><strong>Titreyengöl:</strong> Scenic lake area with premium resorts</li>
            <li><strong>Manavgat:</strong> Local town, famous waterfall nearby</li>
            <li><strong>Evrenseki:</strong> Family resort area</li>
          </ul>

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

          <p><Link to={getLocalizedPath("/book")} className="text-primary hover:underline">Book your Side airport transfer now</Link></p>
        </div>

        <BlogCTA destination="Side" />
        <section className="my-8 md:my-12">
          <h2 className="mb-6 font-serif text-xl font-bold sm:text-2xl md:mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4 md:space-y-6">
            {faqItems.map((item, i) => (<div key={i} className="border-b border-border pb-6 last:border-0"><h3 className="mb-2 text-lg font-semibold">{item.question}</h3><p className="text-muted-foreground">{item.answer}</p></div>))}
          </div>
        </section>
        <RelatedArticles currentArticleId="side-airport-transfer-guide" />
      </article>
      <Footer />
    </WebsiteLayout>
  );
};

export default SideAirportTransferGuide;
