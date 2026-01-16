import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock, Search, X } from "lucide-react";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getWhatsAppUrl } from "@/lib/contact";
import BlogHourlyRentalPromo from "@/components/website/BlogHourlyRentalPromo";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";
import aiChatImage from "@/assets/ai-chat-assistant.png";

// Import blog hero images
import cappadociaHero from "@/assets/blog/cappadocia-transfer-hero.jpg";
import bursaHero from "@/assets/blog/bursa-day-tour-hero.jpg";
import dubaiHero from "@/assets/blog/dubai-transfer-hero.jpg";
import cyprusHero from "@/assets/blog/cyprus-transfer-hero.jpg";
import istanbulCityHero from "@/assets/blog/istanbul-airport-city-hero.jpg";
import istanbulTransferHero from "@/assets/blog/istanbul-transfer-hero.jpg";
import vitoVipStarlightPurple from "@/assets/vito-vip-starlight-purple.jpg";
import antalyaHero from "@/assets/blog/antalya-transfer-hero.jpg";
import privateWorthHero from "@/assets/blog/private-transfer-worth-hero.jpg";
import fethiyeHero from "@/assets/blog/fethiye-transfer-hero.jpg";
import marmarisHero from "@/assets/blog/marmaris-transfer-hero.jpg";
import oludenizHero from "@/assets/blog/oludeniz-transfer-hero.jpg";
import aydinHero from "@/assets/blog/aydin-transfer-hero.jpg";
import muglaHero from "@/assets/blog/mugla-transfer-hero.jpg";
import frankfurtHero from "@/assets/blog/frankfurt-transfer-hero.jpg";
import athensHero from "@/assets/blog/athens-transfer-hero.jpg";
import vitoExteriorBlack from "@/assets/vito-exterior-black.jpg";

