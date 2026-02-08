import { useLanguage } from "@/contexts/LanguageContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, MapPin, Shield, Star, Users } from "lucide-react";
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

const KasAirportTransferGuide = () => {
  const { getLocalizedPath } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    { question: "How far is Kaş from Dalaman Airport?", answer: "Kaş is approximately 185 km from Dalaman Airport (DLM). The drive takes around 2.5-3 hours via the stunning D400 coastal highway. We also offer transfers from Antalya Airport (AYT), which is about 190 km away." },
    { question: "What is the best airport for Kaş transfers?", answer: "Both Dalaman (DLM) and Antalya (AYT) airports serve Kaş. Dalaman is slightly closer and the coastal route is more scenic. We provide transfers from both airports with fixed prices and no hidden fees." },
    { question: "How much does a private transfer from Dalaman to Kaş cost?", answer: "A private Mercedes Vito transfer from Dalaman Airport to Kaš starts from €110. The price includes meet & greet, free waiting time, and door-to-door service. Book a round-trip for 25% discount." },
    { question: "Can I book a transfer from Kaş to Antalya Airport?", answer: "Yes, we provide transfers from Kaš to Antalya Airport (AYT). The journey takes approximately 3 hours. Our driver will pick you up from your hotel or accommodation in Kaš." },
    { question: "Is there a night transfer service to Kaş?", answer: "Yes, Meet Transfer operates 24/7 including late-night and early-morning transfers to Kaš. Our drivers track your flight and adjust for delays automatically. No surge pricing applies." },
    { question: "What vehicles are available for Kaş transfers?", answer: "We offer Standard Sedan (up to 3 passengers), Mercedes Vito (up to 6), VIP Mercedes Vito (up to 6), Mercedes Maybach (up to 3), and Mercedes Sprinter (up to 13) for Kaš transfers." },
  ];

  const tocItems = [
    { id: "about-kas", title: "About Kaş & Getting There" },
    { id: "why-private", title: "Why Choose Private Transfer?" },
    { id: "transfer-prices", title: "Transfer Prices & Routes" },
    { id: "things-to-know", title: "Things to Know" },
    { id: "whats-included", title: "What's Included" },
  ];

  const routes = [
    { area: "Dalaman Airport → Kaş Center", distance: "185 km", time: "2.5-3 hrs", price: "€110" },
    { area: "Dalaman Airport → Kalkan", distance: "130 km", time: "2-2.5 hrs", price: "€90" },
    { area: "Antalya Airport → Kaş Center", distance: "190 km", time: "3-3.5 hrs", price: "€120" },
    { area: "Antalya Airport → Kalkan", distance: "220 km", time: "3-3.5 hrs", price: "€100" },
    { area: "Fethiye → Kaş", distance: "105 km", time: "1.5-2 hrs", price: "€85" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title="Kaş Airport Transfer | Dalaman & Antalya to Kaş"
        description="Book private airport transfers to Kaš from Dalaman or Antalya airports. Fixed prices, professional drivers, and door-to-door service along the stunning Turkish coast."
        keywords="Kaş airport transfer, Dalaman to Kaş transfer, Antalya to Kaş transfer, Kaş private transfer, Kalkan transfer, Dalaman airport taxi Kaş"
        canonicalPath="/blog/kas-airport-transfer-guide"
        ogType="article"
        articlePublishedTime="2025-02-01"
        articleModifiedTime="2025-02-01"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: "Kaš Airport Transfer Guide: Dalaman & Antalya to Kaš",
            description: "Complete guide to airport transfers to Kaš from Dalaman and Antalya airports.",
            datePublished: '2025-02-01',
            dateModified: '2025-02-01',
            author: 'Meet Transfer',
            readingTime: '12',
            wordCount: 1800,
            keywords: ['Kaş airport transfer', 'Dalaman to Kaş', 'Kalkan transfer'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Kaš Airport Transfer', url: '/blog/kas-airport-transfer-guide' },
            ],
          },
          {
            type: 'FAQPage',
            questions: faqItems.map(item => ({ question: item.question, answer: item.answer }))
          }
        ]}
      />

      <article className="mx-auto max-w-4xl px-3 py-8 sm:px-4 md:py-12">
        <Link to={getLocalizedPath("/blog")} className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground md:mb-8">
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Back to Blog
        </Link>

        <header className="mb-8 md:mb-12">
          <Badge variant="secondary" className="mb-3 md:mb-4">Kaš</Badge>
          <h1 className="mb-4 font-serif text-2xl font-bold leading-tight sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl">
            Kaš Airport Transfer Guide: Dalaman & Antalya to Kaš
          </h1>
          <p className="mb-4 text-base text-muted-foreground sm:text-lg md:mb-6 md:text-xl">
            Everything you need to know about private transfers to Kaš — Turkey's charming Mediterranean gem. Get from Dalaman or Antalya airport to your hotel with fixed prices and professional drivers.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatBlogDate("2025-02-01")}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 12 min read</span>
          </div>
        </header>

        <ShareButtons title="Kaš Airport Transfer Guide" className="mb-8" />

        <OptimizedBlogImage src={vitoExteriorBlack} alt="Private transfer vehicle on the scenic road to Kaš, Turkey" aspectRatio="video" priority className="mb-6 rounded-lg md:mb-8 md:rounded-xl" />

        <TableOfContents items={tocItems} />

        <div className="prose prose-sm dark:prose-invert max-w-none sm:prose-base md:prose-lg">
          <h2 id="about-kas">About Kaš & Getting There</h2>
          <p>Kaš is a picturesque coastal town on Turkey's southwestern Mediterranean coast, known for its crystal-clear waters, ancient Lycian ruins, and laid-back atmosphere. Unlike busier resort towns, Kaš retains its authentic Turkish character while offering world-class diving, sea kayaking, and a vibrant marina district.</p>
          <p>Since Kaš doesn't have its own airport, visitors typically fly into either <strong>Dalaman Airport (DLM)</strong> — approximately 185 km away — or <strong>Antalya Airport (AYT)</strong> — approximately 190 km away. Both routes offer stunning coastal scenery along the famous D400 highway.</p>

          <h2 id="why-private">Why Choose a Private Transfer to Kaš?</h2>
          <p>Given the 2.5-3 hour journey from either airport, a private transfer is the most comfortable and reliable option:</p>
          <ul>
            <li><strong>No waiting:</strong> Your driver tracks your flight and waits at arrivals with a name sign</li>
            <li><strong>Fixed prices:</strong> No meter anxiety or surge pricing on the long journey</li>
            <li><strong>Door-to-door:</strong> Dropped directly at your hotel, villa, or any address in Kaš</li>
            <li><strong>Scenic stops:</strong> Option to pause for photos along the breathtaking coastal road</li>
            <li><strong>Comfort:</strong> Air-conditioned Mercedes vehicles for the long drive</li>
          </ul>

          <h2 id="transfer-prices">Transfer Prices & Routes</h2>
          <p>Our fixed-price transfers from both airports to Kaš and nearby destinations:</p>

          <div className="not-prose my-8 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>From</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.area}</TableCell>
                    <TableCell>{r.distance}</TableCell>
                    <TableCell>{r.time}</TableCell>
                    <TableCell className="font-semibold text-primary">{r.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground">* Prices shown for Mercedes Vito (up to 6 passengers). Sedan, VIP, and Sprinter options also available.</p>

          <h2 id="things-to-know">Things to Know About Kaš Transfers</h2>
          <p>The journey to Kaš is one of the most scenic airport transfers in Turkey. Here are some tips:</p>
          <ul>
            <li>The D400 coastal highway offers breathtaking views — sit on the right side heading from Dalaman for the best vistas</li>
            <li>The road passes through Kalkan, a beautiful hillside town — popular as a stopover or transfer destination</li>
            <li>Night transfers are fully supported with no additional charge</li>
            <li>For round trips, enjoy a 25% discount on the return transfer</li>
          </ul>

          <h2 id="whats-included">What's Included in Your Transfer</h2>
          <div className="not-prose my-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> All Transfers Include</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {["Meet & greet at airport arrivals", "Free flight tracking & waiting", "Professional English-speaking driver", "Air-conditioned Mercedes vehicles", "Free child/baby seat on request", "No hidden fees — fixed price guaranteed"].map((item, i) => (
                  <div key={i} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" /><span>{item}</span></div>
                ))}
              </CardContent>
            </Card>
          </div>

          <h3>Our Fleet</h3>
          <div className="not-prose my-8">
            <BlogImageGallery images={[
              { src: vitoFamilyInterior, alt: "Mercedes Vito interior for Kaš transfers", caption: "Spacious Mercedes Vito interior" },
              { src: vitoExteriorBlack, alt: "Mercedes Vito exterior", caption: "Mercedes Vito — ideal for Kaš routes" },
              { src: sprinterLuggage, alt: "Mercedes Sprinter for group transfers", caption: "Sprinter for larger groups" },
              { src: vitoVipPassengersDay, alt: "VIP Mercedes transfer service", caption: "VIP transfer experience" },
            ]} columns={2} />
          </div>

          <h2>Book Your Kaš Transfer</h2>
          <p>Ready to start your Mediterranean getaway? <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">Book your Kaš airport transfer now</Link> with fixed prices and instant confirmation.</p>
        </div>

        <div className="my-8 rounded-xl bg-muted/50 p-4 md:my-12 md:rounded-2xl md:p-6">
          <div className="mb-3 flex items-center gap-2 md:mb-4">
            <MapPin className="h-4 w-4 text-primary md:h-5 md:w-5" />
            <h3 className="text-base font-semibold md:text-lg">Route Map</h3>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">Dalaman Airport to Kaš — the scenic coastal route</p>
        </div>

        <BlogCTA destination="Kaš" />

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

        <RelatedArticles currentArticleId="kas-airport-transfer-guide" />
      </article>
      <Footer />
    </WebsiteLayout>
  );
};

export default KasAirportTransferGuide;
