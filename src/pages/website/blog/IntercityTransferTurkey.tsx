import { useLanguage } from "@/contexts/LanguageContext";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ChevronRight, Shield, Clock, MapPin, Users, Star, CheckCircle, Route, Car, Navigation, Mountain, Building } from "lucide-react";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import heroImage from "@/assets/vito-cappadocia-balloon.jpg";

const IntercityTransferTurkey = () => {
  const { t, language } = useLanguage();
  const { formatBlogDate } = useBlogDate();
  const formattedDate = formatBlogDate("2025-01-16");

  const faqItems = [
    {
      question: "What is intercity transfer in Turkey?",
      answer: "Intercity transfer is a private car service between Turkish cities. Instead of buses or domestic flights, you travel in comfort with a professional driver. Popular routes include Istanbul to Cappadocia, Antalya to Pamukkale, Bodrum to Ephesus. Fixed prices, door-to-door service, flexible stops along the way."
    },
    {
      question: "How much does intercity transfer cost in Turkey?",
      answer: "Intercity transfer prices vary by distance and vehicle. Examples: Istanbul to Cappadocia (8 hours): €350-500, Antalya to Pamukkale (3 hours): €150-200, Bodrum to Ephesus (2.5 hours): €120-180. Prices are per vehicle (not per person), making it economical for groups of 4-6 travelers."
    },
    {
      question: "Is private transfer better than bus for intercity travel?",
      answer: "Private intercity transfer offers: door-to-door service (no stations), flexible departure times, comfort stops when you need, luggage space, air conditioning, stops at scenic points. Buses are cheaper but have fixed schedules, shared space, and limited stops. For families and groups, private transfer is often similar cost with more convenience."
    },
    {
      question: "Can I stop at attractions during intercity transfer?",
      answer: "Yes! Meet Transfer intercity routes include optional stops. Examples: Istanbul-Cappadocia: stop at Safranbolu or Salt Lake. Antalya-Pamukkale: stop at Hierapolis or Salda Lake. Dalaman-Ephesus: stop at Pamukkale. Extra stops are arranged during booking at no or minimal extra cost."
    },
    {
      question: "How long is the drive from Istanbul to Cappadocia?",
      answer: "Istanbul to Cappadocia by private transfer takes 7-8 hours via highway. The route goes through Ankara and Nevşehir. We recommend overnight stay in Cappadocia (2-3 nights) to enjoy hot air balloons, underground cities, and fairy chimneys. Alternatively, fly from Istanbul (1.5 hours)."
    },
    {
      question: "What vehicles are used for intercity transfers?",
      answer: "Meet Transfer uses comfortable vehicles for long journeys: Mercedes Vito (6 passengers): spacious, good luggage space, Mercedes Sprinter (12 passengers): ideal for groups, Mercedes Sedan (3 passengers): for couples or small groups. All vehicles have AC, Wi-Fi, water, and phone chargers."
    },
    {
      question: "Is intercity transfer safe in Turkey?",
      answer: "Yes, intercity transfer with Meet Transfer is very safe. Professional drivers with clean records, well-maintained vehicles, GPS tracking, regular rest stops on long journeys, 24/7 customer support. We've completed 50,000+ transfers safely. Highways in Turkey are modern and well-maintained."
    },
    {
      question: "Can I book one-way intercity transfer?",
      answer: "Yes, you can book one-way intercity transfers. Popular one-way routes: Antalya Airport to Cappadocia, Istanbul to Bursa, Dalaman to Bodrum. No return trip required. If you need return transfer, we offer round-trip discounts. Book both ways for 10-15% savings."
    }
  ];

  const popularRoutes = [
    { from: "Istanbul", to: "Cappadocia", duration: "7-8 hours", distance: "730 km", price: "€350-500", highlights: "Fairy chimneys, hot air balloons" },
    { from: "Antalya", to: "Pamukkale", duration: "3 hours", distance: "240 km", price: "€150-200", highlights: "White terraces, Hierapolis" },
    { from: "Bodrum", to: "Ephesus", duration: "2.5 hours", distance: "170 km", price: "€120-180", highlights: "Ancient city, Virgin Mary House" },
    { from: "Dalaman", to: "Fethiye", duration: "1 hour", distance: "55 km", price: "€60-80", highlights: "Ölüdeniz, Blue Lagoon" },
    { from: "Istanbul", to: "Bursa", duration: "2.5 hours", distance: "150 km", price: "€100-140", highlights: "Grand Mosque, Uludağ" },
    { from: "Antalya", to: "Cappadocia", duration: "6 hours", distance: "540 km", price: "€300-400", highlights: "Scenic route, Konya option" },
  ];

  const benefits = [
    { icon: Navigation, title: "Door-to-Door Service", description: "Hotel pickup and drop-off, no station transfers" },
    { icon: Clock, title: "Flexible Schedule", description: "Depart when you want, not bus schedule" },
    { icon: MapPin, title: "Scenic Stops", description: "Stop at attractions along the route" },
    { icon: Users, title: "Private Vehicle", description: "No sharing with strangers" },
    { icon: Car, title: "Comfort Journey", description: "AC, Wi-Fi, refreshments included" },
    { icon: Shield, title: "Safe Travel", description: "Professional drivers, GPS tracking" },
  ];

  const tocItems = [
    { id: "what-is-intercity", title: "What is Intercity Transfer" },
    { id: "popular-routes", title: "Popular Routes & Prices" },
    { id: "benefits", title: "Benefits of Private Transfer" },
    { id: "vs-alternatives", title: "Private vs Bus vs Flight" },
    { id: "booking-tips", title: "Booking Tips" },
    { id: "faq", title: "Frequently Asked Questions" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Intercity Transfer Turkey | Istanbul to Cappadocia | Meet Transfer"
        description="Book intercity private transfers in Turkey. Istanbul to Cappadocia, Antalya to Pamukkale, Bodrum to Ephesus. Door-to-door service, scenic stops, fixed prices."
        keywords="intercity transfer Turkey, Istanbul to Cappadocia transfer, private transfer between cities Turkey, Antalya to Pamukkale, Bodrum to Ephesus transfer"
        canonicalPath="/blog/intercity-transfer-turkey"
      />
      <SchemaOrg
        schemas={[
          {
            type: "LocalBusiness" as const,
            includeRating: true,
          },
          {
            type: "Article" as const,
            headline: "Intercity Transfer in Turkey - City to City Private Service",
            description: "Complete guide to intercity transfers in Turkey. Popular routes, prices, booking tips. Istanbul to Cappadocia, Antalya to Pamukkale, and more.",
            datePublished: "2025-01-16",
            dateModified: "2025-01-16",
          },
          {
            type: "FAQPage" as const,
            questions: faqItems,
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
            <span className="text-foreground">Intercity Transfer Turkey</span>
          </nav>

          {/* Article Header */}
          <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                Intercity Travel
              </span>
              <span className="text-muted-foreground text-sm flex items-center gap-1">
                <Clock className="h-4 w-4" /> 9 min read
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Intercity Transfer in Turkey - Complete City to City Guide
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Travel between Turkish cities in comfort. Istanbul to Cappadocia, Antalya to Pamukkale, and more. Private transfers with scenic stops.
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
              alt="Private transfer in Cappadocia with hot air balloons"
              className="w-full h-[400px] object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-medium">4.9 Rating • 50,000+ Transfers</span>
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
              <div className="bg-gradient-to-r from-primary/5 to-emerald-500/5 border border-primary/20 rounded-xl p-6 mb-8">
                <p className="text-lg leading-relaxed m-0">
                  <strong>Intercity transfers</strong> are the best way to explore Turkey beyond airport cities. Travel from <strong>Istanbul to Cappadocia</strong>, <strong>Antalya to Pamukkale</strong>, or any city combination with Meet Transfer's private service.
                </p>
              </div>

              {/* What is Intercity Transfer */}
              <section id="what-is-intercity" className="mb-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Route className="h-8 w-8 text-primary" />
                  What is Intercity Transfer?
                </h2>
                <p>
                  <strong>Intercity transfer</strong> is a private car service between different cities in Turkey. Unlike buses or flights, you get a dedicated vehicle with a professional driver who takes you door-to-door at your preferred time.
                </p>
                <p>
                  This service is perfect for <strong>tourists exploring multiple destinations</strong>, families who want convenience, groups who can share costs, and anyone who values comfort over cramped bus seats.
                </p>

                <div className="bg-muted/50 rounded-xl p-6 my-6">
                  <h3 className="text-xl font-semibold mb-4">Why Choose Intercity Transfer?</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>No need to find bus stations or airports</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Stop at attractions along the way</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Depart when you want, not when bus schedules</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>More economical for groups of 4-6</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Popular Routes */}
              <section id="popular-routes" className="mb-12">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <MapPin className="h-8 w-8 text-primary" />
                  Popular Routes & Prices
                </h2>
                <div className="space-y-4 not-prose">
                  {popularRoutes.map((route, index) => (
                    <div key={index} className="border rounded-xl p-5 hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{route.from}</span>
                          <ChevronRight className="h-4 w-4 text-primary" />
                          <span className="font-bold text-lg">{route.to}</span>
                        </div>
                        <span className="text-primary font-semibold">{route.price}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" /> {route.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Navigation className="h-4 w-4" /> {route.distance}
                        </span>
                      </div>
                      <p className="text-sm mt-2 text-muted-foreground">
                        <Mountain className="h-4 w-4 inline mr-1" />
                        {route.highlights}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Benefits */}
              <section id="benefits" className="mb-12">
                <h2 className="text-3xl font-bold mb-6">Benefits of Private Transfer</h2>
                <div className="grid md:grid-cols-2 gap-4 not-prose">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <benefit.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Comparison */}
              <section id="vs-alternatives" className="mb-12">
                <h2 className="text-3xl font-bold mb-6">Private Transfer vs Bus vs Flight</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Feature</th>
                        <th className="text-center p-3">Private Transfer</th>
                        <th className="text-center p-3">Bus</th>
                        <th className="text-center p-3">Flight</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">Door-to-door</td>
                        <td className="text-center p-3 text-green-600">✓</td>
                        <td className="text-center p-3 text-red-500">✗</td>
                        <td className="text-center p-3 text-red-500">✗</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Flexible timing</td>
                        <td className="text-center p-3 text-green-600">✓</td>
                        <td className="text-center p-3 text-red-500">✗</td>
                        <td className="text-center p-3 text-red-500">✗</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Scenic stops</td>
                        <td className="text-center p-3 text-green-600">✓</td>
                        <td className="text-center p-3 text-yellow-600">Limited</td>
                        <td className="text-center p-3 text-red-500">✗</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Luggage space</td>
                        <td className="text-center p-3 text-green-600">Unlimited</td>
                        <td className="text-center p-3 text-yellow-600">Limited</td>
                        <td className="text-center p-3 text-yellow-600">Extra fee</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Cost for 4-6 people</td>
                        <td className="text-center p-3 text-green-600">Best value</td>
                        <td className="text-center p-3 text-yellow-600">Per person</td>
                        <td className="text-center p-3 text-red-500">Expensive</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Booking Tips */}
              <section id="booking-tips" className="mb-12">
                <h2 className="text-3xl font-bold mb-6">Booking Tips for Intercity Transfer</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                    <div>
                      <h3 className="font-semibold">Book 2-3 Days Ahead</h3>
                      <p className="text-muted-foreground">Especially for popular routes like Istanbul-Cappadocia during peak season.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                    <div>
                      <h3 className="font-semibold">Plan Scenic Stops</h3>
                      <p className="text-muted-foreground">Tell us if you want to visit attractions en route - we can suggest the best stops.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                    <div>
                      <h3 className="font-semibold">Start Early</h3>
                      <p className="text-muted-foreground">For 6+ hour journeys, early departure means arrival with daylight for exploration.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                    <div>
                      <h3 className="font-semibold">Book Round-Trip for Savings</h3>
                      <p className="text-muted-foreground">Get 10-15% discount when booking outward and return journeys together.</p>
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
              <ShareButtons title="Intercity Transfer in Turkey - City to City Guide" />

            </article>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      <RelatedArticles currentArticleId="intercity-transfer-turkey" />

      <Footer />
    </WebsiteLayout>
  );
};

export default IntercityTransferTurkey;
