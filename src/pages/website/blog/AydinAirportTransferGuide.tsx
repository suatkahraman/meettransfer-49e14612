import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, MapPin } from "lucide-react";
import aydinTransferHero from "@/assets/blog/aydin-transfer-hero.jpg";
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
import vitoFamilyInterior from "@/assets/vito-family-interior.jpg";
import vitoExteriorBlack from "@/assets/vito-exterior-black.jpg";
import sprinterLuggage from "@/assets/sprinter-luggage.jpg";
import vitoVipPassengersDay from "@/assets/vito-vip-passengers-day.jpg";

const AydinAirportTransferGuide = () => {
  const { getLocalizedPath, t } = useLanguage();

  const faqItems = [
    { question: t("blogAydinFaq1Q"), answer: t("blogAydinFaq1A") },
    { question: t("blogAydinFaq2Q"), answer: t("blogAydinFaq2A") },
    { question: t("blogAydinFaq3Q"), answer: t("blogAydinFaq3A") },
    { question: t("blogAydinFaq4Q"), answer: t("blogAydinFaq4A") },
    { question: t("blogAydinFaq5Q"), answer: t("blogAydinFaq5A") },
    { question: t("blogAydinFaq6Q"), answer: t("blogAydinFaq6A") },
  ];

  const tocItems = [
    { id: "airport-overview", title: t("blogAydinSection1Title") },
    { id: "why-private", title: t("blogAydinSection2Title") },
    { id: "transfer-prices", title: t("blogAydinSection3Title") },
    { id: "destinations", title: t("blogAydinSection4Title") },
    { id: "whats-included", title: t("blogAydinSection5Title") },
  ];

  const destinations = [
    { area: "Kuşadası", distance: "70 km", time: "60-70 min", price: "€75" },
    { area: "Ephesus", distance: "55 km", time: "50-60 min", price: "€65" },
    { area: "Didim", distance: "100 km", time: "90-100 min", price: "€95" },
    { area: "Söke", distance: "65 km", time: "55-65 min", price: "€70" },
    { area: "Aydın Center", distance: "80 km", time: "70-80 min", price: "€80" },
    { area: "Pamukkale", distance: "180 km", time: "150-180 min", price: "€160" },
    { area: "Selçuk", distance: "50 km", time: "45-55 min", price: "€60" },
    { area: "Altınkum", distance: "105 km", time: "95-105 min", price: "€100" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogAydinSeoTitle")}
        description={t("blogAydinSeoDesc")}
        keywords="Izmir airport to Aydin transfer, Aydin airport transfer 2025, Kusadasi transfer, Ephesus private transfer, Didim transfer, Aydin VIP transfer, Pamukkale transfer"
        canonicalPath="/blog/aydin-airport-transfer-guide"
        ogImage="https://meettransfer.app/og/aydin-transfer-og.jpg"
        ogType="article"
        articlePublishedTime="2025-01-12"
        articleModifiedTime="2025-01-12"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: "LocalBusiness" },
          {
            type: "Article",
            headline: t("blogAydinH1"),
            description: t("blogAydinSeoDesc"),
            image: "https://meettransfer.app/og/aydin-transfer-og.jpg",
            datePublished: "2025-01-12",
            dateModified: "2025-01-12",
            author: "Meet Transfer",
            readingTime: "14",
            wordCount: 2000,
            keywords: ["Aydin airport transfer", "Kusadasi transfer", "Ephesus transfer", "Didim transfer"],
          },
          {
            type: "BreadcrumbList",
            items: [
              { name: "Home", url: "/" },
              { name: "Blog", url: "/blog" },
              { name: "Aydin Airport Transfer Guide", url: "/blog/aydin-airport-transfer-guide" },
            ],
          },
          {
            type: "FAQPage",
            questions: faqItems.map(item => ({
              question: item.question,
              answer: item.answer
            }))
          }
        ]}
      />

      <article className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          to={getLocalizedPath("/blog")} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToBlog")}
        </Link>

        <header className="mb-12">
          <Badge variant="secondary" className="mb-4">Aydın</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t("blogAydinH1")}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t("blogAydinIntro")}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("lastUpdated")}: January 12, 2025
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              14 {t("minRead")}
            </span>
          </div>
        </header>

        <ShareButtons title={t("blogAydinH1")} className="mb-8" />

        <div className="aspect-video overflow-hidden rounded-xl mb-8">
          <img 
            src={aydinTransferHero} 
            alt="Aydin Airport Transfer 2025 - Izmir to Kusadasi, Ephesus, Didim VIP Transfer"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        <TableOfContents items={tocItems} />

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 id="airport-overview">{t("blogAydinSection1Title")}</h2>
          <p>{t("blogAydinSection1P1")}</p>
          <p>{t("blogAydinSection1P2")}</p>

          <h2 id="why-private">{t("blogAydinSection2Title")}</h2>
          <p>{t("blogAydinSection2Intro")}</p>
          <ul>
            <li><strong>{t("blogAydinBenefit1").split(":")[0]}:</strong> {t("blogAydinBenefit1").split(":")[1]}</li>
            <li><strong>{t("blogAydinBenefit2").split(":")[0]}:</strong> {t("blogAydinBenefit2").split(":")[1]}</li>
            <li><strong>{t("blogAydinBenefit3").split(":")[0]}:</strong> {t("blogAydinBenefit3").split(":")[1]}</li>
            <li><strong>{t("blogAydinBenefit4").split(":")[0]}:</strong> {t("blogAydinBenefit4").split(":")[1]}</li>
          </ul>

          <h2 id="transfer-prices">{t("blogAydinSection3Title")}</h2>
          <p>{t("blogAydinSection3Intro")}</p>

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
            {t("blogAydinTableNote")}
          </p>

          <h2 id="destinations">{t("blogAydinSection4Title")}</h2>

          <h3>{t("blogAydinKusadasiTitle")}</h3>
          <p>{t("blogAydinKusadasiDesc")}</p>

          <h3>{t("blogAydinEphesusTitle")}</h3>
          <p>{t("blogAydinEphesusDesc")}</p>

          <h3>{t("blogAydinDidimTitle")}</h3>
          <p>{t("blogAydinDidimDesc")}</p>

          <h3>{t("blogAydinPamukkaleTitle")}</h3>
          <p>{t("blogAydinPamukkaleDesc")}</p>

          <h2 id="whats-included">{t("blogAydinSection5Title")}</h2>

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
                  <span>{t("blogPriceInclude5")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h3>{t("galleryTitle") || "Our Fleet Gallery"}</h3>
          <div className="not-prose my-8">
            <BlogImageGallery 
              images={[
                { 
                  src: vitoFamilyInterior, 
                  alt: "Mercedes Vito Family Interior Aydin Transfer",
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
                  caption: "Comfortable journey to Ephesus"
                },
              ]}
              columns={2}
            />
          </div>

          <h2>{t("blogAydinConclusion")}</h2>
          <p>
            {t("blogAydinConclusionP1")} 
            <Link to={getLocalizedPath("/izmir-transfer")} className="text-primary hover:underline"> {t("blogAydinConclusionLink")}</Link>
          </p>
          <p>
            <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">{t("blogPriceConclusionCta")}</Link>
          </p>
        </div>

        <div className="my-12 p-6 bg-muted/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{t("blogAydinMapTitle")}</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {t("blogAydinMapDesc")}
          </p>
        </div>

        <BlogCTA destination="Aydın" />

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

        <RelatedArticles currentArticleId="aydin-airport-transfer-guide" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default AydinAirportTransferGuide;
