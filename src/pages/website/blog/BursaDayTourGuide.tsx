import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Clock, MapPin, Car, Mountain, Landmark, Camera, 
  Utensils, ArrowRight, CheckCircle2, Calendar,
  Snowflake, Sun, TreeDeciduous
} from "lucide-react";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import bursaHeroImage from "@/assets/bursa-transfer-hero.jpg";
import cumalikizikImage from "@/assets/cumalikizik-village.jpg";
import uludagImage from "@/assets/uludag-cable-car.jpg";

const faqItems = [
  {
    question: "How long does it take to get from Istanbul to Bursa?",
    answer: "By private transfer, the journey takes approximately 2.5-3 hours depending on the route. The Osmangazi Bridge route is faster (2.5 hours), while the scenic Mudanya ferry route takes about 3 hours including the ferry crossing."
  },
  {
    question: "Is a day trip from Istanbul to Bursa worth it?",
    answer: "Absolutely! Bursa offers a completely different experience from Istanbul - historic Ottoman architecture, the majestic Uludağ mountain, UNESCO-listed Cumalıkızık village, famous İskender kebab, and thermal springs. It's one of the most rewarding day trips from Istanbul."
  },
  {
    question: "What is Bursa famous for?",
    answer: "Bursa is famous for being the first capital of the Ottoman Empire, the birthplace of İskender kebab, silk production, thermal baths, the UNESCO World Heritage site Cumalıkızık village, and the Uludağ ski resort - Turkey's most popular winter destination."
  },
  {
    question: "What is included in a private Bursa day tour?",
    answer: "Our tours include hotel pickup and drop-off in Istanbul, luxury Mercedes vehicle with professional driver, all tolls and fees, visit to major attractions (Grand Mosque, Green Mosque, Cumalıkızık, cable car), and flexible itinerary. Lunch is optional but highly recommended at a traditional İskender restaurant."
  },
  {
    question: "When is the best time to visit Bursa?",
    answer: "Bursa is beautiful year-round. Spring (April-May) and autumn (September-October) offer pleasant weather for sightseeing. Winter (December-March) is perfect for skiing at Uludağ. Summer can be hot but the mountain provides a cool escape."
  },
  {
    question: "Can you customize the Bursa tour itinerary?",
    answer: "Yes! All our tours are fully customizable. Whether you want to focus on history, nature, food, thermal baths, or a mix of everything, we'll create a personalized itinerary based on your interests and time."
  }
];

