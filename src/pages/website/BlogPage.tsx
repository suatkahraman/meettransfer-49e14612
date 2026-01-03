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

const BlogPage = () => {
  const { t, getLocalizedPath, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Blog posts with translation keys
  const blogPosts = useMemo(() => [
    {
      id: "istanbul-bursa-day-tour-guide",
      titleKey: "blogBursaTitle",
      descriptionKey: "blogBursaDesc",
      category: "Bursa",
      categoryKey: "bursa",
      readTime: 15,
      date: "2025-12-26",
      image: "/images/meet-transfer-vip-mercedes-vito.jpg",
    },
    {
      id: "dubai-airport-transfer-guide",
      titleKey: "blogDubaiTitle",
      descriptionKey: "blogDubaiDesc",
      category: "Dubai",
      categoryKey: "dubai",
      readTime: 14,
      date: "2024-12-26",
      image: "/images/meet-transfer-vip-mercedes-vito.jpg",
    },
    {
      id: "cyprus-airport-transfer-guide",
      titleKey: "blogCyprusTitle",
      descriptionKey: "blogCyprusDesc",
      category: "Cyprus",
      categoryKey: "cyprus",
      readTime: 15,
      date: "2024-12-26",
      image: "/images/meet-transfer-vclass-interior.jpg",
    },
    {
      id: "istanbul-airport-to-city-best-way",
      titleKey: "blogIstanbul1Title",
      descriptionKey: "blogIstanbul1Desc",
      category: "Istanbul",
      categoryKey: "istanbul",
      readTime: 12,
      date: "2024-12-15",
      image: "/images/meet-transfer-vclass-interior.jpg",
    },
    {
      id: "istanbul-airport-transfer-price-guide",
      titleKey: "blogIstanbul2Title",
      descriptionKey: "blogIstanbul2Desc",
      category: "Istanbul",
      categoryKey: "priceGuide",
      readTime: 10,
      date: "2024-12-10",
      image: "/images/meet-transfer-vip-mercedes-vito.jpg",
    },
    {
      id: "private-vs-taxi-transfer-turkey",
      titleKey: "blogPrivateTaxiTitle",
      descriptionKey: "blogPrivateTaxiDesc",
      category: "Travel Tips",
      categoryKey: "travelTips",
      readTime: 11,
      date: "2024-12-05",
      image: "/images/meet-transfer-vclass-interior.jpg",
    },
    {
      id: "antalya-airport-transfer-to-hotels",
      titleKey: "blogAntalyaTitle",
      descriptionKey: "blogAntalyaDesc",
      category: "Antalya",
      categoryKey: "antalya",
      readTime: 13,
      date: "2024-11-28",
      image: "/images/meet-transfer-vip-mercedes-vito.jpg",
    },
    {
      id: "is-private-transfer-worth-it-turkey",
      titleKey: "blogIsWorthItTitle",
      descriptionKey: "blogIsWorthItDesc",
      category: "Travel Tips",
      categoryKey: "travelTips",
      readTime: 14,
      date: "2024-11-20",
      image: "/images/meet-transfer-vclass-interior.jpg",
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
      const title = t(post.titleKey).toLowerCase();
      const description = t(post.descriptionKey).toLowerCase();
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
        keywords={t('blogPageKeywords')}
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
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={post.image} 
                        alt={t(post.titleKey)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {post.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                        {t(post.titleKey)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-3 mb-4">
                        {t(post.descriptionKey)}
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
              href="https://wa.me/905321748390?text=Hello, I would like to book a transfer."
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
