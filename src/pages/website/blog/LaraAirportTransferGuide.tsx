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

const LaraAirportTransferGuide = () => {
  const { getLocalizedPath } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    { question: "How far is Lara from Antalya Airport?", answer: "Lara is only 12-15 km from Antalya Airport (AYT), making it one of the closest resort areas. The transfer takes just 15-20 minutes." },
    { question: "How much is a private transfer to Lara Beach?", answer: "A Mercedes Vito transfer from Antalya Airport to Lara starts from €30. This is one of our most affordable transfers due to the short distance." },
    { question: "Can I get a transfer to Kundu?", answer: "Yes, Kundu (also known as Lara Kundu) is part of the Lara area. We provide transfers to all Lara/Kundu hotels and resorts." },
    { question: "Is it worth taking a private transfer to Lara?", answer: "Absolutely! Even though Lara is close to the airport, a private transfer saves you taxi hassle, provides fixed pricing, and includes meet & greet and flight tracking." },
    { question: "Do you transfer to all Lara hotels?", answer: "Yes, we cover all Lara hotels including Titanic, Royal Seginus, Delphin Imperial, Miracle Resort, Kremlin Palace, and all others." },
    { question: "Is night transfer available to Lara?", answer: "Yes, 24/7 service at the same fixed price." },
  ];

  const tocItems = [
    { id: "about", title: "About Lara" },
    { id: "why-private", title: "Why Private Transfer?" },
    { id: "prices", title: "Prices" },
    { id: "hotels", title: "Popular Hotels" },
    { id: "included", title: "What's Included" },
  ];

  const routes = [
    { area: "Antalya Airport → Lara Beach", distance: "12 km", time: "15 min", price: "€30" },
    { area: "Antalya Airport → Kundu", distance: "15 km", time: "18 min", price: "€32" },
    { area: "Antalya Airport → Lara Barut Collection", distance: "14 km", time: "17 min", price: "€30" },
    { area: "Antalya Airport → Lower Düden Falls", distance: "10 km", time: "12 min", price: "€28" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title="Lara Airport Transfer | Antalya Airport to Lara"
        description="Quick private transfers from Antalya Airport to Lara Beach & Kundu in 15 minutes. Fixed prices, Mercedes vehicles, meet & greet at arrivals."
        keywords="Lara airport transfer, Antalya to Lara transfer, Lara Beach transfer, Kundu transfer, Antalya airport taxi Lara, Lara hotel transfer"
        canonicalPath="/blog/lara-airport-transfer-guide"
        ogType="article" articlePublishedTime="2025-02-01" articleModifiedTime="2025-02-01" articleSection="Travel Guide"
      />
      <SchemaOrg schemas={[
        { type: 'LocalBusiness' },
        { type: 'Article', headline: "Lara Airport Transfer Guide", description: "Antalya Airport to Lara Beach transfers.", datePublished: '2025-02-01', dateModified: '2025-02-01', author: 'Meet Transfer', readingTime: '7', wordCount: 1200, keywords: ['Lara airport transfer', 'Antalya to Lara'] },
        { type: 'BreadcrumbList', items: [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: 'Lara Transfer', url: '/blog/lara-airport-transfer-guide' }] },
        { type: 'FAQPage', questions: faqItems.map(i => ({ question: i.question, answer: i.answer })) }
      ]} />

      <article className="mx-auto max-w-4xl px-3 py-8 sm:px-4 md:py-12">
        <Link to={getLocalizedPath("/blog")} className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground md:mb-8"><ArrowLeft className="h-4 w-4" /> Back to Blog</Link>

        <header className="mb-8 md:mb-12">
          <Badge variant="secondary" className="mb-3">Lara</Badge>
          <h1 className="mb-4 font-serif text-2xl font-bold leading-tight sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl">Lara Airport Transfer: Antalya Airport to Lara Beach in 15 Minutes</h1>
          <p className="mb-4 text-base text-muted-foreground sm:text-lg md:mb-6 md:text-xl">The fastest way from Antalya Airport to Lara Beach and Kundu resort area. Fixed prices starting from €30 with professional Mercedes vehicles.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatBlogDate("2025-02-01")}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 7 min read</span>
          </div>
        </header>

        <ShareButtons title="Lara Airport Transfer Guide" className="mb-8" />
        <OptimizedBlogImage src={vitoExteriorBlack} alt="Private transfer to Lara Beach, Antalya" aspectRatio="video" priority className="mb-6 rounded-lg md:mb-8 md:rounded-xl" />
        <TableOfContents items={tocItems} />

        <div className="prose prose-sm dark:prose-invert max-w-none sm:prose-base md:prose-lg">
          <h2 id="about">About Lara</h2>
          <p>Lara (including the Kundu area) is Antalya's premier beach resort district, stretching along 12 km of golden sand just minutes from the airport. Home to Turkey's most impressive all-inclusive mega-resorts — some themed as replicas of famous landmarks — Lara offers a unique resort experience with the convenience of being incredibly close to Antalya Airport.</p>

          <h2 id="why-private">Why Private Transfer?</h2>
          <p>Even though Lara is the closest resort area to Antalya Airport, a private transfer offers clear advantages:</p>
          <ul>
            <li><strong>15-minute door-to-door:</strong> Fastest possible arrival at your hotel</li>
            <li><strong>Fixed price from €30:</strong> Often cheaper than metered taxis</li>
            <li><strong>Meet & greet:</strong> Driver with name sign at arrivals</li>
            <li><strong>No language barrier:</strong> English-speaking driver</li>
            <li><strong>Flight tracking:</strong> No worries about delays</li>
          </ul>

          <h2 id="prices">Transfer Prices</h2>
          <div className="not-prose my-8 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Route</TableHead><TableHead>Distance</TableHead><TableHead>Duration</TableHead><TableHead>From</TableHead></TableRow></TableHeader>
              <TableBody>{routes.map((r, i) => (<TableRow key={i}><TableCell className="font-medium">{r.area}</TableCell><TableCell>{r.distance}</TableCell><TableCell>{r.time}</TableCell><TableCell className="font-semibold text-primary">{r.price}</TableCell></TableRow>))}</TableBody>
            </Table>
          </div>

          <h2 id="hotels">Popular Lara Hotels We Serve</h2>
          <p>We provide direct transfers to all Lara/Kundu hotels including Titanic Mardan Palace, Royal Seginus, Delphin Imperial, Miracle Resort, Kremlin Palace, Royal Holiday Palace, Baia Lara, Barut Lara, and many more.</p>

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

          <p><Link to={getLocalizedPath("/book")} className="text-primary hover:underline">Book your Lara airport transfer now</Link></p>
        </div>

        <BlogCTA destination="Lara" />
        <section className="my-8 md:my-12">
          <h2 className="mb-6 font-serif text-xl font-bold sm:text-2xl md:mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4 md:space-y-6">
            {faqItems.map((item, i) => (<div key={i} className="border-b border-border pb-6 last:border-0"><h3 className="mb-2 text-lg font-semibold">{item.question}</h3><p className="text-muted-foreground">{item.answer}</p></div>))}
          </div>
        </section>
        <RelatedArticles currentArticleId="lara-airport-transfer-guide" />
      </article>
      <Footer />
    </WebsiteLayout>
  );
};

export default LaraAirportTransferGuide;
