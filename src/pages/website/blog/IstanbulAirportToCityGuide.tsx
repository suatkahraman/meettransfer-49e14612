import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import istanbulAirportCityHero from "@/assets/blog/istanbul-airport-city-hero.jpg";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";

const IstanbulAirportToCityGuide = () => {
  const { t, getLocalizedPath } = useLanguage();

  const faqItems = [
    {
      question: "What is the fastest way to get from Istanbul Airport to city center?",
      answer: "The fastest way is by private transfer, taking approximately 35-45 minutes to Taksim or Sultanahmet depending on traffic. The metro takes about 50-60 minutes but requires transfers."
    },
    {
      question: "How much does regular transport cost from Istanbul Airport to Taksim?",
      answer: "Regular transport from Istanbul Airport to Taksim typically costs between 600-800 TL ($20-25 USD) depending on traffic and time of day. Prices can be higher at night or during peak hours."
    },
    {
      question: "Is there a metro from Istanbul Airport?",
      answer: "Yes, the M11 metro line connects Istanbul Airport to Gayrettepe station, where you can transfer to the M2 line to reach Taksim. The journey takes approximately 50-60 minutes."
    },
    {
      question: "What is the best option for families with children?",
      answer: "Private transfer is the best option for families. It offers door-to-door service, child seats upon request, help with luggage, and no waiting or transfers required."
    },
    {
      question: "Are private transfers available 24/7?",
      answer: "Yes, Meet Transfer offers 24/7 private transfer services with flight tracking. Your driver will monitor your flight and adjust pickup time automatically for delays."
    },
    {
      question: "How do I book a private transfer from Istanbul Airport?",
      answer: "You can book through our website's reservation form or contact us via WhatsApp for instant booking. We'll send you a price quote within minutes."
    }
  ];

  const transportOptions = [
    {
      method: "Private Transfer",
      duration: "35-45 min",
      price: "€50-65",
      pros: ["Door-to-door", "Meet & Greet", "Flight tracking", "Child seats available"],
      cons: ["Higher cost than public transport"],
      rating: 5
    },
    {
      method: "Regular",
      duration: "40-60 min",
      price: "Variable",
      pros: ["Available at airport", "No booking needed"],
      cons: ["Variable pricing", "Language barrier", "No meet & greet", "Traffic issues"],
      rating: 3
    },
    {
      method: "Metro (M11)",
      duration: "50-70 min",
      price: "€1-2",
      pros: ["Very affordable", "Avoids traffic"],
      cons: ["Requires transfer", "Limited luggage space", "Crowded", "Not 24/7"],
      rating: 3
    },
    {
      method: "Havaist Bus",
      duration: "60-90 min",
      price: "€5-8",
      pros: ["Affordable", "Direct to major areas"],
      cons: ["Infrequent schedule", "Traffic dependent", "Limited stops"],
      rating: 3
    }
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={t('blogIstanbul1Title')}
        description={t('blogIstanbul1Desc')}
        keywords="Istanbul Airport to city 2025, Istanbul Airport transfer, IST to Taksim, Istanbul Airport metro, Istanbul Airport to Sultanahmet, private transfer Istanbul, Istanbul Airport bus, Havaist bus, M11 metro Istanbul, Istanbul new airport transport, IST airport to hotel"
        canonicalPath="/blog/istanbul-airport-to-city-best-way"
        ogImage="https://meettransfer.app/images/meet-transfer-vclass-interior.jpg"
        ogType="article"
        articlePublishedTime="2024-12-15"
        articleModifiedTime="2025-01-10"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t('blogIstanbul1H1'),
            description: t('blogIstanbul1Desc'),
            image: 'https://meettransfer.app/images/meet-transfer-vclass-interior.jpg',
            datePublished: '2024-12-15',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '14',
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Istanbul Airport to City Guide', url: '/blog/istanbul-airport-to-city-best-way' },
            ],
          },
          {
            type: 'FAQPage',
            questions: faqItems.map(item => ({
              question: item.question,
              answer: item.answer
            }))
          }
        ]}
      />

      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Back to Blog */}
        <Link 
          to={getLocalizedPath("/blog")} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToBlog')}
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <Badge variant="secondary" className="mb-4">Istanbul</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t('blogIstanbul1H1')}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t('blogIstanbul1Intro')}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t('lastUpdated')}: January 10, 2025
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              14 {t('minRead')}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <ShareButtons title={t('blogIstanbul1H1')} className="mb-8" />

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12">
          <img 
            src={istanbulAirportCityHero} 
            alt="Istanbul Airport to City Center 2025 - Best Transportation Options Including Private Transfer, Metro M11, and Havaist Bus"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>Introduction: Getting from Istanbul Airport to the City</h2>
          <p>
            Istanbul Airport (IST) is one of the world's largest and busiest airports, serving as Turkey's 
            main international gateway. Located approximately 35 kilometers northwest of the city center, 
            it replaced the historic Atatürk Airport in 2019. With millions of passengers passing through 
            annually, finding the best transportation option to your destination is crucial for a smooth 
            start to your Istanbul experience.
          </p>
          <p>
            In this comprehensive guide, we'll explore every transportation option available, compare 
            prices and journey times, and help you decide which method suits your needs best. Whether 
            you're traveling solo, with family, or in a large group, we've got you covered.
          </p>

          <h2>Quick Comparison: All Transportation Options</h2>
          <p>
            Before diving into details, here's a quick overview of your options:
          </p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Option</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price (to Taksim)</TableHead>
                  <TableHead>Best For</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Private Transfer</TableCell>
                  <TableCell>35-45 min</TableCell>
                  <TableCell>€50-65</TableCell>
                  <TableCell>Families, Business, Comfort</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Regular</TableCell>
                  <TableCell>40-60 min</TableCell>
                  <TableCell>Variable</TableCell>
                  <TableCell>Solo travelers, Flexibility</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Metro (M11)</TableCell>
                  <TableCell>50-70 min</TableCell>
                  <TableCell>€1-2</TableCell>
                  <TableCell>Budget travelers</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Havaist Bus</TableCell>
                  <TableCell>60-90 min</TableCell>
                  <TableCell>€5-8</TableCell>
                  <TableCell>Budget, Major destinations</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h2>Option 1: Private Airport Transfer (Recommended)</h2>
          <p>
            A <Link to={getLocalizedPath("/istanbul-transfer")} className="text-primary hover:underline">private airport transfer</Link> is 
            the most comfortable and stress-free way to travel from Istanbul Airport to your destination. 
            This option is particularly popular among families, business travelers, and anyone who values 
            convenience over cost savings.
          </p>

          <h3>How Private Transfers Work</h3>
          <p>
            When you book a private transfer, your driver will be waiting at the arrivals hall with a 
            personalized name sign. The service includes:
          </p>
          <ul>
            <li>Meet & Greet at the arrivals hall</li>
            <li>Help with luggage</li>
            <li>Direct door-to-door service</li>
            <li>Real-time flight tracking</li>
            <li>Complimentary water and WiFi</li>
            <li>Child seats upon request</li>
            <li>No hidden fees or surge pricing</li>
          </ul>

          <h3>Private Transfer Pricing</h3>
          <p>
            Private transfer prices from Istanbul Airport are fixed and transparent:
          </p>
          <ul>
            <li><strong>To Taksim/Beyoğlu:</strong> €50-55 (Mercedes Vito)</li>
            <li><strong>To Sultanahmet:</strong> €50-55 (Mercedes Vito)</li>
            <li><strong>To Kadıköy (Asian Side):</strong> €65-70</li>
            <li><strong>To Sabiha Gökçen Airport:</strong> €110-130</li>
            <li><strong>To Bursa:</strong> €185-220</li>
            <li><strong>To Sapanca:</strong> €245-265</li>
            <li><strong>To Kartepe:</strong> €255-285</li>
          </ul>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Why Choose Private Transfer?
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>No waiting in queues</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Fixed price - no surprises</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Professional English-speaking driver</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>24/7 availability</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>Option 2: Regular Transport</h2>
          <p>
            Regular transport options are available outside the arrivals hall at Istanbul Airport. 
            While convenient for solo travelers, there are some important things to consider.
          </p>

          <h3>Tips for Regular Transport</h3>
          <p>
            When using regular transport options, keep these points in mind:
          </p>
          <ul>
            <li>Variable pricing depending on traffic and time</li>
            <li>Communication may be challenging</li>
            <li>No pre-arranged pickup or meet & greet service</li>
            <li>Payment typically in local currency</li>
          </ul>

          <h2>Option 3: Metro (M11 Line)</h2>
          <p>
            The Istanbul Metro M11 line connects Istanbul Airport to the city center. This is the most 
            budget-friendly option but requires some navigation and isn't ideal if you have heavy luggage.
          </p>

          <h3>Metro Route</h3>
          <p>
            The M11 line runs from Istanbul Airport to Gayrettepe station, where you can transfer to:
          </p>
          <ul>
            <li><strong>M2 Line:</strong> To Taksim, Şişli, Levent</li>
            <li><strong>Marmaray:</strong> To Asian side via undersea tunnel</li>
          </ul>

          <h3>Metro Timings</h3>
          <p>
            The metro operates from approximately 6:00 AM to midnight. Trains run every 8-10 minutes 
            during peak hours and every 15-20 minutes during off-peak times.
          </p>

          <div className="not-prose my-8">
            <Card className="bg-red-500/5 border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Metro Limitations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>• Not available late night/early morning</p>
                <p>• Limited luggage space</p>
                <p>• Requires transfers for most destinations</p>
                <p>• Can be very crowded during rush hours</p>
                <p>• Walking distance in airport is significant</p>
              </CardContent>
            </Card>
          </div>

          <h2>Option 4: Havaist Airport Buses</h2>
          <p>
            Havaist is the official airport bus service connecting Istanbul Airport to various parts of 
            the city. It's a good middle-ground option between metro and private transfer.
          </p>

          <h3>Main Havaist Routes</h3>
          <ul>
            <li><strong>HVIST-1:</strong> To Aksaray (via Yenikapı)</li>
            <li><strong>HVIST-12:</strong> To Taksim Square</li>
            <li><strong>HVIST-14:</strong> To Kadıköy (Asian Side)</li>
            <li><strong>HVIST-19:</strong> To Yenikapı</li>
          </ul>

          <h2>Which Option Should You Choose?</h2>
          <p>
            Your best choice depends on your specific situation:
          </p>

          <h3>Choose Private Transfer If:</h3>
          <ul>
            <li>You're traveling with family or children</li>
            <li>You have heavy or multiple luggage</li>
            <li>You're arriving late at night or early morning</li>
            <li>You value comfort and convenience</li>
            <li>You're a business traveler</li>
            <li>You're unfamiliar with Istanbul</li>
          </ul>

          <h3>Choose Regular Transport If:</h3>
          <ul>
            <li>You're traveling solo with light luggage</li>
            <li>You're comfortable with local transport</li>
            <li>You want flexibility without pre-booking</li>
          </ul>

          <h3>Choose Metro If:</h3>
          <ul>
            <li>You're on a tight budget</li>
            <li>You're traveling during daytime hours</li>
            <li>You have minimal luggage</li>
            <li>Your hotel is near a metro station</li>
          </ul>

          <h2>Distances from Istanbul Airport</h2>
          <p>
            Here are the approximate distances from Istanbul Airport to popular destinations:
          </p>
          <ul>
            <li><strong>Taksim Square:</strong> 40 km (25 miles)</li>
            <li><strong>Sultanahmet:</strong> 45 km (28 miles)</li>
            <li><strong>Kadıköy:</strong> 55 km (34 miles)</li>
            <li><strong>Galataport:</strong> 42 km (26 miles)</li>
            <li><strong>Sabiha Gökçen Airport:</strong> 90 km (56 miles)</li>
          </ul>

          <h2>Tips for a Smooth Arrival</h2>
          <ol>
            <li><strong>Book in advance:</strong> Pre-book your transfer to avoid waiting</li>
            <li><strong>Share flight details:</strong> This helps with flight tracking</li>
            <li><strong>Have address ready:</strong> In Turkish if possible</li>
            <li><strong>Get local SIM:</strong> Available at the airport for communication</li>
            <li><strong>Know the route:</strong> Follow your journey on Google Maps</li>
          </ol>

          <h2>Conclusion</h2>
          <p>
            Getting from Istanbul Airport to the city center doesn't have to be stressful. While each 
            transportation option has its merits, <Link to={getLocalizedPath("/istanbul-transfer")} className="text-primary hover:underline">private 
            transfer</Link> offers the best balance of comfort, reliability, and peace of mind – especially 
            after a long flight.
          </p>
          <p>
            At Meet Transfer, we specialize in providing premium airport transfers with professional 
            drivers, luxury vehicles, and 24/7 support. <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">Request 
            your price</Link> today and start your Istanbul journey in style.
          </p>
        </div>

        {/* CTA Section */}
        <div className="my-12 p-8 bg-primary/5 rounded-2xl text-center">
          <h3 className="font-serif text-2xl font-bold mb-4">
            {t('readyToBookTransfer')}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t('getInstantQuote')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/book")}>
              <Button size="lg" variant="accent" className="gap-2">
                {t('requestPrice')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={getLocalizedPath("/istanbul-transfer")}>
              <Button size="lg" variant="outline">
                {t('footerIstanbul')}
              </Button>
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="my-12">
          <h2 className="font-serif text-2xl font-bold mb-8">{t('frequentlyAskedQuestions')}</h2>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-border pb-6 last:border-0">
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Articles */}
        <RelatedArticles currentArticleId="istanbul-airport-to-city-best-way" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default IstanbulAirportToCityGuide;