const BlogPage = () => {
  const { t, getLocalizedPath, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Blog posts with translation keys - Updated for 2025 SEO
  const blogPosts = useMemo(() => [
    // AI-Optimized Blog Posts for Search Engines & AI Crawlers
    {
      id: "izmir-airport-transfer-best-service",
      titleKey: "blogIzmirBestTitle",
      descriptionKey: "blogIzmirBestDesc",
      category: t("blogIzmirBestCategory") || "Izmir",
      categoryKey: "izmir",
      readTime: 10,
      date: "2025-01-16",
      image: vitoExteriorBlack,
      isStatic: false,
    },
    {
      id: "cappadocia-airport-transfer-best-service",
      titleKey: "blogCappadociaBestTitle",
      descriptionKey: "blogCappadociaBestDesc",
      category: t("blogCappadociaBestCategory") || "Cappadocia",
      categoryKey: "cappadocia",
      readTime: 10,
      date: "2025-01-16",
      image: cappadociaHero,
      isStatic: false,
    },
    {
      id: "bodrum-airport-transfer-best-service",
      titleKey: "blogBodrumBestTitle",
      descriptionKey: "blogBodrumBestDesc",
      category: t("blogBodrumBestCategory") || "Bodrum",
      categoryKey: "bodrum",
      readTime: 10,
      date: "2025-01-16",
      image: vitoExteriorBlack,
      isStatic: false,
    },
    {
      id: "antalya-airport-transfer-best-service",
      titleKey: "blogAntalyaBestTitle",
      descriptionKey: "blogAntalyaBestDesc",
      category: t("blogAntalyaBestCategory") || "Antalya",
      categoryKey: "antalya",
      readTime: 10,
      date: "2025-01-16",
      image: antalyaHero,
      isStatic: false,
    },
    {
      id: "why-meet-transfer-trusted-company",
      title: "Why Meet Transfer is a Trusted Airport Transfer Company in Turkey",
      description: "Discover why Meet Transfer is Turkey's most trusted airport transfer company. 4.7-star Google rating, 50,000+ satisfied customers, licensed drivers, luxury Mercedes fleet.",
      category: "Company",
      categoryKey: "company",
      readTime: 12,
      date: "2025-01-15",
      image: vitoVipStarlightPurple,
      isStatic: true,
    },
    {
      id: "best-vip-transfer-istanbul-review",
      title: "Best VIP Airport Transfer in Istanbul – Meet Transfer Review 2025",
      description: "Discover why Meet Transfer offers the best VIP airport transfer in Istanbul. Mercedes Maybach, VIP Vito with starlight ceiling, 4.7★ rated. Real customer reviews.",
      category: "Istanbul",
      categoryKey: "istanbul",
      readTime: 10,
      date: "2025-01-15",
      image: vitoVipStarlightPurple,
      isStatic: true,
    },
    {
      id: "how-to-choose-reliable-transfer-turkey",
      title: "How to Choose a Reliable Airport Transfer in Turkey – Complete Guide 2025",
      description: "Learn how to choose a reliable airport transfer in Turkey. Expert checklist, red flags to avoid, comparison of taxis vs private transfers.",
      category: "Travel Tips",
      categoryKey: "travelTips",
      readTime: 11,
      date: "2025-01-15",
      image: vitoVipStarlightPurple,
      isStatic: true,
    },
    {
      id: "ai-booking-assistant-guide",
      titleKey: "blogAIAssistantTitle",
      descriptionKey: "blogAIAssistantDesc",
      category: "Technology",
      categoryKey: "technology",
      readTime: 10,
      date: "2025-01-15",
      image: aiChatImage,
    },
    {
      id: "cappadocia-airport-transfer-guide",
      titleKey: "blogCappadociaTitle",
      descriptionKey: "blogCappadociaDesc",
      category: "Cappadocia",
      categoryKey: "cappadocia",
      readTime: 18,
      date: "2025-01-10",
      image: cappadociaHero,
    },
    {
      id: "istanbul-bursa-day-tour-guide",
      titleKey: "blogBursaTitle",
      descriptionKey: "blogBursaDesc",
      category: "Bursa",
      categoryKey: "bursa",
      readTime: 18,
      date: "2025-01-10",
      image: bursaHero,
    },
    {
      id: "dubai-airport-transfer-guide",
      titleKey: "blogDubaiTitle",
      descriptionKey: "blogDubaiDesc",
      category: "Dubai",
      categoryKey: "dubai",
      readTime: 16,
      date: "2025-01-10",
      image: dubaiHero,
    },
    {
      id: "cyprus-airport-transfer-guide",
      titleKey: "blogCyprusTitle",
      descriptionKey: "blogCyprusDesc",
      category: "Cyprus",
      categoryKey: "cyprus",
      readTime: 17,
      date: "2025-01-10",
      image: cyprusHero,
    },
    {
      id: "istanbul-airport-to-city-best-way",
      titleKey: "blogIstanbul1Title",
      descriptionKey: "blogIstanbul1Desc",
      category: "Istanbul",
      categoryKey: "istanbul",
      readTime: 14,
      date: "2025-01-10",
      image: istanbulCityHero,
    },
    {
      id: "istanbul-airport-transfer-price-guide",
      titleKey: "blogIstanbul2Title",
      descriptionKey: "blogIstanbul2Desc",
      category: "Istanbul",
      categoryKey: "priceGuide",
      readTime: 12,
      date: "2025-01-10",
      image: istanbulTransferHero,
    },
    {
      id: "private-vs-taxi-transfer-turkey",
      titleKey: "blogPrivateTaxiTitle",
      descriptionKey: "blogPrivateTaxiDesc",
      category: "Travel Tips",
      categoryKey: "travelTips",
      readTime: 13,
      date: "2025-01-10",
      image: vitoVipStarlightPurple,
    },
    {
      id: "antalya-airport-transfer-to-hotels",
      titleKey: "blogAntalyaTitle",
      descriptionKey: "blogAntalyaDesc",
      category: "Antalya",
      categoryKey: "antalya",
      readTime: 15,
      date: "2025-01-10",
      image: antalyaHero,
    },
    {
      id: "is-private-transfer-worth-it-turkey",
      titleKey: "blogIsWorthItTitle",
      descriptionKey: "blogIsWorthItDesc",
      category: "Travel Tips",
      categoryKey: "travelTips",
      readTime: 16,
      date: "2025-01-10",
      image: privateWorthHero,
    },
    {
      id: "fethiye-airport-transfer-guide",
      titleKey: "blogFethiyeTitle",
      descriptionKey: "blogFethiyeDesc",
      category: "Fethiye",
      categoryKey: "fethiye",
      readTime: 14,
      date: "2025-01-12",
      image: fethiyeHero,
    },
    {
      id: "marmaris-airport-transfer-guide",
      titleKey: "blogMarmarisTitle",
      descriptionKey: "blogMarmarisDesc",
      category: "Marmaris",
      categoryKey: "marmaris",
      readTime: 14,
      date: "2025-01-12",
      image: marmarisHero,
    },
    {
      id: "oludeniz-airport-transfer-guide",
      titleKey: "blogOludenizTitle",
      descriptionKey: "blogOludenizDesc",
      category: "Ölüdeniz",
      categoryKey: "oludeniz",
      readTime: 13,
      date: "2025-01-12",
      image: oludenizHero,
    },
    {
      id: "aydin-airport-transfer-guide",
      titleKey: "blogAydinTitle",
      descriptionKey: "blogAydinDesc",
      category: "Aydın",
      categoryKey: "aydin",
      readTime: 14,
      date: "2025-01-12",
      image: aydinHero,
    },
    {
      id: "mugla-airport-transfer-guide",
      titleKey: "blogMuglaTitle",
      descriptionKey: "blogMuglaDesc",
      category: "Muğla",
      categoryKey: "mugla",
      readTime: 14,
      date: "2025-01-12",
      image: muglaHero,
    },
    {
      id: "frankfurt-airport-transfer-guide",
      titleKey: "blogFrankfurtTitle",
      descriptionKey: "blogFrankfurtDesc",
      category: "Frankfurt",
      categoryKey: "frankfurt",
      readTime: 15,
      date: "2025-01-14",
      image: frankfurtHero,
    },
    {
      id: "athens-airport-transfer-guide",
      titleKey: "blogAthensTitle",
      descriptionKey: "blogAthensDesc",
      category: "Athens",
      categoryKey: "athens",
      readTime: 16,
      date: "2025-01-14",
      image: athensHero,
    },
  ], []);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(blogPosts.map(p => p.category))];
    return cats;
  }, [blogPosts]);

  // Filter posts based on search and category
  const filteredPosts = useMemo(() => {
    return blogPosts.filter(post => {
      // Handle both static posts (with title/description) and translated posts (with titleKey/descriptionKey)
      const title = post.isStatic ? (post.title || '').toLowerCase() : t(post.titleKey).toLowerCase();
      const description = post.isStatic ? (post.description || '').toLowerCase() : t(post.descriptionKey).toLowerCase();
      const matchesSearch = searchQuery === "" || 
        title.includes(searchQuery.toLowerCase()) ||
        description.includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === null || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [blogPosts, searchQuery, selectedCategory, t]);

  const faqItems = [
    {
      question: t('blogFaq1Question'),
      answer: t('blogFaq1Answer')
    },
    {
      question: t('blogFaq2Question'),
      answer: t('blogFaq2Answer')
    },
    {
      question: t('blogFaq3Question'),
      answer: t('blogFaq3Answer')
    },
    {
      question: t('blogFaq4Question'),
      answer: t('blogFaq4Answer')
    }
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t('blogPageTitle')}
        description={t('blogPageDesc')}
        keywords={`${t('blogPageKeywords')}, Turkey airport transfer 2025, Istanbul transfer guide, Antalya transfer tips, Dubai VIP transfer, Cyprus airport taxi, Bodrum transfer, Cappadocia transfer, Turkey travel tips`}
        canonicalPath="/blog"
        ogImage="https://meettransfer.app/images/meet-transfer-vclass-interior.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'BreadcrumbList',
            items: [
              { name: t('home'), url: '/' },
              { name: t('blog'), url: '/blog' },
            ],
          },
          {
            type: 'FAQPage',
            questions: faqItems.map(item => ({
              question: item.question,
              answer: item.answer
            }))
          },
          {
            type: 'Article',
            headline: t('blogHeroTitle'),
            description: t('blogPageDesc'),
            image: 'https://meettransfer.app/images/meet-transfer-vclass-interior.jpg',
            datePublished: '2024-11-01',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '5',
          }
        ]}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/10 to-background py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            {t('travelTips')}
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {t('blogHeroTitle')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('blogHeroDesc')}
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 px-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('searchArticles')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                {t('allCategories')}
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mt-4 text-center md:text-left">
            {t('showingResults').replace('{count}', filteredPosts.length.toString())}
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">{t('noArticlesFound')}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
              >
                {t('clearFilters')}
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Link 
                  key={post.id} 
                  to={getLocalizedPath(`/blog/${post.id}`)}
                  className="group"
                >
                  <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50">
                    <OptimizedBlogImage
                      src={post.image}
                      alt={post.isStatic ? (post.title || '') : t(post.titleKey || '')}
                      className="aspect-video"
                      priority={false}
                    />
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {post.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          {t('updatedForYear').replace('{year}', new Date(post.date).getFullYear().toString())}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                        {post.isStatic ? post.title : t(post.titleKey)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-3 mb-4">
                        {post.isStatic ? post.description : t(post.descriptionKey)}
                      </CardDescription>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.date).toLocaleDateString(language === 'TR' ? 'tr-TR' : language === 'DE' ? 'de-DE' : language === 'FR' ? 'fr-FR' : 'en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readTime} {t('minRead')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Hourly Rental Promo */}
      <BlogHourlyRentalPromo />

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            {t('readyToBookTransfer')}
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            {t('getInstantQuote')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/book")}>
              <Button size="lg" variant="accent" className="gap-2">
                {t('requestPrice')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a 
              href={getWhatsAppUrl("Hello, I would like to book a transfer.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="gap-2">
                {t('getPriceViaWhatsApp')}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-center mb-12">
            {t('frequentlyAskedQuestions')}
          </h2>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-border pb-6 last:border-0">
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </WebsiteLayout>
  );
};

export default BlogPage;
