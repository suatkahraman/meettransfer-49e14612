import { useLanguage } from "@/contexts/LanguageContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ChevronRight, Shield, Clock, Crown, Users, Star, CheckCircle, Gem, Car, Sparkles, Award, Wine, Music, Wifi } from "lucide-react";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import heroImage from "@/assets/maybach-interior-starlight.jpg";

const LuxuryMaybachTransferTurkey = () => {
  const { t, language } = useLanguage();
  const { formatBlogDate } = useBlogDate();
  const formattedDate = formatBlogDate("2025-01-16");

  const faqItems = [
    {
      question: "What is Mercedes Maybach?",
      answer: "Mercedes-Maybach is the ultra-luxury sub-brand of Mercedes-Benz, representing the pinnacle of automotive luxury. The Maybach S-Class features: extended wheelbase for extra legroom, exclusive materials (Nappa leather, exotic wood), advanced technology (starlight headliner, massage seats), champagne cooler, and superior sound insulation."
    },
    {
      question: "How much does Maybach transfer cost in Turkey?",
      answer: "Mercedes Maybach transfer prices in Turkey: Istanbul Airport to city center: €250-350, Antalya Airport to hotels: €300-400, Full-day chauffeur (8 hours): €600-800, Wedding transfer: €400-600. All prices include: professional chauffeur, meet & greet, refreshments, and gratuity."
    },
    {
      question: "Can I book Maybach for wedding in Istanbul?",
      answer: "Yes! Meet Transfer offers Mercedes Maybach for weddings in Istanbul. Package includes: decorated vehicle with ribbons and flowers, professional chauffeur in formal attire, red carpet service, champagne on request, coordination with photographer, and flexible timing. Book 2-4 weeks in advance for availability."
    },
    {
      question: "What features does Maybach have?",
      answer: "Mercedes Maybach features: Starlight headliner (fiber optic ceiling), Executive rear seats with massage and ventilation, Champagne cooler with crystal flutes, Burmester 4D surround sound, Rear entertainment screens, Privacy partition, Extended legroom, HEPA air filtration, and Ambient lighting with 64 colors."
    },
    {
      question: "Where can I get Maybach transfer in Turkey?",
      answer: "Meet Transfer provides Maybach service at: Istanbul (IST & SAW airports), Antalya (AYT), Bodrum (BJV), Izmir (ADB), Ankara (ESB). Also available for: city tours, business meetings, events, weddings, and VIP occasions. Book 24-48 hours in advance for guaranteed availability."
    },
    {
      question: "Is Maybach transfer worth the price?",
      answer: "Maybach transfer is worth it for: special occasions (weddings, anniversaries), business travelers needing ultimate comfort, celebrities requiring privacy, anyone wanting an unforgettable experience. The vehicle cost is shared among passengers, making it more accessible for groups."
    },
    {
      question: "Can I hire Maybach with driver for full day?",
      answer: "Yes, Meet Transfer offers full-day Maybach chauffeur service. Includes: 8 hours of service, professional driver, fuel and tolls, unlimited stops within the city, refreshments. Popular for: city exploration, shopping trips, business meetings, or special occasions. Price: €600-800/day."
    },
    {
      question: "How do I book Mercedes Maybach transfer?",
      answer: "Book Maybach transfer with Meet Transfer: 1) Visit our website or WhatsApp, 2) Select 'Maybach' as vehicle type, 3) Enter pickup/dropoff details, 4) Receive instant quote, 5) Confirm and pay securely. Book 24-48 hours ahead for best availability, especially for weekends and events."
    }
  ];

  const maybachFeatures = [
    { icon: Star, title: "Starlight Headliner", description: "550 fiber optic lights creating a night sky" },
    { icon: Crown, title: "Executive Seats", description: "Massage, ventilation, full recline" },
    { icon: Wine, title: "Champagne Cooler", description: "Chilled refreshments with crystal flutes" },
    { icon: Music, title: "4D Sound System", description: "Burmester surround sound experience" },
    { icon: Shield, title: "Privacy Partition", description: "Complete discretion from driver" },
    { icon: Wifi, title: "Connectivity", description: "Wi-Fi, charging, entertainment screens" },
  ];

  const usesCases = [
    { title: "Airport VIP Transfer", description: "Arrive in ultimate style from Istanbul, Antalya, or any Turkish airport", icon: Car },
    { title: "Wedding Transportation", description: "Make your special day unforgettable with luxury arrival", icon: Sparkles },
    { title: "Business Meetings", description: "Impress clients and partners with executive transport", icon: Award },
    { title: "Special Occasions", description: "Anniversaries, proposals, milestone celebrations", icon: Gem },
  ];

  const tocItems = [
    { id: "what-is-maybach", title: "What is Mercedes Maybach" },
    { id: "features", title: "Maybach Features" },
    { id: "use-cases", title: "When to Book Maybach" },
    { id: "pricing", title: "Maybach Transfer Pricing" },
    { id: "how-to-book", title: "How to Book" },
    { id: "faq", title: "Frequently Asked Questions" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Mercedes Maybach Transfer Turkey | Ultimate Luxury | Meet Transfer"
        description="Book Mercedes Maybach transfer in Turkey. Starlight ceiling, massage seats, champagne cooler. Premium chauffeur service for airports, weddings, VIP occasions."
        keywords="Maybach transfer Turkey, Mercedes Maybach Istanbul, luxury car hire Turkey, Maybach wedding car, VIP airport transfer Maybach, chauffeur service Turkey"
        canonicalPath="/blog/luxury-maybach-transfer-turkey"
      />
      <SchemaOrg
        schemas={[
          {
            type: "LocalBusiness" as const,
            includeRating: true,
          },
          {
            type: "Article" as const,
            headline: "Mercedes Maybach Transfer in Turkey - Ultimate Luxury Experience",
            description: "Complete guide to Mercedes Maybach transfers in Turkey. Features, pricing, booking guide. The ultimate luxury chauffeur service.",
            datePublished: "2025-01-16",
            dateModified: "2025-01-16",
          },
          {
            type: "FAQPage" as const,
          },
        ]}
      />

      <ReadingProgressBar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Maybach Transfer Turkey</span>
          </nav>

          {/* Article Header */}
          <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                Ultra Luxury
              </span>
              <span className="text-muted-foreground text-sm flex items-center gap-1">
                <Clock className="h-4 w-4" /> 8 min read
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Mercedes Maybach Transfer in Turkey - The Ultimate Luxury
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Experience the pinnacle of automotive luxury. Starlight headliner, massage seats, champagne service. The most exclusive transfer in Turkey.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>By Meet Transfer Team</span>
              <span>•</span>
              <time dateTime="2025-01-16">{formattedDate}</time>
            </div>
          </header>

          {/* Hero Image */}
          <div className="relative rounded-xl overflow-hidden mb-8">
            <img
              src={heroImage}
              alt="Mercedes Maybach interior with starlight ceiling"
              className="w-full h-[400px] object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-400" />
                <span className="text-white font-medium">Ultimate Luxury Experience</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Table of Contents - Sidebar */}
            <aside className="lg:col-span-1">
              <TableOfContents items={tocItems} />
            </aside>

            {/* Article Content */}
            <article className="lg:col-span-3 prose prose-lg max-w-none">
              
              {/* Introduction */}
              <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl p-6 mb-8">
                <p className="text-lg leading-relaxed m-0">
                  The <strong>Mercedes-Maybach</strong> represents the absolute pinnacle of luxury transportation. When ordinary VIP service isn't enough, the Maybach delivers an experience reserved for royalty, celebrities, and those who demand the extraordinary.
                </p>
              </div>

              {/* What is Maybach */}
              <section id="what-is-maybach" className="mb-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Crown className="h-8 w-8 text-amber-500" />
                  What is Mercedes Maybach?
                </h2>
                <p>
                  <strong>Mercedes-Maybach</strong> is the ultra-luxury division of Mercedes-Benz, crafting vehicles that transcend ordinary luxury. Originally an independent German manufacturer dating to 1909, Maybach now represents the most exclusive offerings in the Mercedes lineup.
                </p>
                <p>
                  The <strong>Maybach S-Class</strong> features an extended wheelbase, adding 7 inches of rear legroom for passengers who expect first-class comfort. Every surface is finished with the finest materials: Nappa leather, exotic woods, metal accents, and hand-stitched details.
                </p>

                <div className="bg-muted/50 rounded-xl p-6 my-6">
                  <h3 className="text-xl font-semibold mb-4">Maybach vs Regular S-Class</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-amber-500" />
                      <span>7 inches more legroom in rear</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-amber-500" />
                      <span>Exclusive Maybach design elements</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-amber-500" />
                      <span>Executive rear seats with full recline</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-amber-500" />
                      <span>Champagne cooler and crystal flutes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-amber-500" />
                      <span>550-star fiber optic headliner</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Features */}
              <section id="features" className="mb-12">
                <h2 className="text-3xl font-bold mb-6">Maybach Features & Amenities</h2>
                <div className="grid md:grid-cols-2 gap-4 not-prose">
                  {maybachFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 border border-amber-500/10 rounded-lg">
                      <div className="bg-amber-500/10 p-3 rounded-full">
                        <feature.icon className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Use Cases */}
              <section id="use-cases" className="mb-12">
                <h2 className="text-3xl font-bold mb-6">When to Book Maybach Transfer</h2>
                <div className="grid md:grid-cols-2 gap-4 not-prose">
                  {usesCases.map((useCase, index) => (
                    <div key={index} className="p-5 border rounded-xl hover:border-amber-500/50 transition-colors">
                      <useCase.icon className="h-8 w-8 text-amber-500 mb-3" />
                      <h3 className="font-bold text-lg mb-2">{useCase.title}</h3>
                      <p className="text-muted-foreground text-sm">{useCase.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Pricing */}
              <section id="pricing" className="mb-12">
                <h2 className="text-3xl font-bold mb-6">Maybach Transfer Pricing</h2>
                <div className="space-y-4 not-prose">
                  <div className="border rounded-xl p-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Airport Transfer (one-way)</span>
                      <span className="text-amber-600 font-bold">€250-400</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Istanbul IST/SAW, Antalya, Bodrum to city/hotel</p>
                  </div>
                  <div className="border rounded-xl p-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Full Day Service (8 hours)</span>
                      <span className="text-amber-600 font-bold">€600-800</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Unlimited city stops, fuel and tolls included</p>
                  </div>
                  <div className="border rounded-xl p-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Wedding Package</span>
                      <span className="text-amber-600 font-bold">€400-600</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Decorated vehicle, ribbons, champagne, red carpet</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  * All prices include: professional chauffeur, meet & greet, refreshments, Wi-Fi, and 60 minutes waiting time.
                </p>
              </section>

              {/* How to Book */}
              <section id="how-to-book" className="mb-12">
                <h2 className="text-3xl font-bold mb-6">How to Book Maybach Transfer</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                    <div>
                      <h3 className="font-semibold">Select Maybach</h3>
                      <p className="text-muted-foreground">Choose Mercedes Maybach from our vehicle options on website or WhatsApp.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                    <div>
                      <h3 className="font-semibold">Enter Details</h3>
                      <p className="text-muted-foreground">Provide pickup location, destination, date/time, and any special requests.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                    <div>
                      <h3 className="font-semibold">Confirm Booking</h3>
                      <p className="text-muted-foreground">Receive instant quote, pay securely, get confirmation with chauffeur details.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                    <div>
                      <h3 className="font-semibold">Experience Luxury</h3>
                      <p className="text-muted-foreground">Your chauffeur awaits. Sit back and enjoy the ultimate luxury transfer.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* CTA */}
              <BlogCTA />

              {/* FAQ Section */}
              <section id="faq" className="mb-12">
                <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4 not-prose">
                  {faqItems.map((item, index) => (
                    <details key={index} className="group border rounded-lg">
                      <summary className="flex items-center justify-between p-4 cursor-pointer font-medium hover:bg-muted/50 transition-colors">
                        {item.question}
                        <ChevronRight className="h-5 w-5 transition-transform group-open:rotate-90" />
                      </summary>
                      <div className="p-4 pt-0 text-muted-foreground">
                        {item.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </section>

              {/* Share Buttons */}
              <ShareButtons title="Mercedes Maybach Transfer in Turkey - Ultimate Luxury" />

            </article>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      <RelatedArticles currentArticleId="luxury-maybach-transfer-turkey" />

      <Footer />
    </WebsiteLayout>
  );
};

export default LuxuryMaybachTransferTurkey;
