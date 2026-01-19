import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, Plane, MapPin } from "lucide-react";
import cyprusTransferHero from "@/assets/blog/cyprus-transfer-hero.jpg";
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
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";

const CyprusAirportTransferGuide = () => {
  const { getLocalizedPath, t } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    { question: t("blogCyprusFaq1Q"), answer: t("blogCyprusFaq1A") },
    { question: t("blogCyprusFaq2Q"), answer: t("blogCyprusFaq2A") },
    { question: t("blogCyprusFaq3Q"), answer: t("blogCyprusFaq3A") },
    { question: t("blogCyprusFaq4Q"), answer: t("blogCyprusFaq4A") },
    { question: t("blogCyprusFaq5Q"), answer: t("blogCyprusFaq5A") },
    { question: t("blogCyprusFaq6Q"), answer: t("blogCyprusFaq6A") },
  ];

  const larnacaTransferPrices = [
    { destination: t("destLarnacaCity"), duration: "10-15 min", price: "€35-45" },
    { destination: t("destAyiaNapa"), duration: "40-50 min", price: "€50-65" },
    { destination: t("destProtaras"), duration: "50-60 min", price: "€55-70" },
    { destination: t("destLimassol"), duration: "45-55 min", price: "€60-75" },
    { destination: t("destNicosia"), duration: "35-45 min", price: "€50-65" },
    { destination: t("destPaphos"), duration: "90-110 min", price: "€90-110" },
    { destination: t("destKyrenia"), duration: "60-75 min", price: "€75-90" },
  ];

  const paphosTransferPrices = [
    { destination: t("destPaphosCity"), duration: "15-20 min", price: "€25-35" },
    { destination: t("destCoralBay"), duration: "25-30 min", price: "€30-40" },
    { destination: t("destPolis"), duration: "45-55 min", price: "€50-65" },
    { destination: t("destLimassol"), duration: "55-65 min", price: "€65-80" },
    { destination: t("destLarnacaCity"), duration: "90-110 min", price: "€90-110" },
    { destination: t("destAyiaNapa"), duration: "120-140 min", price: "€120-140" },
  ];

  // Ercan Airport (Northern Cyprus) Transfer Prices
  const ercanTransferPrices = [
    { 
      region: t("destGirneMerkez"), 
      destinations: "Girne Merkez, Lefkoşe, Karakum, Çatalköy",
      sedan: "€62", 
      vito: "€68", 
      vipVito: "€88" 
    },
    { 
      region: t("destAlsancakMagusa"), 
      destinations: "Alsancak, Mağusa, İskele",
      sedan: "€74", 
      vito: "€82", 
      vipVito: "€108" 
    },
    { 
      region: t("destLapta"), 
      destinations: "Lapta",
      sedan: "€88", 
      vito: "€98", 
      vipVito: "€148" 
    },
    { 
      region: t("destBafra"), 
      destinations: "Bafra",
      sedan: "€96", 
      vito: "€108", 
      vipVito: "€188" 
    },
  ];

  const popularDestinations = [
    { name: t("destAyiaNapa"), description: t("blogCyprusAyiaNapaDesc") },
    { name: t("destProtaras"), description: t("blogCyprusProtarasDesc") },
    { name: t("destLimassol"), description: t("blogCyprusLimassolDesc") },
    { name: t("destPaphos"), description: t("blogCyprusPaphosDesc") },
    { name: t("destKyrenia"), description: t("blogCyprusKyreniaDesc") },
    { name: t("destTroodosMount"), description: t("blogCyprusTroodosDesc") },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogCyprusSeoTitle")}
        description={t("blogCyprusSeoDesc")}
        keywords="Cyprus airport transfer 2026, budget airport transfer Cyprus, luxury airport transfer Cyprus, VIP airport transfer Cyprus, Larnaca airport transfer, Larnaca Airport to Ayia Napa private transfer, Larnaca Airport to Protaras transfer, Paphos airport transfer, Paphos Airport to Coral Bay transfer, Paphos Airport to Limassol transfer, Ercan airport transfer, Ercan transfer price, Larnaca transfer price 2026, Paphos transfer price 2026, airport pickup drop off Cyprus, group airport transfer Cyprus, family airport transfer Cyprus, Cyprus airport transfer online booking, Cyprus taxi transfer price, airport transfer reviews Cyprus, Ayia Napa transfer, Limassol airport transfer, Protaras transfer, Kyrenia transfer, Famagusta transfer, Northern Cyprus transfer, TRNC airport transfer service, Troodos transfer, Cyprus private driver, Cyprus VIP chauffeur"
        canonicalPath="/blog/cyprus-airport-transfer-guide"
        ogImage="https://meettransfer.app/og/cyprus-transfer-og.jpg"
        ogType="article"
        articlePublishedTime="2024-12-26"
        articleModifiedTime="2026-01-10"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t("blogCyprusH1"),
            description: t("blogCyprusSeoDesc"),
            image: 'https://meettransfer.app/og/cyprus-transfer-og.jpg',
            datePublished: '2024-12-26',
            dateModified: '2026-01-10',
            author: 'Meet Transfer',
            readingTime: '17',
            wordCount: 2500,
            keywords: ['Cyprus transfer', 'Larnaca airport', 'Paphos airport', 'Ercan airport', 'Ayia Napa', 'Protaras', 'Limassol', 'Kyrenia', 'Coral Bay', 'budget transfer Cyprus', 'VIP transfer Cyprus', 'family transfer', 'group transfer', 'airport pickup Cyprus'],
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
              { name: t("blogCyprusH1"), url: '/blog/cyprus-airport-transfer-guide' },
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
          <Badge variant="secondary" className="mb-3 md:mb-4">{t("cityCyprus")}</Badge>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
            {t("blogCyprusH1")}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 md:mb-6">
            {t("blogCyprusIntro")}
          </p>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t("lastUpdated")}: {formatBlogDate("2025-01-10")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              17 {t("minRead")}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <ShareButtons title={t("blogCyprusH1")} className="mb-6 md:mb-8" />

        {/* Featured Image */}
        <OptimizedBlogImage
          src={cyprusTransferHero}
          alt={t("blogCyprusHeroAlt")}
          aspectRatio="video"
          priority
          className="rounded-lg md:rounded-xl mb-6 md:mb-8"
        />

        {/* Table of Contents */}
        <TableOfContents items={[
          { id: "cyprus-intro", title: t("blogCyprusSection1Title") },
          { id: "cyprus-airports", title: t("blogCyprusSection2Title") },
          { id: "cyprus-larnaca", title: t("blogCyprusSection3Title") },
          { id: "cyprus-paphos", title: t("blogCyprusSection4Title") },
          { id: "cyprus-private", title: t("blogCyprusSection5Title") },
          { id: "cyprus-tips", title: t("blogCyprusSection6Title") },
          { id: "cyprus-destinations", title: t("blogCyprusSection7Title") },
          { id: "cyprus-north", title: t("blogCyprusSection8Title") },
          { id: "cyprus-booking", title: t("blogCyprusSection9Title") },
        ]} />

        {/* Article Content */}
        <div className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none">
          <h2 id="cyprus-intro">{t("blogCyprusSection1Title")}</h2>
          <p>{t("blogCyprusSection1P1")}</p>
          <p>{t("blogCyprusSection1P2")}</p>
          
          <p>{t("blogCyprusIslandIntro")}</p>

          <h3>{t("blogCyprusWhyPopular")}</h3>
          <ul>
            <li>{t("blogCyprusPopular1")}</li>
            <li>{t("blogCyprusPopular2")}</li>
            <li>{t("blogCyprusPopular3")}</li>
            <li>{t("blogCyprusPopular4")}</li>
            <li>{t("blogCyprusPopular5")}</li>
          </ul>

          <h2 id="cyprus-airports">{t("blogCyprusSection2Title")}</h2>
          
          <h3>{t("blogCyprusLarnacaTitle")}</h3>
          <p>{t("blogCyprusLarnacaDesc")}</p>
          <p>{t("blogCyprusLarnacaAirportP1")}</p>

          <h3>{t("blogCyprusPaphosAirportTitle")}</h3>
          <p>{t("blogCyprusPaphosAirportDesc")}</p>
          <p>{t("blogCyprusPaphosAirportP1")}</p>

          <h2 id="cyprus-larnaca">{t("blogCyprusSection3Title")}</h2>
          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("blogPriceTableDestination")}</TableHead>
                  <TableHead>{t("blogCyprusTableDuration")}</TableHead>
                  <TableHead>{t("blogCyprusTablePrice")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {larnacaTransferPrices.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.destination}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                    <TableCell>{item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h3>{t("blogCyprusUnderstandingLarnaca")}</h3>
          <p>{t("blogCyprusUnderstandingLarnacaP1")}</p>

          <h2 id="cyprus-paphos">{t("blogCyprusSection4Title")}</h2>
          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("blogPriceTableDestination")}</TableHead>
                  <TableHead>{t("blogCyprusTableDuration")}</TableHead>
                  <TableHead>{t("blogCyprusTablePrice")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paphosTransferPrices.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.destination}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                    <TableCell>{item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h2 id="cyprus-private">{t("blogCyprusSection5Title")}</h2>
          <p>
            <Link to={getLocalizedPath("/cyprus-transfer")} className="text-primary hover:underline">{t("blogCyprusPrivateTransfer")}</Link> {t("blogCyprusSection5P1")}
          </p>

          <h3>{t("blogCyprusWhyPrivate")}</h3>
          <p>{t("blogCyprusWhyPrivateP1")}</p>

          <h3>{t("blogCyprusSection5SubTitle")}</h3>
          <ul>
            <li>{t("blogCyprusInclude1")}</li>
            <li>{t("blogCyprusInclude2")}</li>
            <li>{t("blogCyprusInclude3")}</li>
            <li>{t("blogCyprusInclude4")}</li>
            <li>{t("blogCyprusInclude5")}</li>
            <li>{t("blogCyprusInclude6")}</li>
            <li>{t("blogCyprusInclude7")}</li>
          </ul>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t("blogCyprusWhyChoose")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCyprusWhyChoose1")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCyprusWhyChoose2")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCyprusWhyChoose3")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCyprusWhyChoose4")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 id="cyprus-tips">{t("blogCyprusSection6Title")}</h2>
          <p>{t("blogCyprusSection6Intro")}</p>

          <h3>{t("blogCyprusEssentialTips")}</h3>
          <ul>
            <li>{t("blogCyprusTip1")}</li>
            <li>{t("blogCyprusTip2")}</li>
            <li>{t("blogCyprusTip3")}</li>
            <li>{t("blogCyprusTip4")}</li>
            <li>{t("blogCyprusTip5")}</li>
          </ul>

          <h2 id="cyprus-destinations">{t("blogCyprusSection7Title")}</h2>
          <div className="not-prose my-8 grid md:grid-cols-2 gap-4">
            {popularDestinations.map((destination, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {destination.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{destination.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h3>{t("blogCyprusDiscovering")}</h3>
          <p>{t("blogCyprusDiscoveringP1")}</p>

          <h2 id="cyprus-north">{t("blogCyprusSection8Title")}</h2>
          <p>{t("blogCyprusSection8Intro")}</p>
          <p>{t("blogCyprusNorthernP1")}</p>

          <h3>{t("blogCyprusErcanPricesTitle")}</h3>
          <p>{t("blogCyprusErcanPricesIntro")}</p>
          
          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("blogCyprusTableRegion")}</TableHead>
                  <TableHead>{t("blogCyprusTableSedan")}</TableHead>
                  <TableHead>{t("blogCyprusTableVito")}</TableHead>
                  <TableHead>{t("blogCyprusTableVipVito")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ercanTransferPrices.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div>{item.region}</div>
                      <div className="text-xs text-muted-foreground">{item.destinations}</div>
                    </TableCell>
                    <TableCell>{item.sedan}</TableCell>
                    <TableCell>{item.vito}</TableCell>
                    <TableCell>{item.vipVito}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground italic">{t("blogCyprusErcanNote")}</p>

          <h2 id="cyprus-booking">{t("blogCyprusSection9Title")}</h2>
          <p>{t("blogCyprusSection9Intro")}</p>

          <h3>{t("blogCyprusBookingTips")}</h3>
          <p>{t("blogCyprusBookingTipsP1")}</p>

          <h2>{t("blogCyprusConclusion")}</h2>
          <p>{t("blogCyprusConclusionP1")}</p>
          <p>{t("blogCyprusConclusionP2")}</p>
        </div>

        {/* CTA Section */}
        <BlogCTA destination="Cyprus" />

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
        <RelatedArticles currentArticleId="cyprus-airport-transfer-guide" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default CyprusAirportTransferGuide;
