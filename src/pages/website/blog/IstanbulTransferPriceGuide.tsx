import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2 } from "lucide-react";
import istanbulTransferHero from "@/assets/blog/istanbul-transfer-hero.jpg";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
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
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import BlogImageGallery from "@/components/website/BlogImageGallery";
import BlogCTA from "@/components/website/BlogCTA";
import vitoVip1 from "@/assets/vito-vip-1.jpg";
import vitoVip2 from "@/assets/vito-vip-2.jpg";
import sprinterInteriorBlue from "@/assets/sprinter-interior-blue.jpg";
import vitoAirportAnime from "@/assets/vito-airport-anime.jpg";

const IstanbulTransferPriceGuide = () => {
  const { getLocalizedPath, t } = useLanguage();

  const faqItems = [
    { question: t("blogPriceFaq1Q"), answer: t("blogPriceFaq1A") },
    { question: t("blogPriceFaq2Q"), answer: t("blogPriceFaq2A") },
    { question: t("blogPriceFaq3Q"), answer: t("blogPriceFaq3A") },
    { question: t("blogPriceFaq4Q"), answer: t("blogPriceFaq4A") },
    { question: t("blogPriceFaq5Q"), answer: t("blogPriceFaq5A") },
    { question: t("blogPriceFaq6Q"), answer: t("blogPriceFaq6A") },
  ];

  const tocItems = [
    { id: "understanding-prices", title: t("blogPriceSection1Title") },
    { id: "destination-prices", title: t("blogPriceSection2Title") },
    { id: "vehicle-prices", title: t("blogPriceSection3Title") },
    { id: "whats-included", title: t("blogPriceSection4Title") },
    { id: "booking-tips", title: t("blogPriceSection5Title") },
    { id: "why-choose", title: t("blogPriceSection6Title") },
    { id: "conclusion", title: t("blogPriceConclusion") },
  ];

  const priceData = [
    { destination: "Taksim / Beyoğlu", private: "€50-55", bus: "150 TL ($5)" },
    { destination: "Sultanahmet", private: "€50-55", bus: "150 TL ($5)" },
    { destination: "Kadıköy", private: "€65-70", bus: "180 TL ($6)" },
    { destination: "Beşiktaş", private: "€50-55", bus: "150 TL ($5)" },
    { destination: "Galataport Cruise Terminal", private: "€50-55", bus: "N/A" },
    { destination: "Sabiha Gökçen Airport", private: "€110-130", bus: "N/A" },
    { destination: "Bursa (Osmangazi)", private: "€185-195", bus: "N/A" },
    { destination: "Sapanca", private: "€245-255", bus: "N/A" },
    { destination: "Kartepe Kayak Merkezi", private: "€255-275", bus: "N/A" },
  ];

  const vehiclePrices = [
    { vehicle: "Mercedes Vito (up to 6 pax)", toTaksim: "€50", toKadikoy: "€65", toBursa: "€185" },
    { vehicle: "Mercedes Vito VIP (up to 6 pax)", toTaksim: "€55", toKadikoy: "€70", toBursa: "€195" },
    { vehicle: "Mercedes Maybach (up to 3 pax)", toTaksim: "€65", toKadikoy: "€80", toBursa: "€210" },
    { vehicle: "Mercedes Sprinter (up to 16 pax)", toTaksim: "€85", toKadikoy: "€105", toBursa: "€220" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogPriceSeoTitle")}
        description={t("blogPriceSeoDesc")}
        keywords="Istanbul Airport transfer price 2025, IST transfer cost, private transfer Istanbul price, Istanbul Airport to Taksim price, airport transfer pricing Turkey, Istanbul Airport transfer fare, VIP transfer Istanbul cost, Mercedes transfer Istanbul, Istanbul Airport to hotel price, Sultanahmet transfer cost"
        canonicalPath="/blog/istanbul-airport-transfer-price-guide"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
        ogType="article"
        articlePublishedTime="2024-12-10"
        articleModifiedTime="2025-01-10"
        articleSection="Price Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t("blogPriceH1"),
            description: t("blogPriceSeoDesc"),
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2024-12-10',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '12',
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Istanbul Airport Transfer Price Guide', url: '/blog/istanbul-airport-transfer-price-guide' },
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
          <Badge variant="secondary" className="mb-4">{t("blogPriceBadge")}</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t("blogPriceH1")}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t("blogPriceIntro")}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("lastUpdated")}: January 10, 2025
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              12 {t("minRead")}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <ShareButtons title={t("blogPriceH1")} className="mb-8" />

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-8">
          <img 
            src={istanbulTransferHero} 
            alt="Istanbul Airport Private Transfer 2025 - Mercedes Vito VIP Service to Taksim, Sultanahmet and City Center"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        {/* Table of Contents */}
        <TableOfContents items={tocItems} />

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 id="understanding-prices">{t("blogPriceSection1Title")}</h2>
          <p>{t("blogPriceSection1P1")}</p>
          <p>{t("blogPriceSection1P2")}</p>
          
          <p>
            Istanbul Airport (IST) is one of the largest airports in the world, handling over 70 million passengers 
            annually. Located approximately 35 kilometers from the city center, it replaced the historic Atatürk 
            Airport in 2019 and has since become Turkey's primary international gateway. Understanding transfer 
            pricing is essential for budget planning and avoiding tourist traps.
          </p>

          <h3>Factors Affecting Transfer Prices in 2025</h3>
          <p>
            Several key factors influence how much you'll pay for your Istanbul Airport transfer:
          </p>
          <ul>
            <li><strong>Distance:</strong> Prices vary significantly based on your destination's distance from the airport</li>
            <li><strong>Vehicle type:</strong> Standard, VIP, and luxury vehicles have different price points</li>
            <li><strong>Time of day:</strong> Some providers charge more for night transfers (we don't!)</li>
            <li><strong>Number of passengers:</strong> Larger groups may need bigger vehicles</li>
            <li><strong>Season:</strong> Peak tourist seasons may see higher prices from some providers</li>
          </ul>

          <h2 id="destination-prices">{t("blogPriceSection2Title")}</h2>
          <p>{t("blogPriceSection2Intro")}</p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("blogPriceTableDestination")}</TableHead>
                  <TableHead>{t("blogPriceTablePrivate")}</TableHead>
                  <TableHead>{t("blogPriceTableBus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.destination}</TableCell>
                    <TableCell className="text-primary font-semibold">{row.private}</TableCell>
                    <TableCell>{row.bus}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground">
            {t("blogPriceTableNote")}
          </p>

          <h3>Popular Neighborhoods & Transfer Times</h3>
          <p>
            Understanding Istanbul's geography helps explain the pricing differences:
          </p>
          <ul>
            <li><strong>Taksim & Beyoğlu:</strong> The heart of modern Istanbul, home to Istiklal Street and vibrant nightlife. 40-50 minutes from IST.</li>
            <li><strong>Sultanahmet:</strong> The historic peninsula with Hagia Sophia, Blue Mosque, and Topkapi Palace. 45-55 minutes from IST.</li>
            <li><strong>Kadıköy:</strong> Located on the Asian side, this trendy neighborhood offers authentic local experiences. 60-75 minutes from IST.</li>
            <li><strong>Beşiktaş:</strong> Waterfront district near Dolmabahçe Palace with excellent dining and nightlife. 45-55 minutes from IST.</li>
            <li><strong>Galataport:</strong> New cruise terminal and shopping destination in Karaköy. 40-50 minutes from IST.</li>
          </ul>

          <h2 id="vehicle-prices">{t("blogPriceSection3Title")}</h2>
          <p>
            {t("blogPriceSection3Intro")} <Link to={getLocalizedPath("/fleet")} className="text-primary hover:underline">{t("ourFleet")}</Link>
          </p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("blogPriceTableVehicle")}</TableHead>
                  <TableHead>{t("blogPriceTableToTaksim")}</TableHead>
                  <TableHead>{t("blogPriceTableToKadikoy")}</TableHead>
                  <TableHead>{t("blogPriceTableToBursa")}</TableHead>
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

          <h3>Which Vehicle Should You Choose?</h3>
          <ul>
            <li><strong>Mercedes Vito (up to 6 pax):</strong> Perfect for families and small groups. Comfortable, spacious, with room for 6 large suitcases.</li>
            <li><strong>Mercedes Vito VIP:</strong> Same capacity as standard Vito but with premium leather interior, USB ports, and enhanced comfort features.</li>
            <li><strong>Mercedes Maybach (up to 3 pax):</strong> Ultimate luxury for business travelers or special occasions. Features include massage seats, privacy partition, and champagne cooler.</li>
            <li><strong>Mercedes Sprinter (up to 16 pax):</strong> Ideal for tour groups, corporate events, or large families. Includes individual climate control and entertainment system.</li>
          </ul>

          <h2 id="whats-included">{t("blogPriceSection4Title")}</h2>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t("blogPriceAllInclusive")}
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
                  <span>{t("blogPriceInclude3")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude4")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude5")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude6")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude7")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude8")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h3>What Sets Our Service Apart</h3>
          <p>
            Unlike many competitors, our all-inclusive pricing means you won't face unexpected charges. 
            Some important inclusions that others often charge extra for:
          </p>
          <ul>
            <li><strong>Flight monitoring:</strong> We track your flight in real-time and adjust pickup if delayed</li>
            <li><strong>Free waiting time:</strong> 60 minutes at airports, 15 minutes at hotels</li>
            <li><strong>Child seats:</strong> Available at no extra charge when requested in advance</li>
            <li><strong>24/7 availability:</strong> Same price whether you land at 2 PM or 2 AM</li>
          </ul>

          <h2 id="booking-tips">{t("blogPriceSection5Title")}</h2>
          <p>{t("blogPriceSection5Intro")}</p>

          <h3>When to Book Your Transfer</h3>
          <p>
            For the best experience, we recommend booking your Istanbul Airport transfer at least 24-48 hours 
            in advance. During peak travel seasons (June-September, Christmas, and New Year), booking 3-5 days 
            ahead ensures vehicle availability. However, we also accommodate last-minute bookings when possible.
          </p>

          <h3>Payment Options</h3>
          <p>
            We accept multiple payment methods for your convenience: credit/debit cards (Visa, Mastercard, Amex), 
            cash payment to driver (EUR, USD, GBP, or TRY), and bank transfer for corporate clients. All prices 
            are fixed and agreed upon before booking - no hidden fees or surge pricing.
          </p>

          <h3>Essential Booking Tips</h3>
          <ul>
            <li>Share your full flight details (airline, flight number) for accurate tracking</li>
            <li>Provide your WhatsApp number for real-time communication</li>
            <li>Specify the exact hotel address including neighborhood</li>
            <li>Request child seats at least 24 hours before your transfer</li>
            <li>Consider booking round-trip for discounted rates</li>
            <li>Mention any special requirements (wheelchair access, extra luggage space)</li>
          </ul>

          <h2 id="why-choose">{t("blogPriceSection6Title")}</h2>
          <p>{t("blogPriceSection6Intro")}</p>

          <h3>The Meet Transfer Difference</h3>
          <p>
            Since 2018, we've completed over 50,000 successful transfers with a 4.9-star average rating. 
            Here's what makes us different:
          </p>
          <ul>
            <li><strong>Professional drivers:</strong> All drivers speak English and undergo background checks</li>
            <li><strong>Premium fleet:</strong> Only Mercedes vehicles, regularly maintained and cleaned</li>
            <li><strong>Transparent pricing:</strong> No surge pricing, no hidden fees, price confirmed before booking</li>
            <li><strong>Reliability:</strong> We've never missed a pickup - 100% on-time guarantee</li>
            <li><strong>24/7 support:</strong> WhatsApp support available around the clock</li>
          </ul>

          <h3>Tips for First-Time Visitors</h3>
          <ul>
            <li><strong>Share your flight details:</strong> We monitor your flight and adjust pickup time for delays</li>
            <li><strong>Provide WhatsApp number:</strong> For real-time communication with your driver</li>
            <li><strong>Specify hotel address:</strong> Include the full address for smooth navigation</li>
            <li><strong>Request child seats early:</strong> If traveling with children, mention this when booking</li>
            <li><strong>Consider return transfer:</strong> Book round-trip for better rates and guaranteed service</li>
          </ul>

          {/* Image Gallery */}
          <h3>{t("galleryTitle") || "Our Fleet Gallery"}</h3>
          <div className="not-prose my-8">
            <BlogImageGallery 
              images={[
                { 
                  src: vitoVip1, 
                  alt: "Mercedes Vito VIP Transfer Istanbul",
                  caption: "Mercedes Vito VIP - Luxury Airport Transfer"
                },
                { 
                  src: vitoVip2, 
                  alt: "VIP Interior Istanbul Transfer",
                  caption: "Premium leather interior with starlight ceiling"
                },
                { 
                  src: sprinterInteriorBlue, 
                  alt: "Mercedes Sprinter VIP Minibus",
                  caption: "Sprinter VIP - Perfect for groups"
                },
                { 
                  src: vitoAirportAnime, 
                  alt: "Airport pickup service Istanbul",
                  caption: "Professional meet & greet service"
                },
              ]}
              columns={2}
            />
          </div>

          <h2 id="conclusion">{t("blogPriceConclusion")}</h2>
          <p>
            {t("blogPriceConclusionP1")} 
            <Link to={getLocalizedPath("/istanbul-transfer")} className="text-primary hover:underline"> {t("blogPriceConclusionLink")}</Link>
          </p>
          <p>
            Whether you're arriving for business or leisure, our professional transfer service ensures a stress-free 
            start to your Istanbul journey. With transparent pricing, modern vehicles, and English-speaking drivers, 
            we've served thousands of satisfied travelers since 2018.
          </p>
          <p>
            Istanbul is a magical city where East meets West, and your journey should begin with comfort and style. 
            From the moment you land at Istanbul Airport, our professional team is ready to welcome you with a 
            personalized meet and greet service, ensuring your Turkish adventure starts on the right foot.
          </p>
          <p>
            <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">{t("blogPriceConclusionCta")}</Link>
          </p>
        </div>

        {/* CTA Section */}
        <BlogCTA destination="Istanbul" />

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
        <RelatedArticles currentArticleId="istanbul-airport-transfer-price-guide" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default IstanbulTransferPriceGuide;
