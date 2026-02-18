/**
 * Blog: Yolculuk Asistanınız Artık Yanınızda
 * Meet Transfer - Yapay Zeka ve Kesintisiz Rezervasyon Deneyimi
 */
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bot, Zap, MessageCircle, Car, CheckCircle2, Sparkles } from "lucide-react";
import aiChatImage from "@/assets/ai-chat-assistant.png";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";
import { useBlogT } from "@/components/blog/BlogLayout";

const TravelAssistantAISeamlessBooking = () => {
  const { t } = useBlogT();
  const { getLocalizedPath } = useLanguage();
  const { formatBlogDate } = useBlogDate();
  const navigate = useNavigate();

  const tocItems = [
    { id: "intro", title: t("blogTravelAsstTocIntro") },
    { id: "ai-section", title: t("blogTravelAsstTocAI") },
    { id: "booking-section", title: t("blogTravelAsstTocBooking") },
    { id: "conclusion", title: t("blogTravelAsstTocConclusion") },
    { id: "faq", title: t("frequentlyAskedQuestions") },
  ];

  const faqItems = [
    { question: t("blogTravelAsstFaq1Q"), answer: t("blogTravelAsstFaq1A") },
    { question: t("blogTravelAsstFaq2Q"), answer: t("blogTravelAsstFaq2A") },
    { question: t("blogTravelAsstFaq3Q"), answer: t("blogTravelAsstFaq3A") },
  ];

  const goToBook = () => navigate(getLocalizedPath("/"));

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogTravelAsstTitle")}
        description={t("blogTravelAsstDesc")}
        keywords="yapay zeka transfer, Gemini asistan, tek sayfa rezervasyon, Meet Transfer AI, kesintisiz rezervasyon"
        canonicalPath="/blog/travel-assistant-ai-seamless-booking"
        ogType="article"
        articlePublishedTime="2025-02-15"
        articleModifiedTime="2025-02-15"
        articleSection="Technology"
      />
      <SchemaOrg
        schemas={[
          {
            type: "Article",
            headline: t("blogTravelAsstH1"),
            description: t("blogTravelAsstDesc"),
            datePublished: "2025-02-15",
            dateModified: "2025-02-15",
            author: "Meet Transfer",
          },
          {
            type: "BreadcrumbList",
            items: [
              { name: t("breadcrumbHome"), url: "/" },
              { name: t("breadcrumbBlog"), url: "/blog" },
              { name: t("blogTravelAsstH1"), url: "/blog/travel-assistant-ai-seamless-booking" },
            ],
          },
          {
            type: "FAQPage",
            questions: faqItems.map((item) => ({ question: item.question, answer: item.answer })),
          },
        ]}
      />

      <article className="min-h-screen bg-background">
        <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full blur-3xl opacity-50" />
                <Sparkles className="w-32 h-32 md:w-48 md:h-48 text-primary relative z-10" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-12">
            <div className="container mx-auto">
              <Link
                to={getLocalizedPath("/blog")}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-3 md:mb-4 text-sm md:text-base"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("backToBlog")}
              </Link>

              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                  <Bot className="w-3 h-3 mr-1" />
                  {t("blogTravelAsstCategory")}
                </Badge>
                <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                  <span>{formatBlogDate("2025-02-15")}</span>
                  <span>8 {t("minRead")}</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4 leading-tight">
                {t("blogTravelAsstH1")}
              </h1>

              <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl">
                {t("blogTravelAsstSubtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid lg:grid-cols-[1fr_300px] gap-8 lg:gap-12">
            <div className="prose prose-sm md:prose-lg dark:prose-invert max-w-none">
              {/* Giriş */}
              <section id="intro" className="scroll-mt-20 md:scroll-mt-24">
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4 md:mb-6">
                  {t("blogTravelAsstIntroP1")}
                </p>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4 md:mb-6">
                  {t("blogTravelAsstIntroP2")}
                </p>
              </section>

              {/* Bölüm 1: Yapay Zeka ile Tanışın */}
              <section id="ai-section" className="scroll-mt-20 md:scroll-mt-24 mt-8 md:mt-12">
                <h2 className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-4 md:mb-6">
                  <Bot className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                  {t("blogTravelAsstSection1Title")}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4 md:mb-6">
                  {t("blogTravelAsstSection1P1")}
                </p>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4 md:mb-6">
                  {t("blogTravelAsstSection1P2")}
                </p>

                {/* Örnek etkileşim */}
                <Card className="my-6 md:my-8 border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">{t("blogTravelAsstExampleTitle")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 max-w-[85%]">
                        {t("blogTravelAsstExampleQ")}
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 max-w-[85%]">
                        {t("blogTravelAsstExampleA")}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                  {t("blogTravelAsstSection1Lang")}
                </p>

                <div className="relative my-6 md:my-8 rounded-xl md:rounded-2xl overflow-hidden shadow-lg">
                  <OptimizedBlogImage
                    src={aiChatImage}
                    alt={t("blogTravelAsstVisual1Alt")}
                    aspectRatio="square"
                    className="max-w-sm md:max-w-md mx-auto"
                  />
                </div>
              </section>

              {/* Bölüm 2: Tek Sayfa Rezervasyon */}
              <section id="booking-section" className="scroll-mt-20 md:scroll-mt-24 mt-8 md:mt-12">
                <h2 className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-4 md:mb-6">
                  <Zap className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                  {t("blogTravelAsstSection2Title")}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4 md:mb-6">
                  {t("blogTravelAsstSection2P1")}
                </p>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4 md:mb-6">
                  {t("blogTravelAsstSection2P2")}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 my-6 md:my-8">
                  <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                    <CardHeader className="p-4">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                        Book Now
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                      {t("blogTravelAsstStep1")}
                    </CardContent>
                  </Card>
                  <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                    <CardHeader className="p-4">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                        Get Quote
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                      {t("blogTravelAsstStep2")}
                    </CardContent>
                  </Card>
                  <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                    <CardHeader className="p-4">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                        Confirm
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                      {t("blogTravelAsstStep3")}
                    </CardContent>
                  </Card>
                </div>

                <ul className="space-y-2 my-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{t("blogTravelAsstSection2Benefit1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{t("blogTravelAsstSection2Benefit2")}</span>
                  </li>
                </ul>

                {/* Görsel 2: Tek sayfa akış placeholder */}
                <div className="my-8 rounded-xl border-2 border-dashed border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 p-8 text-center">
                  <Car className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                  <p className="text-sm font-medium text-foreground mb-1">{t("blogTravelAsstVisual2Alt")}</p>
                  <p className="text-xs text-muted-foreground">{t("blogTravelAsstVisual2Desc")}</p>
                </div>
              </section>

              {/* Sonuç */}
              <section id="conclusion" className="scroll-mt-20 md:scroll-mt-24 mt-8 md:mt-12">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                  {t("blogTravelAsstConclusionTitle")}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
                  {t("blogTravelAsstConclusionP1")}
                </p>
              </section>

              {/* CTA */}
              <div className="my-8 md:my-12 p-6 md:p-8 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 text-center">
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">{t("blogTravelAsstCTATitle")}</h3>
                <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">{t("blogTravelAsstCTADesc")}</p>
                <Button onClick={goToBook} size="lg" className="gap-2">
                  <Car className="w-4 h-4 md:w-5 md:h-5" />
                  {t("blogTravelAsstCTAButton")}
                </Button>
              </div>

              {/* FAQ */}
              <section id="faq" className="scroll-mt-20 md:scroll-mt-24 mt-8 md:mt-12">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">
                  {t("frequentlyAskedQuestions")}
                </h2>
                <div className="space-y-4">
                  {faqItems.map((item, index) => (
                    <Card key={index}>
                      <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-base md:text-lg">{item.question}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                        <p className="text-xs md:text-sm text-muted-foreground">{item.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              <ShareButtons title={t("blogTravelAsstH1")} className="mt-12" />
            </div>

            <aside className="hidden lg:block space-y-6">
              <div className="sticky top-24">
                <TableOfContents items={tocItems} />
                <BlogCTA />
              </div>
            </aside>
          </div>

          <RelatedArticles currentArticleId="travel-assistant-ai-seamless-booking" maxArticles={3} className="mt-16" />
        </div>
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default TravelAssistantAISeamlessBooking;
