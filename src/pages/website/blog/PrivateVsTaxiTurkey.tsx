import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, XCircle, Shield, Clock4, Wallet, Users } from "lucide-react";
import vitoVipStarlightPurple from "@/assets/vito-vip-starlight-purple.jpg";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";

const PrivateVsTaxiTurkey = () => {
  const { t, getLocalizedPath } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    { question: t("blogTaxiFaq1Q"), answer: t("blogTaxiFaq1A") },
    { question: t("blogTaxiFaq2Q"), answer: t("blogTaxiFaq2A") },
    { question: t("blogTaxiFaq3Q"), answer: t("blogTaxiFaq3A") },
    { question: t("blogTaxiFaq4Q"), answer: t("blogTaxiFaq4A") },
    { question: t("blogTaxiFaq5Q"), answer: t("blogTaxiFaq5A") },
    { question: t("blogTaxiFaq6Q"), answer: t("blogTaxiFaq6A") },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t('blogPrivateTaxiTitle')}
        description={t('blogPrivateTaxiDesc')}
        keywords="private transfer vs taxi Turkey 2025, Turkey airport transfer, private car Turkey, Turkish transport tips, airport transfer comparison, is private transfer worth it, Istanbul taxi vs private, Antalya taxi comparison, Turkey airport taxi safety"
        canonicalPath="/blog/private-vs-taxi-transfer-turkey"
        ogImage="https://meettransfer.app/og/private-transfer-worth-og.jpg"
        ogType="article"
        articlePublishedTime="2024-12-05"
        articleModifiedTime="2025-01-10"
        articleSection="Travel Tips"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t('blogPrivateTaxiH1'),
            description: t('blogPrivateTaxiDesc'),
            image: 'https://meettransfer.app/og/private-transfer-worth-og.jpg',
            datePublished: '2024-12-05',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '13',
            wordCount: 2000,
            keywords: ['private transfer vs taxi', 'Turkey airport transfer', 'Istanbul taxi', 'VIP transfer Turkey'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: t("breadcrumbHome"), url: '/' },
              { name: t("breadcrumbBlog"), url: '/blog' },
              { name: t("blogTaxiH1"), url: '/blog/private-vs-taxi-transfer-turkey' },
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

      <article className="max-w-4xl mx-auto px-3 sm:px-4 py-8 md:py-12">
        {/* Back to Blog */}
        <Link 
          to={getLocalizedPath("/blog")} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToBlog')}
        </Link>

        {/* Article Header */}
        <header className="mb-8 md:mb-12">
          <Badge variant="secondary" className="mb-3 md:mb-4">{t('travelTips')}</Badge>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
            {t('blogPrivateTaxiH1')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 md:mb-6">
            {t('blogPrivateTaxiIntro')}
          </p>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t("lastUpdated")}: {formatBlogDate("2025-01-10")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              11 {t('minRead')}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <ShareButtons title={t('blogPrivateTaxiH1')} className="mb-6 md:mb-8" />

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-lg md:rounded-xl mb-8 md:mb-12">
          <img 
            src={vitoVipStarlightPurple} 
            alt={t("blogTaxiHeroAlt")}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        {/* Table of Contents */}
        <TableOfContents items={[
          { id: "introduction", title: t("blogTaxiTocIntro") },
          { id: "quick-summary", title: t("blogTaxiTocQuickSummary") },
          { id: "safety-comparison", title: t("blogTaxiTocSafety") },
          { id: "comfort-experience", title: t("blogTaxiTocComfort") },
          { id: "price-comparison", title: t("blogTaxiTocPrice") },
          { id: "convenience-factor", title: t("blogTaxiTocConvenience") },
          { id: "best-choice", title: t("blogTaxiTocBestChoice") },
        ]} />

        <div className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none">
          <h2 id="introduction">{t("blogTaxiSectionIntro")}</h2>
          <p>{t("blogTaxiIntroP1")}</p>
          <p>{t("blogTaxiIntroP2")}</p>

          <h2 id="quick-summary">{t("blogTaxiSectionQuickSummary")}</h2>
          
          <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 my-6 md:my-8">
            <Card className="border-primary/30">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg">{t("blogTaxiPrivateTransfer")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t("blogTaxiPrivatePro1")}</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t("blogTaxiPrivatePro2")}</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t("blogTaxiPrivatePro3")}</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t("blogTaxiPrivatePro4")}</span>
                </div>
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="h-4 w-4" />
                  <span>{t("blogTaxiPrivateCon1")}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/30">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg">{t("blogTaxiRegularTransport")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t("blogTaxiRegularPro1")}</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t("blogTaxiRegularPro2")}</span>
                </div>
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="h-4 w-4" />
                  <span>{t("blogTaxiRegularCon1")}</span>
                </div>
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="h-4 w-4" />
                  <span>{t("blogTaxiRegularCon2")}</span>
                </div>
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="h-4 w-4" />
                  <span>{t("blogTaxiRegularCon3")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 id="safety-comparison">{t("blogTaxiSectionSafety")}</h2>
          
          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {t("blogTaxiSafetyFactors")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">{t("blogTaxiPrivateTransfer")}</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>{t("blogTaxiSafetyPrivate1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>{t("blogTaxiSafetyPrivate2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>{t("blogTaxiSafetyPrivate3")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>{t("blogTaxiSafetyPrivate4")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>{t("blogTaxiSafetyPrivate5")}</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">{t("blogTaxiRegularTransport")}</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>{t("blogTaxiSafetyRegular1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>{t("blogTaxiSafetyRegular2")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>{t("blogTaxiSafetyRegular3")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>{t("blogTaxiSafetyRegular4")}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <p><strong>{t("blogTaxiSafetyVerdict")}:</strong> {t("blogTaxiSafetyVerdictText")}</p>

          <h2 id="comfort-experience">{t("blogTaxiSectionComfort")}</h2>
          <p>{t("blogTaxiComfortIntro")}</p>

          <h3>{t("blogTaxiPrivateComfort")}</h3>
          <ul>
            <li><strong>{t("blogTaxiComfortVehicle")}:</strong> {t("blogTaxiComfortPrivateVehicle")}</li>
            <li><strong>{t("blogTaxiComfortClimate")}:</strong> {t("blogTaxiComfortPrivateClimate")}</li>
            <li><strong>{t("blogTaxiComfortLuggage")}:</strong> {t("blogTaxiComfortPrivateLuggage")}</li>
            <li><strong>{t("blogTaxiComfortAmenities")}:</strong> {t("blogTaxiComfortPrivateAmenities")}</li>
            <li><strong>{t("blogTaxiComfortCleanliness")}:</strong> {t("blogTaxiComfortPrivateCleanliness")}</li>
            <li><strong>{t("blogTaxiComfortSpace")}:</strong> {t("blogTaxiComfortPrivateSpace")}</li>
          </ul>

          <h3>{t("blogTaxiRegularComfort")}</h3>
          <ul>
            <li><strong>{t("blogTaxiComfortVehicle")}:</strong> {t("blogTaxiComfortRegularVehicle")}</li>
            <li><strong>{t("blogTaxiComfortClimate")}:</strong> {t("blogTaxiComfortRegularClimate")}</li>
            <li><strong>{t("blogTaxiComfortLuggage")}:</strong> {t("blogTaxiComfortRegularLuggage")}</li>
            <li><strong>{t("blogTaxiComfortAmenities")}:</strong> {t("blogTaxiComfortRegularAmenities")}</li>
            <li><strong>{t("blogTaxiComfortCleanliness")}:</strong> {t("blogTaxiComfortRegularCleanliness")}</li>
          </ul>

          <h2 id="price-comparison">{t("blogTaxiSectionPrice")}</h2>
          
          <div className="not-prose my-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  {t("blogTaxiPriceBreakdown")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-semibold mb-2">{t("blogTaxiPrivateTransfer")}</h4>
                    <p className="text-2xl font-bold text-primary mb-2">$55-65</p>
                    <p className="text-sm text-muted-foreground">{t("blogTaxiPrivatePriceNote")}</p>
                    <p className="text-sm text-muted-foreground mt-2">{t("blogTaxiPricePer2")}: ~$30</p>
                    <p className="text-sm text-muted-foreground">{t("blogTaxiPricePer4")}: ~$15</p>
                  </div>
                  <div className="p-4 bg-amber-500/5 rounded-lg">
                    <h4 className="font-semibold mb-2">{t("blogTaxiRegularTransport")}</h4>
                    <p className="text-2xl font-bold mb-2">{t("blogTaxiVariable")}</p>
                    <p className="text-sm text-muted-foreground">{t("blogTaxiRegularPriceNote")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <p><strong>{t("blogTaxiRealCostAnalysis")}:</strong> {t("blogTaxiRealCostText")}</p>
          <ul>
            <li>{t("blogTaxiRealCost1")}</li>
            <li>{t("blogTaxiRealCost2")}</li>
            <li>{t("blogTaxiRealCost3")}</li>
            <li>{t("blogTaxiRealCost4")}</li>
            <li>{t("blogTaxiRealCost5")}</li>
          </ul>

          <h2 id="convenience-factor">{t("blogTaxiSectionConvenience")}</h2>

          <div className="not-prose my-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock4 className="h-5 w-5" />
                  {t("blogTaxiTimeComparison")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">{t("blogTaxiPrivateExperience")}</h4>
                    <ol className="text-sm space-y-1 text-muted-foreground">
                      <li>1. {t("blogTaxiPrivateExp1")}</li>
                      <li>2. {t("blogTaxiPrivateExp2")}</li>
                      <li>3. {t("blogTaxiPrivateExp3")}</li>
                      <li>4. {t("blogTaxiPrivateExp4")}</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">{t("blogTaxiRegularExperience")}</h4>
                    <ol className="text-sm space-y-1 text-muted-foreground">
                      <li>1. {t("blogTaxiRegularExp1")}</li>
                      <li>2. {t("blogTaxiRegularExp2")}</li>
                      <li>3. {t("blogTaxiRegularExp3")}</li>
                      <li>4. {t("blogTaxiRegularExp4")}</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 id="best-choice">{t("blogTaxiSectionBestChoice")}</h2>

          <div className="not-prose my-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t("blogTaxiRecommendations")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-b pb-4">
                  <h4 className="font-semibold">{t("blogTaxiFamilies")}</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-primary">{t("blogTaxiChoose")}: {t("blogTaxiPrivateTransfer")}</strong> - {t("blogTaxiFamiliesText")}
                  </p>
                </div>
                <div className="border-b pb-4">
                  <h4 className="font-semibold">{t("blogTaxiBudget")}</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-amber-500">{t("blogTaxiChoose")}: {t("blogTaxiRegularOrMetro")}</strong> - {t("blogTaxiBudgetText")}
                  </p>
                </div>
                <div className="border-b pb-4">
                  <h4 className="font-semibold">{t("blogTaxiBusiness")}</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-primary">{t("blogTaxiChoose")}: {t("blogTaxiPrivateTransfer")}</strong> - {t("blogTaxiBusinessText")}
                  </p>
                </div>
                <div className="border-b pb-4">
                  <h4 className="font-semibold">{t("blogTaxiFirstTime")}</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-primary">{t("blogTaxiChoose")}: {t("blogTaxiPrivateTransfer")}</strong> - {t("blogTaxiFirstTimeText")}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">{t("blogTaxiGroups")}</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-primary">{t("blogTaxiChoose")}: {t("blogTaxiPrivateTransfer")}</strong> - {t("blogTaxiGroupsText")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>{t("blogTaxiImportantTips")}</h2>
          <p>{t("blogTaxiTipsIntro")}</p>
          <ul>
            <li><strong>{t("blogTaxiTip1Label")}:</strong> {t("blogTaxiTip1Text")}</li>
            <li><strong>{t("blogTaxiTip2Label")}:</strong> {t("blogTaxiTip2Text")}</li>
            <li><strong>{t("blogTaxiTip3Label")}:</strong> {t("blogTaxiTip3Text")}</li>
            <li><strong>{t("blogTaxiTip4Label")}:</strong> {t("blogTaxiTip4Text")}</li>
            <li><strong>{t("blogTaxiTip5Label")}:</strong> {t("blogTaxiTip5Text")}</li>
          </ul>

          <h2>{t("blogTaxiHonestVerdict")}</h2>
          <p>{t("blogTaxiVerdictIntro")}</p>
          <p><strong>{t("blogTaxiChoosePrivate")}</strong> {t("blogTaxiChoosePrivateIf")}:</p>
          <ul>
            <li>{t("blogTaxiPrivateIf1")}</li>
            <li>{t("blogTaxiPrivateIf2")}</li>
            <li>{t("blogTaxiPrivateIf3")}</li>
            <li>{t("blogTaxiPrivateIf4")}</li>
            <li>{t("blogTaxiPrivateIf5")}</li>
            <li>{t("blogTaxiPrivateIf6")}</li>
            <li>{t("blogTaxiPrivateIf7")}</li>
          </ul>
          <p><strong>{t("blogTaxiChooseRegular")}</strong> {t("blogTaxiChooseRegularIf")}:</p>
          <ul>
            <li>{t("blogTaxiRegularIf1")}</li>
            <li>{t("blogTaxiRegularIf2")}</li>
            <li>{t("blogTaxiRegularIf3")}</li>
          </ul>

          <h2>{t("blogTaxiConclusion")}</h2>
          <p>
            {t("blogTaxiConclusionP1")}
            <Link to={getLocalizedPath("/services")} className="text-primary hover:underline"> {t("blogTaxiPrivateTransferServices")}</Link> {t("blogTaxiConclusionP1End")}
          </p>
          <p>
            {t("blogTaxiConclusionP2")} <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">{t("blogTaxiRequestPrice")}</Link> {t("blogTaxiConclusionP2End")}
          </p>
        </div>

        {/* CTA Section */}
        <BlogCTA destination="Turkey" />

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
        <RelatedArticles currentArticleId="private-vs-taxi-transfer-turkey" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default PrivateVsTaxiTurkey;
