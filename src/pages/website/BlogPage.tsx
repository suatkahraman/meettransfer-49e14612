import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const blogPosts = [
  {
    id: "istanbul-airport-to-city-best-way",
    title: "Best Way to Get from Istanbul Airport to City Center",
    description: "Complete guide to Istanbul Airport transportation options. Compare private transfers, taxis, metro, and buses. Find the safest, fastest, and most comfortable way to reach Taksim, Sultanahmet, or your hotel.",
    category: "Istanbul",
    readTime: "12 min read",
    date: "2024-12-15",
    image: "/images/meet-transfer-vclass-interior.jpg",
  },
  {
    id: "istanbul-airport-transfer-price-guide",
    title: "Istanbul Airport Transfer Price Guide 2025",
    description: "Updated pricing for Istanbul Airport transfers. Compare costs for private VIP transfers, taxis, and shuttles. Learn about fixed pricing, hidden fees, and how to get the best value for your airport transfer.",
    category: "Price Guide",
    readTime: "10 min read",
    date: "2024-12-10",
    image: "/images/meet-transfer-vip-mercedes-vito.jpg",
  },
  {
    id: "private-vs-taxi-transfer-turkey",
    title: "Private Transfer vs Taxi in Turkey: Which is Better?",
    description: "Honest comparison of private airport transfers and regular taxis in Turkey. We analyze safety, comfort, pricing, and reliability to help you make the best choice for your trip.",
    category: "Travel Tips",
    readTime: "11 min read",
    date: "2024-12-05",
    image: "/images/meet-transfer-vclass-interior.jpg",
  },
  {
    id: "antalya-airport-transfer-to-hotels",
    title: "Antalya Airport Transfer to Hotels: Complete Guide",
    description: "Everything you need to know about getting from Antalya Airport to your hotel. Covers Lara, Belek, Side, Kemer, and Alanya. Pricing, booking tips, and what to expect from your transfer.",
    category: "Antalya",
    readTime: "13 min read",
    date: "2024-11-28",
    image: "/images/meet-transfer-vip-mercedes-vito.jpg",
  },
  {
    id: "is-private-transfer-worth-it-turkey",
    title: "Is Private Transfer Worth It in Turkey?",
    description: "We break down the real costs and benefits of private airport transfers in Turkey. From safety to convenience, discover why thousands of travelers choose VIP transfers over other options.",
    category: "Travel Tips",
    readTime: "14 min read",
    date: "2024-11-20",
    image: "/images/meet-transfer-vclass-interior.jpg",
  },
];

const BlogPage = () => {
  const { t, getLocalizedPath } = useLanguage();

  const faqItems = [
    {
      question: "How often do you publish new blog posts?",
      answer: "We publish new articles weekly, covering airport transfer tips, destination guides, and travel advice for Turkey."
    },
    {
      question: "Can I request a specific blog topic?",
      answer: "Absolutely! Contact us via WhatsApp or email with your topic suggestions. We love hearing from our readers."
    },
    {
      question: "Are the prices mentioned in blog posts accurate?",
      answer: "We update our price guides regularly. For the most accurate pricing, please request a quote through our booking form."
    },
    {
      question: "Do you have guides for cities other than Istanbul?",
      answer: "Yes! We cover all major Turkish destinations including Antalya, Bodrum, Dalaman, Izmir, and Cappadocia."
    }
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Turkey Airport Transfer Blog | Travel Tips & Guides | Meet Transfer"
        description="Expert travel tips, airport transfer guides, and destination insights for Turkey. Learn about Istanbul, Antalya, Bodrum transfers. Updated pricing and booking advice."
        keywords="Turkey travel blog, Istanbul airport guide, Antalya transfer tips, Turkey travel advice, airport transfer Turkey, VIP transfer blog"
        canonicalPath="/blog"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
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
            Travel Insights & Tips
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Turkey Airport Transfer Blog
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Expert guides, pricing tips, and destination insights to help you plan the perfect 
            airport transfer experience in Turkey. From Istanbul to Antalya and beyond.
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Link 
                key={post.id} 
                to={getLocalizedPath(`/blog/${post.id}`)}
                className="group"
              >
                <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
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
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3 mb-4">
                      {post.description}
                    </CardDescription>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to Book Your Transfer?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Get a personalized quote for your airport transfer. Our team responds within minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/book")}>
              <Button size="lg" variant="accent" className="gap-2">
                Request Your Price
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a 
              href="https://wa.me/905321748390?text=Hello, I would like to book a transfer."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="gap-2">
                WhatsApp Booking
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
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
