import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, MapPin } from "lucide-react";
import muglaTransferHero from "@/assets/blog/mugla-transfer-hero.jpg";
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

const MuglaAirportTransferGuide = () => {
  const { getLocalizedPath, t } = useLanguage();

  const faqItems = [
    { question: t("blogMuglaFaq1Q"), answer: t("blogMuglaFaq1A") },
    { question: t("blogMuglaFaq2Q"), answer: t("blogMuglaFaq2A") },
    { question: t("blogMuglaFaq3Q"), answer: t("blogMuglaFaq3A") },
    { question: t("blogMuglaFaq4Q"), answer: t("blogMuglaFaq4A") },
    { question: t("blogMuglaFaq5Q"), answer: t("blogMuglaFaq5A") },
    { question: t("blogMuglaFaq6Q"), answer: t("blogMuglaFaq6A") },
  ];

  const tocItems = [
    { id: "airport-overview", title: t("blogMuglaSection1Title") },
    { id: "why-private", title: t("blogMuglaSection2Title") },
    { id: "transfer-prices", title: t("blogMuglaSection3Title") },
    { id: "destinations", title: t("blogMuglaSection4Title") },
    { id: "whats-included", title: t("blogMuglaSection5Title") },
  ];

  const destinations = [
    { area: "Bodrum", distance: "95 km", time: "90-100 min", price: "€95" },
    { area: "Marmaris", distance: "95 km", time: "90-100 min", price: "€95" },
    { area: "Fethiye", distance: "50 km", time: "50-60 min", price: "€65" },
    { area: "Ölüdeniz", distance: "60 km", time: "60-70 min", price: "€70" },
    { area: "Muğla Center", distance: "25 km", time: "25-35 min", price: "€45" },
    { area: "Datça", distance: "150 km", time: "140-160 min", price: "€140" },
    { area: "Köyceğiz", distance: "35 km", time: "35-45 min", price: "€55" },
    { area: "Ortaca", distance: "20 km", time: "20-30 min", price: "€40" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogMuglaSeoTitle")}
        description={t("blogMuglaSeoDesc")}
        keywords="Dalaman airport to Mugla transfer, Mugla airport transfer 2025, Bodrum transfer, Marmaris transfer, Fethiye transfer, Mugla VIP transfer, Datca transfer"
        canonicalPath="/blog/mugla-airport-transfer-guide"
        ogImage="https://meettransfer.app/og/mugla-transfer-og.jpg"
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
            headline: t("blogMuglaH1"),
            description: t("blogMuglaSeoDesc"),
            image: "https://meettransfer.app/og/mugla-transfer-og.jpg",
            datePublished: "2025-01-12",
            dateModified: "2025-01-12",
            author: "Meet Transfer",
            readingTime: "14",
            wordCount: 2000,
            keywords: ["Mugla airport transfer", "Bodrum transfer", "Marmaris transfer", "Fethiye transfer"],
          },
          {
            type: "BreadcrumbList",
            items: [
              { name: "Home", url: "/" },
              { name: "Blog", url: "/blog" },
              { name: "Mugla Airport Transfer Guide", url: "/blog/mugla-airport-transfer-guide" },
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
          <Badge variant="secondary" className="mb-4">Muğla</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t("blogMuglaH1")}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t("blogMuglaIntro")}
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

        <ShareButtons title={t("blogMuglaH1")} className="mb-8" />

        <div className="aspect-video overflow-hidden rounded-xl mb-8">
          <img 
            src={muglaTransferHero} 
            alt="Mugla Airport Transfer 2025 - Dalaman to Bodrum, Marmaris, Fethiye VIP Transfer"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        <TableOfContents items={tocItems} />

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 id="airport-overview">{t("blogMuglaSection1Title")}</h2>
          <p>{t("blogMuglaSection1P1")}</p>
          <p>{t("blogMuglaSection1P2")}</p>

          <h2 id="why-private">{t("blogMuglaSection2Title")}</h2>
          <p>{t("blogMuglaSection2Intro")}</p>
          <ul>
            <li><strong>{t("blogMuglaBenefit1").split(":")[0]}:</strong> {t("blogMuglaBenefit1").split(":")[1]}</li>
            <li><strong>{t("blogMuglaBenefit2").split(":")[0]}:</strong> {t("blogMuglaBenefit2").split(":")[1]}</li>
            <li><strong>{t("blogMuglaBenefit3").split(":")[0]}:</strong> {t("blogMuglaBenefit3").split(":")[1]}</li>
            <li><strong>{t("blogMuglaBenefit4").split(":")[0]}:</strong> {t("blogMuglaBenefit4").split(":")[1]}</li>
          </ul>

          <h2 id="transfer-prices">{t("blogMuglaSection3Title")}</h2>
          <p>{t("blogMuglaSection3Intro")}</p>

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
            {t("blogMuglaTableNote")}
          </p>

          <h2 id="destinations">{t("blogMuglaSection4Title")}</h2>

          <h3>{t("blogMuglaBodrumTitle")}</h3>
          <p>{t("blogMuglaBodrumDesc")}</p>

          <h3>{t("blogMuglaMarmarisTitle")}</h3>
          <p>{t("blogMuglaMarmarisDesc")}</p>

          <h3>{t("blogMuglaFethiyeTitle")}</h3>
          <p>{t("blogMuglaFethiyeDesc")}</p>

          <h3>{t("blogMuglaDatcaTitle")}</h3>
          <p>{t("blogMuglaDatcaDesc")}</p>

          <h2 id="whats-included">{t("blogMuglaSection5Title")}</h2>

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
                  alt: "Mercedes Vito Family Interior Mugla Transfer",
                  caption: t("blogGalleryCaption1")
                },
                { 
                  src: vitoExteriorBlack, 
                  alt: "Mercedes Vito VIP Exterior",
                  caption: t("blogGalleryCaption2")
                },
                { 
                  src: sprinterLuggage, 
                  alt: "Mercedes Sprinter with luggage space",
                  caption: t("blogGalleryCaption3")
                },
                { 
                  src: vitoVipPassengersDay, 
                  alt: "Happy passengers enjoying transfer",
                  caption: t("blogGalleryCaption4")
                },
              ]}
              columns={2}
            />
          </div>

          <h2>{t("blogMuglaConclusion")}</h2>
          <p>
            {t("blogMuglaConclusionP1")} 
            <Link to={getLocalizedPath("/dalaman-transfer")} className="text-primary hover:underline"> {t("blogMuglaConclusionLink")}</Link>
          </p>
          <p>
            <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">{t("blogPriceConclusionCta")}</Link>
          </p>
        </div>

        <div className="my-12 p-6 bg-muted/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{t("blogMuglaMapTitle")}</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {t("blogMuglaMapDesc")}
          </p>
        </div>

        <BlogCTA destination="Muğla" />

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

        <RelatedArticles currentArticleId="mugla-airport-transfer-guide" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default MuglaAirportTransferGuide;
