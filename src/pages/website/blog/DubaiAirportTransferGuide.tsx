import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2, Plane, Building } from "lucide-react";
import dubaiTransferHero from "@/assets/blog/dubai-transfer-hero.jpg";
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
import BlogCTA from "@/components/website/BlogCTA";

const DubaiAirportTransferGuide = () => {
  const { getLocalizedPath, t } = useLanguage();

  const faqItems = [
    { question: t("blogDubaiFaq1Q"), answer: t("blogDubaiFaq1A") },
    { question: t("blogDubaiFaq2Q"), answer: t("blogDubaiFaq2A") },
    { question: t("blogDubaiFaq3Q"), answer: t("blogDubaiFaq3A") },
    { question: t("blogDubaiFaq4Q"), answer: t("blogDubaiFaq4A") },
    { question: t("blogDubaiFaq5Q"), answer: t("blogDubaiFaq5A") },
    { question: t("blogDubaiFaq6Q"), answer: t("blogDubaiFaq6A") },
  ];

  const transferPrices = [
    { destination: "Downtown Dubai / Burj Khalifa", duration: "15-25 min", price: "$45-60" },
    { destination: "Palm Jumeirah", duration: "25-35 min", price: "$55-70" },
    { destination: "Dubai Marina / JBR", duration: "30-40 min", price: "$55-70" },
    { destination: "Jumeirah Beach Hotels", duration: "20-30 min", price: "$50-65" },
    { destination: "Business Bay", duration: "15-25 min", price: "$45-60" },
    { destination: "Abu Dhabi", duration: "75-90 min", price: "$120-150" },
  ];

  const popularAttractions = [
    { name: "Burj Khalifa", description: t("blogDubaiBurjKhalifa") },
    { name: "Palm Jumeirah", description: t("blogDubaiPalm") },
    { name: "Dubai Mall", description: t("blogDubaiMall") },
    { name: "Dubai Marina", description: t("blogDubaiMarina") },
    { name: "Burj Al Arab", description: t("blogDubaiBurjArab") },
    { name: "Dubai Frame", description: t("blogDubaiFrame") },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogDubaiSeoTitle")}
        description={t("blogDubaiSeoDesc")}
        keywords="Dubai airport transfer 2025, DXB private transfer, Dubai Airport to Downtown, Palm Jumeirah transfer, Dubai VIP transfer, Dubai luxury transfer, Dubai Marina transfer, Burj Khalifa transfer, JBR transfer, Business Bay transfer, Dubai Airport to hotel, DWC airport transfer, Al Maktoum airport, Abu Dhabi transfer, Dubai chauffeur service"
        canonicalPath="/blog/dubai-airport-transfer-guide"
        ogImage="https://meettransfer.app/og/dubai-transfer-og.jpg"
        ogType="article"
        articlePublishedTime="2024-12-26"
        articleModifiedTime="2025-01-10"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t("blogDubaiH1"),
            description: t("blogDubaiSeoDesc"),
            image: 'https://meettransfer.app/og/dubai-transfer-og.jpg',
            datePublished: '2024-12-26',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '16',
            wordCount: 2300,
            keywords: ['Dubai airport transfer', 'DXB transfer', 'Palm Jumeirah', 'Downtown Dubai', 'VIP transfer'],
          },
          {
            type: 'FAQPage',
            questions: faqItems.map(item => ({
              question: item.question,
              answer: item.answer
            }))
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Dubai Airport Transfer Guide', url: '/blog/dubai-airport-transfer-guide' },
            ],
          },
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
          <Badge variant="secondary" className="mb-4">Dubai</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t("blogDubaiH1")}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t("blogDubaiIntro")}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("lastUpdated")}: January 10, 2025
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              16 {t("minRead")}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <ShareButtons title={t("blogDubaiH1")} className="mb-8" />

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12">
          <img 
            src={dubaiTransferHero} 
            alt="Dubai Airport Transfer 2025 - VIP Private Transfer to Downtown, Palm Jumeirah, Dubai Marina"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        {/* Table of Contents */}
        <TableOfContents items={[
          { id: "dubai-intro", title: t("blogDubaiSection1Title") },
          { id: "dubai-airports", title: t("blogDubaiSection2Title") },
          { id: "dubai-prices", title: t("blogDubaiSection3Title") },
          { id: "dubai-private", title: t("blogDubaiSection4Title") },
          { id: "dubai-booking", title: t("blogDubaiSection5Title") },
          { id: "dubai-tips", title: t("blogDubaiSection6Title") },
          { id: "dubai-attractions", title: t("blogDubaiSection7Title") },
          { id: "dubai-faq", title: t("blogDubaiSection8Title") },
        ]} />

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 id="dubai-intro">{t("blogDubaiSection1Title")}</h2>
          <p>{t("blogDubaiSection1P1")}</p>
          <p>{t("blogDubaiSection1P2")}</p>
          
          <p>{t("blogDubaiMostVisited")}</p>

          <h3>{t("blogDubaiWhatToExpect")}</h3>
          <p>{t("blogDubaiWhatToExpectP1")}</p>

          <h2 id="dubai-airports">{t("blogDubaiSection2Title")}</h2>
          <p>{t("blogDubaiSection2Intro")}</p>

          <h3>Dubai International Airport (DXB)</h3>
          <p>
            Located just 4.6 km from the city center, DXB is the primary airport serving Dubai. It features 
            three terminals: Terminal 1 handles most international airlines, Terminal 2 serves budget carriers, 
            and Terminal 3 is exclusively for Emirates airline passengers. The airport is well-connected to 
            the Dubai Metro via the Red Line.
          </p>

          <h3>Al Maktoum International Airport (DWC)</h3>
          <p>
            Situated 37 km southwest of Dubai, Al Maktoum Airport serves as a secondary hub, primarily for 
            cargo and some passenger flights. It's part of the massive Dubai World Central development and 
            is expected to become the world's largest airport upon full completion.
          </p>

          <h2 id="dubai-prices">{t("blogDubaiSection3Title")}</h2>
          <p>{t("blogDubaiSection3Intro")}</p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("blogPriceTableDestination")}</TableHead>
                  <TableHead>{t("blogDubaiTableDuration")}</TableHead>
                  <TableHead>{t("blogDubaiTablePrice")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transferPrices.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.destination}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                    <TableCell>{item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h3>Understanding Dubai Transfer Pricing</h3>
          <p>
            Dubai's transfer prices are influenced by distance, traffic conditions, and the type of service 
            you choose. Sheikh Zayed Road, the main arterial highway, can experience significant traffic 
            during rush hours (7-9 AM and 5-8 PM). Our fixed pricing ensures you know exactly what you'll 
            pay, regardless of traffic conditions.
          </p>

          <h2 id="dubai-private">{t("blogDubaiSection4Title")}</h2>
          <p>
            <Link to={getLocalizedPath("/dubai-transfer")} className="text-primary hover:underline">{t("blogDubaiPrivateTransfer")}</Link> {t("blogDubaiSection4P1")}
          </p>

          <h3>The Dubai Luxury Experience</h3>
          <p>
            Dubai is synonymous with luxury, and your airport transfer should match that standard. Our 
            premium fleet includes the latest Mercedes models, ensuring you arrive at your destination in 
            style. Whether you're heading to the iconic Burj Al Arab or a business meeting at DIFC, our 
            professional chauffeurs know the city inside out.
          </p>

          <h3>{t("blogDubaiSection4SubTitle")}</h3>
          <ul>
            <li>{t("blogDubaiInclude1")}</li>
            <li>{t("blogDubaiInclude2")}</li>
            <li>{t("blogDubaiInclude3")}</li>
            <li>{t("blogDubaiInclude4")}</li>
            <li>{t("blogDubaiInclude5")}</li>
            <li>{t("blogDubaiInclude6")}</li>
            <li>{t("blogDubaiInclude7")}</li>
          </ul>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t("blogDubaiWhyChoose")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogDubaiWhyChoose1")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogDubaiWhyChoose2")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogDubaiWhyChoose3")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogDubaiWhyChoose4")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 id="dubai-booking">{t("blogDubaiSection5Title")}</h2>
          <p>{t("blogDubaiSection5Intro")}</p>

          <h3>Booking in Advance vs. On Arrival</h3>
          <p>
            While transport options are available at Dubai Airport, booking in advance offers significant 
            advantages. Pre-booked transfers mean your driver is already waiting when you exit arrivals, 
            eliminating queue time and uncertainty. During peak seasons and major events like the Dubai 
            Shopping Festival, pre-booking becomes essential.
          </p>

          <h2 id="dubai-tips">{t("blogDubaiSection6Title")}</h2>
          <p>{t("blogDubaiSection6Intro")}</p>

          <h3>Essential Dubai Arrival Tips</h3>
          <ul>
            <li><strong>Stay connected:</strong> Free WiFi is available throughout the airport</li>
            <li><strong>Currency exchange:</strong> ATMs offer better rates than exchange counters</li>
            <li><strong>Dress code:</strong> While Dubai is liberal, modest clothing is respectful</li>
            <li><strong>RTA cards:</strong> Get a Nol card if using public transport during your stay</li>
            <li><strong>Summer heat:</strong> From May to September, temperatures exceed 40°C - air-conditioned transfer is essential</li>
          </ul>

          <h2 id="dubai-attractions">{t("blogDubaiSection7Title")}</h2>
          <div className="not-prose my-8 grid md:grid-cols-2 gap-4">
            {popularAttractions.map((attraction, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    {attraction.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{attraction.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h3>Beyond the Famous Landmarks</h3>
          <p>
            While the Burj Khalifa and Palm Jumeirah grab headlines, Dubai offers much more. Explore the 
            historic Al Fahidi neighborhood for a glimpse of old Dubai, take an abra ride across Dubai Creek, 
            or venture to the desert for an authentic Bedouin experience. Our transfer services can take you 
            anywhere in the emirate.
          </p>

          <h2 id="dubai-faq">{t("blogDubaiSection8Title")}</h2>
          <p>{t("blogDubaiSection8Intro")}</p>

          <h2>{t("blogDubaiConclusion")}</h2>
          <p>{t("blogDubaiConclusionP1")}</p>
          <p>
            Dubai is a city that impresses from the moment you arrive. With world-class infrastructure, 
            stunning architecture, and endless entertainment options, your visit promises to be unforgettable. 
            Starting your journey with a professional private transfer sets the tone for the exceptional 
            experience that awaits you in this dynamic city.
          </p>
        </div>

        {/* CTA Section */}
        <BlogCTA destination="Dubai" />

        {/* FAQ Section */}
        <section className="not-prose mt-16">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8">
            {t("frequentlyAskedQuestions")}
          </h2>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-border pb-6 last:border-0">
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Posts */}
        <RelatedArticles currentArticleId="dubai-airport-transfer-guide" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default DubaiAirportTransferGuide;