const BursaDayTourGuide = () => {
  const { getLocalizedPath } = useLanguage();

  return (
    <WebsiteLayout>
      <SEOHead
        title="Istanbul to Bursa Day Tour Guide 2025 | What to See & How to Get There"
        description="Complete guide to visiting Bursa from Istanbul. Learn about the best attractions, transportation options, tour itineraries, and tips for the perfect day trip to the historic Ottoman capital."
        keywords="Istanbul to Bursa day trip, Bursa day tour, Bursa from Istanbul, Cumalıkızık village, Uludağ cable car, Green Mosque Bursa, Grand Mosque Bursa, İskender kebab Bursa, Bursa thermal baths, Ottoman capital Bursa, Bursa private transfer"
        canonicalPath="/blog/istanbul-bursa-day-tour-guide"
      />
      <SchemaOrg
        schemas={[
          {
            type: 'Article',
            headline: 'Istanbul to Bursa Day Tour Guide 2025 | What to See & How to Get There',
            description: 'Complete guide to visiting Bursa from Istanbul with transportation options, must-see attractions, and tour itineraries.',
            image: 'https://meettransfer.app/images/bursa-transfer-hero.jpg',
            datePublished: '2025-12-26',
            dateModified: '2025-12-31',
            author: 'Meet Transfer',
            readingTime: '15',
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Istanbul to Bursa Day Tour Guide', url: '/blog/istanbul-bursa-day-tour-guide' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
        ]}
      />

      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bursaHeroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <span className="inline-block bg-primary/90 text-primary-foreground px-4 py-1 rounded-full text-sm font-medium mb-4">
            Day Trip Guide
          </span>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Istanbul to Bursa Day Tour Guide 2025
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Discover the ancient Ottoman capital - just 2.5 hours from Istanbul
          </p>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-10 md:py-16">
        {/* Quick Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="text-center p-4">
            <Clock className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Travel Time</p>
            <p className="font-bold">2.5-3 hours</p>
          </Card>
          <Card className="text-center p-4">
            <MapPin className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Distance</p>
            <p className="font-bold">~150 km</p>
          </Card>
          <Card className="text-center p-4">
            <Car className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Best Way</p>
            <p className="font-bold">Private Transfer</p>
          </Card>
          <Card className="text-center p-4">
            <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Tour Duration</p>
            <p className="font-bold">10-12 hours</p>
          </Card>
        </div>

        {/* Introduction */}
        <section className="prose prose-lg max-w-none mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Why Visit Bursa from Istanbul?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Bursa, known as <strong>"Green Bursa" (Yeşil Bursa)</strong>, is one of Turkey's most historically 
            significant cities and makes for a perfect day trip from Istanbul. As the <strong>first capital of 
            the Ottoman Empire</strong> (1335-1363), Bursa is home to stunning Ottoman architecture, the famous 
            Grand Mosque (Ulu Cami), the UNESCO-listed Cumalıkızık village, and Turkey's most popular ski resort, 
            Uludağ.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Unlike the crowded streets of Istanbul, Bursa offers a more relaxed pace with equally impressive 
            historical sites. Plus, it's the birthplace of the legendary <strong>İskender kebab</strong> - 
            reason enough to make the trip!
          </p>
        </section>

        {/* How to Get There */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            How to Get from Istanbul to Bursa
          </h2>
          
          <div className="space-y-6">
            {/* Private Transfer */}
            <Card className="overflow-hidden border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                    <Car className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">Private Transfer (Recommended)</h3>
                      <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">Best Choice</span>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      The most comfortable and flexible option. Door-to-door service with a professional driver 
                      in a luxury Mercedes vehicle. You can stop anywhere, customize your route, and travel at 
                      your own pace.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-2">Osmangazi Bridge Route:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Duration: ~2.5 hours</li>
                          <li>• All-weather reliable</li>
                          <li>• Direct highway</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium mb-2">Mudanya Ferry Route:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Duration: ~3 hours</li>
                          <li>• Scenic sea crossing</li>
                          <li>• More memorable experience</li>
                        </ul>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-primary mt-4">From $150 one-way | From $200 day tour</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Public Transport */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-muted shrink-0">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">Public Transport Options</h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">IDO Fast Ferry + Bus:</p>
                        <p>Ferry from Yenikapı to Mudanya (1.5 hours) + bus to Bursa center (45 min). Total: ~2.5 hours, ~$15/person</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Bus (BUDO):</p>
                        <p>Direct bus from Istanbul Esenler to Bursa. Duration: 3-4 hours depending on traffic. ~$10/person</p>
                      </div>
                    </div>
                    <p className="text-sm text-amber-600 mt-3">
                      ⚠️ Note: Public transport limits your flexibility and doesn't include transportation between attractions in Bursa
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Must-See Attractions */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Must-See Attractions in Bursa
          </h2>

          {/* Cumalıkızık Image */}
          <div className="relative rounded-2xl overflow-hidden mb-8">
            <img 
              src={cumalikizikImage} 
              alt="Cumalıkızık UNESCO Village in Bursa" 
              className="w-full h-[300px] md:h-[400px] object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <h3 className="text-white font-bold text-xl mb-1">Cumalıkızık Village</h3>
              <p className="text-white/80 text-sm">UNESCO World Heritage Site - 700-year-old Ottoman village</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Landmark className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">Grand Mosque (Ulu Cami)</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  The iconic 20-domed mosque built in 1399. One of the finest examples of early Ottoman architecture 
                  with beautiful calligraphy on its interior walls. A must-see landmark of Bursa.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Landmark className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">Green Mosque & Tomb (Yeşil Cami)</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Named for its stunning green-blue Iznik tiles, this 15th-century mosque complex showcases 
                  the peak of Ottoman artistry. The adjacent Green Tomb houses Sultan Mehmed I.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Camera className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">Cumalıkızık Village</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  This 700-year-old UNESCO village has preserved its original Ottoman character with colorful 
                  wooden houses and cobblestone streets. Perfect for traditional breakfast and photography.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Mountain className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">Uludağ Mountain & Cable Car</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Take the world's longest cable car (teleferik) to Uludağ National Park. In winter, it's Turkey's 
                  premier ski resort; in summer, enjoy hiking and stunning panoramic views.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Utensils className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">Koza Han (Silk Bazaar)</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Historic covered marketplace from 1491, center of Bursa's famous silk trade. Browse silk 
                  products, enjoy Turkish coffee in the courtyard cafe, and soak in the atmosphere.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Sun className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">Çekirge Thermal Baths</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Bursa has been famous for its thermal springs since Roman times. The Çekirge district offers 
                  historic hamams with naturally hot mineral waters - perfect for relaxation.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Uludağ Image */}
          <div className="relative rounded-2xl overflow-hidden">
            <img 
              src={uludagImage} 
              alt="Uludağ Cable Car in Winter" 
              className="w-full h-[300px] md:h-[400px] object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <h3 className="text-white font-bold text-xl mb-1">Uludağ Cable Car (Teleferik)</h3>
              <p className="text-white/80 text-sm">World's longest cable car ride with spectacular mountain views</p>
            </div>
          </div>
        </section>

        {/* Sample Itinerary */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Sample Day Tour Itinerary
          </h2>
          
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border md:left-6" />
            
            <div className="space-y-6">
              {[
                { time: "07:00", title: "Hotel Pickup in Istanbul", desc: "Your driver picks you up from your hotel in a luxury Mercedes" },
                { time: "09:30", title: "Arrive in Bursa", desc: "Via Osmangazi Bridge or scenic Mudanya ferry" },
                { time: "10:00", title: "Cumalıkızık Village", desc: "Traditional breakfast and explore the UNESCO heritage village" },
                { time: "12:00", title: "Grand Mosque & Green Mosque", desc: "Visit Bursa's most iconic Ottoman landmarks" },
                { time: "13:30", title: "İskender Kebab Lunch", desc: "Authentic İskender at a famous local restaurant" },
                { time: "14:30", title: "Koza Han & Silk Bazaar", desc: "Shopping and Turkish coffee break" },
                { time: "15:30", title: "Uludağ Cable Car", desc: "Scenic ride to the mountain with panoramic views" },
                { time: "17:30", title: "Depart for Istanbul", desc: "Relax on the journey back to your hotel" },
                { time: "20:00", title: "Arrive Istanbul", desc: "Drop-off at your hotel" },
              ].map((item, idx) => (
                <div key={idx} className="relative pl-10 md:pl-14">
                  <div className="absolute left-2 md:left-4 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                  <div className="bg-card rounded-lg p-4 border border-border/50">
                    <span className="text-xs font-medium text-primary">{item.time}</span>
                    <h4 className="font-bold mt-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Best Time to Visit */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Best Time to Visit Bursa
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 text-center">
                <Sun className="h-8 w-8 mx-auto text-amber-500 mb-3" />
                <h3 className="font-bold mb-2">Spring & Autumn</h3>
                <p className="text-sm text-muted-foreground">
                  April-May & September-October. Perfect weather for sightseeing, comfortable temperatures, 
                  beautiful foliage in autumn.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 text-center">
                <Snowflake className="h-8 w-8 mx-auto text-blue-400 mb-3" />
                <h3 className="font-bold mb-2">Winter</h3>
                <p className="text-sm text-muted-foreground">
                  December-March. Best for skiing at Uludağ, snow activities, and thermal bath experiences. 
                  Magical winter scenery.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 text-center">
                <TreeDeciduous className="h-8 w-8 mx-auto text-green-500 mb-3" />
                <h3 className="font-bold mb-2">Summer</h3>
                <p className="text-sm text-muted-foreground">
                  June-August. Can be hot in the city, but Uludağ offers a cool mountain escape. 
                  Great for hiking and nature.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* What's Included */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            What's Included in Our Bursa Tours
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Hotel pickup & drop-off in Istanbul",
              "Luxury Mercedes vehicle (Vito/V-Class)",
              "Professional English-speaking driver",
              "All tolls, bridge fees & parking",
              "Ferry tickets (if Mudanya route)",
              "Flexible itinerary customization",
              "Complimentary water & WiFi",
              "Child seats available on request",
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            * Entry fees, cable car tickets, and meals are not included but can be arranged
          </p>
        </section>

        {/* CTA Section */}
        <section className="bg-primary/10 rounded-2xl p-6 md:p-10 text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">Ready to Explore Bursa?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Book your private Istanbul to Bursa day tour and discover the ancient Ottoman capital 
            with comfort and flexibility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <WhatsAppButton
              variant="large"
              message="Hi! I'd like to book a day tour from Istanbul to Bursa. Can you help me plan the itinerary?"
            />
            <Button asChild variant="outline" size="lg">
              <Link to={getLocalizedPath("/bursa-transfer")}>
                View All Bursa Options <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {faqItems.map((faq, idx) => (
              <Card key={idx}>
                <CardContent className="p-5">
                  <h3 className="font-bold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Related Articles */}
        <section>
          <h2 className="text-xl font-bold mb-4">Related Articles</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link 
              to={getLocalizedPath("/blog/istanbul-airport-to-city-best-way")} 
              className="block p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <h3 className="font-medium mb-1">Istanbul Airport to City Guide</h3>
              <p className="text-sm text-muted-foreground">Best ways to get from Istanbul Airport to city center</p>
            </Link>
            <Link 
              to={getLocalizedPath("/blog/private-vs-taxi-transfer-turkey")} 
              className="block p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <h3 className="font-medium mb-1">Private Transfer vs Taxi in Turkey</h3>
              <p className="text-sm text-muted-foreground">Compare costs, comfort, and convenience</p>
            </Link>
          </div>
        </section>
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default BursaDayTourGuide;
