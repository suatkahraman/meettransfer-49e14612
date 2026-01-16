import { useLanguage } from "@/contexts/LanguageContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ChevronRight, Star, Crown, Car, Sparkles, Shield, Clock, Users, CheckCircle, Award, Zap } from "lucide-react";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import images
import vitoVipStarlightPurple from "@/assets/vito-vip-starlight-purple.jpg";
import maybachInterior from "@/assets/mercedes-maybach-interior.jpg";

const BestVIPTransferIstanbul = () => {
  const { t, getLocalizedPath } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    {
      question: "What makes Meet Transfer the best VIP transfer in Istanbul?",
      answer: "Meet Transfer stands out with our exclusive Mercedes fleet (VIP Vito, Maybach, S-Class), professional chauffeurs, 4.9-star Google rating, transparent pricing, and personalized service. Our VIP vehicles feature starlight ceilings, premium leather, privacy glass, and complimentary refreshments."
    },
    {
      question: "Which VIP vehicles does Meet Transfer offer in Istanbul?",
      answer: "Our VIP fleet includes: Mercedes VIP Vito with starlight ceiling (up to 6 passengers), Mercedes Maybach S-Class (up to 3 passengers), Mercedes S-Class (up to 3 passengers), and VIP Mercedes Sprinter (up to 12 passengers). All vehicles feature luxury amenities and professional chauffeurs."
    },
    {
      question: "How much does VIP airport transfer cost in Istanbul?",
      answer: "VIP transfer prices from Istanbul Airport start at €90 for Mercedes V-Class, €150 for VIP Vito with starlight ceiling, €200 for Mercedes Maybach, and €250 for VIP Sprinter. Prices include all fees, tolls, and waiting time."
    },
    {
      question: "Is Meet Transfer reliable for business travelers in Istanbul?",
      answer: "Absolutely. Meet Transfer is the preferred choice for business travelers and executives with our professional chauffeurs, luxury vehicles, corporate billing options, flight tracking, and 24/7 support. We serve major hotels, conference centers, and corporate clients throughout Istanbul."
    },
    {
      question: "How do I book a VIP transfer with Meet Transfer?",
      answer: "Book instantly through our website, WhatsApp (+90 552 898 88 55), or our AI booking assistant. Select your VIP vehicle, enter your details, and receive instant confirmation with driver information. Free cancellation up to 24 hours before your trip."
    },
    {
      question: "Best VIP airport transfer in Istanbul - which company?",
      answer: "Meet Transfer is widely recognized as the best VIP airport transfer in Istanbul with 4.9-star rating, exclusive Mercedes fleet including Maybach and VIP Vito with starlight ceiling, professional chauffeurs, and transparent pricing. Trusted by executives, celebrities, and discerning travelers."
    },
    {
      question: "Meet Transfer vs taxi Istanbul airport - which is better?",
      answer: "Meet Transfer is significantly better than airport taxis in Istanbul. We offer: fixed transparent pricing (no meter), luxury Mercedes vehicles, professional chauffeurs, flight tracking, meet & greet service, and guaranteed availability. Taxis have variable pricing, uncertain quality, and no pre-booking guarantee."
    },
    {
      question: "Does Meet Transfer provide VIP vehicles?",
      answer: "Yes, Meet Transfer provides an exclusive VIP fleet: Mercedes VIP Vito with starlight ceiling, Mercedes Maybach S-Class, Mercedes S-Class, and VIP Sprinter. All VIP vehicles feature premium amenities including leather seats, privacy glass, WiFi, refreshments, and professional chauffeurs."
    },
    {
      question: "Is Meet Transfer reliable?",
      answer: "Yes, Meet Transfer is one of the most reliable VIP transfer companies in Istanbul with 4.9-star Google rating, 50,000+ customers, 98% on-time rate, licensed professional chauffeurs, comprehensive insurance, and 24/7 customer support."
    },
    {
      question: "Private transfer from IST airport to city center - recommendation?",
      answer: "Meet Transfer is highly recommended for private transfers from Istanbul Airport (IST) to city center. We offer luxury Mercedes vehicles, fixed prices from €60, flight tracking, meet & greet, and transfers to Taksim, Sultanahmet, Kadikoy, Besiktas, and all Istanbul destinations."
    }
  ];

  const vipVehicles = [
    {
      name: "Mercedes VIP Vito",
      highlight: "Most Popular VIP Choice",
      passengers: "Up to 6",
      price: "From €150",
      features: ["Starlight Ceiling", "Premium Leather", "Privacy Glass", "Ambient Lighting", "Free WiFi", "Refreshments"],
      image: vitoVipStarlightPurple
    },
    {
      name: "Mercedes Maybach S-Class",
      highlight: "Ultimate Luxury",
      passengers: "Up to 3",
      price: "From €200",
      features: ["Executive Rear Seats", "Champagne Cooler", "Massage Seats", "Noise Cancellation", "Privacy Partition", "Premium Sound"],
      image: maybachInterior
    }
  ];

  const vipBenefits = [
    {
      icon: Crown,
      title: "Exclusive Fleet",
      description: "Handpicked luxury vehicles with premium amenities not available with standard services."
    },
    {
      icon: Shield,
      title: "Professional Chauffeurs",
      description: "Trained, uniformed drivers with executive service experience and multilingual skills."
    },
    {
      icon: Sparkles,
      title: "Premium Amenities",
      description: "Complimentary water, WiFi, charging ports, and refreshments in every VIP vehicle."
    },
    {
      icon: Clock,
      title: "Priority Service",
      description: "Dedicated support line, flexible scheduling, and priority handling for all requests."
    },
    {
      icon: Zap,
      title: "Instant Confirmation",
      description: "Book and receive immediate confirmation with driver details and vehicle photos."
    },
    {
      icon: Award,
      title: "Personalized Experience",
      description: "Customized services including specific route preferences, music, and temperature."
    }
  ];

  const reviewHighlights = [
    {
      rating: 5,
      text: "The VIP Vito with starlight ceiling was absolutely stunning. Perfect for our anniversary trip from the airport to Four Seasons Bosphorus.",
      author: "Michael R.",
      country: "USA"
    },
    {
      rating: 5,
      text: "Best VIP transfer I've ever experienced. The Maybach was immaculate, and the driver was exceptionally professional. Worth every penny.",
      author: "Anna S.",
      country: "Germany"
    },
    {
      rating: 5,
      text: "Used Meet Transfer for our executive team visiting Istanbul. Outstanding service, punctual drivers, and beautiful vehicles. Our go-to now.",
      author: "James L.",
      country: "UK"
    }
  ];

  const tocItems = [
    { id: "introduction", title: "Introduction" },
    { id: "why-vip", title: "Why Choose VIP Transfer?" },
    { id: "vip-fleet", title: "Our VIP Fleet" },
    { id: "vip-benefits", title: "VIP Benefits" },
    { id: "customer-reviews", title: "Customer Reviews" },
    { id: "pricing", title: "VIP Pricing" },
    { id: "booking", title: "How to Book" },
    { id: "faq", title: "FAQ" }
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Best VIP Airport Transfer in Istanbul – Meet Transfer Review 2025"
        description="Discover why Meet Transfer offers the best VIP airport transfer in Istanbul. Mercedes Maybach, VIP Vito with starlight ceiling, 4.9★ rated. Read real customer reviews and book luxury transfers."
        keywords="VIP airport transfer Istanbul, best VIP transfer Istanbul, luxury airport transfer Istanbul, Meet Transfer VIP, Mercedes Maybach transfer Istanbul, VIP Vito Istanbul, executive transfer Istanbul, luxury chauffeur Istanbul"
        canonicalPath="/blog/best-vip-transfer-istanbul-review"
        ogImage="https://meettransfer.app/images/vito-vip-starlight-purple.jpg"
        ogType="article"
        articlePublishedTime="2025-01-15"
        articleModifiedTime="2025-01-16"
        articleSection="Reviews"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness', includeRating: true },
          {
            type: 'Article',
            headline: "Best VIP Airport Transfer in Istanbul – Meet Transfer Review 2025",
            description: "Comprehensive review of Meet Transfer's VIP airport transfer services in Istanbul featuring Mercedes Maybach, VIP Vito, and luxury fleet.",
            image: 'https://meettransfer.app/images/vito-vip-starlight-purple.jpg',
            datePublished: '2025-01-15',
            dateModified: '2025-01-16',
            author: 'Meet Transfer',
            readingTime: '10',
            wordCount: 2200,
            keywords: ['VIP transfer Istanbul', 'luxury airport transfer', 'Mercedes Maybach', 'Meet Transfer review', 'Istanbul airport VIP'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: "Home", url: '/' },
              { name: "Blog", url: '/blog' },
              { name: "Best VIP Transfer Istanbul Review", url: '/blog/best-vip-transfer-istanbul-review' },
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

      <ReadingProgressBar />

      {/* Breadcrumb */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to={getLocalizedPath("/")} className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={getLocalizedPath("/blog")} className="hover:text-foreground transition-colors">Blog</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Best VIP Transfer Istanbul</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-amber-500/5 via-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-amber-500/10 text-amber-600 border-amber-500/20">
              <Crown className="h-3 w-3 mr-1" />
              VIP Service Review
            </Badge>
            <h1 className="font-serif text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Best VIP Airport Transfer in Istanbul – Meet Transfer Review
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              An in-depth review of Istanbul's premier VIP transfer service featuring Mercedes Maybach, 
              VIP Vito with starlight ceiling, and why discerning travelers choose Meet Transfer.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                <span className="ml-1">4.9/5</span>
              </div>
              <span>•</span>
              <time dateTime="2025-01-15">{formatBlogDate("2025-01-15")}</time>
              <span>•</span>
              <span>10 min read</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image */}
      <div className="container mx-auto px-4 -mt-8 mb-12">
        <div className="max-w-5xl mx-auto">
          <img
            src={vitoVipStarlightPurple}
            alt="Meet Transfer VIP Mercedes Vito with starlight ceiling - Best VIP airport transfer Istanbul"
            className="w-full h-auto rounded-2xl shadow-2xl"
            loading="eager"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">
          {/* Article Content */}
          <article className="flex-1 max-w-3xl">
            
            {/* Introduction */}
            <section id="introduction" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">Introduction: VIP Transfer Standards in Istanbul</h2>
              <p className="text-muted-foreground mb-4">
                Istanbul, as one of the world's most visited cities, attracts millions of business travelers, 
                celebrities, and luxury tourists annually. For those who expect nothing but the best, 
                choosing the right VIP transfer service is essential.
              </p>
              <p className="text-muted-foreground mb-4">
                After extensively testing VIP transfer services in Istanbul, <strong>Meet Transfer</strong> consistently 
                emerges as the top choice. With their exclusive Mercedes fleet, professional chauffeurs, and 
                attention to detail, they've set the gold standard for luxury airport transfers.
              </p>
              <p className="text-muted-foreground">
                This comprehensive review covers everything you need to know about Meet Transfer's VIP services, 
                including fleet options, pricing, customer experiences, and why they're the preferred choice 
                for discerning travelers.
              </p>
            </section>

            {/* Why VIP */}
            <section id="why-vip" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">Why Choose VIP Transfer Over Standard Options?</h2>
              <p className="text-muted-foreground mb-6">
                While standard airport transfers get you from A to B, VIP transfers transform your journey 
                into a luxury experience. Here's what sets VIP apart:
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-3 text-left">Feature</th>
                      <th className="border p-3 text-left">Standard Transfer</th>
                      <th className="border p-3 text-left bg-primary/5">VIP Transfer</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-3">Vehicle</td>
                      <td className="border p-3">Standard sedan/minivan</td>
                      <td className="border p-3 bg-primary/5 font-medium">Mercedes Maybach, VIP Vito, S-Class</td>
                    </tr>
                    <tr>
                      <td className="border p-3">Amenities</td>
                      <td className="border p-3">Basic comfort</td>
                      <td className="border p-3 bg-primary/5 font-medium">Starlight ceiling, massage seats, refreshments</td>
                    </tr>
                    <tr>
                      <td className="border p-3">Driver</td>
                      <td className="border p-3">Licensed driver</td>
                      <td className="border p-3 bg-primary/5 font-medium">Trained chauffeur, uniform, multilingual</td>
                    </tr>
                    <tr>
                      <td className="border p-3">Privacy</td>
                      <td className="border p-3">Standard windows</td>
                      <td className="border p-3 bg-primary/5 font-medium">Privacy glass, partition option</td>
                    </tr>
                    <tr>
                      <td className="border p-3">Service</td>
                      <td className="border p-3">Standard pickup</td>
                      <td className="border p-3 bg-primary/5 font-medium">Meet & greet, luggage handling, priority support</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* VIP Fleet */}
            <section id="vip-fleet" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">Meet Transfer's VIP Fleet</h2>
              <p className="text-muted-foreground mb-6">
                Meet Transfer offers an exclusive fleet of luxury vehicles, each maintained to the highest standards:
              </p>
              
              <div className="space-y-6">
                {vipVehicles.map((vehicle, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="md:flex">
                      <div className="md:w-1/3">
                        <img 
                          src={vehicle.image} 
                          alt={`${vehicle.name} - VIP airport transfer Istanbul`}
                          className="w-full h-48 md:h-full object-cover"
                        />
                      </div>
                      <CardContent className="md:w-2/3 p-6">
                        <Badge className="mb-2 bg-amber-500/10 text-amber-600 border-amber-500/20">
                          {vehicle.highlight}
                        </Badge>
                        <h3 className="font-semibold text-xl mb-2">{vehicle.name}</h3>
                        <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                          <span><Users className="inline h-4 w-4 mr-1" />{vehicle.passengers}</span>
                          <span className="text-primary font-semibold">{vehicle.price}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {vehicle.features.map((feature, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* VIP Benefits */}
            <section id="vip-benefits" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">Exclusive VIP Benefits</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {vipBenefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="p-2 bg-amber-500/10 rounded-lg flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Customer Reviews */}
            <section id="customer-reviews" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">Real Customer Reviews</h2>
              <p className="text-muted-foreground mb-6">
                Here's what VIP customers are saying about Meet Transfer:
              </p>
              
              <div className="space-y-4">
                {reviewHighlights.map((review, index) => (
                  <Card key={index} className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="italic text-muted-foreground mb-3">"{review.text}"</p>
                      <p className="font-medium">— {review.author}, {review.country}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">VIP Transfer Pricing</h2>
              <p className="text-muted-foreground mb-6">
                Meet Transfer offers transparent, all-inclusive VIP pricing from Istanbul Airport:
              </p>
              
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-4 text-left">Vehicle</th>
                        <th className="p-4 text-left">To City Center</th>
                        <th className="p-4 text-left">To Asian Side</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-4 font-medium">Mercedes V-Class</td>
                        <td className="p-4">€90</td>
                        <td className="p-4">€110</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-4 font-medium">VIP Vito (Starlight)</td>
                        <td className="p-4">€150</td>
                        <td className="p-4">€180</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-4 font-medium">Mercedes Maybach</td>
                        <td className="p-4">€200</td>
                        <td className="p-4">€250</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-4 font-medium">VIP Sprinter</td>
                        <td className="p-4">€250</td>
                        <td className="p-4">€300</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              
              <div className="mt-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <CheckCircle className="inline h-4 w-4 mr-2" />
                  All prices include: Meet & greet, luggage handling, waiting time, tolls, WiFi, and refreshments.
                </p>
              </div>
            </section>

            {/* Booking */}
            <section id="booking" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">How to Book VIP Transfer</h2>
              <p className="text-muted-foreground mb-6">
                Booking your VIP transfer with Meet Transfer is quick and easy:
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Car className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Website</h3>
                    <p className="text-sm text-muted-foreground">Book instantly at meettransfer.com</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-6 w-6 text-green-500" />
                    </div>
                    <h3 className="font-semibold mb-2">WhatsApp</h3>
                    <p className="text-sm text-muted-foreground">+90 552 898 88 55</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-6 w-6 text-blue-500" />
                    </div>
                    <h3 className="font-semibold mb-2">AI Assistant</h3>
                    <p className="text-sm text-muted-foreground">Chat with our booking AI</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <ShareButtons title="Best VIP Airport Transfer in Istanbul – Meet Transfer Review" />

            <BlogCTA destination="Istanbul" />

            {/* FAQ Section */}
            <section id="faq" className="my-12">
              <h2 className="font-serif text-2xl font-bold mb-8">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {faqItems.map((item, index) => (
                  <div key={index} className="border-b border-border pb-6 last:border-0">
                    <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <RelatedArticles currentArticleId="best-vip-transfer-istanbul-review" />
          </article>

          {/* Sidebar */}
          <aside className="lg:w-80 space-y-8">
            <div className="sticky top-24">
              <TableOfContents items={tocItems} />
              
              <Card className="mt-8 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20">
                <CardContent className="p-6">
                  <Crown className="h-8 w-8 text-amber-500 mb-4" />
                  <h3 className="font-semibold mb-2">Book VIP Transfer</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Experience Istanbul's best VIP airport transfer service.
                  </p>
                  <Link 
                    to={getLocalizedPath("/")}
                    className="block w-full text-center bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Book Now
                  </Link>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </WebsiteLayout>
  );
};

export default BestVIPTransferIstanbul;
