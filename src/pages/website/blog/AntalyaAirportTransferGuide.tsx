import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2, MapPin } from "lucide-react";
import antalyaTransferHero from "@/assets/blog/antalya-transfer-hero.jpg";
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
import { getWhatsAppUrl } from "@/lib/contact";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import BlogImageGallery from "@/components/website/BlogImageGallery";
import vitoFamilyInterior from "@/assets/vito-family-interior.jpg";
import vitoExteriorBlack from "@/assets/vito-exterior-black.jpg";
import sprinterLuggage from "@/assets/sprinter-luggage.jpg";
import vitoVipPassengersDay from "@/assets/vito-vip-passengers-day.jpg";

const AntalyaAirportTransferGuide = () => {
  const { getLocalizedPath, t } = useLanguage();

  const faqItems = [
    { question: t("blogAntalyaFaq1Q"), answer: t("blogAntalyaFaq1A") },
    { question: t("blogAntalyaFaq2Q"), answer: t("blogAntalyaFaq2A") },
    { question: t("blogAntalyaFaq3Q"), answer: t("blogAntalyaFaq3A") },
    { question: t("blogAntalyaFaq4Q"), answer: t("blogAntalyaFaq4A") },
    { question: t("blogAntalyaFaq5Q"), answer: t("blogAntalyaFaq5A") },
    { question: t("blogAntalyaFaq6Q"), answer: t("blogAntalyaFaq6A") },
  ];

  const tocItems = [
    { id: "airport-overview", title: t("blogAntalyaSection1Title") },
    { id: "why-private", title: t("blogAntalyaSection2Title") },
    { id: "transfer-prices", title: t("blogAntalyaSection3Title") },
    { id: "destinations", title: t("blogAntalyaSection4Title") },
    { id: "whats-included", title: t("blogAntalyaSection5Title") },
  ];

  const destinations = [
    { area: "Kaleici (Old Town)", distance: "13 km", time: "20-25 min", price: "€50" },
    { area: "Lara Beach / Kundu", distance: "18 km", time: "20-30 min", price: "€50" },
    { area: "Belek", distance: "35 km", time: "35-45 min", price: "€65" },
    { area: "Side", distance: "65 km", time: "60-75 min", price: "€72" },
    { area: "Alanya", distance: "130 km", time: "120-150 min", price: "€84" },
    { area: "Kemer / Göynük", distance: "60 km", time: "50-65 min", price: "€65" },
    { area: "Kaş", distance: "190 km", time: "180-210 min", price: "€170" },
    { area: "Kalkan", distance: "220 km", time: "210-240 min", price: "€170" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogAntalyaSeoTitle")}
        description={t("blogAntalyaSeoDesc")}
        keywords="Antalya airport transfer 2025, AYT airport hotel transfer, Antalya to Belek transfer, Antalya to Side transfer, Lara Beach transfer, private transfer Antalya, Kemer transfer, Alanya airport transfer, Antalya VIP transfer price, Antalya airport taxi cost"
        canonicalPath="/blog/antalya-airport-transfer-to-hotels"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
        ogType="article"
        articlePublishedTime="2024-11-28"
        articleModifiedTime="2025-01-10"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t("blogAntalyaH1"),
            description: t("blogAntalyaSeoDesc"),
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2024-11-28',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '15',
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Antalya Airport Transfer Guide', url: '/blog/antalya-airport-transfer-to-hotels' },
            ],
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
          {t("backToBlog")}
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <Badge variant="secondary" className="mb-4">Antalya</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t("blogAntalyaH1")}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t("blogAntalyaIntro")}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("lastUpdated")}: January 10, 2025
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              15 {t("minRead")}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <ShareButtons title={t("blogAntalyaH1")} className="mb-8" />

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-8">
          <img 
            src={antalyaTransferHero} 
            alt="Antalya Airport Transfer 2025 - Private VIP Transfer to Belek, Side, Kemer, Lara Beach and All-Inclusive Hotels"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        {/* Table of Contents */}
        <TableOfContents items={tocItems} />

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 id="airport-overview">{t("blogAntalyaSection1Title")}</h2>
          <p>{t("blogAntalyaSection1P1")}</p>
          <p>{t("blogAntalyaSection1P2")}</p>
          
          <p>
            Antalya Airport (AYT) is Turkey's third-busiest airport, handling over 35 million passengers annually. 
            Located on the stunning Turkish Riviera, it serves as the gateway to some of the Mediterranean's most 
            beautiful beaches and ancient ruins. The airport features two international terminals and one domestic 
            terminal, all well-equipped with modern amenities.
          </p>

          <h3>Navigating Antalya Airport</h3>
          <p>
            Upon arrival at Antalya Airport, you'll find clear signage in multiple languages guiding you through 
            passport control and baggage claim. Terminal 1 primarily serves international flights, while Terminal 2 
            handles both domestic and international traffic. Both terminals offer free WiFi, currency exchange, 
            and various dining options.
          </p>

          <h2 id="why-private">{t("blogAntalyaSection2Title")}</h2>
          <p>{t("blogAntalyaSection2Intro")}</p>

          <h3>The Antalya Transfer Challenge</h3>
          <p>
            Unlike some cities where public transport is straightforward, Antalya's resort-focused layout means 
            many destinations are spread along the coastline. Hotels in Belek, Side, or Kemer may be 30-130 km 
            from the airport, making private transfer the most practical option. After a long flight, the last 
            thing you want is multiple connections or navigating unfamiliar bus routes with heavy luggage.
          </p>

          <h3>Benefits of Private Transfer in Antalya</h3>
          <ul>
            <li><strong>Direct service:</strong> Straight to your hotel's door, no matter how remote</li>
            <li><strong>Local knowledge:</strong> Drivers know every resort and villa address</li>
            <li><strong>Flexible timing:</strong> Service available 24/7 for all flight arrivals</li>
            <li><strong>Comfort in heat:</strong> Air-conditioned vehicles are essential in summer</li>
            <li><strong>Luggage handling:</strong> Professional assistance with all your bags</li>
          </ul>

          <h2 id="transfer-prices">{t("blogAntalyaSection3Title")}</h2>
          <p>{t("blogAntalyaSection3Intro")}</p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("blogPriceTableDestination")}</TableHead>
                  <TableHead>{t("blogAntalyaTableDistance")}</TableHead>
                  <TableHead>{t("blogAntalyaTableTime")}</TableHead>
                  <TableHead>{t("blogPriceTablePrivate")}</TableHead>
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
            {t("blogAntalyaTableNote")}
          </p>

          <h2 id="destinations">{t("blogAntalyaSection4Title")}</h2>

          <h3>{t("blogAntalyaLaraTitle")}</h3>
          <p>{t("blogAntalyaLaraDesc")}</p>
          <p>
            Lara Beach is known for its massive all-inclusive resorts that line the golden sand coastline. 
            This area, sometimes called the "Las Vegas of Turkey," features themed hotels inspired by famous 
            landmarks. The beach stretches for 12 km and offers crystal-clear Mediterranean waters perfect 
            for swimming from May through October.
          </p>

          <h3>{t("blogAntalyaBelekTitle")}</h3>
          <p>{t("blogAntalyaBelekDesc")}</p>
          <p>
            Belek has evolved into Turkey's premier golf destination, boasting over 15 championship courses 
            designed by legends like Colin Montgomerie and Nick Faldo. The area is also famous for its luxury 
            spa resorts and family-friendly all-inclusive properties. Transfer from Antalya Airport takes 
            approximately 35-45 minutes via the D400 highway.
          </p>

          <h3>{t("blogAntalyaSideTitle")}</h3>
          <p>{t("blogAntalyaSideDesc")}</p>
          <p>
            Side offers a unique blend of ancient history and modern tourism. Walk among Roman ruins, including 
            a 15,000-seat amphitheater and the Temple of Apollo, then relax on beautiful sandy beaches just 
            meters away. The old town's pedestrianized streets are filled with boutiques, restaurants, and 
            cafes overlooking the Mediterranean.
          </p>

          <h3>{t("blogAntalyaKemerTitle")}</h3>
          <p>{t("blogAntalyaKemerDesc")}</p>
          <p>
            Kemer and nearby Göynük are set against the dramatic backdrop of the Taurus Mountains, creating 
            stunning scenery where mountains meet the sea. This area is popular with outdoor enthusiasts, 
            offering opportunities for hiking, diving, and boat trips to secluded coves along the Lycian coast.
          </p>

          <h3>{t("blogAntalyaAlanyaTitle")}</h3>
          <p>{t("blogAntalyaAlanyaDesc")}</p>
          <p>
            Alanya is a bustling resort town dominated by a magnificent 13th-century Seljuk castle perched 
            on a rocky peninsula. The town offers a more local Turkish atmosphere compared to Lara or Belek, 
            with a vibrant bazaar, Cleopatra Beach (one of Turkey's finest), and the famous Red Tower harbor.
          </p>

          <h2 id="whats-included">{t("blogAntalyaSection5Title")}</h2>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t("blogAntalyaIncludesTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude1")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude2")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogAntalyaInclude1")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude4")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude8")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude6")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogAntalyaInclude2")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogAntalyaInclude3")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>{t("blogAntalyaSection6Title")}</h2>
          <p>{t("blogAntalyaSection6Intro")}</p>

          <h3>Best Time to Visit the Turkish Riviera</h3>
          <p>
            The Antalya region enjoys a Mediterranean climate with over 300 days of sunshine annually. 
            Peak season runs from June to September when temperatures reach 30-35°C. Spring (April-May) 
            and autumn (September-October) offer ideal conditions for sightseeing with pleasant 
            temperatures and fewer crowds. Winter remains mild, making it suitable for golf holidays.
          </p>

          <h2>{t("blogAntalyaSection7Title")}</h2>
          <p>{t("blogAntalyaSection7Intro")}</p>

          <h3>Day Trip Ideas from Your Resort</h3>
          <ul>
            <li><strong>Aspendos:</strong> One of the best-preserved Roman theaters in the world (1 hour from Antalya)</li>
            <li><strong>Perge:</strong> Impressive ancient city ruins just 18 km from Antalya center</li>
            <li><strong>Pamukkale:</strong> Famous white travertine terraces (4-hour day trip)</li>
            <li><strong>Düden Waterfalls:</strong> Stunning cascades near Antalya city</li>
            <li><strong>Olympos & Chimera:</strong> Ancient ruins and eternal flames on the Lycian coast</li>
          </ul>

          {/* Image Gallery */}
          <h3>{t("galleryTitle") || "Our Fleet Gallery"}</h3>
          <div className="not-prose my-8">
            <BlogImageGallery 
              images={[
                { 
                  src: vitoFamilyInterior, 
                  alt: "Mercedes Vito Family Interior Antalya Transfer",
                  caption: "Spacious family-friendly interior"
                },
                { 
                  src: vitoExteriorBlack, 
                  alt: "Mercedes Vito VIP Exterior",
                  caption: "Premium Mercedes Vito for resort transfers"
                },
                { 
                  src: sprinterLuggage, 
                  alt: "Mercedes Sprinter with luggage space",
                  caption: "Ample luggage space for families"
                },
                { 
                  src: vitoVipPassengersDay, 
                  alt: "Happy passengers enjoying transfer",
                  caption: "Comfortable journey to your resort"
                },
              ]}
              columns={2}
            />
          </div>

          <h2>{t("blogAntalyaConclusion")}</h2>
          <p>
            {t("blogAntalyaConclusionP1")} 
            <Link to={getLocalizedPath("/antalya-transfer")} className="text-primary hover:underline"> {t("blogAntalyaConclusionLink")}</Link>
          </p>
          <p>
            Your Turkish Riviera adventure begins the moment you land at Antalya Airport. With our professional 
            transfer service, you'll be whisked away to your beach resort, golf hotel, or boutique accommodation 
            in comfort and style. Let the turquoise waters and ancient wonders of the Mediterranean coast 
            welcome you to an unforgettable holiday experience.
          </p>
          <p>
            <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">{t("blogPriceConclusionCta")}</Link>
          </p>
        </div>

        {/* Map Section */}
        <div className="my-12 p-6 bg-muted/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{t("blogAntalyaMapTitle")}</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {t("blogAntalyaMapDesc")}
          </p>
        </div>

        {/* CTA Section */}
        <div className="my-12 p-8 bg-primary/5 rounded-2xl text-center">
          <h3 className="font-serif text-2xl font-bold mb-4">
            {t("blogAntalyaCtaTitle")}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t("blogAntalyaCtaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/antalya-transfer")}>
              <Button size="lg" variant="accent" className="gap-2">
                {t("blogAntalyaCtaButton")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a 
              href={getWhatsAppUrl("Hello, I need a transfer from Antalya Airport.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline">
                {t("whatsappBooking")}
              </Button>
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="my-12">
          <h2 className="font-serif text-2xl font-bold mb-8">{t("frequentlyAskedQuestions")}</h2>
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
        <RelatedArticles currentArticleId="antalya-airport-transfer-to-hotels" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default AntalyaAirportTransferGuide;
