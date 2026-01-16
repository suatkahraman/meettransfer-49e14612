import { useLanguage } from "@/contexts/LanguageContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ChevronRight, Shield, Clock, Lightbulb, Star, CheckCircle, AlertTriangle, ThumbsUp, ThumbsDown, Search, Calendar, CreditCard } from "lucide-react";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";
import heroImage from "@/assets/vito-airport-premium.jpg";

const AirportTransferBookingTips = () => {
  const { t, language } = useLanguage();
  const { formatBlogDate } = useBlogDate();
  const formattedDate = formatBlogDate("2025-01-15");

  const faqItems = [
    {
      question: "When should I book my airport transfer in Turkey?",
      answer: "Book your airport transfer at least 24-48 hours in advance for best availability. During peak season (June-September), book 3-7 days ahead. Last-minute bookings are possible with Meet Transfer, but advance booking guarantees your preferred vehicle and gives you peace of mind."
    },
    {
      question: "What information do I need to book an airport transfer?",
      answer: "To book an airport transfer, you need: flight number (for arrival tracking), pickup location (airport or address), drop-off destination (hotel name or address), date and time, number of passengers, and contact details (phone/WhatsApp for driver communication). Optional: child seat requirements and luggage details."
    },
    {
      question: "Should I pay for airport transfer in advance or cash?",
      answer: "We recommend paying online in advance with Meet Transfer. Benefits: confirmed booking, no cash needed on arrival, no payment disputes, transparent pricing. We accept all major credit cards. If you prefer, you can also pay cash to the driver in EUR, USD, or TRY."
    },
    {
      question: "How do I know if an airport transfer company is reliable?",
      answer: "Check for: Google reviews (4.5+ stars), established business history, transparent pricing (no hidden fees), professional website, responsive customer service, clear cancellation policy, and flight tracking feature. Meet Transfer has 500+ Google reviews with 4.9 rating and 5+ years operating."
    },
    {
      question: "What should I do if my flight is delayed?",
      answer: "With Meet Transfer, you don't need to do anything - we automatically track your flight and adjust pickup time. Other tips: ensure you've provided correct flight number, have the transfer company's WhatsApp number saved, and communicate any significant delays. We offer 60 minutes free waiting time."
    },
    {
      question: "Is it better to book transfer or take taxi from airport in Turkey?",
      answer: "Pre-booked transfers are better because: fixed prices (no meter surprises), driver waiting at arrivals, no language barriers, luggage space guaranteed, child seats available, and no negotiation needed. Taxis can have variable pricing and availability issues, especially at night."
    },
    {
      question: "How early should my transfer arrive before my departure flight?",
      answer: "For departures, we recommend arriving at airport: 3 hours before international flights, 2 hours before domestic flights. Book your pickup time accordingly, considering traffic. Meet Transfer drivers know local traffic patterns and will advise on pickup time."
    },
    {
      question: "Can I cancel or modify my airport transfer booking?",
      answer: "With Meet Transfer: free cancellation up to 24 hours before pickup, modifications accepted based on availability, and no fees for flight-related changes. Always check the cancellation policy when booking. We're flexible with changes - just contact us via WhatsApp."
    }
  ];

  const dosList = [
    "Book at least 24-48 hours in advance",
    "Provide accurate flight number for tracking",
    "Double-check pickup and drop-off addresses",
    "Save driver's contact number before travel",
    "Confirm booking details the day before",
    "Specify child seat needs when booking",
    "Keep booking confirmation accessible offline",
    "Share your flight details for delay tracking",
  ];

  const dontsList = [
    "Wait until last minute during peak season",
    "Book without checking reviews first",
    "Ignore cancellation policy terms",
    "Forget to provide contact phone number",
    "Assume child seats are automatically included",
    "Leave luggage count unspecified",
    "Book with companies that have no online presence",
    "Pay extra for 'special' services at airport",
  ];

  const bookingChecklist = [
    { icon: Calendar, item: "Select correct date and time" },
    { icon: Search, item: "Verify pickup location (terminal, address)" },
    { icon: Search, item: "Confirm drop-off destination" },
    { icon: Lightbulb, item: "Enter correct flight number" },
    { icon: Lightbulb, item: "Specify number of passengers" },
    { icon: Lightbulb, item: "Note luggage and child seat needs" },
    { icon: CreditCard, item: "Complete secure payment" },
    { icon: CheckCircle, item: "Save confirmation and driver contact" },
  ];

  const tocItems = [
    { id: "when-to-book", title: "When to Book" },
    { id: "what-you-need", title: "What You Need to Book" },
    { id: "dos-donts", title: "Do's and Don'ts" },
    { id: "booking-checklist", title: "Booking Checklist" },
    { id: "payment-tips", title: "Payment Tips" },
    { id: "faq", title: "Frequently Asked Questions" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Airport Transfer Booking Tips Turkey | Complete Guide | Meet Transfer"
        description="Expert tips for booking airport transfers in Turkey. When to book, what to check, payment advice. Avoid common mistakes and get the best service."
        keywords="airport transfer booking tips Turkey, how to book transfer Turkey, airport pickup booking, transfer reservation tips, Turkey travel tips, book airport taxi Turkey"
        canonicalPath="/blog/airport-transfer-booking-tips"
      />
      <SchemaOrg
        schemas={[
          {
            type: "LocalBusiness" as const,
            includeRating: true,
          },
          {
            type: "Article" as const,
            headline: "Airport Transfer Booking Tips for Turkey - Expert Guide",
            description: "Complete guide to booking airport transfers in Turkey. Expert tips on timing, payment, and avoiding common mistakes.",
            datePublished: "2025-01-15",
            dateModified: "2025-01-15",
            image: heroImage,
            author: "Meet Transfer",
            readingTime: "8",
            wordCount: 2000,
            keywords: ["airport transfer booking tips", "Turkey transfer booking", "how to book airport transfer", "travel tips Turkey"],
          },
          {
            type: "BreadcrumbList" as const,
            items: [
              { name: "Home", url: "/" },
              { name: "Blog", url: "/blog" },
              { name: "Airport Transfer Booking Tips", url: "/blog/airport-transfer-booking-tips" },
            ],
          },
          {
            type: "FAQPage" as const,
            questions: faqItems.map(item => ({ question: item.question, answer: item.answer })),
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
            <span className="text-foreground">Airport Transfer Booking Tips</span>
          </nav>
        </div>

        {/* Hero Section */}
        <header className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Lightbulb className="w-4 h-4" />
              <span>Expert Tips</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Airport Transfer Booking Tips for Turkey
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
              Learn the insider secrets to booking the perfect airport transfer. Avoid common mistakes, 
              get the best prices, and ensure a smooth arrival in Turkey.
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
                Expert Guide
              </span>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        <div className="container mx-auto px-4 mb-12">
          <div className="max-w-4xl mx-auto">
            <OptimizedBlogImage
              src={heroImage}
              alt="Airport transfer booking tips for Turkey"
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
                
                {/* When to Book */}
                <section id="when-to-book" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    When Should You Book Your Airport Transfer?
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Timing is everything when it comes to booking airport transfers in Turkey. Here's what 
                    experienced travelers recommend:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Ideal: 3-7 Days Before Travel
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Best availability, guaranteed preferred vehicle, peace of mind
                      </p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        Acceptable: 24-48 Hours Before
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Usually available, may have limited vehicle options during peak times
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Last Minute: Same Day
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Possible with Meet Transfer, but no guarantees during busy periods
                      </p>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-6">
                    <p className="text-sm text-muted-foreground">
                      <strong>Peak Season Alert:</strong> During June-September, book at least 1 week ahead 
                      for popular routes like Antalya, Bodrum, and Istanbul airports.
                    </p>
                  </div>
                </section>

                {/* What You Need */}
                <section id="what-you-need" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    What Information Do You Need to Book?
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Have these details ready before booking your transfer:
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { label: "Flight Number", desc: "e.g., TK1234 (for arrival tracking)", required: true },
                      { label: "Pickup Location", desc: "Airport terminal or full address", required: true },
                      { label: "Drop-off Address", desc: "Hotel name or exact address", required: true },
                      { label: "Date & Time", desc: "Arrival or departure time", required: true },
                      { label: "Passenger Count", desc: "Including children", required: true },
                      { label: "Contact Phone", desc: "WhatsApp preferred for updates", required: true },
                      { label: "Child Seats", desc: "Type and quantity needed", required: false },
                      { label: "Luggage Count", desc: "Especially if oversized", required: false },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
                        {item.required ? (
                          <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-medium text-foreground">{item.label}</span>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Do's and Don'ts */}
                <section id="dos-donts" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                    Booking Do's and Don'ts
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-5">
                      <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                        <ThumbsUp className="w-5 h-5 text-green-600" />
                        Do's
                      </h3>
                      <ul className="space-y-2">
                        {dosList.map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-5">
                      <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                        <ThumbsDown className="w-5 h-5 text-red-600" />
                        Don'ts
                      </h3>
                      <ul className="space-y-2">
                        {dontsList.map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Booking Checklist */}
                <section id="booking-checklist" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Complete Booking Checklist
                  </h2>
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="space-y-3">
                      {bookingChecklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded border-2 border-muted-foreground/30 flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">{index + 1}</span>
                          </div>
                          <item.icon className="w-4 h-4 text-primary" />
                          <span className="text-foreground">{item.item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Payment Tips */}
                <section id="payment-tips" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Payment Tips
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-card border border-border rounded-xl p-5">
                      <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        Online Payment (Recommended)
                      </h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Secure and confirmed booking</li>
                        <li>• No cash needed on arrival</li>
                        <li>• Clear price with no surprises</li>
                        <li>• Easy refund if cancellation needed</li>
                      </ul>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-5">
                      <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Cash Payment
                      </h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Available with Meet Transfer in EUR, USD, TRY</li>
                        <li>• Confirm exact amount when booking</li>
                        <li>• Have correct change ready</li>
                        <li>• Avoid paying unknown "extra" fees</li>
                      </ul>
                    </div>
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

                <ShareButtons title="Airport Transfer Booking Tips for Turkey" />
              </div>

              {/* Sidebar */}
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-6">
                  <TableOfContents items={tocItems} />
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-2">Ready to Book?</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Apply these tips now
                    </p>
                    <Link
                      to="/#booking"
                      className="block w-full bg-primary text-primary-foreground text-center py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Book Transfer
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        <RelatedArticles currentArticleId="airport-transfer-booking-tips" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default AirportTransferBookingTips;
