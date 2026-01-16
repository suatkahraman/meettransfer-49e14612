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
import { useBlogDate } from "@/hooks/useBlogDate";

const DubaiAirportTransferGuide = () => {
  const { getLocalizedPath, t } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    { question: t("blogDubaiFaq1Q"), answer: t("blogDubaiFaq1A") },
    { question: t("blogDubaiFaq2Q"), answer: t("blogDubaiFaq2A") },
    { question: t("blogDubaiFaq3Q"), answer: t("blogDubaiFaq3A") },
    { question: t("blogDubaiFaq4Q"), answer: t("blogDubaiFaq4A") },
    { question: t("blogDubaiFaq5Q"), answer: t("blogDubaiFaq5A") },
    { question: t("blogDubaiFaq6Q"), answer: t("blogDubaiFaq6A") },
  ];

  const transferPrices = [
    { destination: t("destDowntownDubai") + " (Sedan)", duration: "15-25 min", price: "265 AED" },
    { destination: t("destDowntownDubai") + " (Premium Van)", duration: "15-25 min", price: "600 AED" },
    { destination: t("destDowntownDubai") + " (SUV)", duration: "15-25 min", price: "650 AED" },
    { destination: t("destDowntownDubai") + " (VIP Sprinter)", duration: "15-25 min", price: "1050 AED" },
    { destination: t("destPalmJumeirah"), duration: "25-35 min", price: "From 300 AED" },
    { destination: t("destDubaiMarina"), duration: "30-40 min", price: "From 280 AED" },
    { destination: t("destJumeirahBeach"), duration: "20-30 min", price: "From 280 AED" },
    { destination: t("destBusinessBay"), duration: "15-25 min", price: "From 265 AED" },
    { destination: t("destAbuDhabi"), duration: "75-90 min", price: "From 650 AED" },
  ];

  const popularAttractions = [
    { name: t("destDowntownDubai").split(" /")[0], description: t("blogDubaiBurjKhalifa") },
    { name: t("destPalmJumeirah"), description: t("blogDubaiPalm") },
    { name: "Dubai Mall", description: t("blogDubaiMall") },
    { name: t("destDubaiMarina").split(" /")[0], description: t("blogDubaiMarina") },
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
              { name: t("breadcrumbHome"), url: '/' },
              { name: t("breadcrumbBlog"), url: '/blog' },
              { name: t("blogDubaiH1"), url: '/blog/dubai-airport-transfer-guide' },
            ],
          },
        ]}
      />

      <article className="max-w-4xl mx-auto px-3 sm:px-4 py-8 md:py-12">
        {/* Back to Blog */}
        <Link 
          to={getLocalizedPath("/blog")} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToBlog")}
        </Link>

        {/* Article Header */}
        <header className="mb-8 md:mb-12">
          <Badge variant="secondary" className="mb-3 md:mb-4">{t("cityDubai")}</Badge>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
            {t("blogDubaiH1")}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 md:mb-6">
            {t("blogDubaiIntro")}
          </p>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t("lastUpdated")}: {formatBlogDate("2025-01-10")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              16 {t("minRead")}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <ShareButtons title={t("blogDubaiH1")} className="mb-6 md:mb-8" />

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-lg md:rounded-xl mb-6 md:mb-8">
          <img 
            src={dubaiTransferHero} 
            alt={t("blogDubaiHeroAlt")}
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
        <div className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none">
          <h2 id="dubai-intro">{t("blogDubaiSection1Title")}</h2>
          <p>{t("blogDubaiSection1P1")}</p>
          <p>{t("blogDubaiSection1P2")}</p>
          
          <p>{t("blogDubaiMostVisited")}</p>

          <h3>{t("blogDubaiWhatToExpect")}</h3>
          <p>{t("blogDubaiWhatToExpectP1")}</p>

          <h2 id="dubai-airports">{t("blogDubaiSection2Title")}</h2>
          <p>{t("blogDubaiSection2Intro")}</p>

          <h3>{t("blogDubaiSection2Title")} - DXB</h3>
          <p>{t("blogDubaiDXBDetails")}</p>

          <h3>Al Maktoum International Airport (DWC)</h3>
          <p>{t("blogDubaiDWCDetails")}</p>

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

          <h3>{t("blogDubaiPricingTitle")}</h3>
          <p>{t("blogDubaiPricingP1")}</p>

          <h2 id="dubai-private">{t("blogDubaiSection4Title")}</h2>
          <p>
            <Link to={getLocalizedPath("/dubai-transfer")} className="text-primary hover:underline">{t("blogDubaiPrivateTransfer")}</Link> {t("blogDubaiSection4P1")}
          </p>

          <h3>{t("blogDubaiLuxuryTitle")}</h3>
          <p>{t("blogDubaiLuxuryP1")}</p>

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

          <h3>{t("blogDubaiBookingTitle")}</h3>
          <p>{t("blogDubaiBookingP1")}</p>

          <h2 id="dubai-tips">{t("blogDubaiSection6Title")}</h2>
          <p>{t("blogDubaiSection6Intro")}</p>

          <h3>{t("blogDubaiTipsTitle")}</h3>
          <ul>
            <li><strong>{t("blogDubaiTip1")}</strong> {t("blogDubaiTip1Desc")}</li>
            <li><strong>{t("blogDubaiTip2")}</strong> {t("blogDubaiTip2Desc")}</li>
            <li><strong>{t("blogDubaiTip3")}</strong> {t("blogDubaiTip3Desc")}</li>
            <li><strong>{t("blogDubaiTip4")}</strong> {t("blogDubaiTip4Desc")}</li>
            <li><strong>{t("blogDubaiTip5")}</strong> {t("blogDubaiTip5Desc")}</li>
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

          <h3>{t("blogDubaiBeyondTitle")}</h3>
          <p>{t("blogDubaiBeyondP1")}</p>

          <h2 id="dubai-faq">{t("blogDubaiSection8Title")}</h2>
          <p>{t("blogDubaiSection8Intro")}</p>

          <h2>{t("blogDubaiConclusion")}</h2>
          <p>{t("blogDubaiConclusionP1")}</p>
          <p>{t("blogDubaiFinalP1")}</p>
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
