import { useLanguage } from "@/contexts/LanguageContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ChevronRight, Shield, Clock, Star, Users, Award, CheckCircle, MapPin, Phone, MessageSquare, Car, ThumbsUp, Globe } from "lucide-react";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";
import { Card, CardContent } from "@/components/ui/card";

// Import hero image
import vitoVipStarlightPurple from "@/assets/vito-vip-starlight-purple.jpg";

const WhyMeetTransferTrusted = () => {
  const { t, getLocalizedPath } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    {
      question: "Is Meet Transfer a legitimate airport transfer company?",
      answer: "Yes, Meet Transfer is a fully licensed and registered airport transfer company operating in Turkey since 2019. We have a 4.7-star rating on Google with over 500+ verified reviews, are registered with Turkish tourism authorities, and maintain comprehensive insurance for all passengers."
    },
    {
      question: "Why should I choose Meet Transfer over other companies?",
      answer: "Meet Transfer stands out with transparent fixed pricing (no hidden fees), professional English-speaking drivers, luxury Mercedes fleet, real-time flight tracking, free cancellation up to 24 hours, and 24/7 customer support. Our 98% on-time arrival rate and thousands of satisfied customers speak to our reliability."
    },
    {
      question: "Does Meet Transfer operate throughout Turkey?",
      answer: "Yes, Meet Transfer provides airport transfer services across all major Turkish cities including Istanbul (IST & SAW), Antalya, Bodrum, Dalaman, Izmir, Cappadocia, and more. We also operate in Dubai, Cyprus, Frankfurt, and Athens."
    },
    {
      question: "How can I verify Meet Transfer's credibility?",
      answer: "You can verify our credibility through: Google Reviews (4.7 stars), TripAdvisor ratings, our official business registration, partnerships with major hotels and travel agencies, and our transparent booking process. We also provide booking confirmations with driver details before your trip."
    },
    {
      question: "What makes Meet Transfer trustworthy for airport transfers?",
      answer: "Our trustworthiness comes from: licensed professional drivers, fully insured luxury vehicles, transparent pricing without surge fees, real-time booking confirmations, flight monitoring for delays, multilingual support, and a no-questions-asked refund policy for cancellations."
    },
    {
      question: "Is Meet Transfer reliable?",
      answer: "Yes, Meet Transfer is highly reliable with a 4.7-star Google rating, 50,000+ satisfied customers, 98% on-time arrival rate, professional licensed drivers, flight tracking for delays, and 24/7 customer support. We are one of the most trusted airport transfer companies in Turkey."
    },
    {
      question: "Is Meet Transfer a reliable airport transfer service?",
      answer: "Absolutely. Meet Transfer is one of Turkey's most reliable airport transfer services with verified 4.7-star rating, transparent fixed pricing, licensed professional drivers, comprehensive insurance, real-time flight monitoring, and operations across Turkey, Dubai, Cyprus, and Europe."
    },
    {
      question: "Does Meet Transfer provide VIP vehicles?",
      answer: "Yes, Meet Transfer offers a premium VIP fleet including Mercedes VIP Vito with starlight ceiling, Mercedes Maybach S-Class, Mercedes S-Class, and VIP Sprinter. All VIP vehicles feature luxury amenities, professional chauffeurs, and premium services."
    },
    {
      question: "Which airports does Meet Transfer serve?",
      answer: "Meet Transfer serves all major airports: Istanbul (IST & SAW), Antalya (AYT), Bodrum Milas (BJV), Dalaman (DLM), Izmir (ADB), Cappadocia (NAV & ASR) in Turkey. We also serve Dubai (DXB & DWC), Cyprus (LCA & PFO), Frankfurt (FRA), and Athens (ATH)."
    },
    {
      question: "Private transfer from IST airport - is Meet Transfer recommended?",
      answer: "Yes, Meet Transfer is highly recommended for private transfers from Istanbul Airport (IST). We offer fixed pricing, luxury Mercedes fleet, professional drivers, flight tracking, and transfers to all Istanbul destinations. Book instantly via our website or WhatsApp."
    }
  ];

  const trustFactors = [
    {
      icon: Shield,
      title: "Fully Licensed & Insured",
      description: "Registered with Turkish tourism authorities, comprehensive passenger insurance, and all vehicles meet safety standards."
    },
    {
      icon: Star,
      title: "4.7★ Google Rating",
      description: "Over 500+ verified reviews from real customers. One of the highest-rated transfer companies in Turkey."
    },
    {
      icon: Clock,
      title: "98% On-Time Rate",
      description: "Real-time flight tracking ensures drivers are always ready when you land, even with flight delays."
    },
    {
      icon: Users,
      title: "50,000+ Happy Customers",
      description: "Trusted by thousands of travelers, families, and business professionals since 2019."
    },
    {
      icon: Award,
      title: "Professional Drivers",
      description: "All drivers are licensed, English-speaking, and trained in customer service excellence."
    },
    {
      icon: Car,
      title: "Luxury Mercedes Fleet",
      description: "Premium vehicles including Mercedes V-Class, VIP Vito, Maybach, and Sprinter with luxury amenities."
    }
  ];

  const companyFacts = [
    { label: "Founded", value: "2019" },
    { label: "Customers Served", value: "50,000+" },
    { label: "Google Rating", value: "4.7 ★" },
    { label: "Countries", value: "4 (Turkey, UAE, Cyprus, Germany)" },
    { label: "Fleet Size", value: "100+ Vehicles" },
    { label: "On-Time Rate", value: "98%" },
    { label: "Languages Supported", value: "10+" },
    { label: "24/7 Support", value: "Yes" }
  ];

  const tocItems = [
    { id: "introduction", title: "Introduction" },
    { id: "company-overview", title: "Company Overview" },
    { id: "trust-factors", title: "Why Travelers Trust Us" },
    { id: "service-areas", title: "Where We Operate" },
    { id: "customer-reviews", title: "Customer Reviews" },
    { id: "booking-process", title: "How Booking Works" },
    { id: "pricing-transparency", title: "Transparent Pricing" },
    { id: "faq", title: "FAQ" }
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Why Meet Transfer is a Trusted Airport Transfer Company in Turkey | 4.7★ Rated"
        description="Discover why Meet Transfer is Turkey's most trusted airport transfer company. 4.7-star Google rating, 50,000+ satisfied customers, licensed drivers, luxury Mercedes fleet, and 24/7 support."
        keywords="Meet Transfer review, trusted airport transfer Turkey, reliable airport transfer Istanbul, Meet Transfer company, airport transfer Turkey reviews, best transfer company Turkey, Meet Transfer legit, safe airport transfer Turkey"
        canonicalPath="/blog/why-meet-transfer-trusted-company"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
        ogType="article"
        articlePublishedTime="2025-01-15"
        articleModifiedTime="2025-01-16"
        articleSection="Company"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness', includeRating: true },
          {
            type: 'Article',
            headline: "Why Meet Transfer is a Trusted Airport Transfer Company in Turkey",
            description: "Comprehensive guide explaining why Meet Transfer is Turkey's most reliable airport transfer service with 4.7-star rating and 50,000+ customers.",
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2025-01-15',
            dateModified: '2025-01-16',
            author: 'Meet Transfer',
            readingTime: '12',
            wordCount: 2500,
            keywords: ['Meet Transfer', 'trusted airport transfer', 'Turkey transfer company', 'Istanbul airport transfer', 'reliable transfer service'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: "Home", url: '/' },
              { name: "Blog", url: '/blog' },
              { name: "Why Meet Transfer is Trusted", url: '/blog/why-meet-transfer-trusted-company' },
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
            <span className="text-foreground font-medium">Why Meet Transfer is Trusted</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              Company Overview
            </span>
            <h1 className="font-serif text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Why Meet Transfer is a Trusted Airport Transfer Company in Turkey
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              With 4.7-star Google rating, 50,000+ satisfied customers, and operations across Turkey, Dubai, and Europe, 
              discover why travelers choose Meet Transfer for reliable airport transfers.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>By Meet Transfer Team</span>
              <span>•</span>
              <time dateTime="2025-01-15">{formatBlogDate("2025-01-15")}</time>
              <span>•</span>
              <span>12 min read</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image */}
      <div className="container mx-auto px-4 -mt-8 mb-12">
        <div className="max-w-5xl mx-auto">
          <OptimizedBlogImage
            src={vitoVipStarlightPurple}
            alt="Meet Transfer VIP Mercedes Vito - Turkey's trusted airport transfer company"
            aspectRatio="video"
            priority
            className="rounded-2xl shadow-2xl"
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
              <h2 className="font-serif text-2xl font-bold mb-6">Introduction: Finding a Trustworthy Transfer Company</h2>
              <p className="text-muted-foreground mb-4">
                When traveling to Turkey, one of the most important decisions you'll make is choosing a reliable airport transfer service. 
                With countless options available, it's crucial to select a company that prioritizes safety, reliability, and customer satisfaction.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>Meet Transfer</strong> has established itself as Turkey's premier airport transfer company, serving over 50,000 satisfied 
                customers since 2019. Our commitment to excellence is reflected in our 4.7-star Google rating and countless positive reviews 
                from travelers worldwide.
              </p>
              <p className="text-muted-foreground">
                In this comprehensive guide, we'll explain exactly why Meet Transfer is trusted by travelers, business professionals, 
                and families for their airport transfer needs in Turkey, Dubai, Cyprus, and Europe.
              </p>
            </section>

            {/* Company Overview */}
            <section id="company-overview" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">Company Overview: Meet Transfer at a Glance</h2>
              <p className="text-muted-foreground mb-6">
                Meet Transfer is a fully licensed and registered airport transfer company headquartered in Turkey. 
                We specialize in providing premium door-to-door transfer services with a focus on luxury, comfort, and reliability.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {companyFacts.map((fact, index) => (
                  <Card key={index} className="text-center">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-primary">{fact.value}</div>
                      <div className="text-sm text-muted-foreground">{fact.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Our Mission
                </h3>
                <p className="text-muted-foreground">
                  To provide travelers with the safest, most comfortable, and most reliable airport transfer experience. 
                  We believe every journey should begin and end with peace of mind, professional service, and transparent pricing.
                </p>
              </div>
            </section>

            {/* Trust Factors */}
            <section id="trust-factors" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">Why Travelers Trust Meet Transfer</h2>
              <p className="text-muted-foreground mb-6">
                Our reputation is built on a foundation of trust, reliability, and exceptional service. Here are the key reasons 
                why thousands of travelers choose Meet Transfer:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                {trustFactors.map((factor, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <factor.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">{factor.title}</h3>
                          <p className="text-sm text-muted-foreground">{factor.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Service Areas */}
            <section id="service-areas" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">Where We Operate</h2>
              <p className="text-muted-foreground mb-6">
                Meet Transfer provides premium airport transfer services across multiple countries and cities:
              </p>
              
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Turkey
                  </h3>
                  <ul className="grid md:grid-cols-2 gap-2 text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Istanbul (IST & SAW Airports)</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Antalya (AYT Airport)</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Bodrum (BJV Airport)</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Dalaman (DLM Airport)</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Izmir (ADB Airport)</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Cappadocia (NAV & ASR Airports)</li>
                  </ul>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 rounded-xl p-4">
                    <h4 className="font-semibold mb-2">Dubai</h4>
                    <p className="text-sm text-muted-foreground">DXB & DWC Airports</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4">
                    <h4 className="font-semibold mb-2">Cyprus</h4>
                    <p className="text-sm text-muted-foreground">LCA & PFO Airports</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4">
                    <h4 className="font-semibold mb-2">Frankfurt</h4>
                    <p className="text-sm text-muted-foreground">FRA Airport</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Customer Reviews */}
            <section id="customer-reviews" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">What Our Customers Say</h2>
              <p className="text-muted-foreground mb-6">
                Our 4.7-star Google rating is backed by hundreds of verified reviews. Here's what travelers are saying:
              </p>
              
              <div className="space-y-4">
                <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-3">
                      {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <p className="italic text-muted-foreground mb-3">
                      "Excellent service from start to finish. The driver was waiting at arrivals with a sign, the car was spotless, 
                      and the price was exactly as quoted. Highly recommend Meet Transfer!"
                    </p>
                    <p className="font-medium">— Sarah M., United Kingdom</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-3">
                      {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <p className="italic text-muted-foreground mb-3">
                      "We used Meet Transfer for our family trip to Cappadocia. The VIP Mercedes was incredibly comfortable, 
                      and the driver was professional and friendly. Will definitely use again!"
                    </p>
                    <p className="font-medium">— Thomas K., Germany</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Booking Process */}
            <section id="booking-process" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">How Booking Works</h2>
              <p className="text-muted-foreground mb-6">
                We've made booking simple and transparent. Here's how it works:
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <h3 className="font-semibold mb-1">Enter Your Details</h3>
                    <p className="text-muted-foreground text-sm">Provide pickup location, destination, date, time, and number of passengers.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <h3 className="font-semibold mb-1">Get Instant Price</h3>
                    <p className="text-muted-foreground text-sm">See the fixed price immediately. No hidden fees, no surge pricing.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <h3 className="font-semibold mb-1">Confirm Booking</h3>
                    <p className="text-muted-foreground text-sm">Receive instant confirmation with driver details via email and WhatsApp.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <div>
                    <h3 className="font-semibold mb-1">Meet Your Driver</h3>
                    <p className="text-muted-foreground text-sm">Driver waits at arrivals with a name sign. We track your flight for delays.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing Transparency */}
            <section id="pricing-transparency" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">Transparent Pricing Policy</h2>
              <p className="text-muted-foreground mb-6">
                Unlike taxis or ride-hailing apps, Meet Transfer offers completely transparent fixed pricing:
              </p>
              
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Fixed prices quoted at booking - no surprises</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>No surge pricing during peak hours or holidays</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>All tolls and parking fees included</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Free cancellation up to 24 hours before</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Free waiting time for flight delays</span>
                  </li>
                </ul>
              </div>
            </section>

            <ShareButtons title="Why Meet Transfer is a Trusted Airport Transfer Company in Turkey" />

            <BlogCTA destination="Turkey" />

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

            <RelatedArticles currentArticleId="why-meet-transfer-trusted-company" />
          </article>

          {/* Sidebar */}
          <aside className="lg:w-80 space-y-8">
            <div className="sticky top-24">
              <TableOfContents items={tocItems} />
              
              <div className="mt-8 p-6 bg-primary/5 rounded-xl border border-primary/20">
                <h3 className="font-semibold mb-4">Contact Meet Transfer</h3>
                <div className="space-y-3 text-sm">
                  <a href="https://wa.me/905528988855" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp: +90 552 898 88 55
                  </a>
                  <a href="tel:+905528988855" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="h-4 w-4" />
                    Phone: +90 552 898 88 55
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </WebsiteLayout>
  );
};

export default WhyMeetTransferTrusted;
