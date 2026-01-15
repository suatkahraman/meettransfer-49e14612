import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, MapPin } from "lucide-react";
import { CompactRouteMap } from "@/components/ui/compact-route-map";
import marmarisTransferHero from "@/assets/blog/marmaris-transfer-hero.jpg";
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
import { useBlogDate } from "@/hooks/useBlogDate";

const MarmarisAirportTransferGuide = () => {
  const { getLocalizedPath, t } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    { question: t("blogMarmarisFaq1Q"), answer: t("blogMarmarisFaq1A") },
    { question: t("blogMarmarisFaq2Q"), answer: t("blogMarmarisFaq2A") },
    { question: t("blogMarmarisFaq3Q"), answer: t("blogMarmarisFaq3A") },
    { question: t("blogMarmarisFaq4Q"), answer: t("blogMarmarisFaq4A") },
    { question: t("blogMarmarisFaq5Q"), answer: t("blogMarmarisFaq5A") },
    { question: t("blogMarmarisFaq6Q"), answer: t("blogMarmarisFaq6A") },
  ];

  const tocItems = [
    { id: "airport-overview", title: t("blogMarmarisSection1Title") },
    { id: "why-private", title: t("blogMarmarisSection2Title") },
    { id: "transfer-prices", title: t("blogMarmarisSection3Title") },
    { id: "destinations", title: t("blogMarmarisSection4Title") },
    { id: "whats-included", title: t("blogMarmarisSection5Title") },
  ];

  const destinations = [
    { area: t("destMarmarisCenter"), distance: "95 km", time: "90-100 min", price: "€85" },
    { area: t("destIcmeler"), distance: "100 km", time: "95-110 min", price: "€85" },
    { area: t("destArmutalan"), distance: "92 km", time: "85-95 min", price: "€85" },
    { area: t("destTurunc"), distance: "110 km", time: "110-120 min", price: "€95" },
    { area: t("destBozburun"), distance: "140 km", time: "140-160 min", price: "€120" },
    { area: t("destDatca"), distance: "170 km", time: "170-200 min", price: "€150" },
    { area: t("destAkyaka"), distance: "65 km", time: "60-70 min", price: "€70" },
    { area: t("destKoycegiz"), distance: "40 km", time: "40-50 min", price: "€60" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogMarmarisSeoTitle")}
        description={t("blogMarmarisSeoDesc")}
        keywords="Dalaman airport to Marmaris transfer, Marmaris airport transfer 2025, Dalaman to Marmaris transfer, Marmaris private transfer, İçmeler transfer, Datça transfer, Marmaris VIP transfer"
        canonicalPath="/blog/marmaris-airport-transfer-guide"
        ogImage="https://meettransfer.app/og/marmaris-transfer-og.jpg"
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
            headline: t("blogMarmarisH1"),
            description: t("blogMarmarisSeoDesc"),
            image: 'https://meettransfer.app/og/marmaris-transfer-og.jpg',
            datePublished: '2025-01-12',
            dateModified: '2025-01-12',
            author: 'Meet Transfer',
            readingTime: '14',
            wordCount: 2000,
            keywords: ['Marmaris airport transfer', 'Dalaman to Marmaris', 'İçmeler transfer', 'Datça transfer'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: t("breadcrumbHome"), url: '/' },
              { name: t("breadcrumbBlog"), url: '/blog' },
              { name: t("blogMarmarisH1"), url: '/blog/marmaris-airport-transfer-guide' },
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

      <article className="max-w-4xl mx-auto px-3 sm:px-4 py-8 md:py-12">
        <Link 
          to={getLocalizedPath("/blog")} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToBlog")}
        </Link>

        <header className="mb-8 md:mb-12">
          <Badge variant="secondary" className="mb-3 md:mb-4">{t("cityMarmaris")}</Badge>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
            {t("blogMarmarisH1")}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 md:mb-6">
            {t("blogMarmarisIntro")}
          </p>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t("lastUpdated")}: {formatBlogDate("2025-01-12")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              14 {t("minRead")}
            </span>
          </div>
        </header>

        <ShareButtons title={t("blogMarmarisH1")} className="mb-6 md:mb-8" />

        <div className="aspect-video overflow-hidden rounded-lg md:rounded-xl mb-6 md:mb-8">
          <img 
            src={marmarisTransferHero} 
            alt={t("blogMarmarisHeroAlt")}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        <TableOfContents items={tocItems} />

        <div className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none">
          <h2 id="airport-overview">{t("blogMarmarisSection1Title")}</h2>
          <p>{t("blogMarmarisSection1P1")}</p>
          <p>{t("blogMarmarisSection1P2")}</p>

          <h2 id="why-private">{t("blogMarmarisSection2Title")}</h2>
          <p>{t("blogMarmarisSection2Intro")}</p>
          <ul>
            <li><strong>{t("blogMarmarisBenefit1").split(":")[0]}:</strong> {t("blogMarmarisBenefit1").split(":")[1]}</li>
            <li><strong>{t("blogMarmarisBenefit2").split(":")[0]}:</strong> {t("blogMarmarisBenefit2").split(":")[1]}</li>
            <li><strong>{t("blogMarmarisBenefit3").split(":")[0]}:</strong> {t("blogMarmarisBenefit3").split(":")[1]}</li>
            <li><strong>{t("blogMarmarisBenefit4").split(":")[0]}:</strong> {t("blogMarmarisBenefit4").split(":")[1]}</li>
          </ul>

          <h2 id="transfer-prices">{t("blogMarmarisSection3Title")}</h2>
          <p>{t("blogMarmarisSection3Intro")}</p>

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
            {t("blogMarmarisTableNote")}
          </p>

          <h2 id="destinations">{t("blogMarmarisSection4Title")}</h2>

          <h3>{t("blogMarmarisIcmelerTitle")}</h3>
          <p>{t("blogMarmarisIcmelerDesc")}</p>

          <h3>{t("blogMarmarisTuruncTitle")}</h3>
          <p>{t("blogMarmarisTuruncDesc")}</p>

          <h3>{t("blogMarmarisDatcaTitle")}</h3>
          <p>{t("blogMarmarisDatcaDesc")}</p>

          <h3>{t("blogMarmarisAkyakaTitle")}</h3>
          <p>{t("blogMarmarisAkyakaDesc")}</p>

          <h2 id="whats-included">{t("blogMarmarisSection5Title")}</h2>

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

          <h2>{t("blogMarmarisConclusion")}</h2>
          <p>
            {t("blogMarmarisConclusionP1")} 
            <Link to={getLocalizedPath("/dalaman-transfer")} className="text-primary hover:underline"> {t("blogMarmarisConclusionLink")}</Link>
          </p>
          <p>
            <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">{t("blogPriceConclusionCta")}</Link>
          </p>
        </div>

        <div className="my-12 p-6 bg-muted/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{t("blogMarmarisMapTitle")}</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {t("blogMarmarisMapDesc")}
          </p>
          <CompactRouteMap 
            pickup="Dalaman Airport, Turkey" 
            dropoff="Marmaris, Turkey" 
            className="h-[200px]"
          />
        </div>

        <BlogCTA destination="Marmaris" />

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

        <RelatedArticles currentArticleId="marmaris-airport-transfer-guide" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default MarmarisAirportTransferGuide;