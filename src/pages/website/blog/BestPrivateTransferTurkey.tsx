import { useLanguage } from "@/contexts/LanguageContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, Star, Shield, Car, MapPin } from "lucide-react";
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
import vitoExteriorBlack from "@/assets/vito-exterior-black.jpg";
import vitoFamilyInterior from "@/assets/vito-family-interior.jpg";
import sprinterLuggage from "@/assets/sprinter-luggage.jpg";
import vitoVipPassengersDay from "@/assets/vito-vip-passengers-day.jpg";

const BestPrivateTransferTurkey = () => {
  const { getLocalizedPath } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    { question: "What is the best private transfer company in Turkey?", answer: "Meet Transfer is rated among the top private transfer companies in Turkey with 4.9/5 stars on Google Reviews. We offer fixed prices, Mercedes vehicles, professional drivers, and 24/7 service across all major Turkish airports and cities." },
    { question: "How much does a private transfer cost in Turkey?", answer: "Private transfer prices in Turkey vary by distance. Airport-to-city transfers start from €30 (e.g., Antalya Airport to Lara). Longer routes like Istanbul Airport to Taksim start from €37. All prices are fixed with no hidden fees." },
    { question: "Is private transfer worth it in Turkey?", answer: "Yes! Private transfers in Turkey offer fixed prices, door-to-door service, flight tracking, meet & greet, and professional drivers — all at competitive rates compared to taxis. Especially valuable for airport transfers with luggage." },
    { question: "Can I book a private transfer in advance for Turkey?", answer: "Yes, and we recommend it. Book online at meettransfer.app with instant confirmation. Pre-booking guarantees your driver, vehicle, and price. Last-minute bookings are also available 24/7." },
    { question: "Which airports does Meet Transfer cover in Turkey?", answer: "We cover all major Turkish airports: Istanbul (IST), Sabiha Gökçen (SAW), Antalya (AYT), Izmir (ADB), Bodrum (BJV), Dalaman (DLM), Ankara (ESB), Adana (ADA), Gazipaşa-Alanya (GZP), Trabzon, and more." },
    { question: "Do private transfers in Turkey include child seats?", answer: "Yes, Meet Transfer provides free child and baby seats on request. Simply mention it when booking. All seats are safety-certified and properly installed by our professional drivers." },
    { question: "Can I pay for a private transfer online?", answer: "Yes, we offer secure online payment as well as pay-at-destination options. Your price is fixed at booking — no surprises, no surge pricing, regardless of traffic or delays." },
    { question: "What vehicles are used for private transfers?", answer: "Our fleet includes Standard Sedan, Mercedes Vito (6 pax), VIP Mercedes Vito, Mercedes Maybach, and Mercedes Sprinter (13 pax). All vehicles are air-conditioned, clean, and well-maintained." },
  ];

  const tocItems = [
    { id: "why-private", title: "Why Private Transfer in Turkey?" },
    { id: "what-to-look-for", title: "What to Look For" },
    { id: "meet-transfer", title: "Why Meet Transfer?" },
    { id: "fleet", title: "Our Fleet" },
    { id: "destinations", title: "Top Destinations" },
    { id: "how-to-book", title: "How to Book" },
  ];

  const features = [
    { icon: Shield, title: "Fixed Prices", desc: "No surge pricing, no meters. The price you see is the price you pay." },
    { icon: Star, title: "4.9★ Rated", desc: "Consistently rated 4.9/5 on Google Reviews by thousands of travelers." },
    { icon: Car, title: "Mercedes Fleet", desc: "Sedan, Vito, VIP, Maybach, Sprinter — vehicles for every need." },
    { icon: MapPin, title: "All Airports", desc: "Istanbul, Antalya, Bodrum, Dalaman, Izmir, Ankara and more." },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title="Best Private Transfer in Turkey | Meet Transfer"
        description="Find the best private transfer service in Turkey. Fixed prices, Mercedes vehicles, 24/7 airport transfers across Istanbul, Antalya, Bodrum & more. Book online."
        keywords="best private transfer Turkey, Turkey airport transfer, private transfer Istanbul, private transfer Antalya, Turkey VIP transfer, airport taxi Turkey"
        canonicalPath="/blog/best-private-transfer-turkey"
        ogType="article" articlePublishedTime="2025-02-01" articleModifiedTime="2025-02-01" articleSection="Travel Guide"
      />
      <SchemaOrg schemas={[
        { type: 'LocalBusiness' },
        { type: 'Article', headline: "Best Private Transfer Service in Turkey", description: "Complete guide to private transfers in Turkey.", datePublished: '2025-02-01', dateModified: '2025-02-01', author: 'Meet Transfer', readingTime: '12', wordCount: 2000, keywords: ['private transfer Turkey', 'best transfer Turkey'] },
        { type: 'BreadcrumbList', items: [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: 'Best Private Transfer Turkey', url: '/blog/best-private-transfer-turkey' }] },
        { type: 'FAQPage', questions: faqItems.map(i => ({ question: i.question, answer: i.answer })) }
      ]} />

      <article className="mx-auto max-w-4xl px-3 py-8 sm:px-4 md:py-12">
        <Link to={getLocalizedPath("/blog")} className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground md:mb-8"><ArrowLeft className="h-4 w-4" /> Back to Blog</Link>

        <header className="mb-8 md:mb-12">
          <Badge variant="secondary" className="mb-3">Turkey Guide</Badge>
          <h1 className="mb-4 font-serif text-2xl font-bold leading-tight sm:text-3xl md:mb-6 md:text-4xl lg:text-5xl">Best Private Transfer Service in Turkey: Complete Guide</h1>
          <p className="mb-4 text-base text-muted-foreground sm:text-lg md:mb-6 md:text-xl">Everything you need to know about booking private airport transfers in Turkey. Compare options, understand pricing, and discover why thousands of travelers choose Meet Transfer.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatBlogDate("2025-02-01")}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 12 min read</span>
          </div>
        </header>

        <ShareButtons title="Best Private Transfer in Turkey" className="mb-8" />
        <OptimizedBlogImage src={vitoVipPassengersDay} alt="Best private transfer service in Turkey with Mercedes vehicles" aspectRatio="video" priority className="mb-6 rounded-lg md:mb-8 md:rounded-xl" />
        <TableOfContents items={tocItems} />

        <div className="prose prose-sm dark:prose-invert max-w-none sm:prose-base md:prose-lg">
          <h2 id="why-private">Why Choose Private Transfer in Turkey?</h2>
          <p>Turkey welcomes over 50 million visitors annually, and getting from the airport to your destination is the first challenge. While taxis, shared shuttles, and public transport exist, private transfers offer the best combination of comfort, reliability, and value.</p>
          <ul>
            <li><strong>Fixed pricing:</strong> No meters, no surge pricing, no negotiations</li>
            <li><strong>Door-to-door:</strong> Airport arrivals directly to your hotel</li>
            <li><strong>Flight tracking:</strong> Your driver adjusts for delays automatically</li>
            <li><strong>Meet & greet:</strong> Name sign at arrivals — no searching for transport</li>
            <li><strong>Language support:</strong> English-speaking professional drivers</li>
            <li><strong>24/7 availability:</strong> Any flight time, including late nights</li>
          </ul>

          <h2 id="what-to-look-for">What to Look For in a Transfer Company</h2>
          <p>When choosing a private transfer service in Turkey, look for:</p>
          <ul>
            <li>Transparent, fixed pricing with no hidden fees</li>
            <li>Real Google Reviews (not just testimonials on their website)</li>
            <li>Online booking with instant confirmation</li>
            <li>Free flight tracking and waiting time</li>
            <li>Professional, licensed drivers</li>
            <li>Well-maintained, modern vehicle fleet</li>
            <li>Free child/baby seats</li>
            <li>24/7 customer support</li>
          </ul>

          <h2 id="meet-transfer">Why Meet Transfer?</h2>
          <div className="not-prose my-8 grid gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <Card key={i} className="border-primary/10">
                <CardContent className="flex items-start gap-3 p-4">
                  <f.icon className="mt-0.5 h-6 w-6 flex-shrink-0 text-primary" />
                  <div><h3 className="font-semibold">{f.title}</h3><p className="text-sm text-muted-foreground">{f.desc}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 id="fleet">Our Fleet</h2>
          <p>We operate an all-Mercedes fleet to ensure consistent quality across all transfers:</p>
          <div className="not-prose my-8">
            <BlogImageGallery images={[
              { src: vitoFamilyInterior, alt: "Mercedes Vito interior", caption: "Mercedes Vito — spacious for families" },
              { src: vitoExteriorBlack, alt: "Mercedes Vito exterior", caption: "Premium Mercedes fleet" },
              { src: sprinterLuggage, alt: "Mercedes Sprinter", caption: "Sprinter for groups up to 13" },
              { src: vitoVipPassengersDay, alt: "VIP transfer", caption: "VIP experience with Meet Transfer" },
            ]} columns={2} />
          </div>

          <h2 id="destinations">Top Transfer Destinations in Turkey</h2>
          <ul>
            <li><Link to={getLocalizedPath("/blog/istanbul-airport-to-city-best-way")} className="text-primary hover:underline">Istanbul Airport transfers</Link> — IST & SAW to city center</li>
            <li><Link to={getLocalizedPath("/blog/antalya-airport-transfer-to-hotels")} className="text-primary hover:underline">Antalya Airport transfers</Link> — to Lara, Belek, Side, Kemer, Alanya</li>
            <li><Link to={getLocalizedPath("/blog/bodrum-airport-transfer-best-service")} className="text-primary hover:underline">Bodrum Airport transfers</Link> — to Bodrum, Yalıkavak, Turgutreis</li>
            <li><Link to={getLocalizedPath("/blog/fethiye-airport-transfer-guide")} className="text-primary hover:underline">Dalaman Airport transfers</Link> — to Fethiye, Ölüdeniz, Marmaris</li>
            <li><Link to={getLocalizedPath("/blog/cappadocia-airport-transfer-guide")} className="text-primary hover:underline">Cappadocia transfers</Link> — Kayseri & Nevşehir airports</li>
          </ul>

          <h2 id="how-to-book">How to Book</h2>
          <p>Booking a private transfer with Meet Transfer takes under 2 minutes:</p>
          <ol>
            <li>Enter your pickup and drop-off locations</li>
            <li>Select your date, time, and vehicle type</li>
            <li>See your fixed price instantly</li>
            <li>Confirm your booking — no payment required upfront</li>
            <li>Receive driver details before your trip</li>
          </ol>
          <p><Link to={getLocalizedPath("/book")} className="text-primary hover:underline">Book your Turkey transfer now</Link> — instant confirmation, best prices guaranteed.</p>
        </div>

        <BlogCTA destination="Turkey" />
        <section className="my-8 md:my-12">
          <h2 className="mb-6 font-serif text-xl font-bold sm:text-2xl md:mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4 md:space-y-6">
            {faqItems.map((item, i) => (<div key={i} className="border-b border-border pb-6 last:border-0"><h3 className="mb-2 text-lg font-semibold">{item.question}</h3><p className="text-muted-foreground">{item.answer}</p></div>))}
          </div>
        </section>
        <RelatedArticles currentArticleId="best-private-transfer-turkey" />
      </article>
      <Footer />
    </WebsiteLayout>
  );
};

export default BestPrivateTransferTurkey;
