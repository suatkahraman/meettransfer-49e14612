import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2, Plane, Building } from "lucide-react";
import frankfurtTransferHero from "@/assets/blog/frankfurt-transfer-hero.jpg";
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
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";

const FrankfurtAirportTransferGuide = () => {
  const { getLocalizedPath, t } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    { question: t("blogFrankfurtFaq1Q"), answer: t("blogFrankfurtFaq1A") },
    { question: t("blogFrankfurtFaq2Q"), answer: t("blogFrankfurtFaq2A") },
    { question: t("blogFrankfurtFaq3Q"), answer: t("blogFrankfurtFaq3A") },
    { question: t("blogFrankfurtFaq4Q"), answer: t("blogFrankfurtFaq4A") },
    { question: t("blogFrankfurtFaq5Q"), answer: t("blogFrankfurtFaq5A") },
    { question: t("blogFrankfurtFaq6Q"), answer: t("blogFrankfurtFaq6A") },
  ];

  const transferPrices = [
    { destination: t("destFrankfurtCity"), duration: "15-25 min", price: "€55-70" },
    { destination: t("destMesseFrankfurt"), duration: "10-15 min", price: "€45-55" },
    { destination: t("destFinancialDistrict"), duration: "15-20 min", price: "€50-65" },
    { destination: "Mannheim", duration: "45-60 min", price: "€130-190" },
    { destination: t("destMainz"), duration: "30-40 min", price: "€75-90" },
    { destination: t("destWiesbaden"), duration: "35-45 min", price: "€85-100" },
    { destination: t("destHeidelberg"), duration: "60-75 min", price: "€120-150" },
  ];

  const popularAttractions = [
    { name: "Römerberg", description: t("blogFrankfurtRomerberg") },
    { name: "Main Tower", description: t("blogFrankfurtMainTower") },
    { name: "Palmengarten", description: t("blogFrankfurtPalmengarten") },
    { name: "Städel Museum", description: t("blogFrankfurtStadel") },
    { name: "Sachsenhausen", description: t("blogFrankfurtSachsenhausen") },
    { name: "Goethe House", description: t("blogFrankfurtGoetheHouse") },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogFrankfurtSeoTitle")}
        description={t("blogFrankfurtSeoDesc")}
        keywords="Frankfurt airport transfer 2025, FRA private transfer, Frankfurt Airport to City Center, Messe Frankfurt transfer, Frankfurt VIP transfer, Frankfurt luxury transfer, Frankfurt business transfer, Römerberg transfer, Main Tower transfer, Sachsenhausen transfer, Frankfurt Airport to hotel, Heidelberg transfer, Mainz transfer, Frankfurt chauffeur service"
        canonicalPath="/blog/frankfurt-airport-transfer-guide"
        ogImage="https://meettransfer.app/og/frankfurt-transfer-og.jpg"
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
            headline: t("blogFrankfurtH1"),
            description: t("blogFrankfurtSeoDesc"),
            image: 'https://meettransfer.app/og/frankfurt-transfer-og.jpg',
            datePublished: '2025-01-13',
            dateModified: '2025-01-13',
            author: 'Meet Transfer',
            readingTime: '15',
            wordCount: 2100,
            keywords: ['Frankfurt airport transfer', 'FRA transfer', 'Messe Frankfurt', 'City Center', 'VIP transfer'],
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
              { name: t("blogFrankfurtH1"), url: '/blog/frankfurt-airport-transfer-guide' },
            ],
          },
        ]}
      />

      <article className="min-h-screen">
        {/* Hero Section */}
        <header className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <img
            src={frankfurtTransferHero}
            alt={t("blogFrankfurtHeroAlt")}
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
                  Frankfurt
                </Badge>
                <Badge variant="outline" className="text-white border-white/50">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatBlogDate("2025-01-13")}
                </Badge>
                <Badge variant="outline" className="text-white border-white/50">
                  <Clock className="h-3 w-3 mr-1" />
                  15 {t("minRead")}
                </Badge>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {t("blogFrankfurtH1")}
              </h1>
              <p className="text-lg text-white/90 max-w-2xl">
                {t("blogFrankfurtIntro")}
              </p>
            </div>
          </div>
        </header>

        {/* Table of Contents */}
        <TableOfContents 
          items={[
            { id: "overview", title: t("blogFrankfurtOverview") },
            { id: "airport-info", title: t("blogFrankfurtAirportInfo") },
            { id: "transfer-options", title: t("blogFrankfurtTransferOptions") },
            { id: "prices", title: t("blogFrankfurtPrices") },
            { id: "attractions", title: t("blogFrankfurtAttractions") },
            { id: "faq", title: t("blogFrankfurtFAQ") },
          ]}
        />

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8 md:py-12">
          {/* Share Buttons */}
          <ShareButtons url={window.location.href} title={t("blogFrankfurtH1")} />

          {/* Overview Section */}
          <section id="overview" className="mb-8 md:mb-12 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t("blogFrankfurtOverview")}</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {t("blogFrankfurtOverviewText1")}
            </p>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {t("blogFrankfurtOverviewText2")}
            </p>
          </section>

          {/* Airport Info Section */}
          <section id="airport-info" className="mb-8 md:mb-12 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t("blogFrankfurtAirportInfo")}</h2>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  Frankfurt Airport (FRA)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    {t("blogFrankfurtAirportFact1")}
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    {t("blogFrankfurtAirportFact2")}
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    {t("blogFrankfurtAirportFact3")}
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    {t("blogFrankfurtAirportFact4")}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Transfer Options Section */}
          <section id="transfer-options" className="mb-8 md:mb-12 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t("blogFrankfurtTransferOptions")}</h2>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("blogFrankfurtPrivateTransfer")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {t("blogFrankfurtPrivateBenefit1")}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {t("blogFrankfurtPrivateBenefit2")}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {t("blogFrankfurtPrivateBenefit3")}
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("blogFrankfurtBusinessTransfer")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      {t("blogFrankfurtBusinessBenefit1")}
                    </li>
                    <li className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      {t("blogFrankfurtBusinessBenefit2")}
                    </li>
                    <li className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      {t("blogFrankfurtBusinessBenefit3")}
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Prices Section */}
          <section id="prices" className="mb-8 md:mb-12 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t("blogFrankfurtPrices")}</h2>
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
              {t("blogFrankfurtPriceNote")}
            </p>
          </section>

          {/* Attractions Section */}
          <section id="attractions" className="mb-8 md:mb-12 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t("blogFrankfurtAttractions")}</h2>
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
          <BlogCTA destination="Frankfurt" />

          {/* FAQ Section */}
          <section id="faq" className="mb-8 md:mb-12 scroll-mt-20">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t("blogFrankfurtFAQ")}</h2>
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
          <RelatedArticles currentArticleId="frankfurt-airport-transfer-guide" />
        </div>
      </article>
      <Footer />
    </WebsiteLayout>
  );
};

export default FrankfurtAirportTransferGuide;
