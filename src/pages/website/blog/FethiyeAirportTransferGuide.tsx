import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, MapPin } from "lucide-react";
import { CompactRouteMap } from "@/components/ui/compact-route-map";
import fethiyeTransferHero from "@/assets/blog/fethiye-transfer-hero.jpg";
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

const FethiyeAirportTransferGuide = () => {
  const { getLocalizedPath, t } = useLanguage();

  const faqItems = [
    { question: t("blogFethiyeFaq1Q"), answer: t("blogFethiyeFaq1A") },
    { question: t("blogFethiyeFaq2Q"), answer: t("blogFethiyeFaq2A") },
    { question: t("blogFethiyeFaq3Q"), answer: t("blogFethiyeFaq3A") },
    { question: t("blogFethiyeFaq4Q"), answer: t("blogFethiyeFaq4A") },
    { question: t("blogFethiyeFaq5Q"), answer: t("blogFethiyeFaq5A") },
    { question: t("blogFethiyeFaq6Q"), answer: t("blogFethiyeFaq6A") },
  ];

  const tocItems = [
    { id: "airport-overview", title: t("blogFethiyeSection1Title") },
    { id: "why-private", title: t("blogFethiyeSection2Title") },
    { id: "transfer-prices", title: t("blogFethiyeSection3Title") },
    { id: "destinations", title: t("blogFethiyeSection4Title") },
    { id: "whats-included", title: t("blogFethiyeSection5Title") },
  ];

  const destinations = [
    { area: "Fethiye Center", distance: "50 km", time: "50-60 min", price: "€65" },
    { area: "Ölüdeniz", distance: "60 km", time: "60-70 min", price: "€70" },
    { area: "Hisarönü", distance: "55 km", time: "55-65 min", price: "€70" },
    { area: "Çalış Beach", distance: "52 km", time: "50-60 min", price: "€65" },
    { area: "Kayaköy", distance: "58 km", time: "55-65 min", price: "€70" },
    { area: "Göcek", distance: "25 km", time: "25-30 min", price: "€55" },
    { area: "Kalkan", distance: "85 km", time: "90-100 min", price: "€90" },
    { area: "Kaş", distance: "110 km", time: "110-130 min", price: "€110" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogFethiyeSeoTitle")}
        description={t("blogFethiyeSeoDesc")}
        keywords="Dalaman airport to Fethiye transfer, Fethiye airport transfer 2025, Dalaman to Ölüdeniz transfer, Fethiye private transfer, Dalaman airport taxi, Fethiye VIP transfer, Göcek transfer, Kalkan transfer"
        canonicalPath="/blog/fethiye-airport-transfer-guide"
        ogImage="https://meettransfer.app/og/fethiye-transfer-og.jpg"
        ogType="article"
        articlePublishedTime="2025-01-12"
        articleModifiedTime="2025-01-12"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t("blogFethiyeH1"),
            description: t("blogFethiyeSeoDesc"),
            image: 'https://meettransfer.app/og/fethiye-transfer-og.jpg',
            datePublished: '2025-01-12',
            dateModified: '2025-01-12',
            author: 'Meet Transfer',
            readingTime: '14',
            wordCount: 2000,
            keywords: ['Fethiye airport transfer', 'Dalaman to Fethiye', 'Ölüdeniz transfer', 'Göcek transfer'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Fethiye Airport Transfer Guide', url: '/blog/fethiye-airport-transfer-guide' },
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
        <Link 
          to={getLocalizedPath("/blog")} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToBlog")}
        </Link>

        <header className="mb-12">
          <Badge variant="secondary" className="mb-4">Fethiye</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t("blogFethiyeH1")}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t("blogFethiyeIntro")}
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

        <ShareButtons title={t("blogFethiyeH1")} className="mb-8" />

        <div className="aspect-video overflow-hidden rounded-xl mb-8">
          <img 
            src={fethiyeTransferHero} 
            alt="Fethiye Airport Transfer 2025 - Dalaman to Fethiye, Ölüdeniz, Göcek VIP Transfer"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        <TableOfContents items={tocItems} />

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 id="airport-overview">{t("blogFethiyeSection1Title")}</h2>
          <p>{t("blogFethiyeSection1P1")}</p>
          <p>{t("blogFethiyeSection1P2")}</p>

          <h2 id="why-private">{t("blogFethiyeSection2Title")}</h2>
          <p>{t("blogFethiyeSection2Intro")}</p>
          <ul>
            <li><strong>{t("blogFethiyeBenefit1").split(":")[0]}:</strong> {t("blogFethiyeBenefit1").split(":")[1]}</li>
            <li><strong>{t("blogFethiyeBenefit2").split(":")[0]}:</strong> {t("blogFethiyeBenefit2").split(":")[1]}</li>
            <li><strong>{t("blogFethiyeBenefit3").split(":")[0]}:</strong> {t("blogFethiyeBenefit3").split(":")[1]}</li>
            <li><strong>{t("blogFethiyeBenefit4").split(":")[0]}:</strong> {t("blogFethiyeBenefit4").split(":")[1]}</li>
          </ul>

          <h2 id="transfer-prices">{t("blogFethiyeSection3Title")}</h2>
          <p>{t("blogFethiyeSection3Intro")}</p>

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
            {t("blogFethiyeTableNote")}
          </p>

          <h2 id="destinations">{t("blogFethiyeSection4Title")}</h2>

          <h3>{t("blogFethiyeOludenizTitle")}</h3>
          <p>{t("blogFethiyeOludenizDesc")}</p>

          <h3>{t("blogFethiyeGocekTitle")}</h3>
          <p>{t("blogFethiyeGocekDesc")}</p>

          <h3>{t("blogFethiyeKalkanTitle")}</h3>
          <p>{t("blogFethiyeKalkanDesc")}</p>

          <h3>{t("blogFethiyeKasTitle")}</h3>
          <p>{t("blogFethiyeKasDesc")}</p>

          <h2 id="whats-included">{t("blogFethiyeSection5Title")}</h2>

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
                  alt: "Mercedes Vito Family Interior Fethiye Transfer",
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

          <h2>{t("blogFethiyeConclusion")}</h2>
          <p>
            {t("blogFethiyeConclusionP1")} 
            <Link to={getLocalizedPath("/dalaman-transfer")} className="text-primary hover:underline"> {t("blogFethiyeConclusionLink")}</Link>
          </p>
          <p>
            <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">{t("blogPriceConclusionCta")}</Link>
          </p>
        </div>

        <div className="my-12 p-6 bg-muted/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{t("blogFethiyeMapTitle")}</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {t("blogFethiyeMapDesc")}
          </p>
          <CompactRouteMap 
            pickup="Dalaman Airport, Turkey" 
            dropoff="Fethiye, Turkey" 
            className="h-[200px]"
          />
        </div>

        <BlogCTA destination="Fethiye" />

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

        <RelatedArticles currentArticleId="fethiye-airport-transfer-guide" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default FethiyeAirportTransferGuide;