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

const KemerAirportTransferGuide = () => {
  const { getLocalizedPath } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    { question: "How far is Kemer from Antalya Airport?", answer: "Kemer is approximately 55 km from Antalya Airport (AYT). The drive takes about 45-60 minutes along the scenic coastal road, passing through Antalya city." },
    { question: "How much does a private transfer to Kemer cost?", answer: "A Mercedes Vito transfer from Antalya Airport to Kemer starts from €48. Fixed price with meet & greet, flight tracking, and door-to-door service." },
    { question: "Can I get a transfer to Göynük or Çamyuva?", answer: "Yes, we provide transfers to all Kemer district areas including Göynük, Çamyuva, Tekirova, Beldibi, and Kiriş at fixed prices." },
    { question: "Is there a night transfer to Kemer?", answer: "Yes, 24/7 service with no extra charges for night transfers. Your driver tracks your flight automatically." },
    { question: "What vehicles are available?", answer: "Standard Sedan, Mercedes Vito, VIP Mercedes Vito, Mercedes Maybach, and Mercedes Sprinter — suitable for individuals, families, and groups." },
    { question: "Can you transfer to Olympos or Çıralı?", answer: "Yes, we offer transfers to Olympos and Çıralı from Antalya Airport. These beautiful spots are about 80-90 km from the airport." },
  ];

  const tocItems = [
    { id: "about", title: "About Kemer" },
    { id: "why-private", title: "Why Private Transfer?" },
    { id: "prices", title: "Prices & Routes" },
    { id: "areas", title: "Kemer Areas" },
    { id: "included", title: "What's Included" },
  ];

  const routes = [
    { area: "Antalya Airport → Kemer Center", distance: "55 km", time: "45-60 min", price: "€48" },
    { area: "Antalya Airport → Beldibi", distance: "40 km", time: "35 min", price: "€42" },
    { area: "Antalya Airport → Göynük", distance: "50 km", time: "40 min", price: "€45" },
    { area: "Antalya Airport → Çamyuva", distance: "60 km", time: "50 min", price: "€50" },
    { area: "Antalya Airport → Tekirova", distance: "70 km", time: "60 min", price: "€55" },
    { area: "Antalya Airport → Olympos/Çıralı", distance: "85 km", time: "75 min", price: "€65" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title="Kemer Airport Transfer | Antalya Airport to Kemer"
        description="Book private transfers from Antalya Airport to Kemer, Göynük, Çamyuva, Tekirova & Olympos. Fixed prices, Mercedes vehicles, 24/7 service."
        keywords="Kemer airport transfer, Antalya to Kemer transfer, Kemer private transfer, Göynük transfer, Çamyuva transfer, Tekirova transfer"
        canonicalPath="/blog/kemer-airport-transfer-guide"
        ogType="article" articlePublishedTime="2025-02-01" articleModifiedTime="2025-02-01" articleSection="Travel Guide"
      />
      <SchemaOrg schemas={[
        { type: 'LocalBusiness' },
        { type: 'Article', headline: "Kemer Airport Transfer Guide", description: "Complete guide to Antalya Airport to Kemer transfers.", datePublished: '2025-02-01', dateModified: '2025-02-01', author: 'Meet Transfer', readingTime: '9', wordCount: 1500, keywords: ['Kemer airport transfer', 'Antalya to Kemer'] },
        { type: 'BreadcrumbList', items: [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: 'Kemer Transfer', url: '/blog/kemer-airport-transfer-guide' }] },
        { type: 'FAQPage', questions: faqItems.map(i => ({ question: i.question, answer: i.answer })) }
      ]} />

      <article className="mx-auto max-w-4xl px-3 py-8 sm:px-4 md:py-12">
        <Link to={getLocalizedPath("/blog")} className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground md:mb-8"><ArrowLeft className="h-4 w-4" /> Back to Blog</Link>

        <header className="mb-8 md:mb-12">
          <Badge variant="secondary" className="mb-3">Kemer</Badge>
          <h1 className="mb-4 font-serif text-2xl font-bold leading-tight sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl">Kemer Airport Transfer: Antalya Airport to Kemer & Surroundings</h1>
          <p className="mb-4 text-base text-muted-foreground sm:text-lg md:mb-6 md:text-xl">Private transfers from Antalya Airport to Kemer, Göynük, Çamyuva, Tekirova, and Olympos. Fixed prices with professional drivers.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatBlogDate("2025-02-01")}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 9 min read</span>
          </div>
        </header>

        <ShareButtons title="Kemer Airport Transfer Guide" className="mb-8" />
        <OptimizedBlogImage src={vitoExteriorBlack} alt="Private transfer to Kemer resorts" aspectRatio="video" priority className="mb-6 rounded-lg md:mb-8 md:rounded-xl" />
        <TableOfContents items={tocItems} />

        <div className="prose prose-sm dark:prose-invert max-w-none sm:prose-base md:prose-lg">
          <h2 id="about">About Kemer</h2>
          <p>Kemer is a stunning coastal resort town nestled between the Taurus Mountains and the Mediterranean Sea, about 55 km southwest of Antalya. Known for its pine-clad mountains, crystal-clear coves, and vibrant marina, Kemer offers a perfect blend of natural beauty and resort luxury.</p>

          <h2 id="why-private">Why Choose a Private Transfer?</h2>
          <ul>
            <li><strong>Direct route:</strong> No stops — straight to your hotel in Kemer</li>
            <li><strong>Scenic drive:</strong> Enjoy the beautiful coastal road in comfort</li>
            <li><strong>Fixed prices:</strong> No meter, no surge, no surprises</li>
            <li><strong>Flight tracking:</strong> We adjust for any delays</li>
            <li><strong>24/7 service:</strong> All hours covered</li>
          </ul>

          <h2 id="prices">Transfer Prices</h2>
          <div className="not-prose my-8 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Route</TableHead><TableHead>Distance</TableHead><TableHead>Duration</TableHead><TableHead>From</TableHead></TableRow></TableHeader>
              <TableBody>{routes.map((r, i) => (<TableRow key={i}><TableCell className="font-medium">{r.area}</TableCell><TableCell>{r.distance}</TableCell><TableCell>{r.time}</TableCell><TableCell className="font-semibold text-primary">{r.price}</TableCell></TableRow>))}</TableBody>
            </Table>
          </div>

          <h2 id="areas">Kemer District Areas</h2>
          <p>The Kemer region includes several charming sub-districts, each with its own character:</p>
          <ul>
            <li><strong>Beldibi:</strong> Closest to Antalya, popular all-inclusive resorts</li>
            <li><strong>Göynük:</strong> Canyon and nature paradise</li>
            <li><strong>Kemer Center:</strong> Marina, bazaar, and vibrant nightlife</li>
            <li><strong>Kiriş & Çamyuva:</strong> Family-friendly beach areas</li>
            <li><strong>Tekirova:</strong> Luxury resorts near ancient Phaselis</li>
            <li><strong>Olympos & Çıralı:</strong> Bohemian atmosphere, eternal flames of Chimera</li>
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

          <p><Link to={getLocalizedPath("/book")} className="text-primary hover:underline">Book your Kemer airport transfer now</Link></p>
        </div>

        <BlogCTA destination="Kemer" />
        <section className="my-8 md:my-12">
          <h2 className="mb-6 font-serif text-xl font-bold sm:text-2xl md:mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4 md:space-y-6">
            {faqItems.map((item, i) => (<div key={i} className="border-b border-border pb-6 last:border-0"><h3 className="mb-2 text-lg font-semibold">{item.question}</h3><p className="text-muted-foreground">{item.answer}</p></div>))}
          </div>
        </section>
        <RelatedArticles currentArticleId="kemer-airport-transfer-guide" />
      </article>
      <Footer />
    </WebsiteLayout>
  );
};

export default KemerAirportTransferGuide;
