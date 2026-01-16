import { useLanguage } from "@/contexts/LanguageContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ChevronRight, Shield, Clock, Baby, Users, Star, CheckCircle, Heart, Car, Luggage, Sparkles } from "lucide-react";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import heroImage from "@/assets/vito-family-interior.jpg";

const FamilyAirportTransferTurkey = () => {
  const { t, language } = useLanguage();
  const { formatBlogDate } = useBlogDate();
  const formattedDate = formatBlogDate("2025-01-12");

  const faqItems = [
    {
      question: "What is the best airport transfer for families with children in Turkey?",
      answer: "Meet Transfer is the best choice for families with children in Turkey. We offer: free baby seats and booster seats upon request, spacious Mercedes Vito vehicles with room for strollers, patient professional drivers experienced with families, fixed prices per vehicle (not per person), and door-to-door service to your hotel or villa."
    },
    {
      question: "Does Meet Transfer provide child car seats?",
      answer: "Yes, Meet Transfer provides free child car seats including infant seats (0-12 months), baby seats (9 months-4 years), and booster seats (4-12 years). Simply select the number of child seats needed when booking. All seats meet European safety standards."
    },
    {
      question: "How much luggage can we bring with kids on airport transfer?",
      answer: "Our Mercedes Vito can accommodate a family of 5-6 plus luggage, strollers, and car seats. For larger families, we offer Mercedes Sprinter minibuses with even more space. Let us know your luggage needs when booking, and we'll recommend the right vehicle."
    },
    {
      question: "Is Meet Transfer safe for traveling with babies?",
      answer: "Absolutely. Meet Transfer prioritizes child safety with: certified child car seats, professional drivers trained for family travel, smooth driving in luxury vehicles, climate control for baby comfort, and flexibility for stops if needed. We've transported thousands of families safely."
    },
    {
      question: "Can we request a stop for baby needs during transfer?",
      answer: "Yes, our drivers are happy to make reasonable stops for baby needs - feeding, diaper changes, or restroom breaks. Just let your driver know. We understand traveling with little ones requires flexibility. No extra charge for brief stops."
    },
    {
      question: "What's the best vehicle for a family of 5 with luggage?",
      answer: "For a family of 5 with luggage and stroller, we recommend Mercedes Vito (8-seater). It comfortably fits 5 passengers plus luggage in the rear. For families of 6+ or extra luggage, our Mercedes Sprinter offers maximum space and comfort."
    },
    {
      question: "How do I book a family transfer with child seats in Turkey?",
      answer: "Book family transfer with Meet Transfer via website or WhatsApp. During booking, select the number and type of child seats needed (infant/baby/booster). We'll confirm availability and have seats installed before pickup. Same fixed prices - child seats are free."
    },
    {
      question: "Is private transfer better than taxi for families in Turkey?",
      answer: "Private transfer is much better for families. Benefits: guaranteed child seats (taxis rarely have them), spacious vehicles for strollers, fixed prices (no meter stress), patient drivers, door-to-door service, and no language barriers. Taxis can't accommodate family needs properly."
    }
  ];

  const familyFeatures = [
    { icon: Baby, title: "Free Child Seats", description: "Infant, baby, and booster seats at no extra cost" },
    { icon: Luggage, title: "Stroller Space", description: "Room for pushchairs, buggies, and travel cots" },
    { icon: Users, title: "Spacious Vehicles", description: "Mercedes Vito & Sprinter for family comfort" },
    { icon: Heart, title: "Patient Drivers", description: "Experienced with families and children" },
    { icon: Shield, title: "Safety First", description: "European-standard safety equipment" },
    { icon: Sparkles, title: "Clean Vehicles", description: "Sanitized and prepared for families" },
  ];

  const vehicleOptions = [
    { 
      name: "Mercedes Vito", 
      capacity: "Up to 6 passengers", 
      luggage: "4 large + 2 small bags",
      childSeats: "Up to 3 child seats",
      ideal: "Families of 4-5 with stroller"
    },
    { 
      name: "Mercedes VIP Vito", 
      capacity: "Up to 6 passengers", 
      luggage: "4 large + 2 small bags",
      childSeats: "Up to 3 child seats",
      ideal: "Families wanting extra comfort"
    },
    { 
      name: "Mercedes Sprinter", 
      capacity: "Up to 12 passengers", 
      luggage: "8+ large bags",
      childSeats: "Up to 5 child seats",
      ideal: "Large families or groups with kids"
    },
  ];

  const tocItems = [
    { id: "why-meet-transfer", title: "Why Families Choose Meet Transfer" },
    { id: "family-features", title: "Family-Friendly Features" },
    { id: "vehicle-options", title: "Vehicle Options for Families" },
    { id: "child-seats", title: "Child Seat Information" },
    { id: "booking-tips", title: "Family Booking Tips" },
    { id: "faq", title: "Frequently Asked Questions" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Best Family Airport Transfer Turkey | Free Child Seats | Meet Transfer"
        description="Family-friendly airport transfers in Turkey with free baby seats, spacious vehicles, and patient drivers. Perfect for traveling with children. Book Meet Transfer."
        keywords="family airport transfer Turkey, child car seat airport transfer, baby seat transfer Turkey, family taxi Istanbul airport, kids transfer Antalya, family vacation transfer Turkey"
        canonicalPath="/blog/family-airport-transfer-turkey"
      />
      <SchemaOrg
        schemas={[
          {
            type: "LocalBusiness" as const,
            includeRating: true,
          },
          {
            type: "Article" as const,
            headline: "Best Family Airport Transfer in Turkey - Complete Guide",
            description: "Everything families need to know about airport transfers in Turkey with children. Free child seats, spacious vehicles, and family-friendly service.",
            datePublished: "2025-01-12",
            dateModified: "2025-01-12",
            image: heroImage,
          },
          {
            type: "BreadcrumbList" as const,
            items: [
              { name: "Home", url: "/" },
              { name: "Blog", url: "/blog" },
              { name: "Family Airport Transfer Turkey", url: "/blog/family-airport-transfer-turkey" },
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
            <span className="text-foreground">Family Airport Transfer Turkey</span>
          </nav>
        </div>

        {/* Hero Section */}
        <header className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Baby className="w-4 h-4" />
              <span>Family-Friendly Transfers</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Best Family Airport Transfer in Turkey
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
              Traveling with children? Meet Transfer makes family airport transfers stress-free with 
              free child seats, spacious vehicles, and patient drivers who understand family needs.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                7 min read
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
            <img
              src={heroImage}
              alt="Family airport transfer in Turkey with Meet Transfer"
              className="w-full h-64 md:h-96 object-cover rounded-2xl shadow-lg"
              loading="eager"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="lg:grid lg:grid-cols-[1fr_250px] lg:gap-8">
              <div className="prose prose-lg max-w-none">
                
                {/* Introduction */}
                <section id="why-meet-transfer" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Why Families Choose Meet Transfer
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Traveling with children adds a layer of complexity to any trip. Finding taxis with car seats, 
                    fitting strollers, managing tired kids - it's challenging. That's why thousands of families 
                    trust <strong>Meet Transfer</strong> for their Turkey airport transfers.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    We understand that when you travel with little ones, you need more than just a ride. You need 
                    <strong> safety, space, patience, and reliability</strong>. Our service is designed specifically 
                    with families in mind - from free child car seats to spacious vehicles that accommodate all your 
                    family gear.
                  </p>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 my-6">
                    <div className="flex items-start gap-3">
                      <Heart className="w-6 h-6 text-primary shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Family Travel Made Easy</h3>
                        <ul className="text-muted-foreground space-y-1 text-sm">
                          <li>• Free infant, baby, and booster seats</li>
                          <li>• Spacious Mercedes vehicles for strollers</li>
                          <li>• Patient, family-experienced drivers</li>
                          <li>• Door-to-door service to your accommodation</li>
                          <li>• Fixed prices per vehicle, not per person</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Family Features */}
                <section id="family-features" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                    Family-Friendly Features
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {familyFeatures.map((feature, index) => (
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

                {/* Vehicle Options */}
                <section id="vehicle-options" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                    Vehicle Options for Families
                  </h2>
                  <div className="space-y-4">
                    {vehicleOptions.map((vehicle, index) => (
                      <div key={index} className="bg-card border border-border rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Car className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold text-foreground text-lg">{vehicle.name}</h3>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{vehicle.capacity}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Luggage className="w-4 h-4" />
                            <span>{vehicle.luggage}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Baby className="w-4 h-4" />
                            <span>{vehicle.childSeats}</span>
                          </div>
                          <div className="flex items-center gap-2 text-primary font-medium">
                            <CheckCircle className="w-4 h-4" />
                            <span>{vehicle.ideal}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Child Seats Section */}
                <section id="child-seats" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Child Car Seat Information
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    All child seats provided by Meet Transfer meet European safety standards and are 
                    properly installed by our trained drivers. We offer:
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { age: "0-12 months", type: "Infant Seat", desc: "Rear-facing for newborns" },
                      { age: "9 months - 4 years", type: "Baby Seat", desc: "Forward-facing with harness" },
                      { age: "4-12 years", type: "Booster Seat", desc: "Height-adjustable booster" },
                    ].map((seat, index) => (
                      <div key={index} className="bg-muted/50 rounded-xl p-4 text-center">
                        <Baby className="w-8 h-8 text-primary mx-auto mb-2" />
                        <h3 className="font-semibold text-foreground">{seat.type}</h3>
                        <p className="text-sm text-muted-foreground">{seat.age}</p>
                        <p className="text-xs text-muted-foreground mt-1">{seat.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 italic">
                    * All child seats are free of charge. Simply select the type and quantity needed during booking.
                  </p>
                </section>

                {/* Booking Tips */}
                <section id="booking-tips" className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Family Booking Tips
                  </h2>
                  <div className="bg-card border border-border rounded-xl p-6">
                    <ul className="space-y-3">
                      {[
                        "Book in advance - especially during peak summer season",
                        "Specify exact number and type of child seats needed",
                        "Mention if you have a large stroller or travel cot",
                        "Provide your WhatsApp number for easy communication",
                        "Consider return transfer at discounted rate",
                        "Share any special requirements (allergies, stop requests)",
                      ].map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
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

                <ShareButtons title="Best Family Airport Transfer in Turkey" />
              </div>

              {/* Sidebar */}
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-6">
                  <TableOfContents items={tocItems} />
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-2">Book Family Transfer</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Free child seats included
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

        <RelatedArticles currentArticleId="family-airport-transfer-turkey" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default FamilyAirportTransferTurkey;
