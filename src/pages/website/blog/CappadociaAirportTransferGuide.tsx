import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, MapPin, Plane, Star, Sunrise } from "lucide-react";
import cappadociaTransferHero from "@/assets/blog/cappadocia-transfer-hero.jpg";
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
import BlogImageGallery from "@/components/website/BlogImageGallery";
import BlogCTA from "@/components/website/BlogCTA";
import vitoCappadociaBalloon from "@/assets/vito-cappadocia-balloon.jpg";
import vitoVipCouple from "@/assets/vito-vip-couple-starlight.jpg";
import vitoPassengerCouple from "@/assets/vito-passenger-couple.jpg";
import vitoAirportWelcome from "@/assets/vito-airport-welcome.jpg";

const CappadociaAirportTransferGuide = () => {
  const { getLocalizedPath, t, language } = useLanguage();

  const faqItems = [
    { question: t("blogCappadociaFaq1Q"), answer: t("blogCappadociaFaq1A") },
    { question: t("blogCappadociaFaq2Q"), answer: t("blogCappadociaFaq2A") },
    { question: t("blogCappadociaFaq3Q"), answer: t("blogCappadociaFaq3A") },
    { question: t("blogCappadociaFaq4Q"), answer: t("blogCappadociaFaq4A") },
    { question: t("blogCappadociaFaq5Q"), answer: t("blogCappadociaFaq5A") },
    { question: t("blogCappadociaFaq6Q"), answer: t("blogCappadociaFaq6A") },
  ];

  // Sistemdeki gerçek fiyatlar
  const kayseriPrices = [
    { area: "Göreme", distance: "80 km", time: "60-75 min", vitoPrice: "€90", vipPrice: "€95", maybachPrice: "€110", minibusPrice: "€160" },
    { area: "Ürgüp", distance: "75 km", time: "55-70 min", vitoPrice: "€90", vipPrice: "€95", maybachPrice: "€110", minibusPrice: "€160" },
    { area: "Uçhisar", distance: "78 km", time: "60-75 min", vitoPrice: "€90", vipPrice: "€95", maybachPrice: "€110", minibusPrice: "€160" },
    { area: "Avanos", distance: "85 km", time: "65-80 min", vitoPrice: "€95", vipPrice: "€100", maybachPrice: "€115", minibusPrice: "€165" },
    { area: "Nevşehir", distance: "70 km", time: "50-65 min", vitoPrice: "€85", vipPrice: "€90", maybachPrice: "€105", minibusPrice: "€155" },
  ];

  const nevsehirPrices = [
    { area: "Göreme", distance: "40 km", time: "35-45 min", vitoPrice: "€70", vipPrice: "€74", maybachPrice: "€80", minibusPrice: "€135" },
    { area: "Ürgüp", distance: "35 km", time: "30-40 min", vitoPrice: "€70", vipPrice: "€74", maybachPrice: "€80", minibusPrice: "€135" },
    { area: "Uçhisar", distance: "38 km", time: "32-42 min", vitoPrice: "€70", vipPrice: "€74", maybachPrice: "€80", minibusPrice: "€135" },
    { area: "Avanos", distance: "45 km", time: "40-50 min", vitoPrice: "€75", vipPrice: "€79", maybachPrice: "€85", minibusPrice: "€140" },
    { area: "Nevşehir", distance: "30 km", time: "25-35 min", vitoPrice: "€65", vipPrice: "€69", maybachPrice: "€75", minibusPrice: "€130" },
  ];

  const popularHotels = [
    "Museum Hotel",
    "Argos in Cappadocia",
    "Sultan Cave Suites",
    "Mithra Cave Hotel",
    "Kelebek Special Cave Hotel",
    "Aydinli Cave House",
    "Cappadocia Cave Suites",
    "Taskonaklar Hotel",
  ];

  const balloonCompanies = [
    "Royal Balloon",
    "Butterfly Balloons",
    "Voyager Balloons",
    "Turkiye Balloons",
    "Atmosfer Balloons",
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogCappadociaSeoTitle")}
        description={t("blogCappadociaSeoDesc")}
        keywords="Cappadocia airport transfer 2025, Kayseri airport to Göreme, Nevsehir airport transfer, Cappadocia balloon tour transfer, Göreme hotel transfer, Ürgüp transfer, Cappadocia VIP transfer price, Kapadokya havalimanı transfer, balon turu transfer"
        canonicalPath="/blog/cappadocia-airport-transfer-guide"
        ogImage="https://meettransfer.app/og/cappadocia-transfer-og.jpg"
        ogType="article"
        articlePublishedTime="2025-01-10"
        articleModifiedTime="2025-01-10"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t("blogCappadociaH1"),
            description: t("blogCappadociaSeoDesc"),
            image: 'https://meettransfer.app/og/cappadocia-transfer-og.jpg',
            datePublished: '2025-01-10',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '18',
            wordCount: 2800,
            keywords: ['Cappadocia transfer', 'Kayseri airport', 'Nevsehir airport', 'Göreme', 'balloon tour transfer'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: t("breadcrumbHome"), url: '/' },
              { name: t("breadcrumbBlog"), url: '/blog' },
              { name: t("blogCappadociaH1"), url: '/blog/cappadocia-airport-transfer-guide' },
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
          <Badge variant="secondary" className="mb-4">Cappadocia</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t("blogCappadociaH1")}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t("blogCappadociaIntro")}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("lastUpdated")}: January 10, 2025
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              18 {t("minRead")}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <ShareButtons 
          title={t("blogCappadociaH1")} 
          className="mb-8" 
        />

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12">
          <img 
            src={cappadociaTransferHero} 
            alt={t("blogCappadociaHeroAlt")}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        {/* Table of Contents */}
        <TableOfContents items={[
          { id: "cappadocia-how-to-get", title: t("blogCappadociaTocHowToGet") },
          { id: "cappadocia-kayseri-prices", title: t("blogCappadociaTocKayseriPrices") },
          { id: "cappadocia-nevsehir-prices", title: t("blogCappadociaTocNevsehirPrices") },
          { id: "cappadocia-balloon", title: t("blogCappadociaTocBalloon") },
          { id: "cappadocia-hotels", title: t("blogCappadociaTocHotels") },
          { id: "cappadocia-why-choose", title: t("blogCappadociaTocWhyChoose") },
        ]} />

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 id="cappadocia-how-to-get">
            {t("blogCappadociaTocHowToGet")}
          </h2>
          <p>{t("blogCappadociaHowToGetP1")}</p>
          <p>{t("blogCappadociaHowToGetP2")}</p>

          {/* Two Airport Comparison */}
          <div className="not-prose my-8 grid md:grid-cols-2 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  Kayseri (ASR)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>{t("blogCappadociaDistance")}:</strong> 80 km {t("blogCappadociaToGoreme")}</p>
                <p><strong>{t("blogCappadociaDuration")}:</strong> 60-75 {t("blogCappadociaMinutes")}</p>
                <p><strong>{t("blogCappadociaAdvantage")}:</strong> {t("blogCappadociaMoreFlights")}</p>
                <p><strong>{t("blogCappadociaDisadvantage")}:</strong> {t("blogCappadociaLongerTransfer")}</p>
              </CardContent>
            </Card>
            <Card className="bg-accent/5 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-accent" />
                  Nevşehir (NAV)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>{t("blogCappadociaDistance")}:</strong> 40 km {t("blogCappadociaToGoreme")}</p>
                <p><strong>{t("blogCappadociaDuration")}:</strong> 35-45 {t("blogCappadociaMinutes")}</p>
                <p><strong>{t("blogCappadociaAdvantage")}:</strong> {t("blogCappadociaShorterTransfer")}</p>
                <p><strong>{t("blogCappadociaDisadvantage")}:</strong> {t("blogCappadociaLimitedFlights")}</p>
              </CardContent>
            </Card>
          </div>

          <h2 id="cappadocia-kayseri-prices">
            {t("blogCappadociaTocKayseriPrices")}
          </h2>
          <p>{t("blogCappadociaKayseriPricesP1")}</p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("blogCappadociaArea")}</TableHead>
                  <TableHead>{t("blogCappadociaDistance")}</TableHead>
                  <TableHead>{t("blogCappadociaDuration")}</TableHead>
                  <TableHead>Mercedes Vito</TableHead>
                  <TableHead>VIP Mercedes</TableHead>
                  <TableHead>Maybach</TableHead>
                  <TableHead>Minibüs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kayseriPrices.map((dest, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{dest.area}</TableCell>
                    <TableCell>{dest.distance}</TableCell>
                    <TableCell>{dest.time}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.vitoPrice}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.vipPrice}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.maybachPrice}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.minibusPrice}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h2 id="cappadocia-nevsehir-prices">
            {t("blogCappadociaTocNevsehirPrices")}
          </h2>
          <p>{t("blogCappadociaNevsehirPricesP1")}</p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("blogCappadociaArea")}</TableHead>
                  <TableHead>{t("blogCappadociaDistance")}</TableHead>
                  <TableHead>{t("blogCappadociaDuration")}</TableHead>
                  <TableHead>Mercedes Vito</TableHead>
                  <TableHead>VIP Mercedes</TableHead>
                  <TableHead>Maybach</TableHead>
                  <TableHead>Minibüs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nevsehirPrices.map((dest, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{dest.area}</TableCell>
                    <TableCell>{dest.distance}</TableCell>
                    <TableCell>{dest.time}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.vitoPrice}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.vipPrice}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.maybachPrice}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.minibusPrice}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground">
            {t("blogCappadociaPriceNote")}
          </p>

          {/* Balloon Tour Section */}
          <h2 id="cappadocia-balloon" className="flex items-center gap-2">
            <Sunrise className="h-6 w-6 text-orange-500" />
            {t("blogCappadociaBalloonTitle")}
          </h2>
          <p>{t("blogCappadociaBalloonP1")}</p>

          <div className="not-prose my-8">
            <Card className="bg-orange-500/10 border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sunrise className="h-5 w-5 text-orange-500" />
                  {t("blogCappadociaBalloonPackage")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCappadociaBalloonPickup")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCappadociaBalloonLaunch")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCappadociaBalloonReturn")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCappadociaBalloonDriver")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h3>{t("blogCappadociaBalloonCompanies")}</h3>
          <ul>
            {balloonCompanies.map((company, index) => (
              <li key={index}>{company}</li>
            ))}
          </ul>
          <p>{t("blogCappadociaBalloonNote")}</p>

          {/* Popular Hotels */}
          <h2 id="cappadocia-hotels">{t("blogCappadociaHotelsTitle")}</h2>
          <p>{t("blogCappadociaHotelsP1")}</p>
          
          <div className="not-prose my-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {popularHotels.map((hotel, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{hotel}</span>
              </div>
            ))}
          </div>

          {/* Image Gallery */}
          <h3>{t("blogCappadociaGallery")}</h3>
          <div className="not-prose my-8">
            <BlogImageGallery 
              images={[
                { 
                  src: vitoCappadociaBalloon, 
                  alt: t("blogCappadociaGalleryBalloon"),
                  caption: t("blogCappadociaGalleryBalloon")
                },
                { 
                  src: vitoAirportWelcome, 
                  alt: t("blogCappadociaGalleryAirport"),
                  caption: t("blogCappadociaGalleryAirport")
                },
                { 
                  src: vitoVipCouple, 
                  alt: t("blogCappadociaGalleryVip"),
                  caption: t("blogCappadociaGalleryVip")
                },
                { 
                  src: vitoPassengerCouple, 
                  alt: t("blogCappadociaGalleryComfort"),
                  caption: t("blogCappadociaGalleryComfort")
                },
              ]}
              columns={2}
            />
          </div>

          <h2 id="cappadocia-why-choose">{t("blogCappadociaIncludedTitle")}</h2>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t("blogCappadociaIncludedServices")}
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
                  <span>{t("blogCappadociaInclude60min")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude4")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCappadociaIncludeFlightTracking")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude6")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCappadociaIncludeMeetGreet")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCappadociaInclude247")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>{t("blogCappadociaPlacesTitle")}</h2>
          <p>{t("blogCappadociaPlacesP1")}</p>
          <ul>
            <li><strong>Göreme Açık Hava Müzesi</strong> - {t("blogCappadociaGoreme")}</li>
            <li><strong>Derinkuyu Yeraltı Şehri</strong> - {t("blogCappadociaDerinkuyu")}</li>
            <li><strong>Kaymakli Yeraltı Şehri</strong> - {t("blogCappadociaKaymakli")}</li>
            <li><strong>Uçhisar Kalesi</strong> - {t("blogCappadociaUchisar")}</li>
            <li><strong>Paşabağ (Mantar Kaya)</strong> - {t("blogCappadociaPasabag")}</li>
            <li><strong>Devrent Vadisi</strong> - {t("blogCappadociaDevrent")}</li>
            <li><strong>Avanos</strong> - {t("blogCappadociaAvanos")}</li>
          </ul>

          <h2>{t("blogCappadociaWhyMeetTitle")}</h2>
          <p>{t("blogCappadociaWhyMeetP1")}</p>
          <p>
            <Link to={getLocalizedPath("/cappadocia-transfer")} className="text-primary hover:underline">
              {t("blogCappadociaVisitPage")}
            </Link>
            {' '}
            {t("blogCappadociaOr")}
            {' '}
            <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">
              {t("blogCappadociaBookNow")}
            </Link>.
          </p>
        </div>

        {/* Map Section */}
        <div className="my-12 p-6 bg-muted/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{t("blogCappadociaMapTitle")}</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">{t("blogCappadociaMapP1")}</p>
        </div>

        {/* CTA Section */}
        <BlogCTA destination="Cappadocia" />

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
        <RelatedArticles currentArticleId="cappadocia-airport-transfer-guide" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default CappadociaAirportTransferGuide;
