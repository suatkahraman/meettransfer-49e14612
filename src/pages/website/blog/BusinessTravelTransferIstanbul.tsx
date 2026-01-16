import { useLanguage } from "@/contexts/LanguageContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ChevronRight, Shield, Clock, Briefcase, Users, Star, CheckCircle, Wifi, Car, CreditCard, FileText, Building } from "lucide-react";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";
import heroImage from "@/assets/mercedes-maybach-interior.jpg";

const BusinessTravelTransferIstanbul = () => {
  const { t, language } = useLanguage();
  const { formatBlogDate } = useBlogDate();
  const formattedDate = formatBlogDate("2025-01-14");

  const faqItems = [
    {
      question: "What is the best executive airport transfer in Istanbul?",
      answer: "Meet Transfer is the best executive airport transfer in Istanbul for business travelers. We offer: Mercedes Maybach and VIP Vito vehicles, professional chauffeurs in formal attire, Wi-Fi connectivity, privacy partitions, corporate invoicing, and 24/7 availability. Perfect for executives, CEOs, and corporate clients."
    },
    {
      question: "Does Meet Transfer provide corporate accounts for business travel?",
      answer: "Yes, Meet Transfer offers corporate accounts with: centralized billing, monthly invoicing, dedicated account manager, priority booking, volume discounts, detailed trip reports, and expense management integration. Contact us to set up a corporate account for your company."
    },
    {
      question: "Can I work during my airport transfer in Istanbul?",
      answer: "Absolutely. Our VIP vehicles feature: complimentary high-speed Wi-Fi, USB charging ports, privacy glass, spacious seating, quiet ride, and climate control. Many executives use transfer time for emails, calls, or preparation for meetings. We ensure a productive journey."
    },
    {
      question: "What vehicles does Meet Transfer offer for business travelers?",
      answer: "For business travelers, we offer: Mercedes Maybach (ultimate luxury), Mercedes VIP Vito (executive group travel), Mercedes E-Class (individual executive), and Mercedes S-Class (premium sedan). All vehicles are immaculate, late-model, and equipped with business amenities."
    },
    {
      question: "Does Meet Transfer provide invoices for business expenses?",
      answer: "Yes, we provide detailed invoices for all transfers. Invoices include: company name, date, route, vehicle type, and total amount. Perfect for expense reports and corporate reimbursement. We can also provide monthly consolidated invoices for corporate accounts."
    },
    {
      question: "Can Meet Transfer handle VIP client airport pickup?",
      answer: "Yes, we specialize in VIP client pickups. Services include: meet & greet at arrivals, luggage assistance, name board with company logo (optional), VIP lounge coordination, protocol vehicles for delegations, and multilingual chauffeurs. Impress your clients from arrival."
    },
    {
      question: "Is Meet Transfer reliable for important business meetings?",
      answer: "100% reliable. We have a 98% on-time record, real-time flight tracking, backup vehicle protocols, experienced professional drivers, and 24/7 operations team. We understand that for business travelers, time is money. We never let you down."
    },
    {
      question: "Does Meet Transfer serve business hotels in Istanbul?",
      answer: "Yes, we serve all business hotels in Istanbul including: Four Seasons, Raffles, St. Regis, Shangri-La, Çırağan Palace, Swissôtel, Hilton, Marriott, and all hotels near Maslak, Levent, and Taksim business districts. Door-to-door service."
    }
  ];

  const businessFeatures = [
    { icon: Wifi, title: "In-Car Wi-Fi", description: "Stay connected with complimentary high-speed internet" },
    { icon: FileText, title: "Corporate Invoicing", description: "Detailed invoices for expense reporting" },
    { icon: Shield, title: "Reliability", description: "98% on-time arrival rate for meetings" },
    { icon: Car, title: "Executive Fleet", description: "Mercedes Maybach, S-Class, VIP Vito" },
    { icon: CreditCard, title: "Easy Payment", description: "Card, invoice, or corporate account" },
    { icon: Building, title: "Hotel Coverage", description: "All major business hotels served" },
  ];

  const executiveVehicles = [
    { 
      name: "Mercedes Maybach", 
      type: "Ultimate Luxury",
      features: ["Rear executive seating", "Privacy partition", "Premium sound", "Champagne cooler"],
      ideal: "CEOs, VIPs, high-profile clients",
      price: "From €180"
    },
    { 
      name: "Mercedes S-Class", 
      type: "Executive Sedan",
      features: ["Leather interior", "Wi-Fi", "USB charging", "Climate control"],
      ideal: "Individual business travelers",
      price: "From €120"
    },
    { 
      name: "Mercedes VIP Vito", 
      type: "Executive Van",
      features: ["Starlight ceiling", "Reclining seats", "Mini bar", "Privacy glass"],
      ideal: "Executive groups, delegations",
      price: "From €90"
    },
  ];

  const tocItems = [
    { id: "executive-transfers", title: "Executive Airport Transfers" },
    { id: "business-features", title: "Business Travel Features" },
    { id: "vehicle-fleet", title: "Executive Vehicle Fleet" },
    { id: "corporate-services", title: "Corporate Services" },
    { id: "business-areas", title: "Istanbul Business Areas" },
    { id: "faq", title: "Frequently Asked Questions" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Executive Airport Transfer Istanbul | Business Travel | Meet Transfer"
        description="Premium executive airport transfers in Istanbul for business travelers. Corporate invoicing, Wi-Fi, Mercedes Maybach fleet. Reliable service for professionals."
        keywords="executive airport transfer Istanbul, business travel Istanbul, corporate transfer Turkey, VIP airport pickup Istanbul, business taxi Istanbul, executive chauffeur Istanbul"
        canonicalPath="/blog/business-travel-transfer-istanbul"
      />
      <SchemaOrg
        schemas={[
          {
            type: "LocalBusiness" as const,
            includeRating: true,
          },
          {
            type: "Article" as const,
            headline: "Executive Airport Transfer Istanbul - Business Travel Guide",
            description: "Complete guide to executive airport transfers in Istanbul for business travelers, corporate clients, and VIPs.",
            datePublished: "2025-01-14",
            dateModified: "2025-01-14",
            image: heroImage,
          },
          {
            type: "BreadcrumbList" as const,
            items: [
              { name: "Home", url: "/" },
              { name: "Blog", url: "/blog" },
              { name: "Business Travel Transfer Istanbul", url: "/blog/business-travel-transfer-istanbul" },
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
            <span className="text-foreground">Business Travel Transfer Istanbul</span>
          </nav>
        </div>

        {/* Hero Section */}
        <header className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Briefcase className="w-4 h-4" />
              <span>Executive Transfers</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Executive Airport Transfer Istanbul
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
              Premium business travel transfers for executives, corporate clients, and professionals. 
              Mercedes Maybach fleet, corporate invoicing, and 24/7 reliable service in Istanbul.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                6 min read
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
              alt="Executive airport transfer Istanbul with Mercedes Maybach"
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
                <section id="executive-transfers" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Executive Airport Transfers in Istanbul
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    For business travelers, airport transfers aren't just about getting from A to B. It's about 
                    making the right impression, using time productively, and arriving ready for success. 
                    <strong> Meet Transfer</strong> understands the unique needs of corporate clients.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    From the moment you land at Istanbul Airport, our professional chauffeurs provide a seamless 
                    experience. Work during your transfer with in-car Wi-Fi, relax in our Mercedes Maybach fleet, 
                    or use the quiet journey to prepare for important meetings. We handle the logistics while you 
                    focus on business.
                  </p>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 my-6">
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-6 h-6 text-primary shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Why Business Travelers Choose Us</h3>
                        <ul className="text-muted-foreground space-y-1 text-sm">
                          <li>• 98% on-time reliability for meetings</li>
                          <li>• Corporate accounts with monthly invoicing</li>
                          <li>• Mercedes Maybach, S-Class, VIP Vito fleet</li>
                          <li>• Complimentary Wi-Fi in all vehicles</li>
                          <li>• Professional chauffeurs in formal attire</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Business Features */}
                <section id="business-features" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                    Business Travel Features
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {businessFeatures.map((feature, index) => (
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

                {/* Vehicle Fleet */}
                <section id="vehicle-fleet" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                    Executive Vehicle Fleet
                  </h2>
                  <div className="space-y-4">
                    {executiveVehicles.map((vehicle, index) => (
                      <div key={index} className="bg-card border border-border rounded-xl p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <Car className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-foreground text-lg">{vehicle.name}</h3>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{vehicle.type}</span>
                          </div>
                          <span className="font-bold text-primary">{vehicle.price}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {vehicle.features.map((feature, i) => (
                            <span key={i} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Ideal for: {vehicle.ideal}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Corporate Services */}
                <section id="corporate-services" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Corporate Services
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Meet Transfer offers comprehensive corporate solutions for businesses:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { title: "Corporate Accounts", desc: "Centralized billing for your organization" },
                      { title: "Monthly Invoicing", desc: "Consolidated invoices for easy expense management" },
                      { title: "Dedicated Manager", desc: "Personal account manager for your company" },
                      { title: "Priority Booking", desc: "Guaranteed availability for urgent requests" },
                      { title: "Volume Discounts", desc: "Reduced rates for regular bookings" },
                      { title: "Trip Reports", desc: "Detailed reports for expense tracking" },
                    ].map((service, index) => (
                      <div key={index} className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground">{service.title}</span>
                          <p className="text-sm text-muted-foreground">{service.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Business Areas */}
                <section id="business-areas" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Istanbul Business Areas We Serve
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    We provide executive transfers to all Istanbul business districts:
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      "Maslak Financial District",
                      "Levent Business Center",
                      "Taksim / Beyoğlu",
                      "Şişli / Mecidiyeköy",
                      "Ataşehir Business District",
                      "Kadıköy / Asian Side",
                      "Beşiktaş",
                      "Sarıyer / Tarabya",
                      "All 5-Star Hotels",
                    ].map((area, index) => (
                      <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                        <Building className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground">{area}</span>
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

                <ShareButtons title="Executive Airport Transfer Istanbul" />
              </div>

              {/* Sidebar */}
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-6">
                  <TableOfContents items={tocItems} />
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-2">Corporate Account</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Set up business account
                    </p>
                    <Link
                      to="/#booking"
                      className="block w-full bg-primary text-primary-foreground text-center py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Contact Us
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        <RelatedArticles currentArticleId="business-travel-transfer-istanbul" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default BusinessTravelTransferIstanbul;
