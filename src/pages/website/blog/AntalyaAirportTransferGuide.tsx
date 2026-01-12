import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, MapPin } from "lucide-react";
import antalyaTransferHero from "@/assets/blog/antalya-transfer-hero.jpg";
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
    { area: t("destKaleici"), distance: "13 km", time: "20-25 min", price: "€50" },
    { area: t("destLaraBeach"), distance: "18 km", time: "20-30 min", price: "€50" },
    { area: t("destBelek"), distance: "35 km", time: "35-45 min", price: "€65" },
    { area: t("destSide"), distance: "65 km", time: "60-75 min", price: "€72" },
    { area: t("destAlanya"), distance: "130 km", time: "120-150 min", price: "€84" },
    { area: t("destKemer"), distance: "60 km", time: "50-65 min", price: "€65" },
    { area: t("destKasAntalya"), distance: "190 km", time: "180-210 min", price: "€170" },
    { area: t("destKalkanAntalya"), distance: "220 km", time: "210-240 min", price: "€170" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogAntalyaSeoTitle")}
        description={t("blogAntalyaSeoDesc")}
        keywords="Antalya airport transfer 2025, AYT airport hotel transfer, Antalya to Belek transfer, Antalya to Side transfer, Lara Beach transfer, private transfer Antalya, Kemer transfer, Alanya airport transfer, Antalya VIP transfer price, Antalya airport taxi cost"
        canonicalPath="/blog/antalya-airport-transfer-to-hotels"
        ogImage="https://meettransfer.app/og/antalya-transfer-og.jpg"
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
            image: 'https://meettransfer.app/og/antalya-transfer-og.jpg',
            datePublished: '2024-11-28',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '15',
            wordCount: 2200,
            keywords: ['Antalya airport transfer', 'AYT transfer', 'Belek transfer', 'Side transfer', 'Lara Beach'],
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
          <Badge variant="secondary" className="mb-4">{t("cityAntalya")}</Badge>
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
            alt={t("blogAntalyaHeroAlt")}
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
          
          <p>{t("blogAntalyaAirportP1")}</p>

          <h3>{t("blogAntalyaNavigating")}</h3>
          <p>{t("blogAntalyaNavigatingP1")}</p>

          <h2 id="why-private">{t("blogAntalyaSection2Title")}</h2>
          <p>{t("blogAntalyaSection2Intro")}</p>

          <h3>{t("blogAntalyaChallenge")}</h3>
          <p>{t("blogAntalyaChallengeP1")}</p>

          <h3>{t("blogAntalyaBenefits")}</h3>
          <ul>
            <li><strong>{t("blogAntalyaBenefit1").split(":")[0]}:</strong> {t("blogAntalyaBenefit1").split(":")[1]}</li>
            <li><strong>{t("blogAntalyaBenefit2").split(":")[0]}:</strong> {t("blogAntalyaBenefit2").split(":")[1]}</li>
            <li><strong>{t("blogAntalyaBenefit3").split(":")[0]}:</strong> {t("blogAntalyaBenefit3").split(":")[1]}</li>
            <li><strong>{t("blogAntalyaBenefit4").split(":")[0]}:</strong> {t("blogAntalyaBenefit4").split(":")[1]}</li>
            <li><strong>{t("blogAntalyaBenefit5").split(":")[0]}:</strong> {t("blogAntalyaBenefit5").split(":")[1]}</li>
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
          <p>{t("blogAntalyaLaraP1")}</p>

          <h3>{t("blogAntalyaBelekTitle")}</h3>
          <p>{t("blogAntalyaBelekDesc")}</p>
          <p>{t("blogAntalyaBelekP1")}</p>

          <h3>{t("blogAntalyaSideTitle")}</h3>
          <p>{t("blogAntalyaSideDesc")}</p>
          <p>{t("blogAntalyaSideP1")}</p>

          <h3>{t("blogAntalyaKemerTitle")}</h3>
          <p>{t("blogAntalyaKemerDesc")}</p>
          <p>{t("blogAntalyaKemerP1")}</p>

          <h3>{t("blogAntalyaAlanyaTitle")}</h3>
          <p>{t("blogAntalyaAlanyaDesc")}</p>
          <p>{t("blogAntalyaAlanyaP1")}</p>

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

          <h3>{t("blogAntalyaBestTime")}</h3>
          <p>{t("blogAntalyaBestTimeP1")}</p>

          <h2>{t("blogAntalyaSection7Title")}</h2>
          <p>{t("blogAntalyaSection7Intro")}</p>

          <h3>{t("blogAntalyaDayTrips")}</h3>
          <ul>
            <li><strong>Aspendos:</strong> {t("blogAntalyaDayTrip1").split(":")[1] || t("blogAntalyaDayTrip1")}</li>
            <li><strong>Perge:</strong> {t("blogAntalyaDayTrip2").split(":")[1] || t("blogAntalyaDayTrip2")}</li>
            <li><strong>Pamukkale:</strong> {t("blogAntalyaDayTrip3").split(":")[1] || t("blogAntalyaDayTrip3")}</li>
            <li><strong>Düden Waterfalls:</strong> {t("blogAntalyaDayTrip4").split(":")[1] || t("blogAntalyaDayTrip4")}</li>
            <li><strong>Olympos & Chimera:</strong> {t("blogAntalyaDayTrip5").split(":")[1] || t("blogAntalyaDayTrip5")}</li>
          </ul>

          {/* Image Gallery */}
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

          <h2>{t("blogAntalyaConclusion")}</h2>
          <p>
            {t("blogAntalyaConclusionP1")} 
            <Link to={getLocalizedPath("/antalya-transfer")} className="text-primary hover:underline"> {t("blogAntalyaConclusionLink")}</Link>
          </p>
          <p>{t("blogAntalyaConclusionP2")}</p>
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
        <BlogCTA destination="Antalya" />

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
