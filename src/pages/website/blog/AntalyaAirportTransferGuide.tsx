import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2, MapPin } from "lucide-react";
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

  const destinations = [
    { area: "Kaleici (Old Town)", distance: "13 km", time: "20-25 min", price: "€50" },
    { area: "Lara Beach / Kundu", distance: "18 km", time: "20-30 min", price: "€50" },
    { area: "Belek", distance: "35 km", time: "35-45 min", price: "€65" },
    { area: "Side", distance: "65 km", time: "60-75 min", price: "€72" },
    { area: "Alanya", distance: "130 km", time: "120-150 min", price: "€84" },
    { area: "Kemer / Göynük", distance: "60 km", time: "50-65 min", price: "€65" },
    { area: "Kaş", distance: "190 km", time: "180-210 min", price: "€170" },
    { area: "Kalkan", distance: "220 km", time: "210-240 min", price: "€170" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("blogAntalyaSeoTitle")}
        description={t("blogAntalyaSeoDesc")}
        keywords="Antalya airport transfer, AYT airport hotel transfer, Antalya to Belek transfer, Antalya to Side transfer, Lara Beach transfer, private transfer Antalya"
        canonicalPath="/blog/antalya-airport-transfer-to-hotels"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
        ogType="article"
        articlePublishedTime="2024-11-28"
        articleModifiedTime="2025-01-05"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t("blogAntalyaH1"),
            description: t("blogAntalyaSeoDesc"),
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2024-11-28',
            dateModified: '2025-12-31',
            author: 'Meet Transfer',
            readingTime: '13',
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
          <Badge variant="secondary" className="mb-4">Antalya</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t("blogAntalyaH1")}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t("blogAntalyaIntro")}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              November 28, 2024
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              13 {t("minRead")}
            </span>
          </div>
        </header>

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12">
          <img 
            src="/images/meet-transfer-vip-mercedes-vito.jpg" 
            alt="Private transfer from Antalya Airport"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>{t("blogAntalyaSection1Title")}</h2>
          <p>{t("blogAntalyaSection1P1")}</p>
          <p>{t("blogAntalyaSection1P2")}</p>

          <h2>{t("blogAntalyaSection2Title")}</h2>
          <p>{t("blogAntalyaSection2Intro")}</p>

          <h2>{t("blogAntalyaSection3Title")}</h2>
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

          <h2>{t("blogAntalyaSection4Title")}</h2>

          <h3>{t("blogAntalyaLaraTitle")}</h3>
          <p>{t("blogAntalyaLaraDesc")}</p>

          <h3>{t("blogAntalyaBelekTitle")}</h3>
          <p>{t("blogAntalyaBelekDesc")}</p>

          <h3>{t("blogAntalyaSideTitle")}</h3>
          <p>{t("blogAntalyaSideDesc")}</p>

          <h3>{t("blogAntalyaKemerTitle")}</h3>
          <p>{t("blogAntalyaKemerDesc")}</p>

          <h3>{t("blogAntalyaAlanyaTitle")}</h3>
          <p>{t("blogAntalyaAlanyaDesc")}</p>

          <h2>{t("blogAntalyaSection5Title")}</h2>

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

          <h2>{t("blogAntalyaSection7Title")}</h2>
          <p>{t("blogAntalyaSection7Intro")}</p>

          <h2>{t("blogAntalyaConclusion")}</h2>
          <p>
            {t("blogAntalyaConclusionP1")} 
            <Link to={getLocalizedPath("/antalya-transfer")} className="text-primary hover:underline"> {t("blogAntalyaConclusionLink")}</Link>
          </p>
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
        <div className="my-12 p-8 bg-primary/5 rounded-2xl text-center">
          <h3 className="font-serif text-2xl font-bold mb-4">
            {t("blogAntalyaCtaTitle")}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t("blogAntalyaCtaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/antalya-transfer")}>
              <Button size="lg" variant="accent" className="gap-2">
                {t("blogAntalyaCtaButton")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a 
              href={getWhatsAppUrl("Hello, I need a transfer from Antalya Airport.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline">
                {t("whatsappBooking")}
              </Button>
            </a>
          </div>
        </div>

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
        <section className="my-12">
          <h2 className="font-serif text-2xl font-bold mb-6">{t("relatedArticles")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link 
              to={getLocalizedPath("/blog/istanbul-airport-transfer-price-guide")}
              className="group p-4 border border-border rounded-lg hover:border-primary transition-colors"
            >
              <Badge variant="outline" className="mb-2">Istanbul</Badge>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{t("blogIstanbul2Title")}</h3>
            </Link>
            <Link 
              to={getLocalizedPath("/blog/is-private-transfer-worth-it")}
              className="group p-4 border border-border rounded-lg hover:border-primary transition-colors"
            >
              <Badge variant="outline" className="mb-2">{t("travelTips")}</Badge>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{t("blogWorthItTitle")}</h3>
            </Link>
          </div>
        </section>
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default AntalyaAirportTransferGuide;
