import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, Plane, MapPin } from "lucide-react";
import cyprusTransferHero from "@/assets/blog/cyprus-transfer-hero.jpg";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
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
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import BlogCTA from "@/components/website/BlogCTA";

const CyprusAirportTransferGuide = () => {
  const { getLocalizedPath, t } = useLanguage();

  const faqItems = [
    { question: t("blogCyprusFaq1Q"), answer: t("blogCyprusFaq1A") },
    { question: t("blogCyprusFaq2Q"), answer: t("blogCyprusFaq2A") },
    { question: t("blogCyprusFaq3Q"), answer: t("blogCyprusFaq3A") },
    { question: t("blogCyprusFaq4Q"), answer: t("blogCyprusFaq4A") },
    { question: t("blogCyprusFaq5Q"), answer: t("blogCyprusFaq5A") },
    { question: t("blogCyprusFaq6Q"), answer: t("blogCyprusFaq6A") },
  ];

  const larnacaTransferPrices = [
    { destination: "Larnaca City / Hotels", duration: "10-15 min", price: "€35-45" },
    { destination: "Ayia Napa", duration: "40-50 min", price: "€50-65" },
    { destination: "Protaras", duration: "50-60 min", price: "€55-70" },
    { destination: "Limassol", duration: "45-55 min", price: "€60-75" },
    { destination: "Nicosia", duration: "35-45 min", price: "€50-65" },
    { destination: "Paphos", duration: "90-110 min", price: "€90-110" },
    { destination: "Kyrenia (North Cyprus)", duration: "60-75 min", price: "€75-90" },
  ];

  const paphosTransferPrices = [
    { destination: "Paphos City / Hotels", duration: "15-20 min", price: "€25-35" },
    { destination: "Coral Bay", duration: "25-30 min", price: "€30-40" },
    { destination: "Polis Chrysochous", duration: "45-55 min", price: "€50-65" },
    { destination: "Limassol", duration: "55-65 min", price: "€65-80" },
    { destination: "Larnaca", duration: "90-110 min", price: "€90-110" },
    { destination: "Ayia Napa", duration: "120-140 min", price: "€120-140" },
  ];

  const popularDestinations = [
    { name: "Ayia Napa", description: t("blogCyprusAyiaNapaDesc") },
    { name: "Protaras", description: t("blogCyprusProtarasDesc") },
    { name: "Limassol", description: t("blogCyprusLimassolDesc") },
    { name: "Paphos", description: t("blogCyprusPaphosDesc") },
    { name: "Kyrenia", description: t("blogCyprusKyreniaDesc") },
    { name: "Troodos Mountains", description: t("blogCyprusTroodosDesc") },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={t("blogCyprusSeoTitle")}
        description={t("blogCyprusSeoDesc")}
        keywords="Cyprus airport transfer 2025, Larnaca airport transfer, Paphos airport transfer, Ayia Napa transfer, Limassol airport transfer, Cyprus private transfer, Protaras transfer, Kyrenia transfer, Northern Cyprus transfer, Ercan airport, Famagusta transfer, Troodos transfer, Cyprus VIP transfer, Cyprus transfer price"
        canonicalPath="/blog/cyprus-airport-transfer-guide"
        ogImage="https://meettransfer.app/images/meet-transfer-vclass-interior.jpg"
        ogType="article"
        articlePublishedTime="2024-12-26"
        articleModifiedTime="2025-01-10"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: t("blogCyprusH1"),
            description: t("blogCyprusSeoDesc"),
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2024-12-26',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '17',
          },
          {
            type: 'FAQPage',
            questions: faqItems.map(item => ({
              question: item.question,
              answer: item.answer
            }))
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Cyprus Airport Transfer Guide', url: '/blog/cyprus-airport-transfer-guide' },
            ],
          },
        ]}
      />

      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Back to Blog */}
        <Link 
          to={getLocalizedPath("/blog")} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToBlog")}
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <Badge variant="secondary" className="mb-4">Cyprus</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {t("blogCyprusH1")}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t("blogCyprusIntro")}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("lastUpdated")}: January 10, 2025
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              17 {t("minRead")}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <ShareButtons title={t("blogCyprusH1")} className="mb-8" />

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12">
          <img 
            src={cyprusTransferHero} 
            alt="Cyprus Airport Transfer 2025 - VIP Private Transfer from Larnaca and Paphos Airports"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        {/* Table of Contents */}
        <TableOfContents items={[
          { id: "cyprus-intro", title: t("blogCyprusSection1Title") },
          { id: "cyprus-airports", title: t("blogCyprusSection2Title") },
          { id: "cyprus-larnaca", title: t("blogCyprusSection3Title") },
          { id: "cyprus-paphos", title: t("blogCyprusSection4Title") },
          { id: "cyprus-private", title: t("blogCyprusSection5Title") },
          { id: "cyprus-tips", title: t("blogCyprusSection6Title") },
          { id: "cyprus-destinations", title: t("blogCyprusSection7Title") },
          { id: "cyprus-north", title: t("blogCyprusSection8Title") },
          { id: "cyprus-booking", title: t("blogCyprusSection9Title") },
        ]} />

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 id="cyprus-intro">{t("blogCyprusSection1Title")}</h2>
          <p>{t("blogCyprusSection1P1")}</p>
          <p>{t("blogCyprusSection1P2")}</p>
          
          <p>
            Cyprus, the third-largest island in the Mediterranean, offers a unique blend of Greek and 
            Turkish influences, ancient history, and stunning beaches. With over 4 million tourists 
            visiting annually, efficient airport transfers are essential for a stress-free holiday. 
            Whether you're heading to the party beaches of Ayia Napa or the cultural treasures of Paphos, 
            planning your transportation ensures a smooth arrival.
          </p>

          <h3>Why Cyprus is a Popular Destination</h3>
          <ul>
            <li><strong>Year-round sunshine:</strong> Over 340 days of sun annually</li>
            <li><strong>Rich history:</strong> UNESCO World Heritage sites including Paphos Archaeological Park</li>
            <li><strong>Beautiful beaches:</strong> Crystal-clear waters and Blue Flag beaches</li>
            <li><strong>Diverse landscapes:</strong> Mountains, vineyards, and coastal scenery</li>
            <li><strong>English widely spoken:</strong> Former British colony with excellent English</li>
          </ul>

          <h2 id="cyprus-airports">{t("blogCyprusSection2Title")}</h2>
          
          <h3>{t("blogCyprusLarnacaTitle")}</h3>
          <p>{t("blogCyprusLarnacaDesc")}</p>
          <p>
            Larnaca International Airport (LCA) is Cyprus's primary airport, handling approximately 8 million 
            passengers annually. Located just 4 km from Larnaca city center, it's the main hub for flights 
            from Europe and the Middle East. The airport features modern facilities, duty-free shopping, 
            and various dining options. It's strategically positioned for easy access to all major resort areas.
          </p>

          <h3>{t("blogCyprusPaphosAirportTitle")}</h3>
          <p>{t("blogCyprusPaphosAirportDesc")}</p>
          <p>
            Paphos International Airport (PFO) serves the western part of Cyprus and handles about 3 million 
            passengers per year. It's particularly convenient for travelers staying in Paphos, Coral Bay, or 
            Polis Chrysochous. Many UK charter flights arrive here, making it popular with British holidaymakers 
            exploring the Akamas Peninsula and archaeological sites.
          </p>

          <h2 id="cyprus-larnaca">{t("blogCyprusSection3Title")}</h2>
          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("blogPriceTableDestination")}</TableHead>
                  <TableHead>{t("blogDubaiTableDuration")}</TableHead>
                  <TableHead>{t("blogDubaiTablePrice")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {larnacaTransferPrices.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.destination}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                    <TableCell>{item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h3>Understanding Larnaca Airport Transfers</h3>
          <p>
            Larnaca Airport's central location makes it convenient for most destinations. The A1 motorway 
            provides fast connections to Limassol and Paphos, while the A3 leads to Ayia Napa and Protaras. 
            Traffic is generally light, though summer weekends can see increased congestion on coastal routes.
          </p>

          <h2 id="cyprus-paphos">{t("blogCyprusSection4Title")}</h2>
          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("blogPriceTableDestination")}</TableHead>
                  <TableHead>{t("blogDubaiTableDuration")}</TableHead>
                  <TableHead>{t("blogDubaiTablePrice")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paphosTransferPrices.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.destination}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                    <TableCell>{item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h2 id="cyprus-private">{t("blogCyprusSection5Title")}</h2>
          <p>
            <Link to={getLocalizedPath("/cyprus-transfer")} className="text-primary hover:underline">{t("blogCyprusPrivateTransfer")}</Link> {t("blogCyprusSection5P1")}
          </p>

          <h3>Why Private Transfer in Cyprus?</h3>
          <p>
            While Cyprus has public buses and regular transportation options, private transfers offer significant advantages.
            Resort areas like Ayia Napa, Protaras, and the Paphos region are spread across large areas, 
            often with hotels located outside main transport hubs. Private transfer ensures door-to-door 
            service without the hassle of multiple connections or language barriers.
          </p>

          <h3>{t("blogCyprusSection5SubTitle")}</h3>
          <ul>
            <li>{t("blogCyprusInclude1")}</li>
            <li>{t("blogCyprusInclude2")}</li>
            <li>{t("blogCyprusInclude3")}</li>
            <li>{t("blogCyprusInclude4")}</li>
            <li>{t("blogCyprusInclude5")}</li>
            <li>{t("blogCyprusInclude6")}</li>
            <li>{t("blogCyprusInclude7")}</li>
          </ul>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t("blogCyprusWhyChoose")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCyprusWhyChoose1")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCyprusWhyChoose2")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCyprusWhyChoose3")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogCyprusWhyChoose4")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 id="cyprus-tips">{t("blogCyprusSection6Title")}</h2>
          <p>{t("blogCyprusSection6Intro")}</p>

          <h3>Essential Cyprus Travel Tips</h3>
          <ul>
            <li><strong>Currency:</strong> Euro (€) is used throughout the Republic of Cyprus</li>
            <li><strong>Driving:</strong> Left-hand traffic (like UK), international license accepted</li>
            <li><strong>Language:</strong> Greek is official, but English is widely spoken</li>
            <li><strong>Power sockets:</strong> UK-style three-pin plugs (Type G)</li>
            <li><strong>Tipping:</strong> 10% in restaurants is customary</li>
          </ul>

          <h2 id="cyprus-destinations">{t("blogCyprusSection7Title")}</h2>
          <div className="not-prose my-8 grid md:grid-cols-2 gap-4">
            {popularDestinations.map((destination, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {destination.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{destination.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h3>Discovering Cyprus Beyond the Beaches</h3>
          <p>
            While Cyprus is famous for its beaches, the island offers much more. The Troodos Mountains 
            provide hiking trails and traditional villages, with Byzantine-era painted churches that are 
            UNESCO World Heritage sites. Wine enthusiasts can explore the Commandaria wine region, producing 
            one of the world's oldest named wines. The divided capital Nicosia offers a unique glimpse into 
            the island's complex history.
          </p>

          <h2 id="cyprus-north">{t("blogCyprusSection8Title")}</h2>
          <p>{t("blogCyprusSection8Intro")}</p>
          <p>
            Northern Cyprus (Turkish Republic of Northern Cyprus) can be accessed via checkpoints from the 
            Republic of Cyprus. Popular destinations include the historic harbor town of Kyrenia (Girne), 
            the ancient ruins of Salamis near Famagusta (Gazimağusa), and the pristine Karpaz Peninsula. 
            We offer transfers across the island, including to these lesser-visited treasures.
          </p>

          <h2 id="cyprus-booking">{t("blogCyprusSection9Title")}</h2>
          <p>{t("blogCyprusSection9Intro")}</p>

          <h3>Booking Your Cyprus Transfer</h3>
          <p>
            We recommend booking your transfer at least 48 hours in advance, especially during peak season 
            (June-September). Our simple booking process requires your flight details, hotel address, and 
            passenger count. Confirmation is sent instantly via email, and our driver will be waiting with 
            a personalized name board when you exit arrivals.
          </p>

          <h2>{t("blogCyprusConclusion")}</h2>
          <p>{t("blogCyprusConclusionP1")}</p>
          <p>
            Cyprus offers an incredible combination of Mediterranean beauty, ancient history, and warm 
            hospitality. From the legendary birthplace of Aphrodite to the vibrant nightlife of Ayia Napa, 
            this island has something for everyone. Start your Cypriot adventure right with a comfortable, 
            reliable private transfer that takes you directly to where the memories begin.
          </p>
        </div>

        {/* CTA Section */}
        <BlogCTA destination="Cyprus" />

        {/* FAQ Section */}
        <section className="not-prose mt-16">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8">
            {t("frequentlyAskedQuestions")}
          </h2>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-border pb-6 last:border-0">
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Posts */}
        <RelatedArticles currentArticleId="cyprus-airport-transfer-guide" />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default CyprusAirportTransferGuide;
