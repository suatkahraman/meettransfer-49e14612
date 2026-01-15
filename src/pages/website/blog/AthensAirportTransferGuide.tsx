import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2, Plane, Building } from "lucide-react";
import athensTransferHero from "@/assets/blog/athens-transfer-hero.jpg";
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
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";

const AthensAirportTransferGuide = () => {
  const { getLocalizedPath, t } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    { question: t("blogAthensFaq1Q"), answer: t("blogAthensFaq1A") },
    { question: t("blogAthensFaq2Q"), answer: t("blogAthensFaq2A") },
    { question: t("blogAthensFaq3Q"), answer: t("blogAthensFaq3A") },
    { question: t("blogAthensFaq4Q"), answer: t("blogAthensFaq4A") },
    { question: t("blogAthensFaq5Q"), answer: t("blogAthensFaq5A") },
    { question: t("blogAthensFaq6Q"), answer: t("blogAthensFaq6A") },
  ];

  const transferPrices = [
    { destination: t("destAthensCenter"), duration: "35-50 min", price: "€45-60" },
    { destination: t("destPiraeus"), duration: "45-60 min", price: "€55-70" },
    { destination: t("destGlyfada"), duration: "30-40 min", price: "€40-55" },
    { destination: t("destVouliagmeni"), duration: "35-45 min", price: "€50-65" },
    { destination: t("destSounion"), duration: "60-75 min", price: "€90-110" },
    { destination: t("destDelphi"), duration: "150-180 min", price: "€180-220" },
  ];

  const popularAttractions = [
    { name: "Acropolis", description: t("blogAthensAcropolis") },
    { name: "Plaka", description: t("blogAthensPlaka") },
    { name: "Syntagma Square", description: t("blogAthensSyntagma") },
    { name: "Piraeus Port", description: t("blogAthensPiraeus") },
    { name: "National Archaeological Museum", description: t("blogAthensMuseum") },
    { name: "Temple of Poseidon", description: t("blogAthensSounion") },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogAthensSeoTitle")}
        description={t("blogAthensSeoDesc")}
        keywords="Athens airport transfer 2025, ATH private transfer, Athens Airport to City Center, Piraeus port transfer, Athens VIP transfer, Athens luxury transfer, Acropolis transfer, Plaka transfer, Syntagma transfer, Athens Airport to hotel, Delphi transfer, Cape Sounion transfer, Athens chauffeur service, Greece airport transfer"
        canonicalPath="/blog/athens-airport-transfer-guide"
        ogImage="https://meettransfer.app/og/athens-transfer-og.jpg"
        ogType="article"
        articlePublishedTime="2025-01-13"
        articleModifiedTime="2025-01-13"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t("blogAthensH1"),
            description: t("blogAthensSeoDesc"),
            image: 'https://meettransfer.app/og/athens-transfer-og.jpg',
            datePublished: '2025-01-13',
            dateModified: '2025-01-13',
            author: 'Meet Transfer',
            readingTime: '16',
            wordCount: 2200,
            keywords: ['Athens airport transfer', 'ATH transfer', 'Piraeus', 'Acropolis', 'VIP transfer', 'Greece transfer'],
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
              { name: t("blogAthensH1"), url: '/blog/athens-airport-transfer-guide' },
            ],
          },
        ]}
      />

      <article className="min-h-screen">
        {/* Hero Section */}
        <header className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <img
            src={athensTransferHero}
            alt={t("blogAthensHeroAlt")}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
              <Link 
                to={getLocalizedPath("/blog")} 
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("backToBlog")}
              </Link>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                  Greece
                </Badge>
                <Badge variant="outline" className="text-white border-white/50">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatBlogDate("2025-01-13")}
                </Badge>
                <Badge variant="outline" className="text-white border-white/50">
                  <Clock className="h-3 w-3 mr-1" />
                  16 {t("minRead")}
                </Badge>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {t("blogAthensH1")}
              </h1>
              <p className="text-lg text-white/90 max-w-2xl">
                {t("blogAthensIntro")}
              </p>
            </div>
          </div>
        </header>

        {/* Table of Contents */}
        <TableOfContents 
          items={[
            { id: "overview", title: t("blogAthensOverview") },
            { id: "airport-info", title: t("blogAthensAirportInfo") },
            { id: "transfer-options", title: t("blogAthensTransferOptions") },
            { id: "prices", title: t("blogAthensPrices") },
            { id: "attractions", title: t("blogAthensAttractions") },
            { id: "faq", title: t("blogAthensFAQ") },
          ]}
        />

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8 md:py-12">
          {/* Share Buttons */}
          <ShareButtons url={window.location.href} title={t("blogAthensH1")} />

          {/* Overview Section */}
          <section id="overview" className="mb-8 md:mb-12 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t("blogAthensOverview")}</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {t("blogAthensOverviewText1")}
            </p>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {t("blogAthensOverviewText2")}
            </p>
          </section>

          {/* Airport Info Section */}
          <section id="airport-info" className="mb-8 md:mb-12 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t("blogAthensAirportInfo")}</h2>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  Athens International Airport (ATH)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    {t("blogAthensAirportFact1")}
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    {t("blogAthensAirportFact2")}
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    {t("blogAthensAirportFact3")}
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    {t("blogAthensAirportFact4")}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Transfer Options Section */}
          <section id="transfer-options" className="mb-8 md:mb-12 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t("blogAthensTransferOptions")}</h2>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("blogAthensPrivateTransfer")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {t("blogAthensPrivateBenefit1")}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {t("blogAthensPrivateBenefit2")}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {t("blogAthensPrivateBenefit3")}
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("blogAthensPortTransfer")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      {t("blogAthensPortBenefit1")}
                    </li>
                    <li className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      {t("blogAthensPortBenefit2")}
                    </li>
                    <li className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      {t("blogAthensPortBenefit3")}
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Prices Section */}
          <section id="prices" className="mb-8 md:mb-12 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t("blogAthensPrices")}</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("destination")}</TableHead>
                      <TableHead>{t("duration")}</TableHead>
                      <TableHead>{t("priceRange")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transferPrices.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.destination}</TableCell>
                        <TableCell>{item.duration}</TableCell>
                        <TableCell className="text-primary font-semibold">{item.price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              {t("blogAthensPriceNote")}
            </p>
          </section>

          {/* Attractions Section */}
          <section id="attractions" className="mb-8 md:mb-12 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t("blogAthensAttractions")}</h2>
            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
              {popularAttractions.map((attraction, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{attraction.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{attraction.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA */}
          <BlogCTA destination="Athens" />

          {/* FAQ Section */}
          <section id="faq" className="mb-8 md:mb-12 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t("blogAthensFAQ")}</h2>
            <div className="space-y-3 md:space-y-4">
              {faqItems.map((item, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{item.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Related Articles */}
          <RelatedArticles currentArticleId="athens-airport-transfer-guide" />
        </div>
      </article>
      <Footer />
    </WebsiteLayout>
  );
};

export default AthensAirportTransferGuide;
