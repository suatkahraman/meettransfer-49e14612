import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, Star, Shield, Car, Users, Plane, Building, Camera, CheckCircle2, Church, MapPinned, Sparkles, Clock3, Route, Gem } from "lucide-react";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ShareButtons from "@/components/website/ShareButtons";
import BlogCTA from "@/components/website/BlogCTA";
import RelatedArticles from "@/components/website/RelatedArticles";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";
import { useBlogDate } from "@/hooks/useBlogDate";

// Import images
import vitoExteriorBlack from "@/assets/vito-exterior-black.jpg";
import vitoVipStarlightPurple from "@/assets/vito-vip-starlight-purple.jpg";
import midyatStoneHouses from "@/assets/blog/midyat-stone-houses.jpg";
import morGabrielMonastery from "@/assets/blog/mor-gabriel-monastery.jpg";
import midyatTelkariSilver from "@/assets/blog/midyat-telkari-silver.jpg";
import daraAncientCity from "@/assets/blog/dara-ancient-city.jpg";

const MidyatAirportTransferGuide = () => {
  const { t, getLocalizedPath, language } = useLanguage();
  const { formatBlogDate } = useBlogDate();
  const formattedDate = formatBlogDate("2025-01-16");
  const faqItems = [
    {
      question: "What is the nearest airport to Midyat?",
      answer: "Mardin Airport (MQM) is the nearest airport to Midyat, located approximately 65 km away. Private transfer from Mardin Airport to Midyat takes about 1.5 hours through scenic Mesopotamian landscape."
    },
    {
      question: "How much does airport transfer to Midyat cost?",
      answer: "Private transfer from Mardin Airport to Midyat starts from €65 for sedan vehicles and €85 for VIP Mercedes Vito. Prices include meet & greet, flight tracking, and door-to-door service to your hotel."
    },
    {
      question: "Can I visit Mor Gabriel Monastery with airport transfer?",
      answer: "Yes, we offer combined transfers that include stops at Mor Gabriel Monastery, one of the oldest surviving Christian monasteries in the world. Additional stops can be arranged during booking."
    },
    {
      question: "Is Midyat worth visiting?",
      answer: "Absolutely! Midyat is famous for its unique stone architecture, ancient Syriac monasteries, silver filigree craftsmanship (telkari), and rich multicultural heritage where Assyrians, Kurds, and Arabs coexist."
    },
    {
      question: "What is special about Midyat architecture?",
      answer: "Midyat's honey-colored limestone buildings feature intricate carvings and traditional Mesopotamian architecture. The old town has been used as a filming location for Turkish TV series, making it a popular destination."
    }
  ];

  const transferPrices = [
    { destination: "Midyat Center", distance: "65 km", duration: "1.5 hours", sedan: "€65", vito: "€85", maybach: "€150" },
    { destination: "Mor Gabriel Monastery", distance: "80 km", duration: "1 hour 45 min", sedan: "€75", vito: "€95", maybach: "€165" },
    { destination: "Mor Yakup Monastery", distance: "70 km", duration: "1.5 hours", sedan: "€70", vito: "€90", maybach: "€155" },
    { destination: "Hasankeyf (Batman)", distance: "120 km", duration: "2 hours", sedan: "€95", vito: "€120", maybach: "€200" },
    { destination: "Mardin City", distance: "65 km", duration: "1 hour", sedan: "€55", vito: "€75", maybach: "€140" },
    { destination: "Dara Ancient City", distance: "45 km", duration: "50 min", sedan: "€50", vito: "€70", maybach: "€130" },
  ];

  const attractions = [
    {
      name: "Mor Gabriel Monastery",
      description: "Founded in 397 AD, one of the oldest surviving Christian monasteries. Home to Syriac Orthodox monks for over 1,600 years.",
      icon: Church
    },
    {
      name: "Midyat Old Town",
      description: "Stunning honey-colored stone houses with intricate carvings, narrow streets, and traditional architecture.",
      icon: Building
    },
    {
      name: "Telkari Silver Workshops",
      description: "Famous for silver filigree craftsmanship (telkari). Watch artisans create intricate jewelry and decorative items.",
      icon: Gem
    },
    {
      name: "Mor Yakup Monastery",
      description: "Ancient monastery with beautiful architecture and peaceful atmosphere, still home to a small community.",
      icon: Church
    }
  ];

  const nearbyCities = [
    { name: "Mardin", distance: "65 km", time: "1 hour", description: "Ancient city with stunning old town and Mesopotamian views" },
    { name: "Hasankeyf", distance: "55 km", time: "50 min", description: "12,000-year-old ancient city on Tigris River" },
    { name: "Dara Ancient City", distance: "45 km", time: "50 min", description: "Roman and Byzantine ruins with underground cisterns" },
    { name: "Nusaybin", distance: "50 km", time: "45 min", description: "Historic border town with Assyrian heritage" },
    { name: "Batman", distance: "55 km", time: "1 hour", description: "Modern city, gateway to regional attractions" },
  ];

  const ourServices = [
    {
      title: "Airport Transfers",
      description: "Direct transfers from Mardin Airport to Midyat with meet & greet service",
      icon: Plane
    },
    {
      title: "Monastery Tours",
      description: "Full-day tours to Mor Gabriel, Mor Yakup, and other Syriac monasteries",
      icon: Church
    },
    {
      title: "Stone House Tours",
      description: "Explore Midyat's famous stone architecture with local guides",
      icon: Building
    },
    {
      title: "Telkari Workshops",
      description: "Visit silver filigree workshops and meet local artisans",
      icon: Gem
    },
    {
      title: "Intercity Transfers",
      description: "Comfortable transfers to Mardin, Hasankeyf, Dara, and beyond",
      icon: Route
    },
    {
      title: "Multi-Day Tours",
      description: "Custom itineraries covering Tur Abdin's spiritual treasures",
      icon: Clock3
    }
  ];

  const tocItems = [
    { id: "overview", title: "Overview" },
    { id: "getting-there", title: "Getting to Midyat" },
    { id: "transfer-options", title: "Transfer Options" },
    { id: "prices", title: "Transfer Prices" },
    { id: "cities", title: "Nearby Cities" },
    { id: "services", title: "Our Services" },
    { id: "monasteries", title: "Syriac Monasteries" },
    { id: "attractions", title: "Top Attractions" },
    { id: "faq", title: "FAQ" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Midyat Airport Transfer - Private Shuttle to Mor Gabriel, Syriac Monasteries 2025"
        description="Book private airport transfer to Midyat from Mardin Airport. Visit Mor Gabriel Monastery, stone houses, telkari workshops. Mercedes fleet, English-speaking drivers."
        keywords="Midyat airport transfer, Mor Gabriel Monastery transfer, Midyat private shuttle, Syriac monasteries tour, Mardin to Midyat transfer, Mesopotamia tours, Midyat hotels transfer, telkari Midyat"
        canonicalPath="/blog/midyat-airport-transfer-guide"
        ogImage="https://meettransfer.app/images/vito-exterior-black.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness', includeRating: true },
          {
            type: 'Article',
            headline: "Midyat Airport Transfer - Complete Guide 2025",
            description: "Book private airport transfer to Midyat, Mor Gabriel Monastery and Syriac heritage sites.",
            image: "https://meettransfer.app/images/vito-exterior-black.jpg",
            datePublished: "2025-01-16",
            dateModified: "2025-01-16",
            author: "Meet Transfer",
            readingTime: "13",
            wordCount: 3200,
            keywords: ["Midyat airport transfer", "Mor Gabriel Monastery", "Syriac monasteries", "Mardin to Midyat"]
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Midyat Airport Transfer', url: '/blog/midyat-airport-transfer-guide' },
            ],
          },
          {
            type: 'FAQPage',
            questions: faqItems.map(item => ({ question: item.question, answer: item.answer }))
          }
        ]}
      />
      <ReadingProgressBar />

      <article className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            to={getLocalizedPath("/blog")} 
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </nav>

        {/* Hero Section */}
        <header className="mb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">Midyat</Badge>
            <Badge variant="outline">Syriac Heritage</Badge>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Updated 2025
            </Badge>
          </div>
          
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Midyat Airport Transfer - Private Shuttle to Mor Gabriel & Syriac Monasteries
          </h1>
          
          <p className="text-lg text-muted-foreground mb-6 max-w-3xl">
            Discover the ancient Syriac heritage with comfortable private transfers to Midyat. 
            Visit Mor Gabriel Monastery, explore stone house architecture, and experience 
            1,600 years of Christian history in Mesopotamia.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime="2025-01-16">{formattedDate}</time>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>13 min read</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>4.9/5 Rating</span>
            </div>
          </div>

          <ShareButtons title="Midyat Airport Transfer - Private Shuttle to Mor Gabriel, Syriac Monasteries 2025" />
        </header>

        {/* Hero Image - Midyat Stone Houses */}
        <OptimizedBlogImage
          src={midyatStoneHouses}
          alt="Midyat old town cobblestone streets with traditional honey-colored stone houses and intricate carvings"
          className="w-full aspect-video rounded-xl mb-12"
          priority={true}
        />

        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          {/* Main Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            
            {/* Overview */}
            <section id="overview">
              <h2>Discover Midyat - The Heart of Syriac Christianity</h2>
              <p>
                Midyat is a hidden gem in southeastern Turkey, known for its incredible stone 
                architecture, ancient Syriac Orthodox monasteries, and traditional silver 
                craftsmanship. This ancient town has been home to Assyrian Christians, Kurds, 
                and Arabs for millennia.
              </p>
              <p>
                Our private transfer service connects you directly from Mardin Airport to 
                Midyat and its surrounding monasteries, ensuring a comfortable and enriching 
                journey through Mesopotamian history.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 not-prose my-8">
                <Card>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Church className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Monastery Tours</h3>
                      <p className="text-sm text-muted-foreground">Visit ancient Syriac monasteries dating back 1,600 years</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Car className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Mercedes Fleet</h3>
                      <p className="text-sm text-muted-foreground">Comfortable vehicles for mountain roads</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Camera className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Photo Stops</h3>
                      <p className="text-sm text-muted-foreground">Scenic stops along the route available</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Multi-Language</h3>
                      <p className="text-sm text-muted-foreground">English, Turkish, Arabic speaking drivers</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Image: Mor Gabriel Monastery */}
            <div className="not-prose my-8">
              <OptimizedBlogImage
                src={morGabrielMonastery}
                alt="Mor Gabriel Monastery exterior with ancient stone walls in Tur Abdin plateau"
                className="w-full rounded-xl"
                aspectRatio="video"
              />
              <p className="text-sm text-muted-foreground text-center mt-2">
                Mor Gabriel Monastery - Founded in 397 AD, one of the world's oldest active monasteries
              </p>
            </div>

            {/* Getting There */}
            <section id="getting-there">
              <h2>How to Get to Midyat</h2>
              <p>
                Midyat is located in Mardin Province, southeastern Turkey. The nearest airport 
                is Mardin Airport (MQM), approximately 65 km away.
              </p>
              <ul>
                <li><strong>From Mardin Airport:</strong> 65 km, 1.5 hours by private transfer</li>
                <li><strong>From Mardin City:</strong> 65 km, 1 hour by private transfer</li>
                <li><strong>From Diyarbakır Airport:</strong> 180 km, 2.5 hours by private transfer</li>
                <li><strong>Best Time to Visit:</strong> April-June and September-November</li>
              </ul>
            </section>

            {/* Transfer Options */}
            <section id="transfer-options">
              <h2>Transfer Options to Midyat</h2>
              
              <h3>1. Standard Sedan Transfer</h3>
              <p>
                Comfortable Mercedes E-Class or similar for couples and solo travelers. 
                Perfect for the winding mountain roads to Midyat.
              </p>

              <h3>2. VIP Mercedes Vito</h3>
              <p>
                Ideal for families or groups visiting monasteries. Seats up to 7 passengers 
                with space for luggage. Our most popular choice for Midyat tours.
              </p>

              <h3>3. Mercedes Maybach</h3>
              <p>
                Ultimate luxury for the discerning traveler. Experience Mesopotamia in 
                unparalleled comfort with premium amenities.
              </p>

              <h3>4. Combined Monastery Tour Transfer</h3>
              <p>
                Special package including transfers to Mor Gabriel, Mor Yakup, and other 
                monasteries with waiting time at each location.
              </p>
            </section>

            {/* VIP Vehicle Image */}
            <div className="not-prose my-8">
              <OptimizedBlogImage
                src={vitoVipStarlightPurple}
                alt="VIP Mercedes Vito with starlight ceiling for luxury Midyat transfers"
                className="w-full rounded-xl"
                aspectRatio="video"
              />
              <p className="text-sm text-muted-foreground text-center mt-2">
                VIP Mercedes Vito - Luxury interior for comfortable monastery tours
              </p>
            </div>

            {/* Prices */}
            <section id="prices">
              <h2>Midyat Transfer Prices 2025</h2>
              
              {/* Desktop Table */}
              <div className="hidden md:block not-prose my-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destination</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Sedan</TableHead>
                      <TableHead>VIP Vito</TableHead>
                      <TableHead>Maybach</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transferPrices.map((route) => (
                      <TableRow key={route.destination}>
                        <TableCell className="font-medium">{route.destination}</TableCell>
                        <TableCell>{route.distance}</TableCell>
                        <TableCell>{route.duration}</TableCell>
                        <TableCell>{route.sedan}</TableCell>
                        <TableCell>{route.vito}</TableCell>
                        <TableCell>{route.maybach}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden not-prose space-y-4 my-8">
                {transferPrices.map((route) => (
                  <Card key={route.destination}>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">{route.destination}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Distance:</span>
                        <span>{route.distance}</span>
                        <span className="text-muted-foreground">Duration:</span>
                        <span>{route.duration}</span>
                        <span className="text-muted-foreground">Sedan:</span>
                        <span className="font-medium">{route.sedan}</span>
                        <span className="text-muted-foreground">VIP Vito:</span>
                        <span className="font-medium">{route.vito}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Nearby Cities Section */}
            <section id="cities">
              <h2>Nearby Cities & Destinations</h2>
              <p>
                Midyat is a perfect base for exploring the Tur Abdin region and southeastern Turkey's 
                most fascinating historical sites. Our transfer service connects you to all major destinations.
              </p>
              
              <div className="not-prose my-8 grid gap-4">
                {nearbyCities.map((city) => (
                  <Card key={city.name} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{city.name}</h4>
                            <p className="text-sm text-muted-foreground">{city.description}</p>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">{city.distance}</div>
                          <div className="text-muted-foreground">{city.time}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Image: Telkari Silver */}
            <div className="not-prose my-8">
              <OptimizedBlogImage
                src={midyatTelkariSilver}
                alt="Midyat telkari silver filigree craftsmanship with artisan creating intricate jewelry"
                className="w-full rounded-xl"
                aspectRatio="square"
              />
              <p className="text-sm text-muted-foreground text-center mt-2">
                Telkari - Traditional Midyat silver filigree craftsmanship passed down through generations
              </p>
            </div>

            {/* Our Services Section */}
            <section id="services">
              <h2>Our Services in Midyat Region</h2>
              <p>
                Meet Transfer offers comprehensive transportation solutions for visitors exploring 
                Midyat and the Tur Abdin plateau. From airport pickups to multi-day monastery tours.
              </p>
              
              <div className="not-prose my-8 grid sm:grid-cols-2 gap-4">
                {ourServices.map((service) => (
                  <Card key={service.title} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <service.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{service.title}</h4>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Monasteries */}
            <section id="monasteries">
              <h2>Syriac Monasteries Near Midyat</h2>
              <p>
                The Tur Abdin plateau around Midyat is home to some of the world's oldest 
                continuously operating Christian monasteries. Our transfer service can include 
                visits to these remarkable sites:
              </p>
              
              <h3>Mor Gabriel Monastery (Dayro d-Mor Gabriel)</h3>
              <p>
                Founded in 397 AD, Mor Gabriel is one of the oldest surviving Syriac Orthodox 
                monasteries in the world. Still home to a community of monks and nuns, it 
                features ancient churches, beautiful gardens, and centuries of religious history.
              </p>

              <h3>Mor Yakup (Mar Jacob) Monastery</h3>
              <p>
                A peaceful monastery with beautiful architecture and stunning views of the 
                Mesopotamian plains. Visitors can explore the ancient church and meet the 
                small community of monks who maintain this sacred site.
              </p>

              <h3>Mor Augin Monastery</h3>
              <p>
                Perched dramatically on a cliff, Mor Augin offers spectacular views and a 
                sense of spiritual isolation. The monastery has been a center of Syriac 
                Christianity for centuries.
              </p>
            </section>

            {/* Image: Dara Ancient City */}
            <div className="not-prose my-8">
              <OptimizedBlogImage
                src={daraAncientCity}
                alt="Dara Ancient City ruins with Roman and Byzantine architecture near Midyat"
                className="w-full rounded-xl"
                aspectRatio="video"
              />
              <p className="text-sm text-muted-foreground text-center mt-2">
                Dara Ancient City - Roman and Byzantine ruins with impressive underground cisterns
              </p>
            </div>

            {/* Attractions */}
            <section id="attractions">
              <h2>Top Attractions in Midyat Region</h2>
              <p>
                Beyond the monasteries, Midyat offers a wealth of cultural and historical experiences:
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 not-prose my-8">
                {attractions.map((attraction) => (
                  <Card key={attraction.name}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <attraction.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{attraction.name}</h4>
                          <p className="text-sm text-muted-foreground">{attraction.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* What's Included */}
            <section>
              <h2>What's Included in Your Transfer</h2>
              <div className="grid sm:grid-cols-2 gap-2 not-prose">
                {[
                  "Meet & greet at airport",
                  "Flight tracking",
                  "60 minutes free waiting",
                  "Door-to-door service",
                  "Professional driver",
                  "Air-conditioned vehicle",
                  "Free WiFi",
                  "Bottled water",
                  "Child seats on request",
                  "24/7 support"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 py-1">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section id="faq">
              <h2>Frequently Asked Questions</h2>
              <div className="not-prose space-y-4">
                {faqItems.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{item.question}</h3>
                      <p className="text-muted-foreground">{item.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* CTA */}
            <BlogCTA />
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TableOfContents items={tocItems} />
              
              <Card className="mt-6">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">Book Your Transfer</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get instant quote for Midyat transfer
                  </p>
                  <Button asChild className="w-full">
                    <Link to={getLocalizedPath("/")}>Get Quote</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>

        {/* Related Articles */}
        <RelatedArticles
        />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default MidyatAirportTransferGuide;
