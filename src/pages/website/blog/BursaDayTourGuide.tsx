import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Clock, MapPin, Car, Mountain, Landmark, Camera, 
  Utensils, CheckCircle2, Calendar,
  Snowflake, Sun, TreeDeciduous, ArrowLeft
} from "lucide-react";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { Badge } from "@/components/ui/badge";
import bursaHeroImage from "@/assets/blog/bursa-day-tour-hero.jpg";
import cumalikizikImage from "@/assets/cumalikizik-village.jpg";
import uludagImage from "@/assets/uludag-cable-car.jpg";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import BlogCTA from "@/components/website/BlogCTA";

const BursaDayTourGuide = () => {
  const { getLocalizedPath, t } = useLanguage();

  const faqItems = [
    { question: t("blogBursaFaq1Q"), answer: t("blogBursaFaq1A") },
    { question: t("blogBursaFaq2Q"), answer: t("blogBursaFaq2A") },
    { question: t("blogBursaFaq3Q"), answer: t("blogBursaFaq3A") },
    { question: t("blogBursaFaq4Q"), answer: t("blogBursaFaq4A") },
    { question: t("blogBursaFaq5Q"), answer: t("blogBursaFaq5A") },
    { question: t("blogBursaFaq6Q"), answer: t("blogBursaFaq6A") },
  ];

  const tocItems = [
    { id: "why-bursa", title: t("blogBursaSection1Title") },
    { id: "how-to-get", title: t("blogBursaSection2Title") },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogBursaSeoTitle")}
        description={t("blogBursaSeoDesc")}
        keywords="Istanbul to Bursa day trip 2025, Bursa day tour, Bursa from Istanbul, Cumalıkızık village, Uludağ cable car, Green Mosque Bursa, Grand Mosque Bursa, İskender kebab Bursa, Bursa thermal baths, Ottoman capital Bursa, Bursa private transfer, Bursa ski resort, Osmangazi Bridge, Istanbul Bursa transfer price"
        canonicalPath="/blog/istanbul-bursa-day-tour-guide"
        ogImage="https://meettransfer.app/og/bursa-day-tour-og.jpg"
        ogType="article"
        articlePublishedTime="2024-12-26"
        articleModifiedTime="2025-01-10"
        articleSection="Day Tour Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t("blogBursaH1"),
            description: t("blogBursaSeoDesc"),
            image: 'https://meettransfer.app/og/bursa-day-tour-og.jpg',
            datePublished: '2024-12-26',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '18',
            wordCount: 2600,
            keywords: ['Istanbul Bursa day trip', 'Bursa tour', 'Cumalıkızık', 'Uludağ', 'Ottoman capital'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Istanbul to Bursa Day Tour Guide', url: '/blog/istanbul-bursa-day-tour-guide' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
        ]}
      />

      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bursaHeroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <span className="inline-block bg-primary/90 text-primary-foreground px-4 py-1 rounded-full text-sm font-medium mb-4">
            {t("dayTripGuide")}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {t("blogBursaH1")}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            {t("blogBursaIntro")}
          </p>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-10 md:py-16">
        {/* Back to Blog */}
        <Link 
          to={getLocalizedPath("/blog")} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToBlog")}
        </Link>

        {/* Share Buttons */}
        <ShareButtons title={t("blogBursaH1")} className="mb-8" />

        {/* Quick Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="text-center p-4">
            <Clock className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">{t("blogBursaTravelTime")}</p>
            <p className="font-bold">2.5-3 {t("blogBursaHours")}</p>
          </Card>
          <Card className="text-center p-4">
            <MapPin className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">{t("blogBursaDistance")}</p>
            <p className="font-bold">~150 km</p>
          </Card>
          <Card className="text-center p-4">
            <Car className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">{t("blogBursaBestWay")}</p>
            <p className="font-bold">{t("blogBursaPrivateTransfer")}</p>
          </Card>
          <Card className="text-center p-4">
            <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">{t("blogBursaTourDuration")}</p>
            <p className="font-bold">10-12 {t("blogBursaHours")}</p>
          </Card>
        </div>

        {/* Table of Contents */}
        <TableOfContents items={tocItems} />

        {/* Introduction */}
        <section className="prose prose-lg max-w-none mb-12">
          <h2 id="why-bursa" className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {t("blogBursaSection1Title")}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t("blogBursaSection1P1")}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {t("blogBursaSection1P2")}
          </p>
        </section>

        {/* How to Get There */}
        <section className="mb-12">
          <h2 id="how-to-get" className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            {t("blogBursaSection2Title")}
          </h2>
          
          <div className="space-y-6">
            {/* Private Transfer */}
            <Card className="overflow-hidden border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                    <Car className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">{t("blogBursaPrivateTransferTitle")}</h3>
                      <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">{t("blogBursaBestChoice")}</span>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {t("blogBursaPrivateTransferDesc")}
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-2">{t("blogBursaOsmangaziRoute")}:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• {t("blogBursaDuration")}: ~2.5 {t("blogBursaHours")}</li>
                          <li>• {t("blogBursaAllWeather")}</li>
                          <li>• {t("blogBursaDirectHighway")}</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium mb-2">{t("blogBursaMudanyaRoute")}:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• {t("blogBursaDuration")}: ~3 {t("blogBursaHours")}</li>
                          <li>• {t("blogBursaScenic")}</li>
                          <li>• {t("blogBursaMoreMemorable")}</li>
                        </ul>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-primary mt-4">{t("blogBursaPrice")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Public Transport */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-muted shrink-0">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">{t("blogBursaPublicTransportTitle")}</h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">{t("blogBursaIdoFerry")}:</p>
                        <p>{t("blogBursaIdoFerryDesc")}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{t("blogBursaBus")}:</p>
                        <p>{t("blogBursaBusDesc")}</p>
                      </div>
                    </div>
                    <p className="text-sm text-amber-600 mt-3">
                      ⚠️ {t("blogBursaPublicNote")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Must-See Attractions */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            {t("blogBursaSection3Title")}
          </h2>

          {/* Cumalıkızık Image */}
          <div className="relative rounded-2xl overflow-hidden mb-8">
            <img 
              src={cumalikizikImage} 
              alt="Cumalıkızık UNESCO Village in Bursa" 
              className="w-full h-[300px] md:h-[400px] object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <h3 className="text-white font-bold text-xl mb-1">{t("blogBursaCumalikizikTitle")}</h3>
              <p className="text-white/80 text-sm">{t("blogBursaCumalikizikSubtitle")}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Landmark className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">{t("blogBursaGrandMosqueTitle")}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("blogBursaGrandMosqueDesc")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Landmark className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">{t("blogBursaGreenMosqueTitle")}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("blogBursaGreenMosqueDesc")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Camera className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">{t("blogBursaCumalikizikCardTitle")}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("blogBursaCumalikizikCardDesc")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Mountain className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">{t("blogBursaUludagTitle")}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("blogBursaUludagDesc")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Utensils className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">{t("blogBursaKozaHanTitle")}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("blogBursaKozaHanDesc")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Sun className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">{t("blogBursaThermalTitle")}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("blogBursaThermalDesc")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Uludağ Image */}
          <div className="relative rounded-2xl overflow-hidden">
            <img 
              src={uludagImage} 
              alt="Uludağ Cable Car in Winter" 
              className="w-full h-[300px] md:h-[400px] object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <h3 className="text-white font-bold text-xl mb-1">{t("blogBursaCableCarTitle")}</h3>
              <p className="text-white/80 text-sm">{t("blogBursaCableCarSubtitle")}</p>
            </div>
          </div>
        </section>

        {/* Sample Itinerary */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            {t("blogBursaSection4Title")}
          </h2>
          
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border md:left-6" />
            
            <div className="space-y-6">
              {[
                { time: "07:00", title: t("blogBursaItinerary1Title"), desc: t("blogBursaItinerary1Desc") },
                { time: "09:30", title: t("blogBursaItinerary2Title"), desc: t("blogBursaItinerary2Desc") },
                { time: "10:00", title: t("blogBursaItinerary3Title"), desc: t("blogBursaItinerary3Desc") },
                { time: "12:00", title: t("blogBursaItinerary4Title"), desc: t("blogBursaItinerary4Desc") },
                { time: "13:30", title: t("blogBursaItinerary5Title"), desc: t("blogBursaItinerary5Desc") },
                { time: "15:00", title: t("blogBursaItinerary6Title"), desc: t("blogBursaItinerary6Desc") },
                { time: "17:00", title: t("blogBursaItinerary7Title"), desc: t("blogBursaItinerary7Desc") },
                { time: "19:30", title: t("blogBursaItinerary8Title"), desc: t("blogBursaItinerary8Desc") },
              ].map((item, index) => (
                <div key={index} className="relative pl-10 md:pl-16">
                  <div className="absolute left-0 md:left-2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <span className="text-sm font-bold text-primary">{item.time}</span>
                    <h4 className="font-semibold mt-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Best Time to Visit */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            {t("blogBursaSection5Title")}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 text-center">
                <TreeDeciduous className="h-8 w-8 mx-auto text-green-500 mb-3" />
                <h3 className="font-bold mb-2">{t("blogBursaSpringAutumn")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("blogBursaSpringAutumnDesc")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <Snowflake className="h-8 w-8 mx-auto text-blue-500 mb-3" />
                <h3 className="font-bold mb-2">{t("blogBursaWinter")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("blogBursaWinterDesc")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <Sun className="h-8 w-8 mx-auto text-amber-500 mb-3" />
                <h3 className="font-bold mb-2">{t("blogBursaSummer")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("blogBursaSummerDesc")}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* What's Included */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            {t("blogBursaSection6Title")}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              t("blogBursaInclude1"),
              t("blogBursaInclude2"),
              t("blogBursaInclude3"),
              t("blogBursaInclude4"),
              t("blogBursaInclude5"),
              t("blogBursaInclude6"),
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <BlogCTA destination="Bursa" />

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
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

        {/* Related Articles */}
        <RelatedArticles currentArticleId="istanbul-bursa-day-tour-guide" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default BursaDayTourGuide;
