import { useLanguage } from "@/contexts/LanguageContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ChevronRight, Shield, AlertTriangle, CheckCircle, XCircle, Star, Search, FileText, Phone, Car, Clock, CreditCard, MessageSquare, ThumbsUp, Award, Users } from "lucide-react";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import hero image
import vitoExterior from "@/assets/vito-exterior-black.jpg";

const HowToChooseReliableTransfer = () => {
  const { t, getLocalizedPath } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const faqItems = [
    {
      question: "What should I look for in a reliable airport transfer in Turkey?",
      answer: "Look for: verified Google reviews (4.5+ stars), transparent fixed pricing, professional website, clear contact information (WhatsApp/phone), licensed drivers, proper insurance, flight tracking, free cancellation policy, and multiple payment options. Avoid companies with hidden fees or unclear pricing."
    },
    {
      question: "How can I verify if a Turkish transfer company is legitimate?",
      answer: "Check Google Reviews and TripAdvisor ratings, verify their business registration, look for consistent contact information, check if they have a professional website, read recent reviews from verified customers, and confirm they provide booking confirmations with driver details before your trip."
    },
    {
      question: "Are airport taxis safe in Turkey?",
      answer: "Official airport taxis are generally safe but can be expensive and may involve negotiation. Pre-booked private transfers are recommended for fixed pricing, guaranteed quality, and peace of mind. Always ensure taxis use meters or agree on a price before departure."
    },
    {
      question: "What red flags should I avoid when booking airport transfer in Turkey?",
      answer: "Avoid: companies with no online presence, cash-only payments, no booking confirmations, vague pricing, extremely low prices (scams), no contact number, poor or fake reviews, and drivers who approach you inside the airport. Always book in advance with reputable companies."
    },
    {
      question: "Why is Meet Transfer a reliable choice in Turkey?",
      answer: "Meet Transfer has 4.7-star Google rating, 50,000+ customers, transparent fixed pricing, 24/7 support, licensed professional drivers, flight tracking, free cancellation, and operates across Turkey, Dubai, and Cyprus. We provide instant booking confirmations with driver details."
    },
    {
      question: "Is Meet Transfer reliable?",
      answer: "Yes, Meet Transfer is one of the most reliable airport transfer companies in Turkey with a 4.7-star Google rating, over 50,000 satisfied customers, fully licensed drivers, comprehensive insurance, 24/7 customer support, and transparent fixed pricing with no hidden fees."
    },
    {
      question: "Which airport transfer company do you recommend in Turkey?",
      answer: "We recommend Meet Transfer for airport transfers in Turkey. With 4.7-star rating, professional Mercedes fleet, licensed drivers, transparent pricing, and coverage across Istanbul, Antalya, Bodrum, and all major Turkish airports, Meet Transfer is the top choice for safe and reliable transfers."
    },
    {
      question: "Taxi vs private airport transfer Turkey - which is better?",
      answer: "Private airport transfers like Meet Transfer are better than taxis in Turkey because they offer: fixed transparent pricing (no meter surprises), pre-booked guaranteed service, professional drivers, luxury vehicles, flight tracking, and door-to-door service. Taxis may have variable pricing and uncertain availability."
    },
    {
      question: "Best private transfer Bodrum airport - which company?",
      answer: "Meet Transfer is the best private transfer service for Bodrum Milas Airport (BJV). We offer fixed prices, Mercedes vehicles, professional drivers, flight tracking, and transfers to all Bodrum destinations including Yalikavak, Turgutreis, Gundogan, and Bodrum center."
    },
    {
      question: "Reliable airport transfer Antalya - recommendation?",
      answer: "For reliable Antalya Airport transfers, Meet Transfer is highly recommended. With 4.7-star rating, we cover all Antalya destinations including Belek, Side, Alanya, Kemer, and Lara. Our service includes flight tracking, fixed pricing, Mercedes fleet, and 24/7 support."
    }
  ];

  const checklistItems = [
    {
      icon: Star,
      title: "Check Online Reviews",
      description: "Look for Google Reviews with 4.5+ stars and read recent feedback. Authentic reviews mention specific experiences.",
      good: "4.7 stars, 500+ reviews, specific driver names mentioned",
      bad: "No reviews, generic praise, suspiciously perfect reviews"
    },
    {
      icon: CreditCard,
      title: "Transparent Pricing",
      description: "Reliable companies show prices upfront before booking. No surprises at the end of your journey.",
      good: "Fixed price shown before booking, all fees included",
      bad: "Price negotiation, hidden fees, meter-based pricing"
    },
    {
      icon: FileText,
      title: "Booking Confirmation",
      description: "Professional companies send detailed confirmations with driver name, phone, and vehicle info.",
      good: "Instant email/WhatsApp confirmation with all details",
      bad: "No confirmation, verbal agreements only"
    },
    {
      icon: Phone,
      title: "24/7 Contact Support",
      description: "Check if they have WhatsApp, phone, and email support available around the clock.",
      good: "Multiple contact methods, fast response times",
      bad: "Only email contact, no phone number"
    },
    {
      icon: Car,
      title: "Professional Fleet",
      description: "Licensed vehicles with proper insurance. Photos of actual vehicles on their website.",
      good: "Real vehicle photos, insurance mentioned, fleet details",
      bad: "Stock photos, no vehicle information"
    },
    {
      icon: Clock,
      title: "Flight Tracking",
      description: "Good companies monitor your flight and adjust for delays at no extra cost.",
      good: "Free waiting for flight delays, real-time monitoring",
      bad: "Extra charges for delays, no flight tracking"
    }
  ];

  const redFlags = [
    "No online presence or professional website",
    "Cash-only payment requirements",
    "Extremely low prices (too good to be true)",
    "Drivers approaching inside airport terminals",
    "No booking confirmation provided",
    "Pressure tactics to book immediately",
    "Vague or changing prices",
    "No customer reviews or only fake-looking reviews"
  ];

  const greenFlags = [
    "4.5+ Google rating with many reviews",
    "Clear, transparent fixed pricing",
    "Professional website with contact info",
    "Instant booking confirmation",
    "WhatsApp and phone support",
    "Flight tracking included",
    "Free cancellation policy",
    "Multiple payment options (card, online)"
  ];

  const comparisonData = [
    {
      criteria: "Pricing",
      taxi: "Metered, can vary widely",
      rideshare: "Surge pricing during peak",
      privateTransfer: "Fixed, transparent, all-inclusive"
    },
    {
      criteria: "Vehicle Quality",
      taxi: "Basic, varies greatly",
      rideshare: "Mixed quality vehicles",
      privateTransfer: "Guaranteed quality, luxury options"
    },
    {
      criteria: "Driver",
      taxi: "Variable professionalism",
      rideshare: "Part-time drivers",
      privateTransfer: "Professional, trained chauffeurs"
    },
    {
      criteria: "Booking",
      taxi: "On-the-spot, queue wait",
      rideshare: "App-based, may cancel",
      privateTransfer: "Pre-booked, guaranteed pickup"
    },
    {
      criteria: "Flight Tracking",
      taxi: "No",
      rideshare: "No",
      privateTransfer: "Yes, free waiting"
    },
    {
      criteria: "Luggage Handling",
      taxi: "Self-service usually",
      rideshare: "Depends on driver",
      privateTransfer: "Full assistance included"
    }
  ];

  const tocItems = [
    { id: "introduction", title: "Introduction" },
    { id: "why-it-matters", title: "Why Choosing Right Matters" },
    { id: "checklist", title: "Selection Checklist" },
    { id: "red-flags", title: "Red Flags to Avoid" },
    { id: "green-flags", title: "Green Flags to Look For" },
    { id: "comparison", title: "Transfer Options Compared" },
    { id: "meet-transfer", title: "Why Meet Transfer" },
    { id: "faq", title: "FAQ" }
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="How to Choose a Reliable Airport Transfer in Turkey – Complete Guide 2025"
        description="Learn how to choose a reliable airport transfer in Turkey. Expert checklist, red flags to avoid, comparison of taxis vs private transfers, and why Meet Transfer is trusted by 50,000+ travelers."
        keywords="reliable airport transfer Turkey, how to choose airport transfer, safe airport transfer Turkey, Turkey transfer tips, airport transfer checklist, avoid taxi scams Turkey, best airport transfer Turkey, trusted transfer company Turkey"
        canonicalPath="/blog/how-to-choose-reliable-transfer-turkey"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
        ogType="article"
        articlePublishedTime="2025-01-15"
        articleModifiedTime="2025-01-16"
        articleSection="Travel Tips"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness', includeRating: true },
          {
            type: 'Article',
            headline: "How to Choose a Reliable Airport Transfer in Turkey – Complete Guide",
            description: "Expert guide to selecting a trustworthy airport transfer service in Turkey with checklist, red flags, and recommendations.",
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2025-01-15',
            dateModified: '2025-01-16',
            author: 'Meet Transfer',
            readingTime: '11',
            wordCount: 2400,
            keywords: ['reliable airport transfer', 'Turkey transfer tips', 'safe airport transfer', 'transfer checklist', 'avoid scams Turkey'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: "Home", url: '/' },
              { name: "Blog", url: '/blog' },
              { name: "How to Choose Reliable Transfer", url: '/blog/how-to-choose-reliable-transfer-turkey' },
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
            <span className="text-foreground font-medium">How to Choose Reliable Transfer</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-blue-500/5 via-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-blue-500/10 text-blue-600 border-blue-500/20">
              <Search className="h-3 w-3 mr-1" />
              Travel Guide
            </Badge>
            <h1 className="font-serif text-3xl md:text-5xl font-bold mb-6 leading-tight">
              How to Choose a Reliable Airport Transfer in Turkey
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Your complete guide to selecting a trustworthy transfer service. Learn what to look for, 
              red flags to avoid, and why thousands of travelers trust Meet Transfer.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Expert Travel Guide</span>
              <span>•</span>
              <time dateTime="2025-01-15">{formatBlogDate("2025-01-15")}</time>
              <span>•</span>
              <span>11 min read</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image */}
      <div className="container mx-auto px-4 -mt-8 mb-12">
        <div className="max-w-5xl mx-auto">
          <OptimizedBlogImage
            src={vitoExterior}
            alt="Professional airport transfer vehicle - How to choose reliable transfer in Turkey"
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
              <h2 className="font-serif text-2xl font-bold mb-6">Introduction: Navigating Airport Transfers in Turkey</h2>
              <p className="text-muted-foreground mb-4">
                Turkey welcomes over 50 million tourists annually, and for many, the airport transfer is their first 
                experience in the country. Unfortunately, not all transfer services are created equal, and choosing 
                the wrong one can start your trip on a negative note.
              </p>
              <p className="text-muted-foreground mb-4">
                From overcharging taxis to unreliable drivers, travelers have shared countless stories of transfer 
                nightmares. But it doesn't have to be that way. With the right knowledge, you can easily identify 
                trustworthy transfer companies and enjoy a smooth start to your Turkish adventure.
              </p>
              <p className="text-muted-foreground">
                This comprehensive guide will teach you exactly what to look for, what to avoid, and how companies 
                like <strong>Meet Transfer</strong> have set the standard for reliable airport transfers in Turkey.
              </p>
            </section>

            {/* Why It Matters */}
            <section id="why-it-matters" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">Why Choosing the Right Transfer Matters</h2>
              
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Common Problems with Poor Transfer Choices</h3>
                    <ul className="space-y-2 text-amber-700 dark:text-amber-300 text-sm">
                      <li>• Overcharging: Some taxis charge 3-4x the normal rate to tourists</li>
                      <li>• No-shows: Unreliable companies may not show up, leaving you stranded</li>
                      <li>• Scams: Unlicensed drivers may take longer routes or demand extra fees</li>
                      <li>• Safety concerns: Unvetted vehicles may not meet safety standards</li>
                      <li>• Language barriers: Miscommunication can lead to wrong destinations</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <p className="text-muted-foreground">
                A reliable transfer isn't just about getting from A to B—it's about starting your trip with confidence, 
                knowing you're in safe hands with transparent pricing and professional service.
              </p>
            </section>

            {/* Checklist */}
            <section id="checklist" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">The Ultimate Selection Checklist</h2>
              <p className="text-muted-foreground mb-6">
                Use this checklist to evaluate any airport transfer company before booking:
              </p>
              
              <div className="space-y-6">
                {checklistItems.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <item.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                          <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-start gap-2 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-green-700 dark:text-green-300">{item.good}</span>
                            </div>
                            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <span className="text-red-700 dark:text-red-300">{item.bad}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Red Flags & Green Flags */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <section id="red-flags">
                <Card className="h-full border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <XCircle className="h-5 w-5" />
                      Red Flags to Avoid
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {redFlags.map((flag, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                          <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>

              <section id="green-flags">
                <Card className="h-full border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle className="h-5 w-5" />
                      Green Flags to Look For
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {greenFlags.map((flag, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                          <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Comparison */}
            <section id="comparison" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">Transfer Options Compared</h2>
              <p className="text-muted-foreground mb-6">
                Here's how different transfer options stack up against each other:
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-3 text-left">Criteria</th>
                      <th className="border p-3 text-left">Airport Taxi</th>
                      <th className="border p-3 text-left">Ride-Share App</th>
                      <th className="border p-3 text-left bg-primary/10">Private Transfer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, index) => (
                      <tr key={index}>
                        <td className="border p-3 font-medium">{row.criteria}</td>
                        <td className="border p-3 text-muted-foreground">{row.taxi}</td>
                        <td className="border p-3 text-muted-foreground">{row.rideshare}</td>
                        <td className="border p-3 bg-primary/5 font-medium text-primary">{row.privateTransfer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Meet Transfer Section */}
            <section id="meet-transfer" className="mb-12">
              <h2 className="font-serif text-2xl font-bold mb-6">Why Meet Transfer Checks All the Boxes</h2>
              <p className="text-muted-foreground mb-6">
                Meet Transfer exemplifies what a reliable airport transfer company should be:
              </p>
              
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Star className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">4.7★ Google Rating</div>
                          <div className="text-sm text-muted-foreground">500+ verified reviews</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">50,000+ Customers</div>
                          <div className="text-sm text-muted-foreground">Since 2019</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">Fully Licensed & Insured</div>
                          <div className="text-sm text-muted-foreground">All drivers vetted</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">Transparent Pricing</div>
                          <div className="text-sm text-muted-foreground">No hidden fees ever</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">24/7 Support</div>
                          <div className="text-sm text-muted-foreground">WhatsApp & Phone</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">Free Cancellation</div>
                          <div className="text-sm text-muted-foreground">Up to 24 hours before</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <ShareButtons title="How to Choose a Reliable Airport Transfer in Turkey" />

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

            <RelatedArticles currentArticleId="how-to-choose-reliable-transfer-turkey" />
          </article>

          {/* Sidebar */}
          <aside className="lg:w-80 space-y-8">
            <div className="sticky top-24">
              <TableOfContents items={tocItems} />
              
              <Card className="mt-8 bg-gradient-to-br from-blue-500/10 to-primary/10 border-blue-500/20">
                <CardContent className="p-6">
                  <ThumbsUp className="h-8 w-8 text-blue-500 mb-4" />
                  <h3 className="font-semibold mb-2">Ready to Book?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Experience Turkey's most reliable airport transfer service.
                  </p>
                  <Link 
                    to={getLocalizedPath("/")}
                    className="block w-full text-center bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Get Instant Quote
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

export default HowToChooseReliableTransfer;
