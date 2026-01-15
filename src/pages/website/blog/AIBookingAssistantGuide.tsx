import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Bot, Sparkles, Globe, CheckCircle2, MessageCircle, Zap, Shield, Clock4, Languages } from "lucide-react";
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

const AIBookingAssistantGuide = () => {
  const { t, getLocalizedPath } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    { question: t("blogAIAssistantFaq1Q"), answer: t("blogAIAssistantFaq1A") },
    { question: t("blogAIAssistantFaq2Q"), answer: t("blogAIAssistantFaq2A") },
    { question: t("blogAIAssistantFaq3Q"), answer: t("blogAIAssistantFaq3A") },
    { question: t("blogAIAssistantFaq4Q"), answer: t("blogAIAssistantFaq4A") },
    { question: t("blogAIAssistantFaq5Q"), answer: t("blogAIAssistantFaq5A") },
    { question: t("blogAIAssistantFaq6Q"), answer: t("blogAIAssistantFaq6A") },
  ];

  const aiFeatures = [
    {
      icon: Clock4,
      titleKey: "blogAIAssistantFeature1Title",
      descKey: "blogAIAssistantFeature1Desc",
    },
    {
      icon: Languages,
      titleKey: "blogAIAssistantFeature2Title",
      descKey: "blogAIAssistantFeature2Desc",
    },
    {
      icon: Zap,
      titleKey: "blogAIAssistantFeature3Title",
      descKey: "blogAIAssistantFeature3Desc",
    },
    {
      icon: Shield,
      titleKey: "blogAIAssistantFeature4Title",
      descKey: "blogAIAssistantFeature4Desc",
    },
  ];

  const comparisonData = [
    {
      feature: t("blogAIAssistantCompare1"),
      traditional: "5-10 min",
      aiAssistant: "< 30 sec",
    },
    {
      feature: t("blogAIAssistantCompare2"),
      traditional: "1-2",
      aiAssistant: "12+",
    },
    {
      feature: t("blogAIAssistantCompare3"),
      traditional: t("blogAIAssistantCompareLimited"),
      aiAssistant: "24/7",
    },
    {
      feature: t("blogAIAssistantCompare4"),
      traditional: t("blogAIAssistantCompareManual"),
      aiAssistant: t("blogAIAssistantCompareInstant"),
    },
    {
      feature: t("blogAIAssistantCompare5"),
      traditional: t("blogAIAssistantCompareNo"),
      aiAssistant: t("blogAIAssistantCompareYes"),
    },
  ];

  const scrollToAssistant = () => {
    const chatButton = document.querySelector('[data-chat-trigger]') as HTMLButtonElement;
    if (chatButton) {
      chatButton.click();
    }
  };

  const tocItems = [
    { id: "what-is-ai-assistant", title: t("blogAIAssistantToc1") },
    { id: "how-it-works", title: t("blogAIAssistantToc2") },
    { id: "key-features", title: t("blogAIAssistantToc3") },
    { id: "comparison", title: t("blogAIAssistantToc4") },
    { id: "benefits", title: t("blogAIAssistantToc5") },
    { id: "faq", title: t("frequentlyAskedQuestions") },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t('blogAIAssistantTitle')}
        description={t('blogAIAssistantDesc')}
        keywords="AI booking assistant, yapay zeka ile rezervasyon, AI transfer booking, instant price quote, automated booking, artificial intelligence travel, AI havalimanı transfer, chatbot booking, 24/7 booking assistant, multilingual booking, quick booking AI, smart travel assistant"
        canonicalPath="/blog/ai-booking-assistant-guide"
        ogImage="https://meettransfer.app/og/ai-assistant-og.jpg"
        ogType="article"
        articlePublishedTime="2025-01-15"
        articleModifiedTime="2025-01-15"
        articleSection="Technology"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          { type: 'AIBookingAssistant' },
          {
            type: 'Article',
            headline: t('blogAIAssistantH1'),
            description: t('blogAIAssistantDesc'),
            image: 'https://meettransfer.app/og/ai-assistant-og.jpg',
            datePublished: '2025-01-15',
            dateModified: '2025-01-15',
            author: 'Meet Transfer',
            readingTime: '10',
            wordCount: 1800,
            keywords: ['AI booking assistant', 'yapay zeka rezervasyon', 'AI transfer', 'instant booking', 'smart travel'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: t("breadcrumbHome"), url: '/' },
              { name: t("breadcrumbBlog"), url: '/blog' },
              { name: t("blogAIAssistantH1"), url: '/blog/ai-booking-assistant-guide' },
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

      {/* Hero Section */}
      <article className="min-h-screen bg-background">
        <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full blur-3xl opacity-50 animate-pulse" />
                <Bot className="w-32 h-32 md:w-48 md:h-48 text-primary relative z-10" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="container mx-auto">
              <Link 
                to={getLocalizedPath("/blog")} 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("backToBlog")}
              </Link>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Bot className="w-3 h-3 mr-1" />
                  {t("blogAIAssistantCategory")}
                </Badge>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatBlogDate("2025-01-15")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    10 {t("minRead")}
                  </span>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
                {t("blogAIAssistantH1")}
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl">
                {t("blogAIAssistantSubtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-[1fr_300px] gap-12">
            {/* Main Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              
              {/* What is AI Assistant */}
              <section id="what-is-ai-assistant" className="scroll-mt-24">
                <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-foreground mb-6">
                  <Bot className="w-8 h-8 text-primary" />
                  {t("blogAIAssistantSection1Title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t("blogAIAssistantSection1P1")}
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t("blogAIAssistantSection1P2")}
                </p>
                
                <div className="relative my-8 rounded-2xl overflow-hidden shadow-xl">
                  <img 
                    src={aiChatImage} 
                    alt={t("blogAIAssistantImageAlt")}
                    className="w-full max-w-md mx-auto"
                    loading="lazy"
                  />
                </div>
              </section>

              {/* How It Works */}
              <section id="how-it-works" className="scroll-mt-24 mt-12">
                <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-foreground mb-6">
                  <Sparkles className="w-8 h-8 text-primary" />
                  {t("blogAIAssistantSection2Title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t("blogAIAssistantSection2P1")}
                </p>
                
                <div className="grid md:grid-cols-3 gap-6 my-8">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
                        {t("blogAIAssistantStep1Title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{t("blogAIAssistantStep1Desc")}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
                        {t("blogAIAssistantStep2Title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{t("blogAIAssistantStep2Desc")}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</span>
                        {t("blogAIAssistantStep3Title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{t("blogAIAssistantStep3Desc")}</p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Key Features */}
              <section id="key-features" className="scroll-mt-24 mt-12">
                <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-foreground mb-6">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                  {t("blogAIAssistantSection3Title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t("blogAIAssistantSection3P1")}
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 my-8">
                  {aiFeatures.map((feature, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <feature.icon className="w-6 h-6 text-primary" />
                          {t(feature.titleKey)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{t(feature.descKey)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Comparison */}
              <section id="comparison" className="scroll-mt-24 mt-12">
                <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-foreground mb-6">
                  <Zap className="w-8 h-8 text-primary" />
                  {t("blogAIAssistantSection4Title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t("blogAIAssistantSection4P1")}
                </p>
                
                <div className="overflow-x-auto my-8">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-4 text-left font-semibold">{t("blogAIAssistantTableFeature")}</th>
                        <th className="p-4 text-left font-semibold">{t("blogAIAssistantTableTraditional")}</th>
                        <th className="p-4 text-left font-semibold text-primary">{t("blogAIAssistantTableAI")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, index) => (
                        <tr key={index} className="border-b border-border">
                          <td className="p-4">{row.feature}</td>
                          <td className="p-4 text-muted-foreground">{row.traditional}</td>
                          <td className="p-4 text-primary font-medium">{row.aiAssistant}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Benefits */}
              <section id="benefits" className="scroll-mt-24 mt-12">
                <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-foreground mb-6">
                  <Globe className="w-8 h-8 text-primary" />
                  {t("blogAIAssistantSection5Title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t("blogAIAssistantSection5P1")}
                </p>
                
                <ul className="space-y-4 my-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 shrink-0" />
                    <span className="text-muted-foreground">{t("blogAIAssistantBenefit1")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 shrink-0" />
                    <span className="text-muted-foreground">{t("blogAIAssistantBenefit2")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 shrink-0" />
                    <span className="text-muted-foreground">{t("blogAIAssistantBenefit3")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 shrink-0" />
                    <span className="text-muted-foreground">{t("blogAIAssistantBenefit4")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 shrink-0" />
                    <span className="text-muted-foreground">{t("blogAIAssistantBenefit5")}</span>
                  </li>
                </ul>
              </section>

              {/* CTA */}
              <div className="my-12 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 text-center">
                <h3 className="text-2xl font-bold text-foreground mb-4">{t("blogAIAssistantCTATitle")}</h3>
                <p className="text-muted-foreground mb-6">{t("blogAIAssistantCTADesc")}</p>
                <Button onClick={scrollToAssistant} size="lg" className="gap-2">
                  <MessageCircle className="w-5 h-5" />
                  {t("blogAIAssistantCTAButton")}
                </Button>
              </div>

              {/* FAQ */}
              <section id="faq" className="scroll-mt-24 mt-12">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                  {t("frequentlyAskedQuestions")}
                </h2>
                <div className="space-y-6">
                  {faqItems.map((item, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{item.question}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{item.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              <ShareButtons title={t("blogAIAssistantH1")} className="mt-12" />
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <TableOfContents items={tocItems} />
              <BlogCTA />
            </aside>
          </div>

          <RelatedArticles 
            currentArticleId="ai-booking-assistant-guide" 
            maxArticles={3}
            className="mt-16"
          />
        </div>
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default AIBookingAssistantGuide;
