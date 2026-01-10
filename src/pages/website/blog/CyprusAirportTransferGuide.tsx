import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2, Plane, MapPin } from "lucide-react";
import cyprusTransferHero from "@/assets/blog/cyprus-transfer-hero.jpg";
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

const CyprusAirportTransferGuide = () => {
  const { getLocalizedPath, t } = useLanguage();

  const faqItems = [
    { question: t("blogCyprusFaq1Q"), answer: t("blogCyprusFaq1A") },
    { question: t("blogCyprusFaq2Q"), answer: t("blogCyprusFaq2A") },
    { question: t("blogCyprusFaq3Q"), answer: t("blogCyprusFaq3A") },
    { question: t("blogCyprusFaq4Q"), answer: t("blogCyprusFaq4A") },
    { question: t("blogCyprusFaq5Q"), answer: t("blogCyprusFaq5A") },
    { question: t("blogCyprusFaq6Q"), answer: t("blogCyprusFaq6A") },
  ];

  const larnacaTransferPrices = [
    { destination: "Larnaca City / Hotels", duration: "10-15 min", price: "€35-45" },
    { destination: "Ayia Napa", duration: "40-50 min", price: "€50-65" },
    { destination: "Protaras", duration: "50-60 min", price: "€55-70" },
    { destination: "Limassol", duration: "45-55 min", price: "€60-75" },
    { destination: "Nicosia", duration: "35-45 min", price: "€50-65" },
    { destination: "Paphos", duration: "90-110 min", price: "€90-110" },
    { destination: "Kyrenia (North Cyprus)", duration: "60-75 min", price: "€75-90" },
  ];

  const paphosTransferPrices = [
    { destination: "Paphos City / Hotels", duration: "15-20 min", price: "€25-35" },
    { destination: "Coral Bay", duration: "25-30 min", price: "€30-40" },
    { destination: "Polis Chrysochous", duration: "45-55 min", price: "€50-65" },
    { destination: "Limassol", duration: "55-65 min", price: "€65-80" },
    { destination: "Larnaca", duration: "90-110 min", price: "€90-110" },
    { destination: "Ayia Napa", duration: "120-140 min", price: "€120-140" },
  ];

  const popularDestinations = [
    { name: "Ayia Napa", description: t("blogCyprusAyiaNapaDesc") },
    { name: "Protaras", description: t("blogCyprusProtarasDesc") },
    { name: "Limassol", description: t("blogCyprusLimassolDesc") },
    { name: "Paphos", description: t("blogCyprusPaphosDesc") },
    { name: "Kyrenia", description: t("blogCyprusKyreniaDesc") },
    { name: "Troodos Mountains", description: t("blogCyprusTroodosDesc") },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("blogCyprusSeoTitle")}
        description={t("blogCyprusSeoDesc")}
        keywords="Cyprus airport transfer 2025, Larnaca airport transfer, Paphos airport transfer, Ayia Napa transfer, Limassol airport transfer, Cyprus private transfer, Protaras transfer, Kyrenia transfer, Northern Cyprus transfer, Ercan airport, Famagusta transfer, Troodos transfer, Cyprus VIP transfer, Cyprus taxi price"
        canonicalPath="/blog/cyprus-airport-transfer-guide"
        ogImage="https://meettransfer.app/images/meet-transfer-vclass-interior.jpg"
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
            headline: t("blogCyprusH1"),
            description: t("blogCyprusSeoDesc"),
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2024-12-26',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '17',
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
              { name: 'Cyprus Airport Transfer Guide', url: '/blog/cyprus-airport-transfer-guide' },
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
          <Badge variant="secondary" className="mb-4">Cyprus</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t("blogCyprusH1")}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t("blogCyprusIntro")}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("lastUpdated")}: January 10, 2025
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              17 {t("minRead")}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <ShareButtons title={t("blogCyprusH1")} className="mb-8" />

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12">
          <img 
            src={cyprusTransferHero} 
            alt="Cyprus Airport Transfer 2025 - VIP Private Transfer from Larnaca and Paphos Airports"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>{t("blogCyprusSection1Title")}</h2>
          <p>{t("blogCyprusSection1P1")}</p>
          <p>{t("blogCyprusSection1P2")}</p>

          <h2>{t("blogCyprusSection2Title")}</h2>
          
          <h3>{t("blogCyprusLarnacaTitle")}</h3>
          <p>{t("blogCyprusLarnacaDesc")}</p>

          <h3>{t("blogCyprusPaphosAirportTitle")}</h3>
          <p>{t("blogCyprusPaphosAirportDesc")}</p>

          <h2>{t("blogCyprusSection3Title")}</h2>
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
                {larnacaTransferPrices.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.destination}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                    <TableCell>{item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h2>{t("blogCyprusSection4Title")}</h2>
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
                {paphosTransferPrices.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.destination}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                    <TableCell>{item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h2>{t("blogCyprusSection5Title")}</h2>
          <p>
            <Link to={getLocalizedPath("/cyprus-transfer")} className="text-primary hover:underline">{t("blogCyprusPrivateTransfer")}</Link> {t("blogCyprusSection5P1")}
          </p>

          <h3>{t("blogCyprusSection5SubTitle")}</h3>
          <ul>
            <li>{t("blogCyprusInclude1")}</li>
            <li>{t("blogCyprusInclude2")}</li>
            <li>{t("blogCyprusInclude3")}</li>
            <li>{t("blogCyprusInclude4")}</li>
            <li>{t("blogCyprusInclude5")}</li>
            <li>{t("blogCyprusInclude6")}</li>
            <li>{t("blogCyprusInclude7")}</li>
          </ul>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t("blogCyprusWhyChoose")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCyprusWhyChoose1")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCyprusWhyChoose2")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCyprusWhyChoose3")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCyprusWhyChoose4")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>{t("blogCyprusSection6Title")}</h2>
          <p>{t("blogCyprusSection6Intro")}</p>

          <h2>{t("blogCyprusSection7Title")}</h2>
          <div className="not-prose my-8 grid md:grid-cols-2 gap-4">
            {popularDestinations.map((destination, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {destination.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{destination.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2>{t("blogCyprusSection8Title")}</h2>
          <p>{t("blogCyprusSection8Intro")}</p>

          <h2>{t("blogCyprusSection9Title")}</h2>
          <p>{t("blogCyprusSection9Intro")}</p>

          <h2>{t("blogCyprusConclusion")}</h2>
          <p>{t("blogCyprusConclusionP1")}</p>
        </div>

        {/* CTA Section */}
        <div className="not-prose my-12 p-8 bg-primary/5 rounded-xl text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">
            {t("blogCyprusCtaTitle")}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            {t("blogCyprusCtaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/cyprus-transfer")}>
              <Button size="lg" variant="accent" className="gap-2">
                {t("blogCyprusCtaButton")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a 
              href={getWhatsAppUrl("Hello, I need a transfer from Cyprus airport.")}
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
        <section className="not-prose mt-16 pt-8 border-t border-border">
          <h2 className="font-serif text-xl font-bold mb-6">{t("relatedArticles")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link 
              to={getLocalizedPath("/blog/dubai-airport-transfer-guide")}
              className="group p-4 border border-border rounded-lg hover:border-primary transition-colors"
            >
              <Badge variant="outline" className="mb-2">Dubai</Badge>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{t("blogDubaiTitle")}</h3>
            </Link>
            <Link 
              to={getLocalizedPath("/blog/antalya-airport-transfer-to-hotels")}
              className="group p-4 border border-border rounded-lg hover:border-primary transition-colors"
            >
              <Badge variant="outline" className="mb-2">Antalya</Badge>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{t("blogAntalyaTitle")}</h3>
            </Link>
          </div>
        </section>
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default CyprusAirportTransferGuide;
