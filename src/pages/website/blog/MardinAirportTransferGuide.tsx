import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, Star, Shield, Car, Users, Plane, Building, Camera, CheckCircle2 } from "lucide-react";
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

const MardinAirportTransferGuide = () => {
  const { t, getLocalizedPath, language } = useLanguage();
  const { formatBlogDate } = useBlogDate();
  const formattedDate = formatBlogDate("2025-01-16");
  const faqItems = [
    {
      question: "How do I get from Mardin Airport to city center?",
      answer: "The best way is private airport transfer. Mardin Airport (MQM) is located 20 km from city center. Private transfer takes about 25 minutes with door-to-door service, meet & greet, and fixed prices."
    },
    {
      question: "What is the cost of airport transfer to Mardin?",
      answer: "Private transfer from Mardin Airport to city center starts from €35 for sedan vehicles. VIP Mercedes Vito transfers start from €55. All prices include meet & greet service and free waiting time."
    },
    {
      question: "Can I book a transfer to Midyat from Mardin Airport?",
      answer: "Yes, we offer direct transfers from Mardin Airport to Midyat. The journey takes approximately 1.5 hours covering 65 km. Perfect for visiting the ancient Syriac monasteries and stone houses."
    },
    {
      question: "Is there public transport from Mardin Airport?",
      answer: "Public transport options are very limited from Mardin Airport. Private transfer is the most reliable and comfortable option, especially for tourists visiting historical sites."
    },
    {
      question: "What attractions can I visit in Mardin?",
      answer: "Mardin offers incredible historical sites including Zinciriye Medrese, Kasımiye Medrese, Deyrulzafaran Monastery, Mardin Museum, and the stunning old town with its honey-colored stone architecture."
    }
  ];

  const transferPrices = [
    { destination: "Mardin City Center", distance: "20 km", duration: "25 min", sedan: "€35", vito: "€55", maybach: "€120" },
    { destination: "Midyat", distance: "65 km", duration: "1.5 hours", sedan: "€65", vito: "€85", maybach: "€150" },
    { destination: "Nusaybin", distance: "55 km", duration: "1 hour", sedan: "€55", vito: "€75", maybach: "€140" },
    { destination: "Kızıltepe", distance: "40 km", duration: "45 min", sedan: "€45", vito: "€65", maybach: "€130" },
    { destination: "Deyrulzafaran Monastery", distance: "25 km", duration: "30 min", sedan: "€40", vito: "€60", maybach: "€125" },
    { destination: "Dara Ancient City", distance: "30 km", duration: "35 min", sedan: "€45", vito: "€65", maybach: "€130" },
  ];

  const attractions = [
    {
      name: "Zinciriye Medrese",
      description: "14th-century Islamic theological school with stunning architecture and panoramic views of Mesopotamia.",
      icon: Building
    },
    {
      name: "Deyrulzafaran Monastery",
      description: "5th-century Syriac Orthodox monastery, one of the oldest in the world, still active today.",
      icon: Building
    },
    {
      name: "Mardin Old Town",
      description: "UNESCO tentative site with honey-colored stone houses cascading down the hillside.",
      icon: Camera
    },
    {
      name: "Kasımiye Medrese",
      description: "15th-century madrasa featuring remarkable Islamic architecture and calligraphy.",
      icon: Building
    }
  ];

  const tocItems = [
    { id: "overview", title: "Overview" },
    { id: "airport-info", title: "Mardin Airport Info" },
    { id: "transfer-options", title: "Transfer Options" },
    { id: "prices", title: "Transfer Prices" },
    { id: "attractions", title: "Top Attractions" },
    { id: "faq", title: "FAQ" },
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title="Mardin Airport Transfer - Private VIP Shuttle to Midyat, Nusaybin 2025"
        description="Book private airport transfer from Mardin Airport (MQM) to city center, Midyat, Deyrulzafaran Monastery. Mercedes fleet, meet & greet, fixed prices. Best Mardin transfer service."
        keywords="Mardin airport transfer, Mardin airport taxi, Mardin to Midyat transfer, Deyrulzafaran monastery transfer, Mardin VIP transfer, Mesopotamia tours, Mardin private shuttle, MQM airport transfer"
        canonicalPath="/blog/mardin-airport-transfer-guide"
        ogImage="https://meettransfer.app/images/vito-exterior-black.jpg"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness', includeRating: true },
          {
            type: 'Article',
            headline: "Mardin Airport Transfer - Complete Guide 2025",
            description: "Book private airport transfer from Mardin Airport to city center, Midyat, and historical sites.",
            image: "https://meettransfer.app/images/vito-exterior-black.jpg",
            datePublished: "2025-01-16",
            dateModified: "2025-01-16",
            author: "Meet Transfer",
            readingTime: "10",
            wordCount: 2100,
            keywords: ["Mardin airport transfer", "Midyat transfer", "Mesopotamia tours", "Deyrulzafaran monastery"]
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Mardin Airport Transfer', url: '/blog/mardin-airport-transfer-guide' },
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
            <Badge variant="secondary">Mardin</Badge>
            <Badge variant="outline">Mesopotamia</Badge>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Updated 2025
            </Badge>
          </div>
          
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Mardin Airport Transfer - Private VIP Shuttle to Midyat & Historical Sites
          </h1>
          
          <p className="text-lg text-muted-foreground mb-6 max-w-3xl">
            Discover ancient Mesopotamia with comfortable private transfers from Mardin Airport. 
            Door-to-door service to Mardin city center, Midyat, Deyrulzafaran Monastery, and Dara Ancient City.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime="2025-01-16">{formattedDate}</time>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>10 min read</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>4.9/5 Rating</span>
            </div>
          </div>

          <ShareButtons title="Mardin Airport Transfer - Private VIP Shuttle to Midyat, Nusaybin 2025" />
        </header>

        {/* Hero Image */}
        <OptimizedBlogImage
          src={vitoExteriorBlack}
          alt="Private airport transfer Mercedes Vito in Mardin, Mesopotamia region"
          className="w-full aspect-video rounded-xl mb-12"
          priority={true}
        />

        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          {/* Main Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            
            {/* Overview */}
            <section id="overview">
              <h2>Why Choose Private Transfer in Mardin?</h2>
              <p>
                Mardin, the jewel of Mesopotamia, offers one of Turkey's most unique travel experiences. 
                The ancient city perched on a hilltop overlooking the Syrian plains requires reliable 
                transportation to fully explore its wonders.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 not-prose my-8">
                <Card>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Local Expert Drivers</h3>
                      <p className="text-sm text-muted-foreground">Drivers who know the region's winding roads and historical sites</p>
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
                      <p className="text-sm text-muted-foreground">Comfortable vehicles for Mesopotamia's terrain</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Plane className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Flight Tracking</h3>
                      <p className="text-sm text-muted-foreground">We monitor your flight for delays</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Multi-Language Support</h3>
                      <p className="text-sm text-muted-foreground">English, Turkish, Arabic speaking drivers</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Airport Info */}
            <section id="airport-info">
              <h2>Mardin Airport (MQM) Information</h2>
              <p>
                Mardin Airport is a small but efficient regional airport located 20 km south of Mardin city center. 
                It serves domestic flights from Istanbul, Ankara, and other major Turkish cities.
              </p>
              <ul>
                <li><strong>IATA Code:</strong> MQM</li>
                <li><strong>Distance to City:</strong> 20 km (25 minutes)</li>
                <li><strong>Distance to Midyat:</strong> 65 km (1.5 hours)</li>
                <li><strong>Airlines:</strong> Turkish Airlines, Pegasus, AnadoluJet</li>
              </ul>
            </section>

            {/* Transfer Options */}
            <section id="transfer-options">
              <h2>Transfer Options from Mardin Airport</h2>
              
              <h3>1. Private Sedan Transfer</h3>
              <p>
                Ideal for couples or solo travelers. Comfortable Mercedes E-Class or similar 
                with air conditioning and professional driver.
              </p>

              <h3>2. VIP Mercedes Vito</h3>
              <p>
                Perfect for families or small groups up to 7 passengers. Spacious interior, 
                leather seats, and ample luggage space for Mesopotamia exploration.
              </p>

              <h3>3. Mercedes Maybach</h3>
              <p>
                Ultimate luxury for discerning travelers. Arrive at Mardin's ancient streets 
                in unparalleled comfort and style.
              </p>
            </section>

            {/* Prices */}
            <section id="prices">
              <h2>Mardin Airport Transfer Prices 2025</h2>
              
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

            {/* Attractions */}
            <section id="attractions">
              <h2>Top Attractions in Mardin Region</h2>
              <p>
                Mardin and its surroundings offer incredible historical and cultural experiences. 
                Our transfer service can take you to all these remarkable sites:
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
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <BlogCTA />

            {/* FAQ */}
            <section id="faq" className="not-prose">
              <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{item.question}</h3>
                      <p className="text-muted-foreground text-sm">{item.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <TableOfContents items={tocItems} />
              
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Book Your Transfer</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get instant pricing for Mardin Airport transfers
                  </p>
                  <Button asChild className="w-full">
                    <Link to={getLocalizedPath("/")}>Book Now</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>

        {/* Related Articles */}
        <RelatedArticles currentArticleId="mardin-airport-transfer-guide" maxArticles={3} />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default MardinAirportTransferGuide;
