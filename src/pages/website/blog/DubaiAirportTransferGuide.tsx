import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2, Plane, Building } from "lucide-react";
import dubaiTransferHero from "@/assets/blog/dubai-transfer-hero.jpg";
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

const DubaiAirportTransferGuide = () => {
  const { getLocalizedPath, t } = useLanguage();

  const faqItems = [
    { question: t("blogDubaiFaq1Q"), answer: t("blogDubaiFaq1A") },
    { question: t("blogDubaiFaq2Q"), answer: t("blogDubaiFaq2A") },
    { question: t("blogDubaiFaq3Q"), answer: t("blogDubaiFaq3A") },
    { question: t("blogDubaiFaq4Q"), answer: t("blogDubaiFaq4A") },
    { question: t("blogDubaiFaq5Q"), answer: t("blogDubaiFaq5A") },
    { question: t("blogDubaiFaq6Q"), answer: t("blogDubaiFaq6A") },
  ];

  const transferPrices = [
    { destination: "Downtown Dubai / Burj Khalifa", duration: "15-25 min", price: "$45-60" },
    { destination: "Palm Jumeirah", duration: "25-35 min", price: "$55-70" },
    { destination: "Dubai Marina / JBR", duration: "30-40 min", price: "$55-70" },
    { destination: "Jumeirah Beach Hotels", duration: "20-30 min", price: "$50-65" },
    { destination: "Business Bay", duration: "15-25 min", price: "$45-60" },
    { destination: "Abu Dhabi", duration: "75-90 min", price: "$120-150" },
  ];

  const popularAttractions = [
    { name: "Burj Khalifa", description: t("blogDubaiBurjKhalifa") },
    { name: "Palm Jumeirah", description: t("blogDubaiPalm") },
    { name: "Dubai Mall", description: t("blogDubaiMall") },
    { name: "Dubai Marina", description: t("blogDubaiMarina") },
    { name: "Burj Al Arab", description: t("blogDubaiBurjArab") },
    { name: "Dubai Frame", description: t("blogDubaiFrame") },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogDubaiSeoTitle")}
        description={t("blogDubaiSeoDesc")}
        keywords="Dubai airport transfer 2025, DXB private transfer, Dubai Airport to Downtown, Palm Jumeirah transfer, Dubai VIP transfer, Dubai luxury transfer, Dubai Marina transfer, Burj Khalifa transfer, JBR transfer, Business Bay transfer, Dubai Airport to hotel, DWC airport transfer, Al Maktoum airport, Abu Dhabi transfer, Dubai chauffeur service"
        canonicalPath="/blog/dubai-airport-transfer-guide"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
        ogType="article"
        articlePublishedTime="2024-12-26"
        articleModifiedTime="2025-01-10"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t("blogDubaiH1"),
            description: t("blogDubaiSeoDesc"),
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2024-12-26',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '16',
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
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Dubai Airport Transfer Guide', url: '/blog/dubai-airport-transfer-guide' },
            ],
          },
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
          <Badge variant="secondary" className="mb-4">Dubai</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t("blogDubaiH1")}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t("blogDubaiIntro")}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("lastUpdated")}: January 10, 2025
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              16 {t("minRead")}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <ShareButtons title={t("blogDubaiH1")} className="mb-8" />

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12">
          <img 
            src={dubaiTransferHero} 
            alt="Dubai Airport Transfer 2025 - VIP Private Transfer to Downtown, Palm Jumeirah, Dubai Marina"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>{t("blogDubaiSection1Title")}</h2>
          <p>{t("blogDubaiSection1P1")}</p>
          <p>{t("blogDubaiSection1P2")}</p>

          <h2>{t("blogDubaiSection2Title")}</h2>
          <p>{t("blogDubaiSection2Intro")}</p>

          <h2>{t("blogDubaiSection3Title")}</h2>
          <p>{t("blogDubaiSection3Intro")}</p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("blogPriceTableDestination")}</TableHead>
                  <TableHead>{t("blogDubaiTableDuration")}</TableHead>
                  <TableHead>{t("blogDubaiTablePrice")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transferPrices.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.destination}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                    <TableCell>{item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h2>{t("blogDubaiSection4Title")}</h2>
          <p>
            <Link to={getLocalizedPath("/dubai-transfer")} className="text-primary hover:underline">{t("blogDubaiPrivateTransfer")}</Link> {t("blogDubaiSection4P1")}
          </p>

          <h3>{t("blogDubaiSection4SubTitle")}</h3>
          <ul>
            <li>{t("blogDubaiInclude1")}</li>
            <li>{t("blogDubaiInclude2")}</li>
            <li>{t("blogDubaiInclude3")}</li>
            <li>{t("blogDubaiInclude4")}</li>
            <li>{t("blogDubaiInclude5")}</li>
            <li>{t("blogDubaiInclude6")}</li>
            <li>{t("blogDubaiInclude7")}</li>
          </ul>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t("blogDubaiWhyChoose")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogDubaiWhyChoose1")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogDubaiWhyChoose2")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogDubaiWhyChoose3")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogDubaiWhyChoose4")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>{t("blogDubaiSection5Title")}</h2>
          <p>{t("blogDubaiSection5Intro")}</p>

          <h2>{t("blogDubaiSection6Title")}</h2>
          <p>{t("blogDubaiSection6Intro")}</p>

          <h2>{t("blogDubaiSection7Title")}</h2>
          <div className="not-prose my-8 grid md:grid-cols-2 gap-4">
            {popularAttractions.map((attraction, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    {attraction.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{attraction.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2>{t("blogDubaiSection8Title")}</h2>
          <p>{t("blogDubaiSection8Intro")}</p>

          <h2>{t("blogDubaiConclusion")}</h2>
          <p>{t("blogDubaiConclusionP1")}</p>
        </div>

        {/* CTA Section */}
        <div className="not-prose my-12 p-8 bg-primary/5 rounded-xl text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">
            {t("blogDubaiCtaTitle")}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            {t("blogDubaiCtaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/dubai-transfer")}>
              <Button size="lg" variant="accent" className="gap-2">
                {t("blogDubaiCtaButton")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a 
              href={getWhatsAppUrl("Hello, I need a transfer from Dubai Airport.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="gap-2">
                {t("whatsappBooking")}
              </Button>
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="not-prose mt-16">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8">
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

        {/* Related Posts */}
        <RelatedArticles currentArticleId="dubai-airport-transfer-guide" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default DubaiAirportTransferGuide;
