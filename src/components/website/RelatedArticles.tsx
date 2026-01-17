import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import OptimizedBlogImage from "./OptimizedBlogImage";

// Import hero images for Mardin, Midyat and Adana
import mardinHero from "@/assets/blog/mardin-transfer-hero.jpg";
import midyatHero from "@/assets/blog/midyat-transfer-hero.jpg";
import adanaHero from "@/assets/blog/adana-transfer-hero.jpg";

// Blog posts data - centralized for reuse
export const allBlogPosts = [
  // AI-Optimized Blog Posts for Search Engines & AI Crawlers
  {
    id: "vip-airport-transfer-turkey",
    title: "VIP Airport Transfer Turkey - Maybach, S-Class, VIP Vito",
    description: "Book VIP airport transfer in Turkey. Luxury Mercedes Maybach, S-Class fleet. Professional chauffeurs, meet & greet service.",
    category: "VIP Service",
    categoryKey: "vipService",
    readTime: 10,
    date: "2025-01-16",
    image: "/images/mercedes-maybach.jpg",
    isStatic: true,
  },
  {
    id: "intercity-transfer-turkey",
    title: "Intercity Transfer Turkey - Istanbul to Cappadocia Guide",
    description: "Private intercity transfers in Turkey. Istanbul to Cappadocia, Antalya to Pamukkale. Door-to-door service, scenic stops.",
    category: "Intercity",
    categoryKey: "intercity",
    readTime: 9,
    date: "2025-01-16",
    image: "/images/vito-cappadocia-balloon.jpg",
    isStatic: true,
  },
  {
    id: "luxury-maybach-transfer-turkey",
    title: "Mercedes Maybach Transfer Turkey - Ultimate Luxury",
    description: "Experience Mercedes Maybach transfers. Starlight ceiling, massage seats, champagne service. Premium chauffeur service.",
    category: "Ultra Luxury",
    categoryKey: "ultraLuxury",
    readTime: 8,
    date: "2025-01-16",
    image: "/images/maybach-interior.jpg",
    isStatic: true,
  },
  {
    id: "mardin-airport-transfer-guide",
    title: "Mardin Airport Transfer - Private VIP Shuttle to Midyat, Nusaybin",
    description: "Book private airport transfer from Mardin Airport to city center, Midyat, Deyrulzafaran Monastery. Mercedes fleet, meet & greet.",
    category: "Mardin",
    categoryKey: "mardin",
    readTime: 10,
    date: "2025-01-16",
    image: mardinHero,
    isStatic: true,
  },
  {
    id: "midyat-airport-transfer-guide",
    title: "Midyat Airport Transfer - Private Shuttle to Mor Gabriel Monastery",
    description: "Book private airport transfer to Midyat from Mardin Airport. Visit Mor Gabriel Monastery, stone houses, telkari workshops.",
    category: "Midyat",
    categoryKey: "midyat",
    readTime: 11,
    date: "2025-01-16",
    image: midyatHero,
    isStatic: true,
  },
  {
    id: "adana-airport-transfer-guide",
    title: "Adana Airport Transfer - Private VIP Shuttle to City Center, Mersin",
    description: "Book private airport transfer from Adana Şakirpaşa Airport to city center, Mersin, Tarsus, Antakya. Mercedes fleet, meet & greet service.",
    category: "Adana",
    categoryKey: "adana",
    readTime: 10,
    date: "2025-01-17",
    image: adanaHero,
    isStatic: true,
  },
  {
    id: "safe-night-transfer-turkey",
    title: "Safe Night Airport Transfer in Turkey - Complete Guide",
    description: "Book safe late-night airport transfers in Turkey with Meet Transfer. 24/7 service, GPS tracking, verified drivers, fixed prices.",
    category: "Travel Tips",
    categoryKey: "travelTips",
    readTime: 8,
    date: "2025-01-10",
    image: "/images/vito-vip-starlight-purple.jpg",
    isStatic: true,
  },
  {
    id: "family-airport-transfer-turkey",
    title: "Best Family Airport Transfer in Turkey - Free Child Seats",
    description: "Family-friendly airport transfers in Turkey with free baby seats, spacious vehicles, and patient drivers. Perfect for traveling with children.",
    category: "Travel Tips",
    categoryKey: "travelTips",
    readTime: 7,
    date: "2025-01-12",
    image: "/images/vito-exterior-black.jpg",
    isStatic: true,
  },
  {
    id: "business-travel-transfer-istanbul",
    title: "Executive Airport Transfer Istanbul - Business Travel Guide",
    description: "Premium executive airport transfers in Istanbul for business travelers. Corporate invoicing, Wi-Fi, Mercedes Maybach fleet.",
    category: "Istanbul",
    categoryKey: "istanbul",
    readTime: 6,
    date: "2025-01-14",
    image: "/images/mercedes-maybach.jpg",
    isStatic: true,
  },
  {
    id: "airport-transfer-booking-tips",
    title: "Airport Transfer Booking Tips for Turkey - Expert Guide",
    description: "Expert tips for booking airport transfers in Turkey. When to book, what to check, payment advice. Avoid common mistakes.",
    category: "Travel Tips",
    categoryKey: "travelTips",
    readTime: 8,
    date: "2025-01-15",
    image: "/images/vito-exterior-black.jpg",
    isStatic: true,
  },
  {
    id: "izmir-airport-transfer-best-service",
    titleKey: "blogIzmirBestTitle",
    descriptionKey: "blogIzmirBestDesc",
    category: "Izmir",
    categoryKey: "izmir",
    readTime: 10,
    date: "2025-01-16",
    image: "/images/vito-exterior-black.jpg",
  },
  {
    id: "cappadocia-airport-transfer-best-service",
    titleKey: "blogCappadociaBestTitle",
    descriptionKey: "blogCappadociaBestDesc",
    category: "Cappadocia",
    categoryKey: "cappadocia",
    readTime: 10,
    date: "2025-01-16",
    image: "/images/blog/cappadocia-transfer-hero.jpg",
  },
  {
    id: "bodrum-airport-transfer-best-service",
    titleKey: "blogBodrumBestTitle",
    descriptionKey: "blogBodrumBestDesc",
    category: "Bodrum",
    categoryKey: "bodrum",
    readTime: 10,
    date: "2025-01-16",
    image: "/images/vito-exterior-black.jpg",
  },
  {
    id: "antalya-airport-transfer-best-service",
    titleKey: "blogAntalyaBestTitle",
    descriptionKey: "blogAntalyaBestDesc",
    category: "Antalya",
    categoryKey: "antalya",
    readTime: 10,
    date: "2025-01-16",
    image: "/images/antalya-transfer-hero.jpg",
  },
  {
    id: "why-meet-transfer-trusted-company",
    title: "Why Meet Transfer is a Trusted Airport Transfer Company in Turkey",
    description: "Discover why Meet Transfer is Turkey's most trusted airport transfer company. 4.7-star Google rating, 50,000+ satisfied customers, licensed drivers, luxury Mercedes fleet.",
    category: "Company",
    categoryKey: "company",
    readTime: 12,
    date: "2025-01-15",
    image: "/images/vito-vip-starlight-purple.jpg",
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
    image: "/images/vito-vip-starlight-purple.jpg",
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
    image: "/images/vito-exterior-black.jpg",
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
    image: "/images/ai-chat-assistant.png",
  },
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
    id: "fethiye-airport-transfer-guide",
    titleKey: "blogFethiyeTitle",
    descriptionKey: "blogFethiyeDesc",
    category: "Fethiye",
    categoryKey: "fethiye",
    readTime: 14,
    date: "2025-01-12",
    image: "/images/meet-transfer-vip-mercedes-vito.jpg",
  },
  {
    id: "marmaris-airport-transfer-guide",
    titleKey: "blogMarmarisTitle",
    descriptionKey: "blogMarmarisDesc",
    category: "Marmaris",
    categoryKey: "marmaris",
    readTime: 14,
    date: "2025-01-12",
    image: "/images/meet-transfer-vclass-interior.jpg",
  },
  {
    id: "oludeniz-airport-transfer-guide",
    titleKey: "blogOludenizTitle",
    descriptionKey: "blogOludenizDesc",
    category: "Ölüdeniz",
    categoryKey: "oludeniz",
    readTime: 13,
    date: "2025-01-12",
    image: "/images/meet-transfer-vip-mercedes-vito.jpg",
  },
  {
    id: "aydin-airport-transfer-guide",
    titleKey: "blogAydinTitle",
    descriptionKey: "blogAydinDesc",
    category: "Aydın",
    categoryKey: "aydin",
    readTime: 14,
    date: "2025-01-12",
    image: "/images/meet-transfer-vclass-interior.jpg",
  },
  {
    id: "mugla-airport-transfer-guide",
    titleKey: "blogMuglaTitle",
    descriptionKey: "blogMuglaDesc",
    category: "Muğla",
    categoryKey: "mugla",
    readTime: 14,
    date: "2025-01-12",
    image: "/images/meet-transfer-vip-mercedes-vito.jpg",
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
              <OptimizedBlogImage
                src={post.image}
                alt={post.title || t(post.titleKey || '')}
                className="aspect-video"
                priority={false}
              />
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
