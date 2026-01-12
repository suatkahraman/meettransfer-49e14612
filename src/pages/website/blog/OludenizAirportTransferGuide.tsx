import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, MapPin } from "lucide-react";
import { CompactRouteMap } from "@/components/ui/compact-route-map";
import oludenizTransferHero from "@/assets/blog/oludeniz-transfer-hero.jpg";
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

const OludenizAirportTransferGuide = () => {
  const { getLocalizedPath, t } = useLanguage();

  const faqItems = [
    { question: t("blogOludenizFaq1Q"), answer: t("blogOludenizFaq1A") },
    { question: t("blogOludenizFaq2Q"), answer: t("blogOludenizFaq2A") },
    { question: t("blogOludenizFaq3Q"), answer: t("blogOludenizFaq3A") },
    { question: t("blogOludenizFaq4Q"), answer: t("blogOludenizFaq4A") },
    { question: t("blogOludenizFaq5Q"), answer: t("blogOludenizFaq5A") },
    { question: t("blogOludenizFaq6Q"), answer: t("blogOludenizFaq6A") },
  ];

  const tocItems = [
    { id: "airport-overview", title: t("blogOludenizSection1Title") },
    { id: "why-private", title: t("blogOludenizSection2Title") },
    { id: "transfer-prices", title: t("blogOludenizSection3Title") },
    { id: "attractions", title: t("blogOludenizSection4Title") },
    { id: "whats-included", title: t("blogOludenizSection5Title") },
  ];

  const destinations = [
    { area: t("destOludenizBeach"), distance: "60 km", time: "60-70 min", price: "€70" },
    { area: t("destHisaronuOlu"), distance: "55 km", time: "55-65 min", price: "€70" },
    { area: t("destOvacik"), distance: "58 km", time: "55-65 min", price: "€70" },
    { area: t("destFethiyeCenterOlu"), distance: "50 km", time: "50-60 min", price: "€65" },
    { area: t("destCalisBeachOlu"), distance: "52 km", time: "50-60 min", price: "€65" },
    { area: t("destKayakoyOlu"), distance: "58 km", time: "55-65 min", price: "€70" },
    { area: t("destBabadag"), distance: "65 km", time: "70-80 min", price: "€75" },
    { area: t("destButterflyValley"), distance: "70 km", time: "75-85 min", price: "€80" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogOludenizSeoTitle")}
        description={t("blogOludenizSeoDesc")}
        keywords="Dalaman airport to Ölüdeniz transfer, Ölüdeniz airport transfer 2025, Dalaman to Blue Lagoon transfer, Ölüdeniz private transfer, Hisarönü transfer, paragliding transfer, Ölüdeniz VIP transfer"
        canonicalPath="/blog/oludeniz-airport-transfer-guide"
        ogImage="https://meettransfer.app/og/oludeniz-transfer-og.jpg"
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
            headline: t("blogOludenizH1"),
            description: t("blogOludenizSeoDesc"),
            image: 'https://meettransfer.app/og/oludeniz-transfer-og.jpg',
            datePublished: '2025-01-12',
            dateModified: '2025-01-12',
            author: 'Meet Transfer',
            readingTime: '14',
            wordCount: 2000,
            keywords: ['Ölüdeniz airport transfer', 'Blue Lagoon transfer', 'Hisarönü transfer', 'paragliding transfer'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Ölüdeniz Airport Transfer Guide', url: '/blog/oludeniz-airport-transfer-guide' },
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
          <Badge variant="secondary" className="mb-4">{t("cityOludeniz")}</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t("blogOludenizH1")}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t("blogOludenizIntro")}
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

        <ShareButtons title={t("blogOludenizH1")} className="mb-8" />

        <div className="aspect-video overflow-hidden rounded-xl mb-8">
          <img 
            src={oludenizTransferHero} 
            alt={t("blogOludenizHeroAlt")}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        <TableOfContents items={tocItems} />

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 id="airport-overview">{t("blogOludenizSection1Title")}</h2>
          <p>{t("blogOludenizSection1P1")}</p>
          <p>{t("blogOludenizSection1P2")}</p>

          <h2 id="why-private">{t("blogOludenizSection2Title")}</h2>
          <p>{t("blogOludenizSection2Intro")}</p>
          <ul>
            <li><strong>{t("blogOludenizBenefit1").split(":")[0]}:</strong> {t("blogOludenizBenefit1").split(":")[1]}</li>
            <li><strong>{t("blogOludenizBenefit2").split(":")[0]}:</strong> {t("blogOludenizBenefit2").split(":")[1]}</li>
            <li><strong>{t("blogOludenizBenefit3").split(":")[0]}:</strong> {t("blogOludenizBenefit3").split(":")[1]}</li>
            <li><strong>{t("blogOludenizBenefit4").split(":")[0]}:</strong> {t("blogOludenizBenefit4").split(":")[1]}</li>
          </ul>

          <h2 id="transfer-prices">{t("blogOludenizSection3Title")}</h2>
          <p>{t("blogOludenizSection3Intro")}</p>

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
            {t("blogOludenizTableNote")}
          </p>

          <h2 id="attractions">{t("blogOludenizSection4Title")}</h2>

          <h3>{t("blogOludenizBlueLagoonTitle")}</h3>
          <p>{t("blogOludenizBlueLagoonDesc")}</p>

          <h3>{t("blogOludenizParaglidingTitle")}</h3>
          <p>{t("blogOludenizParaglidingDesc")}</p>

          <h3>{t("blogOludenizButterflyTitle")}</h3>
          <p>{t("blogOludenizButterflyDesc")}</p>

          <h3>{t("blogOludenizKayakoyTitle")}</h3>
          <p>{t("blogOludenizKayakoyDesc")}</p>

          <h2 id="whats-included">{t("blogOludenizSection5Title")}</h2>

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

          <h3>{t("galleryTitle")}</h3>
          <div className="not-prose my-8">
            <BlogImageGallery 
              images={[
                { 
                  src: vitoFamilyInterior, 
                  alt: t("blogGalleryAlt1"),
                  caption: t("blogGalleryCaption1")
                },
                { 
                  src: vitoExteriorBlack, 
                  alt: t("blogGalleryAlt2"),
                  caption: t("blogGalleryCaption2")
                },
                { 
                  src: sprinterLuggage, 
                  alt: t("blogGalleryAlt3"),
                  caption: t("blogGalleryCaption3")
                },
                { 
                  src: vitoVipPassengersDay, 
                  alt: t("blogGalleryAlt4"),
                  caption: t("blogGalleryCaption4")
                },
              ]}
              columns={2}
            />
          </div>

          <h2>{t("blogOludenizConclusion")}</h2>
          <p>
            {t("blogOludenizConclusionP1")} 
            <Link to={getLocalizedPath("/dalaman-transfer")} className="text-primary hover:underline"> {t("blogOludenizConclusionLink")}</Link>
          </p>
          <p>
            <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">{t("blogPriceConclusionCta")}</Link>
          </p>
        </div>

        <div className="my-12 p-6 bg-muted/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{t("blogOludenizMapTitle")}</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {t("blogOludenizMapDesc")}
          </p>
          <CompactRouteMap 
            pickup="Dalaman Airport, Turkey" 
            dropoff="Ölüdeniz, Turkey" 
            className="h-[200px]"
          />
        </div>

        <BlogCTA destination="Ölüdeniz" />

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

        <RelatedArticles currentArticleId="oludeniz-airport-transfer-guide" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default OludenizAirportTransferGuide;