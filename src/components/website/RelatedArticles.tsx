import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

// Blog posts data - centralized for reuse
export const allBlogPosts = [
  {
    id: "cappadocia-airport-transfer-guide",
    titleKey: "blogCappadociaTitle",
    descriptionKey: "blogCappadociaDesc",
    category: "Cappadocia",
    categoryKey: "cappadocia",
    readTime: 18,
    date: "2025-01-10",
    image: "/images/meet-transfer-vip-mercedes-vito.jpg",
  },
  {
    id: "istanbul-bursa-day-tour-guide",
    titleKey: "blogBursaTitle",
    descriptionKey: "blogBursaDesc",
    category: "Bursa",
    categoryKey: "bursa",
    readTime: 18,
    date: "2025-01-10",
    image: "/images/meet-transfer-vip-mercedes-vito.jpg",
  },
  {
    id: "dubai-airport-transfer-guide",
    titleKey: "blogDubaiTitle",
    descriptionKey: "blogDubaiDesc",
    category: "Dubai",
    categoryKey: "dubai",
    readTime: 16,
    date: "2025-01-10",
    image: "/images/meet-transfer-vip-mercedes-vito.jpg",
  },
  {
    id: "cyprus-airport-transfer-guide",
    titleKey: "blogCyprusTitle",
    descriptionKey: "blogCyprusDesc",
    category: "Cyprus",
    categoryKey: "cyprus",
    readTime: 17,
    date: "2025-01-10",
    image: "/images/meet-transfer-vclass-interior.jpg",
  },
  {
    id: "istanbul-airport-to-city-best-way",
    titleKey: "blogIstanbul1Title",
    descriptionKey: "blogIstanbul1Desc",
    category: "Istanbul",
    categoryKey: "istanbul",
    readTime: 14,
    date: "2025-01-10",
    image: "/images/meet-transfer-vclass-interior.jpg",
  },
  {
    id: "istanbul-airport-transfer-price-guide",
    titleKey: "blogIstanbul2Title",
    descriptionKey: "blogIstanbul2Desc",
    category: "Istanbul",
    categoryKey: "priceGuide",
    readTime: 12,
    date: "2025-01-10",
    image: "/images/meet-transfer-vip-mercedes-vito.jpg",
  },
  {
    id: "private-vs-taxi-transfer-turkey",
    titleKey: "blogPrivateTaxiTitle",
    descriptionKey: "blogPrivateTaxiDesc",
    category: "Travel Tips",
    categoryKey: "travelTips",
    readTime: 13,
    date: "2025-01-10",
    image: "/images/meet-transfer-vclass-interior.jpg",
  },
  {
    id: "antalya-airport-transfer-to-hotels",
    titleKey: "blogAntalyaTitle",
    descriptionKey: "blogAntalyaDesc",
    category: "Antalya",
    categoryKey: "antalya",
    readTime: 15,
    date: "2025-01-10",
    image: "/images/meet-transfer-vip-mercedes-vito.jpg",
  },
  {
    id: "is-private-transfer-worth-it-turkey",
    titleKey: "blogIsWorthItTitle",
    descriptionKey: "blogIsWorthItDesc",
    category: "Travel Tips",
    categoryKey: "travelTips",
    readTime: 16,
    date: "2025-01-10",
    image: "/images/meet-transfer-vclass-interior.jpg",
  },
  {
    id: "frankfurt-airport-transfer-guide",
    titleKey: "blogFrankfurtTitle",
    descriptionKey: "blogFrankfurtDesc",
    category: "Frankfurt",
    categoryKey: "frankfurt",
    readTime: 15,
    date: "2025-01-14",
    image: "/images/meet-transfer-vip-mercedes-vito.jpg",
  },
  {
    id: "athens-airport-transfer-guide",
    titleKey: "blogAthensTitle",
    descriptionKey: "blogAthensDesc",
    category: "Athens",
    categoryKey: "athens",
    readTime: 16,
    date: "2025-01-14",
    image: "/images/meet-transfer-vclass-interior.jpg",
  },
];

interface RelatedArticlesProps {
  currentArticleId: string;
  maxArticles?: number;
  className?: string;
}

const RelatedArticles = ({ 
  currentArticleId, 
  maxArticles = 3,
  className = ""
}: RelatedArticlesProps) => {
  const { t, getLocalizedPath, language } = useLanguage();

  // Get current article's category
  const currentArticle = allBlogPosts.find(post => post.id === currentArticleId);
  const currentCategory = currentArticle?.category;

  // Get related articles: same category first, then others
  const relatedArticles = allBlogPosts
    .filter(post => post.id !== currentArticleId)
    .sort((a, b) => {
      // Prioritize same category
      if (a.category === currentCategory && b.category !== currentCategory) return -1;
      if (b.category === currentCategory && a.category !== currentCategory) return 1;
      // Then sort by date
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, maxArticles);

  if (relatedArticles.length === 0) return null;

  return (
    <section className={`my-12 ${className}`}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif text-2xl font-bold">{t("relatedArticles")}</h2>
        <Link 
          to={getLocalizedPath("/blog")}
          className="text-primary hover:underline text-sm flex items-center gap-1"
        >
          {t("viewAllArticles")}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {relatedArticles.map((post) => (
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
                <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {t(post.titleKey)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 mb-3 text-sm">
                  {t(post.descriptionKey)}
                </CardDescription>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
    </section>
  );
};

export default RelatedArticles;
