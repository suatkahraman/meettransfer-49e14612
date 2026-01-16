import { useLanguage } from "@/contexts/LanguageContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ChevronRight, Shield, Clock, Moon, Users, Star, CheckCircle, MapPin, Phone, Eye, Car, Lock, AlertTriangle } from "lucide-react";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";
import heroImage from "@/assets/vito-passenger-night.jpg";

const SafeNightTransferTurkey = () => {
  const { t, language } = useLanguage();
  const { formatBlogDate } = useBlogDate();
  const formattedDate = formatBlogDate("2025-01-10");

  const faqItems = [
    {
      question: "Is it safe to take an airport transfer at night in Turkey?",
      answer: "Yes, it is safe to take a pre-booked airport transfer at night in Turkey with Meet Transfer. Our professional drivers are fully licensed, vehicles have GPS tracking, and we provide 24/7 customer support. All night transfers include real-time flight monitoring, so your driver will be waiting even if your flight is delayed."
    },
    {
      question: "What is the safest late-night transfer from Istanbul Airport?",
      answer: "Meet Transfer provides the safest late-night transfers from Istanbul Airport (IST). We offer: verified professional drivers, GPS-tracked vehicles, 24/7 customer support, fixed prices with no surge pricing, and meet & greet service at arrivals. Book in advance for guaranteed safe pickup at any hour."
    },
    {
      question: "How do I book a safe midnight transfer in Turkey?",
      answer: "Book a safe midnight transfer with Meet Transfer via our website or WhatsApp. Simply enter your flight details, and we'll track your flight for any delays. Your driver will be waiting at arrivals with a name sign. No cash needed - pay online securely. We serve all major Turkish airports 24/7."
    },
    {
      question: "Is Meet Transfer available for late-night airport pickups?",
      answer: "Yes, Meet Transfer operates 24/7 including late-night and early morning airport pickups. We cover Istanbul IST/SAW, Antalya AYT, Izmir ADB, Bodrum BJV, Dalaman DLM airports at all hours. Night transfers have the same fixed prices - no surge pricing."
    },
    {
      question: "What safety features does Meet Transfer offer for night transfers?",
      answer: "Meet Transfer night transfers include: GPS vehicle tracking, professional licensed drivers with background checks, 24/7 live customer support, real-time flight monitoring, driver photo and vehicle details sent before pickup, luxury well-maintained vehicles, and option to share trip details with family."
    },
    {
      question: "Are taxi or private transfer safer at night in Turkey?",
      answer: "Pre-booked private transfers like Meet Transfer are significantly safer than street taxis at night. Advantages: verified drivers, fixed prices (no meter manipulation), GPS tracking, English-speaking drivers, 24/7 support, and your transfer details are recorded. Street taxis may have variable pricing and unverified drivers."
    },
    {
      question: "Can I get a female driver for night transfer in Turkey?",
      answer: "Meet Transfer can arrange female drivers for night transfers upon request, subject to availability. Please mention this preference when booking. We prioritize passenger comfort and safety for all night transfers, especially for solo female travelers."
    },
    {
      question: "What happens if my flight is delayed at night?",
      answer: "Meet Transfer provides complimentary flight tracking for all night transfers. If your flight is delayed, your driver will adjust pickup time automatically - no extra charge. We offer 60 minutes free waiting time from actual landing. You'll receive SMS updates with driver details."
    }
  ];

  const safetyFeatures = [
    { icon: Shield, title: "Verified Drivers", description: "Background-checked, licensed professional drivers" },
    { icon: Eye, title: "GPS Tracking", description: "Real-time vehicle tracking for your safety" },
    { icon: Phone, title: "24/7 Support", description: "Live customer support available any hour" },
    { icon: Lock, title: "Secure Payment", description: "Pre-pay online, no cash needed at night" },
    { icon: Moon, title: "No Surge Pricing", description: "Same fixed prices day or night" },
    { icon: Car, title: "Premium Vehicles", description: "Well-maintained luxury Mercedes fleet" },
  ];

  const nightTransferTips = [
    "Always book transfers in advance - don't rely on finding taxis at 3 AM",
    "Choose reputable companies with verified reviews like Meet Transfer",
    "Share your trip details with family or friends",
    "Confirm your driver's details before entering the vehicle",
    "Keep your phone charged and have emergency numbers saved",
    "Avoid unmarked or unlicensed vehicles at airports",
  ];

  const tocItems = [
    { id: "why-night-transfer", title: "Why Choose Professional Night Transfer" },
    { id: "safety-features", title: "Our Safety Features" },
    { id: "night-transfer-tips", title: "Night Transfer Safety Tips" },
    { id: "airports-covered", title: "Airports We Cover 24/7" },
    { id: "booking-process", title: "How to Book" },
    { id: "faq", title: "Frequently Asked Questions" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Safe Night Airport Transfer Turkey | 24/7 Service | Meet Transfer"
        description="Book safe late-night airport transfers in Turkey with Meet Transfer. 24/7 service, GPS tracking, verified drivers, fixed prices. Istanbul, Antalya, Bodrum airports."
        keywords="safe night transfer Turkey, late night airport transfer Istanbul, midnight airport pickup Turkey, 24/7 airport transfer, night transfer Antalya, safe taxi night Turkey"
        canonicalPath="/blog/safe-night-transfer-turkey"
      />
      <SchemaOrg
        schemas={[
          {
            type: "LocalBusiness" as const,
            includeRating: true,
          },
          {
            type: "Article" as const,
            headline: "Safe Night Airport Transfer in Turkey - Complete Guide",
            description: "Everything you need to know about safe late-night airport transfers in Turkey. Book with Meet Transfer for 24/7 secure transportation.",
            datePublished: "2025-01-10",
            dateModified: "2025-01-10",
            image: heroImage,
          },
          {
            type: "BreadcrumbList" as const,
            items: [
              { name: "Home", url: "/" },
              { name: "Blog", url: "/blog" },
              { name: "Safe Night Transfer Turkey", url: "/blog/safe-night-transfer-turkey" },
            ],
          },
          {
            type: "FAQPage" as const,
            questions: faqItems,
          },
        ]}
      />

      <ReadingProgressBar />

      <article className="min-h-screen bg-background">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Safe Night Transfer Turkey</span>
          </nav>
        </div>

        {/* Hero Section */}
        <header className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Moon className="w-4 h-4" />
              <span>24/7 Safe Transfers</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Safe Night Airport Transfer in Turkey
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
              Arriving late at night? Book a secure, pre-arranged airport transfer with Meet Transfer. 
              Professional drivers, GPS tracking, and 24/7 support ensure your safety at any hour.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                8 min read
              </span>
              <span>•</span>
              <span>{formattedDate}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                4.9 Rating
              </span>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        <div className="container mx-auto px-4 mb-12">
          <div className="max-w-4xl mx-auto">
            <OptimizedBlogImage
              src={heroImage}
              alt="Safe night airport transfer in Turkey with Meet Transfer"
              priority={true}
              aspectRatio="hero"
              className="rounded-2xl shadow-lg"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="lg:grid lg:grid-cols-[1fr_250px] lg:gap-8">
              <div className="prose prose-lg max-w-none">
                
                {/* Introduction */}
                <section id="why-night-transfer" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Why Choose Professional Night Transfer in Turkey?
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Arriving at a Turkish airport late at night can be stressful, especially in an unfamiliar country. 
                    Street taxis may not be readily available, language barriers can cause confusion, and safety concerns 
                    are heightened after dark. This is why smart travelers choose <strong>pre-booked private transfers</strong> 
                    with trusted companies like Meet Transfer.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    With Meet Transfer, your driver will be waiting for you at arrivals - even if your flight lands at 3 AM. 
                    Our <strong>real-time flight tracking</strong> means we know if your flight is delayed, and we adjust 
                    pickup time automatically. No surge pricing, no surprises, just safe transportation to your destination.
                  </p>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 my-6">
                    <div className="flex items-start gap-3">
                      <Shield className="w-6 h-6 text-primary shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Why Meet Transfer for Night Transfers?</h3>
                        <ul className="text-muted-foreground space-y-1 text-sm">
                          <li>• 4.9★ Google rating with 500+ verified reviews</li>
                          <li>• Professional licensed drivers with background checks</li>
                          <li>• GPS-tracked luxury Mercedes vehicles</li>
                          <li>• 24/7 live customer support</li>
                          <li>• Same fixed prices day or night - no surge</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Safety Features */}
                <section id="safety-features" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                    Our Night Transfer Safety Features
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {safetyFeatures.map((feature, index) => (
                      <div key={index} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <feature.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Night Transfer Tips */}
                <section id="night-transfer-tips" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Night Transfer Safety Tips
                  </h2>
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      <h3 className="font-semibold text-foreground">Stay Safe with These Tips</h3>
                    </div>
                    <ul className="space-y-3">
                      {nightTransferTips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* Airports Covered */}
                <section id="airports-covered" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Airports We Cover 24/7
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Meet Transfer operates <strong>24 hours a day, 7 days a week</strong> at all major Turkish airports:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { code: "IST", name: "Istanbul Airport", city: "Istanbul" },
                      { code: "SAW", name: "Sabiha Gökçen Airport", city: "Istanbul" },
                      { code: "AYT", name: "Antalya Airport", city: "Antalya" },
                      { code: "DLM", name: "Dalaman Airport", city: "Muğla" },
                      { code: "BJV", name: "Milas-Bodrum Airport", city: "Bodrum" },
                      { code: "ADB", name: "Adnan Menderes Airport", city: "Izmir" },
                    ].map((airport, index) => (
                      <div key={index} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                        <MapPin className="w-5 h-5 text-primary" />
                        <div>
                          <span className="font-semibold text-foreground">{airport.code}</span>
                          <span className="text-muted-foreground text-sm"> - {airport.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Booking Process */}
                <section id="booking-process" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    How to Book Your Night Transfer
                  </h2>
                  <div className="space-y-4">
                    {[
                      { step: 1, title: "Enter Your Details", desc: "Provide flight number, destination, and passenger count" },
                      { step: 2, title: "Choose Your Vehicle", desc: "Select from Mercedes Vito, VIP Vito, or Maybach" },
                      { step: 3, title: "Pay Securely Online", desc: "No cash needed - pay by card before your trip" },
                      { step: 4, title: "Receive Confirmation", desc: "Get driver details and contact information via SMS/email" },
                      { step: 5, title: "Meet Your Driver", desc: "Your driver waits at arrivals with your name sign" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                          {item.step}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* CTA */}
                <BlogCTA />

                {/* FAQ Section */}
                <section id="faq" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-4">
                    {faqItems.map((item, index) => (
                      <div key={index} className="bg-card border border-border rounded-xl p-5">
                        <h3 className="font-semibold text-foreground mb-2">{item.question}</h3>
                        <p className="text-muted-foreground text-sm">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <ShareButtons title="Safe Night Airport Transfer in Turkey" />
              </div>

              {/* Sidebar */}
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-6">
                  <TableOfContents items={tocItems} />
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-2">Book Night Transfer</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      24/7 service with fixed prices
                    </p>
                    <Link
                      to="/#booking"
                      className="block w-full bg-primary text-primary-foreground text-center py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        <RelatedArticles currentArticleId="safe-night-transfer-turkey" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default SafeNightTransferTurkey;
