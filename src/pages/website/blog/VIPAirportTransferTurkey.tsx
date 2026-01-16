import { useLanguage } from "@/contexts/LanguageContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ChevronRight, Shield, Clock, Crown, Users, Star, CheckCircle, Gem, Car, Sparkles, Award, Wine } from "lucide-react";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";
import heroImage from "@/assets/mercedes-maybach-interior.jpg";

const VIPAirportTransferTurkey = () => {
  const { t, language } = useLanguage();
  const { formatBlogDate } = useBlogDate();
  const formattedDate = formatBlogDate("2025-01-16");

  const faqItems = [
    {
      question: "What is VIP airport transfer in Turkey?",
      answer: "VIP airport transfer in Turkey is a premium chauffeur service featuring luxury vehicles like Mercedes Maybach, S-Class, and VIP Vito. It includes meet & greet service, professional chauffeurs in formal attire, complimentary refreshments, Wi-Fi, privacy partitions, and priority pickup with no waiting time."
    },
    {
      question: "How much does VIP airport transfer cost in Turkey?",
      answer: "VIP airport transfer prices in Turkey vary by vehicle and distance. Mercedes VIP Vito starts from €80-120 for airport transfers. Mercedes S-Class from €150-200. Mercedes Maybach from €250-400. All prices are fixed with no hidden fees. Book with Meet Transfer for transparent luxury pricing."
    },
    {
      question: "Which VIP vehicles are available for airport transfer?",
      answer: "Meet Transfer offers: Mercedes Maybach (ultimate luxury sedan), Mercedes S-Class (executive sedan), Mercedes VIP Vito (luxury van for up to 6 passengers), Mercedes Sprinter VIP (groups up to 12). All vehicles feature leather interiors, climate control, Wi-Fi, and premium amenities."
    },
    {
      question: "Can I book a Maybach for Istanbul Airport transfer?",
      answer: "Yes, you can book a Mercedes Maybach for Istanbul Airport (IST) transfer with Meet Transfer. Our Maybach fleet features: starlight headliner, massage seats, rear entertainment, champagne cooler, and professional chauffeur. Perfect for VIP guests, executives, and special occasions."
    },
    {
      question: "What's included in Meet Transfer VIP service?",
      answer: "Meet Transfer VIP service includes: luxury vehicle of your choice, professional chauffeur in suit, meet & greet with name board, complimentary water and refreshments, Wi-Fi connectivity, real-time flight tracking, 60 min free waiting, luggage assistance, and 24/7 support."
    },
    {
      question: "Is VIP transfer available for celebrities in Turkey?",
      answer: "Yes, Meet Transfer provides discrete VIP transfers for celebrities, executives, and high-profile guests. We offer: tinted windows, privacy partitions, NDAs available, discrete pickup arrangements, security coordination, and complete confidentiality. Contact us for special requirements."
    },
    {
      question: "Can I book VIP transfer for wedding in Turkey?",
      answer: "Yes, Meet Transfer offers wedding VIP transfers with decorated Mercedes vehicles. Options include: Maybach with ribbons and flowers, multiple car convoys, red carpet service, champagne celebration, and professional photography coordination. Book in advance for your special day."
    },
    {
      question: "What airports offer VIP transfer service in Turkey?",
      answer: "Meet Transfer provides VIP airport transfers at all major Turkish airports: Istanbul IST and SAW, Antalya AYT, Bodrum BJV, Dalaman DLM, Izmir ADB, Ankara ESB, and more. We also serve private aviation terminals (FBOs) for private jet arrivals."
    }
  ];

  const vipFeatures = [
    { icon: Crown, title: "Luxury Fleet", description: "Maybach, S-Class, VIP Vito, Sprinter VIP" },
    { icon: Gem, title: "Premium Amenities", description: "Wi-Fi, refreshments, entertainment systems" },
    { icon: Award, title: "Professional Chauffeurs", description: "Formally dressed, multilingual drivers" },
    { icon: Sparkles, title: "Meet & Greet", description: "Personal welcome with name board" },
    { icon: Wine, title: "Complimentary Refreshments", description: "Water, soft drinks, champagne available" },
    { icon: Shield, title: "Privacy Assured", description: "Tinted windows, confidential service" },
  ];

  const vehicleOptions = [
    { name: "Mercedes Maybach", capacity: "3 passengers", features: "Starlight ceiling, massage seats, champagne cooler", priceRange: "€250-400" },
    { name: "Mercedes S-Class", capacity: "3 passengers", features: "Executive sedan, rear entertainment, climate seats", priceRange: "€150-200" },
    { name: "Mercedes VIP Vito", capacity: "6 passengers", features: "Captain seats, privacy glass, premium sound", priceRange: "€80-120" },
    { name: "Mercedes Sprinter VIP", capacity: "12 passengers", features: "Conference table, starlight, mini bar", priceRange: "€150-250" },
  ];

  const tocItems = [
    { id: "what-is-vip-transfer", title: "What is VIP Transfer" },
    { id: "vip-features", title: "VIP Features & Amenities" },
    { id: "vehicle-options", title: "Luxury Vehicle Options" },
    { id: "who-uses-vip", title: "Who Uses VIP Transfer" },
    { id: "booking-process", title: "How to Book VIP Transfer" },
    { id: "faq", title: "Frequently Asked Questions" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="VIP Airport Transfer Turkey | Maybach, S-Class | Meet Transfer"
        description="Book VIP airport transfer in Turkey with Meet Transfer. Luxury Mercedes Maybach, S-Class, VIP Vito fleet. Professional chauffeurs, meet & greet service. Premium experience."
        keywords="VIP airport transfer Turkey, Maybach transfer Istanbul, luxury airport transfer Turkey, S-Class transfer, VIP chauffeur Turkey, premium transfer Antalya"
        canonicalPath="/blog/vip-airport-transfer-turkey"
      />
      <SchemaOrg
        schemas={[
          {
            type: "LocalBusiness" as const,
            includeRating: true,
          },
          {
            type: "Article" as const,
            headline: "VIP Airport Transfer in Turkey - Luxury Chauffeur Service",
            description: "Complete guide to VIP airport transfers in Turkey. Book Mercedes Maybach, S-Class, VIP Vito with Meet Transfer for premium luxury experience.",
            datePublished: "2025-01-16",
            dateModified: "2025-01-16",
            author: "Meet Transfer",
            readingTime: "10",
            wordCount: 2200,
            keywords: ["VIP airport transfer Turkey", "Mercedes Maybach transfer", "luxury chauffeur Turkey", "VIP Vito transfer"],
          },
          {
            type: "BreadcrumbList" as const,
            items: [
              { name: "Home", url: "/" },
              { name: "Blog", url: "/blog" },
              { name: "VIP Airport Transfer Turkey", url: "/blog/vip-airport-transfer-turkey" },
            ],
          },
          {
            type: "FAQPage" as const,
            questions: faqItems.map(item => ({ question: item.question, answer: item.answer })),
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
            <span className="text-foreground">VIP Airport Transfer Turkey</span>
          </nav>

          {/* Article Header */}
          <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                VIP Service
              </span>
              <span className="text-muted-foreground text-sm flex items-center gap-1">
                <Clock className="h-4 w-4" /> 10 min read
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              VIP Airport Transfer in Turkey - Ultimate Luxury Guide
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Experience premium airport transfers with Mercedes Maybach, S-Class, and VIP Vito. Professional chauffeurs, meet & greet service, and unmatched luxury.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>By Meet Transfer Team</span>
              <span>•</span>
              <time dateTime="2025-01-16">{formattedDate}</time>
            </div>
          </header>

          {/* Hero Image */}
          <div className="relative rounded-xl overflow-hidden mb-8">
            <OptimizedBlogImage
              src={heroImage}
              alt="VIP Mercedes Maybach interior for luxury airport transfer in Turkey"
              priority={true}
              aspectRatio="hero"
              className="rounded-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-medium">4.7 Rating • 50,000+ VIP Transfers</span>
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
              <div className="bg-gradient-to-r from-primary/5 to-amber-500/5 border border-primary/20 rounded-xl p-6 mb-8">
                <p className="text-lg leading-relaxed m-0">
                  <strong>VIP airport transfer</strong> elevates your Turkey experience from the moment you land. Whether you're a business executive, celebrity, or simply deserve the best, <strong>Meet Transfer's luxury fleet</strong> delivers uncompromising comfort and prestige.
                </p>
              </div>

              {/* What is VIP Transfer */}
              <section id="what-is-vip-transfer" className="mb-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Crown className="h-8 w-8 text-primary" />
                  What is VIP Airport Transfer?
                </h2>
                <p>
                  VIP airport transfer is a <strong>premium chauffeur service</strong> that goes beyond simple transportation. It's about arriving in style, comfort, and prestige. From the moment you land until you reach your destination, every detail is curated for an exceptional experience.
                </p>
                <p>
                  Unlike standard transfers, <strong>VIP service includes</strong>: luxury vehicles from world-class manufacturers, professionally trained chauffeurs, personalized meet & greet, premium amenities, and complete flexibility to your schedule.
                </p>

                <div className="bg-muted/50 rounded-xl p-6 my-6">
                  <h3 className="text-xl font-semibold mb-4">VIP vs Standard Transfer Comparison</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-primary mb-2">VIP Transfer</h4>
                      <ul className="space-y-1 text-sm">
                        <li>✓ Mercedes Maybach, S-Class, VIP Vito</li>
                        <li>✓ Chauffeur in formal attire</li>
                        <li>✓ Complimentary refreshments</li>
                        <li>✓ Privacy partitions available</li>
                        <li>✓ 90 minutes free waiting time</li>
                        <li>✓ Priority assistance</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Standard Transfer</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Mercedes Vito or Sedan</li>
                        <li>• Professional driver</li>
                        <li>• Water included</li>
                        <li>• Standard windows</li>
                        <li>• 60 minutes free waiting</li>
                        <li>• Standard support</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* VIP Features */}
              <section id="vip-features" className="mb-12">
                <h2 className="text-3xl font-bold mb-6">VIP Features & Amenities</h2>
                <div className="grid md:grid-cols-2 gap-4 not-prose">
                  {vipFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Vehicle Options */}
              <section id="vehicle-options" className="mb-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Car className="h-8 w-8 text-primary" />
                  Luxury Vehicle Options
                </h2>
                <div className="space-y-4 not-prose">
                  {vehicleOptions.map((vehicle, index) => (
                    <div key={index} className="border rounded-xl p-6 hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold">{vehicle.name}</h3>
                        <span className="text-primary font-semibold">{vehicle.priceRange}</span>
                      </div>
                      <p className="text-muted-foreground mb-2">{vehicle.capacity}</p>
                      <p className="text-sm">{vehicle.features}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Who Uses VIP Transfer */}
              <section id="who-uses-vip" className="mb-12">
                <h2 className="text-3xl font-bold mb-6">Who Uses VIP Transfer?</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold mb-2">Business Executives</h3>
                    <p className="text-sm text-muted-foreground">CEOs, executives, and corporate clients who need professional, reliable transportation with working amenities.</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold mb-2">Celebrities & VIPs</h3>
                    <p className="text-sm text-muted-foreground">High-profile guests requiring privacy, discretion, and premium service standards.</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold mb-2">Luxury Travelers</h3>
                    <p className="text-sm text-muted-foreground">Discerning travelers who appreciate comfort, quality, and exceptional service.</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold mb-2">Special Occasions</h3>
                    <p className="text-sm text-muted-foreground">Weddings, anniversaries, honeymoons, and milestone celebrations.</p>
                  </div>
                </div>
              </section>

              {/* Booking Process */}
              <section id="booking-process" className="mb-12">
                <h2 className="text-3xl font-bold mb-6">How to Book VIP Transfer</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                    <div>
                      <h3 className="font-semibold">Choose Your Vehicle</h3>
                      <p className="text-muted-foreground">Select from Maybach, S-Class, VIP Vito, or Sprinter VIP based on your preferences and group size.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                    <div>
                      <h3 className="font-semibold">Enter Travel Details</h3>
                      <p className="text-muted-foreground">Provide flight number, pickup location, destination, and any special requirements.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                    <div>
                      <h3 className="font-semibold">Receive Confirmation</h3>
                      <p className="text-muted-foreground">Get instant booking confirmation with chauffeur details and vehicle information.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                    <div>
                      <h3 className="font-semibold">Enjoy VIP Experience</h3>
                      <p className="text-muted-foreground">Your chauffeur awaits at arrivals with name board. Relax and enjoy the luxury journey.</p>
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
              <ShareButtons title="VIP Airport Transfer in Turkey - Ultimate Luxury Guide" />

            </article>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      <RelatedArticles currentArticleId="vip-airport-transfer-turkey" />

      <Footer />
    </WebsiteLayout>
  );
};

export default VIPAirportTransferTurkey;
