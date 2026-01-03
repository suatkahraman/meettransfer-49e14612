import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2 } from "lucide-react";
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

  const priceData = [
    { destination: "Taksim / Beyoğlu", taxi: "600-800 TL ($20-25)", private: "$55-65", bus: "150 TL ($5)" },
    { destination: "Sultanahmet", taxi: "650-850 TL ($21-27)", private: "$55-65", bus: "150 TL ($5)" },
    { destination: "Kadıköy", taxi: "800-1000 TL ($26-32)", private: "$70-85", bus: "180 TL ($6)" },
    { destination: "Beşiktaş", taxi: "600-750 TL ($19-24)", private: "$55-65", bus: "150 TL ($5)" },
    { destination: "Galataport Cruise Terminal", taxi: "600-800 TL ($20-25)", private: "$55-65", bus: "N/A" },
    { destination: "Sabiha Gökçen Airport", taxi: "1500-2000 TL ($48-65)", private: "$120-150", bus: "N/A" },
    { destination: "Bursa (via ferry)", taxi: "N/A", private: "$180-220", bus: "N/A" },
  ];

  const vehiclePrices = [
    { vehicle: "Mercedes Vito (up to 6 pax)", toTaksim: "$55-65", toKadikoy: "$70-85", toBursa: "$180-220" },
    { vehicle: "Mercedes V-Class VIP (up to 6 pax)", toTaksim: "$75-90", toKadikoy: "$90-110", toBursa: "$220-280" },
    { vehicle: "Mercedes Maybach (up to 3 pax)", toTaksim: "$150-200", toKadikoy: "$180-220", toBursa: "$350-450" },
    { vehicle: "Mercedes Sprinter (up to 16 pax)", toTaksim: "$120-150", toKadikoy: "$140-180", toBursa: "$300-380" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t("blogPriceSeoTitle")}
        description={t("blogPriceSeoDesc")}
        keywords="Istanbul Airport transfer price, IST transfer cost, Istanbul taxi fare, private transfer Istanbul price, Istanbul Airport to Taksim price, airport transfer pricing Turkey"
        canonicalPath="/blog/istanbul-airport-transfer-price-guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t("blogPriceH1"),
            description: t("blogPriceSeoDesc"),
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2024-12-10',
            dateModified: '2025-12-31',
            author: 'Meet Transfer',
            readingTime: '10',
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
              December 10, 2024
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              10 {t("minRead")}
            </span>
          </div>
        </header>

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12">
          <img 
            src="/images/meet-transfer-vip-mercedes-vito.jpg" 
            alt="Mercedes Vito VIP Transfer Istanbul"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>{t("blogPriceSection1Title")}</h2>
          <p>{t("blogPriceSection1P1")}</p>
          <p>{t("blogPriceSection1P2")}</p>

          <h2>{t("blogPriceSection2Title")}</h2>
          <p>{t("blogPriceSection2Intro")}</p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("blogPriceTableDestination")}</TableHead>
                  <TableHead>{t("blogPriceTableTaxi")}</TableHead>
                  <TableHead>{t("blogPriceTablePrivate")}</TableHead>
                  <TableHead>{t("blogPriceTableBus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.destination}</TableCell>
                    <TableCell>{row.taxi}</TableCell>
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

          <h2>{t("blogPriceSection3Title")}</h2>
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

          <h2>{t("blogPriceSection4Title")}</h2>

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

          <h2>{t("blogPriceSection5Title")}</h2>
          <p>{t("blogPriceSection5Intro")}</p>

          <h2>{t("blogPriceSection6Title")}</h2>
          <p>{t("blogPriceSection6Intro")}</p>

          <h2>{t("blogPriceConclusion")}</h2>
          <p>
            {t("blogPriceConclusionP1")} 
            <Link to={getLocalizedPath("/istanbul-transfer")} className="text-primary hover:underline"> {t("blogPriceConclusionLink")}</Link>
          </p>
          <p>
            <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">{t("blogPriceConclusionCta")}</Link>
          </p>
        </div>

        {/* CTA Section */}
        <div className="my-12 p-8 bg-primary/5 rounded-2xl text-center">
          <h3 className="font-serif text-2xl font-bold mb-4">
            {t("blogPriceCtaTitle")}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t("blogPriceCtaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/book")}>
              <Button size="lg" variant="accent" className="gap-2">
                {t("requestPrice")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a 
              href="https://wa.me/905321748390?text=Hello, I need a price quote for Istanbul Airport transfer."
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
              to={getLocalizedPath("/blog/istanbul-airport-to-city-guide")}
              className="group p-4 border border-border rounded-lg hover:border-primary transition-colors"
            >
              <Badge variant="outline" className="mb-2">Istanbul</Badge>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{t("blogIstanbul1Title")}</h3>
            </Link>
            <Link 
              to={getLocalizedPath("/blog/private-transfer-vs-taxi-turkey")}
              className="group p-4 border border-border rounded-lg hover:border-primary transition-colors"
            >
              <Badge variant="outline" className="mb-2">{t("travelTips")}</Badge>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{t("blogPrivateTaxiTitle")}</h3>
            </Link>
          </div>
        </section>
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default IstanbulTransferPriceGuide;
