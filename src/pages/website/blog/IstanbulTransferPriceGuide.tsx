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
    { destination: t("destTaksim"), private: "€50-55", bus: "150 TL ($5)" },
    { destination: t("destSultanahmet"), private: "€50-55", bus: "150 TL ($5)" },
    { destination: t("destKadikoy"), private: "€65-70", bus: "180 TL ($6)" },
    { destination: t("destBesiktas"), private: "€50-55", bus: "150 TL ($5)" },
    { destination: t("destGalataport"), private: "€50-55", bus: t("tableNotAvailable") },
    { destination: t("destSabihaGokcen"), private: "€110-130", bus: t("tableNotAvailable") },
    { destination: t("destBursa"), private: "€185-195", bus: t("tableNotAvailable") },
    { destination: t("destSapanca"), private: "€245-255", bus: t("tableNotAvailable") },
    { destination: t("destKartepe"), private: "€255-275", bus: t("tableNotAvailable") },
  ];

  const vehiclePrices = [
    { vehicle: t("vehicleVito"), toTaksim: "€50", toKadikoy: "€65", toBursa: "€185" },
    { vehicle: t("vehicleVitoVIP"), toTaksim: "€55", toKadikoy: "€70", toBursa: "€195" },
    { vehicle: t("vehicleMaybach"), toTaksim: "€65", toKadikoy: "€80", toBursa: "€210" },
    { vehicle: t("vehicleSprinter"), toTaksim: "€85", toKadikoy: "€105", toBursa: "€220" },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogPriceSeoTitle")}
        description={t("blogPriceSeoDesc")}
        keywords="Istanbul Airport transfer price 2025, IST transfer cost, private transfer Istanbul price, Istanbul Airport to Taksim price, airport transfer pricing Turkey, Istanbul Airport transfer fare, VIP transfer Istanbul cost, Mercedes transfer Istanbul, Istanbul Airport to hotel price, Sultanahmet transfer cost"
        canonicalPath="/blog/istanbul-airport-transfer-price-guide"
        ogImage="https://meettransfer.app/og/istanbul-transfer-og.jpg"
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
            image: 'https://meettransfer.app/og/istanbul-transfer-og.jpg',
            datePublished: '2024-12-10',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '12',
            wordCount: 2400,
            keywords: ['Istanbul airport transfer', 'IST transfer price', 'Taksim transfer', 'Sultanahmet transfer', 'private transfer Istanbul'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: t("breadcrumbHome"), url: '/' },
              { name: t("breadcrumbBlog"), url: '/blog' },
              { name: t("blogIstanbulPriceH1"), url: '/blog/istanbul-airport-transfer-price-guide' },
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
            alt={t("blogIstanbulPriceHeroAlt")}
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
          
          <p>{t("blogPriceAboutAirport")}</p>

          <h3>{t("blogPriceFactorsTitle")}</h3>
          <p>{t("blogPriceFactorsIntro")}</p>
          <ul>
            <li><strong>{t("blogPriceFactorDistanceLabel")}:</strong> {t("blogPriceFactorDistanceText")}</li>
            <li><strong>{t("blogPriceFactorVehicleLabel")}:</strong> {t("blogPriceFactorVehicleText")}</li>
            <li><strong>{t("blogPriceFactorTimeLabel")}:</strong> {t("blogPriceFactorTimeText")}</li>
            <li><strong>{t("blogPriceFactorPassengersLabel")}:</strong> {t("blogPriceFactorPassengersText")}</li>
            <li><strong>{t("blogPriceFactorSeasonLabel")}:</strong> {t("blogPriceFactorSeasonText")}</li>
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

          <h3>{t("blogPriceNeighborhoodsTitle")}</h3>
          <p>{t("blogPriceNeighborhoodsIntro")}</p>
          <ul>
            <li><strong>Taksim & Beyoğlu:</strong> {t("blogPriceTaksimText")}</li>
            <li><strong>Sultanahmet:</strong> {t("blogPriceSultanahmetText")}</li>
            <li><strong>Kadıköy:</strong> {t("blogPriceKadikoyText")}</li>
            <li><strong>Beşiktaş:</strong> {t("blogPriceBesiktasText")}</li>
            <li><strong>Galataport:</strong> {t("blogPriceGalataportText")}</li>
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

          <h3>{t("blogPriceVehicleChoiceTitle")}</h3>
          <ul>
            <li><strong>Mercedes Vito (up to 6 pax):</strong> {t("blogPriceVehicleVitoText")}</li>
            <li><strong>Mercedes Vito VIP:</strong> {t("blogPriceVehicleVitoVIPText")}</li>
            <li><strong>Mercedes Maybach (up to 3 pax):</strong> {t("blogPriceVehicleMaybachText")}</li>
            <li><strong>Mercedes Sprinter (up to 16 pax):</strong> {t("blogPriceVehicleSprinterText")}</li>
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

          <h3>{t("blogPriceSetApartTitle")}</h3>
          <p>{t("blogPriceSetApartIntro")}</p>
          <ul>
            <li><strong>{t("blogPriceSetApartFlightLabel")}:</strong> {t("blogPriceSetApartFlightText")}</li>
            <li><strong>{t("blogPriceSetApartWaitLabel")}:</strong> {t("blogPriceSetApartWaitText")}</li>
            <li><strong>{t("blogPriceSetApartChildLabel")}:</strong> {t("blogPriceSetApartChildText")}</li>
            <li><strong>{t("blogPriceSetApart247Label")}:</strong> {t("blogPriceSetApart247Text")}</li>
          </ul>

          <h2 id="booking-tips">{t("blogPriceSection5Title")}</h2>
          <p>{t("blogPriceSection5Intro")}</p>

          <h3>{t("blogPriceBookingTimeTitle")}</h3>
          <p>{t("blogPriceBookingTimeP")}</p>

          <h3>{t("blogPricePaymentTitle")}</h3>
          <p>{t("blogPricePaymentP")}</p>

          <h3>{t("blogPriceEssentialTipsTitle")}</h3>
          <ul>
            <li>{t("blogPriceTip1")}</li>
            <li>{t("blogPriceTip2")}</li>
            <li>{t("blogPriceTip3")}</li>
            <li>{t("blogPriceTip4")}</li>
            <li>{t("blogPriceTip5")}</li>
            <li>{t("blogPriceTip6")}</li>
          </ul>

          <h2 id="why-choose">{t("blogPriceSection6Title")}</h2>
          <p>{t("blogPriceSection6Intro")}</p>

          <h3>{t("blogPriceDifferenceTitle")}</h3>
          <p>{t("blogPriceDifferenceP")}</p>
          <ul>
            <li><strong>{t("blogPriceDiff1Label")}:</strong> {t("blogPriceDiff1Text")}</li>
            <li><strong>{t("blogPriceDiff2Label")}:</strong> {t("blogPriceDiff2Text")}</li>
            <li><strong>{t("blogPriceDiff3Label")}:</strong> {t("blogPriceDiff3Text")}</li>
            <li><strong>{t("blogPriceDiff4Label")}:</strong> {t("blogPriceDiff4Text")}</li>
            <li><strong>{t("blogPriceDiff5Label")}:</strong> {t("blogPriceDiff5Text")}</li>
          </ul>

          <h3>{t("blogPriceFirstTimeTitle")}</h3>
          <ul>
            <li><strong>{t("blogPriceFirstTimeTip1Label")}:</strong> {t("blogPriceFirstTimeTip1Text")}</li>
            <li><strong>{t("blogPriceFirstTimeTip2Label")}:</strong> {t("blogPriceFirstTimeTip2Text")}</li>
            <li><strong>{t("blogPriceFirstTimeTip3Label")}:</strong> {t("blogPriceFirstTimeTip3Text")}</li>
            <li><strong>{t("blogPriceFirstTimeTip4Label")}:</strong> {t("blogPriceFirstTimeTip4Text")}</li>
            <li><strong>{t("blogPriceFirstTimeTip5Label")}:</strong> {t("blogPriceFirstTimeTip5Text")}</li>
          </ul>

          {/* Image Gallery */}
          <h3>{t("galleryTitle")}</h3>
          <div className="not-prose my-8">
            <BlogImageGallery 
              images={[
                { 
                  src: vitoVip1, 
                  alt: t("blogPriceGalleryAlt1"),
                  caption: t("blogPriceGalleryCaption1")
                },
                { 
                  src: vitoVip2, 
                  alt: t("blogPriceGalleryAlt2"),
                  caption: t("blogPriceGalleryCaption2")
                },
                { 
                  src: sprinterInteriorBlue, 
                  alt: t("blogPriceGalleryAlt3"),
                  caption: t("blogPriceGalleryCaption3")
                },
                { 
                  src: vitoAirportAnime, 
                  alt: t("blogPriceGalleryAlt4"),
                  caption: t("blogPriceGalleryCaption4")
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
          <p>{t("blogPriceConclusionP2")}</p>
          <p>{t("blogPriceConclusionP3")}</p>
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
