import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import istanbulAirportCityHero from "@/assets/blog/istanbul-airport-city-hero.jpg";
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
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import BlogCTA from "@/components/website/BlogCTA";

const IstanbulAirportToCityGuide = () => {
  const { t, getLocalizedPath } = useLanguage();

  const faqItems = [
    { question: t("blogIstanbulFaq1Q"), answer: t("blogIstanbulFaq1A") },
    { question: t("blogIstanbulFaq2Q"), answer: t("blogIstanbulFaq2A") },
    { question: t("blogIstanbulFaq3Q"), answer: t("blogIstanbulFaq3A") },
    { question: t("blogIstanbulFaq4Q"), answer: t("blogIstanbulFaq4A") },
    { question: t("blogIstanbulFaq5Q"), answer: t("blogIstanbulFaq5A") },
    { question: t("blogIstanbulFaq6Q"), answer: t("blogIstanbulFaq6A") },
  ];

  const transportOptions = [
    {
      method: "Private Transfer",
      duration: "35-45 min",
      price: "€50-65",
      pros: ["Door-to-door", "Meet & Greet", "Flight tracking", "Child seats available"],
      cons: ["Higher cost than public transport"],
      rating: 5
    },
    {
      method: "Regular Transportation",
      duration: "40-60 min",
      price: "Variable",
      pros: ["Available at airport", "No booking needed"],
      cons: ["Variable pricing", "Language barrier", "No meet & greet", "Traffic issues"],
      rating: 3
    },
    {
      method: "Metro (M11)",
      duration: "50-70 min",
      price: "€1-2",
      pros: ["Very affordable", "Avoids traffic"],
      cons: ["Requires transfer", "Limited luggage space", "Crowded", "Not 24/7"],
      rating: 3
    },
    {
      method: "Havaist Bus",
      duration: "60-90 min",
      price: "€5-8",
      pros: ["Affordable", "Direct to major areas"],
      cons: ["Infrequent schedule", "Traffic dependent", "Limited stops"],
      rating: 3
    }
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t('blogIstanbul1Title')}
        description={t('blogIstanbul1Desc')}
        keywords="Istanbul Airport to city 2025, Istanbul Airport transfer, IST to Taksim, Istanbul Airport metro, Istanbul Airport to Sultanahmet, private transfer Istanbul, Istanbul Airport bus, Havaist bus, M11 metro Istanbul, Istanbul new airport transport, IST airport to hotel"
        canonicalPath="/blog/istanbul-airport-to-city-best-way"
        ogImage="https://meettransfer.app/og/istanbul-airport-city-og.jpg"
        ogType="article"
        articlePublishedTime="2024-12-15"
        articleModifiedTime="2025-01-10"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t('blogIstanbul1H1'),
            description: t('blogIstanbul1Desc'),
            image: 'https://meettransfer.app/og/istanbul-airport-city-og.jpg',
            datePublished: '2024-12-15',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '14',
            wordCount: 2100,
            keywords: ['Istanbul Airport to city', 'IST transfer', 'Taksim transfer', 'Sultanahmet', 'metro M11'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Istanbul Airport to City Guide', url: '/blog/istanbul-airport-to-city-best-way' },
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
          {t('backToBlog')}
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <Badge variant="secondary" className="mb-4">Istanbul</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t('blogIstanbul1H1')}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t('blogIstanbul1Intro')}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t('lastUpdated')}: January 10, 2025
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              14 {t('minRead')}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <ShareButtons title={t('blogIstanbul1H1')} className="mb-8" />

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12">
          <img 
            src={istanbulAirportCityHero} 
            alt="Istanbul Airport to City Center 2025 - Best Transportation Options Including Private Transfer, Metro M11, and Havaist Bus"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        <TableOfContents items={[
          { id: "introduction", title: t("blogIstanbulTocIntro") },
          { id: "quick-comparison", title: t("blogIstanbulTocComparison") },
          { id: "private-transfer", title: t("blogIstanbulTocPrivate") },
          { id: "regular-transport", title: t("blogIstanbulTocRegular") },
          { id: "metro-m11", title: t("blogIstanbulTocMetro") },
          { id: "havaist-bus", title: t("blogIstanbulTocHavaist") },
          { id: "which-option", title: t("blogIstanbulTocWhichOption") },
          { id: "distances", title: t("blogIstanbulTocDistances") },
          { id: "tips", title: t("blogIstanbulTocTips") },
        ]} />

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 id="introduction">{t("blogIstanbulTocIntro")}</h2>
          <p>{t("blogIstanbulIntroP1")}</p>
          <p>{t("blogIstanbulIntroP2")}</p>

          <h2 id="quick-comparison">{t("blogIstanbulTocComparison")}</h2>
          <p>{t("blogIstanbulQuickOverview")}</p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("blogIstanbulTableOption")}</TableHead>
                  <TableHead>{t("blogIstanbulTableDuration")}</TableHead>
                  <TableHead>{t("blogIstanbulTablePrice")}</TableHead>
                  <TableHead>{t("blogIstanbulTableBestFor")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{t("blogIstanbulTablePrivate")}</TableCell>
                  <TableCell>35-45 min</TableCell>
                  <TableCell>€50-65</TableCell>
                  <TableCell>{t("blogIstanbulBestForFamilies")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{t("blogIstanbulTableRegular")}</TableCell>
                  <TableCell>40-60 min</TableCell>
                  <TableCell>Variable</TableCell>
                  <TableCell>{t("blogIstanbulBestForSolo")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{t("blogIstanbulTableMetro")}</TableCell>
                  <TableCell>50-70 min</TableCell>
                  <TableCell>€1-2</TableCell>
                  <TableCell>{t("blogIstanbulBestForBudget")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{t("blogIstanbulTableHavaist")}</TableCell>
                  <TableCell>60-90 min</TableCell>
                  <TableCell>€5-8</TableCell>
                  <TableCell>{t("blogIstanbulBestForMajor")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h2 id="private-transfer">{t("blogIstanbulTocPrivate")}</h2>
          <p>
            <Link to={getLocalizedPath("/istanbul-transfer")} className="text-primary hover:underline">{t("blogIstanbulTablePrivate")}</Link> {t("blogIstanbulPrivateTransferDesc")}
          </p>

          <h3>{t("blogIstanbulHowPrivateWorks")}</h3>
          <p>{t("blogIstanbulHowPrivateP1")}</p>
          <ul>
            <li>{t("blogIstanbulPrivateFeature1")}</li>
            <li>{t("blogIstanbulPrivateFeature2")}</li>
            <li>{t("blogIstanbulPrivateFeature3")}</li>
            <li>{t("blogIstanbulPrivateFeature4")}</li>
            <li>{t("blogIstanbulPrivateFeature5")}</li>
            <li>{t("blogIstanbulPrivateFeature6")}</li>
            <li>{t("blogIstanbulPrivateFeature7")}</li>
          </ul>

          <h3>{t("blogIstanbulPrivatePricing")}</h3>
          <p>{t("blogIstanbulPrivatePricingP1")}</p>
          <ul>
            <li>{t("blogIstanbulPriceTaksim")}</li>
            <li>{t("blogIstanbulPriceSultanahmet")}</li>
            <li>{t("blogIstanbulPriceKadikoy")}</li>
            <li>{t("blogIstanbulPriceSabiha")}</li>
            <li>{t("blogIstanbulPriceBursa")}</li>
            <li>{t("blogIstanbulPriceSapanca")}</li>
            <li>{t("blogIstanbulPriceKartepe")}</li>
          </ul>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t("blogIstanbulWhyChoosePrivate")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogIstanbulWhyPrivate1")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogIstanbulWhyPrivate2")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogIstanbulWhyPrivate3")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogIstanbulWhyPrivate4")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 id="regular-transport">{t("blogIstanbulTocRegular")}</h2>
          <p>{t("blogIstanbulRegularP1")}</p>

          <h3>{t("blogIstanbulRegularTips")}</h3>
          <p>{t("blogIstanbulRegularTipsP1")}</p>
          <ul>
            <li>{t("blogIstanbulRegularTip1")}</li>
            <li>{t("blogIstanbulRegularTip2")}</li>
            <li>{t("blogIstanbulRegularTip3")}</li>
            <li>{t("blogIstanbulRegularTip4")}</li>
          </ul>

          <h2 id="metro-m11">{t("blogIstanbulTocMetro")}</h2>
          <p>{t("blogIstanbulMetroP1")}</p>

          <h3>{t("blogIstanbulMetroRoute")}</h3>
          <p>{t("blogIstanbulMetroRouteP1")}</p>
          <ul>
            <li>{t("blogIstanbulMetroM2")}</li>
            <li>{t("blogIstanbulMetroMarmaray")}</li>
          </ul>

          <h3>{t("blogIstanbulMetroTimings")}</h3>
          <p>{t("blogIstanbulMetroTimingsP1")}</p>

          <div className="not-prose my-8">
            <Card className="bg-red-500/5 border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  {t("blogIstanbulMetroLimitations")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>• {t("blogIstanbulMetroLimit1")}</p>
                <p>• {t("blogIstanbulMetroLimit2")}</p>
                <p>• {t("blogIstanbulMetroLimit3")}</p>
                <p>• {t("blogIstanbulMetroLimit4")}</p>
                <p>• {t("blogIstanbulMetroLimit5")}</p>
              </CardContent>
            </Card>
          </div>

          <h2 id="havaist-bus">{t("blogIstanbulTocHavaist")}</h2>
          <p>{t("blogIstanbulHavalistRoutesP1")}</p>

          <h3>{t("blogIstanbulHavalistRoutes")}</h3>
          <ul>
            <li>{t("blogIstanbulHavalistRoute1")}</li>
            <li>{t("blogIstanbulHavalistRoute2")}</li>
            <li>{t("blogIstanbulHavalistRoute3")}</li>
            <li>{t("blogIstanbulHavalistRoute4")}</li>
          </ul>

          <h2 id="which-option">{t("blogIstanbulTocWhichOption")}</h2>
          <p>{t("blogIstanbulWhichOption")}</p>

          <h3>{t("blogIstanbulChoosePrivateIf")}</h3>
          <ul>
            <li>{t("blogIstanbulChoosePrivate1")}</li>
            <li>{t("blogIstanbulChoosePrivate2")}</li>
            <li>{t("blogIstanbulChoosePrivate3")}</li>
            <li>{t("blogIstanbulChoosePrivate4")}</li>
            <li>{t("blogIstanbulChoosePrivate5")}</li>
            <li>{t("blogIstanbulChoosePrivate6")}</li>
          </ul>

          <h3>{t("blogIstanbulChooseRegularIf")}</h3>
          <ul>
            <li>{t("blogIstanbulChooseRegular1")}</li>
            <li>{t("blogIstanbulChooseRegular2")}</li>
            <li>{t("blogIstanbulChooseRegular3")}</li>
          </ul>

          <h3>{t("blogIstanbulChooseMetroIf")}</h3>
          <ul>
            <li>{t("blogIstanbulChooseMetro1")}</li>
            <li>{t("blogIstanbulChooseMetro2")}</li>
            <li>{t("blogIstanbulChooseMetro3")}</li>
            <li>{t("blogIstanbulChooseMetro4")}</li>
          </ul>

          <h2 id="distances">{t("blogIstanbulDistances")}</h2>
          <p>{t("blogIstanbulDistancesP1")}</p>
          <ul>
            <li>{t("blogIstanbulDistTaksim")}</li>
            <li>{t("blogIstanbulDistSultanahmet")}</li>
            <li>{t("blogIstanbulDistKadikoy")}</li>
            <li>{t("blogIstanbulDistGalataport")}</li>
            <li>{t("blogIstanbulDistSabiha")}</li>
          </ul>

          <h2 id="tips">{t("blogIstanbulTips")}</h2>
          <ol>
            <li>{t("blogIstanbulTip1")}</li>
            <li>{t("blogIstanbulTip2")}</li>
            <li>{t("blogIstanbulTip3")}</li>
            <li>{t("blogIstanbulTip4")}</li>
            <li>{t("blogIstanbulTip5")}</li>
          </ol>

          <h2>{t("blogIstanbulConclusion")}</h2>
          <p>
            {t("blogIstanbulConclusionP1")} <Link to={getLocalizedPath("/istanbul-transfer")} className="text-primary hover:underline">{t("blogIstanbulTablePrivate")}</Link>.
          </p>
          <p>
            {t("blogIstanbulConclusionP2")} <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">{t("requestPrice")}</Link>.
          </p>
        </div>

        {/* CTA Section */}
        <BlogCTA destination="Istanbul" />

        {/* FAQ Section */}
        <section className="my-12">
          <h2 className="font-serif text-2xl font-bold mb-8">{t('frequentlyAskedQuestions')}</h2>
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
        <RelatedArticles currentArticleId="istanbul-airport-to-city-best-way" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default IstanbulAirportToCityGuide;
