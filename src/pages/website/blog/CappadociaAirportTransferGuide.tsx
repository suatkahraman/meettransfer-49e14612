import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle2, MapPin, Plane, Star, Sunrise } from "lucide-react";
import cappadociaTransferHero from "@/assets/blog/cappadocia-transfer-hero.jpg";
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
import { getWhatsAppUrl } from "@/lib/contact";
import ShareButtons from "@/components/website/ShareButtons";

const CappadociaAirportTransferGuide = () => {
  const { getLocalizedPath, t, language } = useLanguage();

  const faqItems = [
    { 
      question: language === 'TR' 
        ? "Kapadokya'ya en yakın havalimanı hangisi?" 
        : "Which airport is closest to Cappadocia?",
      answer: language === 'TR'
        ? "Nevşehir-Kapadokya Havalimanı (NAV) Göreme'ye sadece 40 km mesafededir. Kayseri Havalimanı (ASR) ise 80 km uzaklıktadır ancak daha fazla uçuş seçeneği sunar."
        : "Nevsehir-Kapadocia Airport (NAV) is only 40 km from Göreme. Kayseri Airport (ASR) is 80 km away but offers more flight options."
    },
    { 
      question: language === 'TR' 
        ? "Havalimanından otele transfer ne kadar sürer?" 
        : "How long is the transfer from airport to hotel?",
      answer: language === 'TR'
        ? "Nevşehir Havalimanı'ndan Göreme'ye yaklaşık 35-45 dakika, Kayseri Havalimanı'ndan ise 60-75 dakika sürer."
        : "From Nevsehir Airport to Göreme it takes approximately 35-45 minutes, from Kayseri Airport it takes 60-75 minutes."
    },
    { 
      question: language === 'TR' 
        ? "Balon turu için transfer hizmeti var mı?" 
        : "Is there transfer service for balloon tours?",
      answer: language === 'TR'
        ? "Evet, sabah 04:00-05:00 arası balon turları için özel erken sabah transfer hizmetimiz mevcuttur. Otel alımı dahildir."
        : "Yes, we offer early morning transfer service for balloon tours between 04:00-05:00 AM. Hotel pickup is included."
    },
    { 
      question: language === 'TR' 
        ? "Transfer fiyatlarına neler dahil?" 
        : "What is included in transfer prices?",
      answer: language === 'TR'
        ? "Tüm vergiler, uçuş takibi, ücretsiz bekleme süresi (60 dk), kapıdan kapıya hizmet, çocuk koltuğu (talep üzerine) ve 7/24 destek dahildir."
        : "All taxes, flight tracking, free waiting time (60 min), door-to-door service, child seat (on request), and 24/7 support are included."
    },
    { 
      question: language === 'TR' 
        ? "Kapadokya'da hangi bölgelere transfer yapıyorsunuz?" 
        : "Which areas do you transfer to in Cappadocia?",
      answer: language === 'TR'
        ? "Göreme, Ürgüp, Uçhisar, Avanos, Nevşehir merkez, Ortahisar, Mustafapaşa ve tüm butik otellere transfer hizmeti sunuyoruz."
        : "We offer transfers to Göreme, Ürgüp, Uchisar, Avanos, Nevşehir city center, Ortahisar, Mustafapaşa and all boutique hotels."
    },
    { 
      question: language === 'TR' 
        ? "Gece geç saatlerde transfer mümkün mü?" 
        : "Is late night transfer available?",
      answer: language === 'TR'
        ? "Evet, 7/24 transfer hizmeti sunuyoruz. Gece uçuşları için ek ücret alınmaz."
        : "Yes, we offer 24/7 transfer service. There is no extra charge for night flights."
    },
  ];

  // Sistemdeki gerçek fiyatlar
  const kayseriPrices = [
    { area: "Göreme", distance: "80 km", time: "60-75 min", vitoPrice: "€90", vipPrice: "€95", maybachPrice: "€110", minibusPrice: "€160" },
    { area: "Ürgüp", distance: "75 km", time: "55-70 min", vitoPrice: "€90", vipPrice: "€95", maybachPrice: "€110", minibusPrice: "€160" },
    { area: "Uçhisar", distance: "78 km", time: "60-75 min", vitoPrice: "€90", vipPrice: "€95", maybachPrice: "€110", minibusPrice: "€160" },
    { area: "Avanos", distance: "85 km", time: "65-80 min", vitoPrice: "€95", vipPrice: "€100", maybachPrice: "€115", minibusPrice: "€165" },
    { area: "Nevşehir", distance: "70 km", time: "50-65 min", vitoPrice: "€85", vipPrice: "€90", maybachPrice: "€105", minibusPrice: "€155" },
  ];

  const nevsehirPrices = [
    { area: "Göreme", distance: "40 km", time: "35-45 min", vitoPrice: "€70", vipPrice: "€74", maybachPrice: "€80", minibusPrice: "€135" },
    { area: "Ürgüp", distance: "35 km", time: "30-40 min", vitoPrice: "€70", vipPrice: "€74", maybachPrice: "€80", minibusPrice: "€135" },
    { area: "Uçhisar", distance: "38 km", time: "32-42 min", vitoPrice: "€70", vipPrice: "€74", maybachPrice: "€80", minibusPrice: "€135" },
    { area: "Avanos", distance: "45 km", time: "40-50 min", vitoPrice: "€75", vipPrice: "€79", maybachPrice: "€85", minibusPrice: "€140" },
    { area: "Nevşehir", distance: "30 km", time: "25-35 min", vitoPrice: "€65", vipPrice: "€69", maybachPrice: "€75", minibusPrice: "€130" },
  ];

  const popularHotels = [
    "Museum Hotel",
    "Argos in Cappadocia",
    "Sultan Cave Suites",
    "Mithra Cave Hotel",
    "Kelebek Special Cave Hotel",
    "Aydinli Cave House",
    "Cappadocia Cave Suites",
    "Taskonaklar Hotel",
  ];

  const balloonCompanies = [
    "Royal Balloon",
    "Butterfly Balloons",
    "Voyager Balloons",
    "Turkiye Balloons",
    "Atmosfer Balloons",
  ];

  return (
    <WebsiteLayout>
      <SEOHead
        title={language === 'TR' 
          ? "Kapadokya Havalimanı Transfer Rehberi 2025 | Fiyatlar & Balon Turları" 
          : "Cappadocia Airport Transfer Guide 2025 | Prices & Balloon Tours"}
        description={language === 'TR'
          ? "Kayseri ve Nevşehir havalimanlarından Göreme, Ürgüp ve diğer Kapadokya bölgelerine VIP transfer. Balon turu transferleri, güncel fiyatlar ve otel listesi."
          : "VIP transfer from Kayseri and Nevsehir airports to Göreme, Ürgüp and other Cappadocia regions. Balloon tour transfers, current prices and hotel list."}
        keywords="Cappadocia airport transfer 2025, Kayseri airport to Göreme, Nevsehir airport transfer, Cappadocia balloon tour transfer, Göreme hotel transfer, Ürgüp transfer, Cappadocia VIP transfer price, Kapadokya havalimanı transfer, balon turu transfer"
        canonicalPath="/blog/cappadocia-airport-transfer-guide"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
        ogType="article"
        articlePublishedTime="2025-01-10"
        articleModifiedTime="2025-01-10"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: language === 'TR' 
              ? "Kapadokya Havalimanı Transfer Rehberi 2025" 
              : "Cappadocia Airport Transfer Guide 2025",
            description: language === 'TR'
              ? "Kayseri ve Nevşehir havalimanlarından Kapadokya transferi hakkında kapsamlı rehber"
              : "Comprehensive guide about transfers from Kayseri and Nevsehir airports to Cappadocia",
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2025-01-10',
            dateModified: '2025-01-10',
            author: 'Meet Transfer',
            readingTime: '18',
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: '/' },
              { name: 'Blog', url: '/blog' },
              { name: 'Cappadocia Airport Transfer Guide', url: '/blog/cappadocia-airport-transfer-guide' },
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
          {t("backToBlog")}
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <Badge variant="secondary" className="mb-4">Cappadocia</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {language === 'TR' 
              ? "Kapadokya Havalimanı Transfer Rehberi 2025: Fiyatlar, Balon Turları ve Oteller" 
              : "Cappadocia Airport Transfer Guide 2025: Prices, Balloon Tours & Hotels"}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {language === 'TR'
              ? "Kayseri (ASR) ve Nevşehir-Kapadokya (NAV) havalimanlarından Göreme, Ürgüp ve tüm Kapadokya bölgelerine VIP transfer hizmeti. Güncel fiyatlar, balon turu transferleri ve popüler otel bilgileri."
              : "VIP transfer service from Kayseri (ASR) and Nevsehir-Cappadocia (NAV) airports to Göreme, Ürgüp and all Cappadocia regions. Current prices, balloon tour transfers and popular hotel information."}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("lastUpdated")}: January 10, 2025
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              18 {t("minRead")}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <ShareButtons 
          title={language === 'TR' 
            ? "Kapadokya Havalimanı Transfer Rehberi 2025" 
            : "Cappadocia Airport Transfer Guide 2025"} 
          className="mb-8" 
        />

        {/* Featured Image */}
        <div className="aspect-video overflow-hidden rounded-xl mb-12">
          <img 
            src={cappadociaTransferHero} 
            alt={language === 'TR' 
              ? "Kapadokya Havalimanı Transfer 2025 - Göreme, Ürgüp, Uçhisar Otellere VIP Transfer" 
              : "Cappadocia Airport Transfer 2025 - VIP Transfer to Göreme, Ürgüp, Uchisar Hotels"}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>
            {language === 'TR' 
              ? "Kapadokya'ya Nasıl Ulaşılır?" 
              : "How to Get to Cappadocia?"}
          </h2>
          <p>
            {language === 'TR'
              ? "Kapadokya, Türkiye'nin en büyüleyici destinasyonlarından biridir. Peri bacaları, yeraltı şehirleri ve eşsiz balon turlarıyla ünlü bu bölgeye iki havalimanından ulaşabilirsiniz: Nevşehir-Kapadokya Havalimanı (NAV) ve Kayseri Erkilet Havalimanı (ASR). Her iki havalimanı da yılda milyonlarca turisti Kapadokya'nın büyüleyici manzaralarına taşıyor."
              : "Cappadocia is one of Turkey's most enchanting destinations. Famous for its fairy chimneys, underground cities, and unique balloon tours, you can reach this region from two airports: Nevsehir-Cappadocia Airport (NAV) and Kayseri Erkilet Airport (ASR). Both airports transport millions of tourists annually to Cappadocia's mesmerizing landscapes."}
          </p>
          <p>
            {language === 'TR'
              ? "Nevşehir Havalimanı Göreme'ye daha yakındır (40 km), ancak Kayseri Havalimanı daha fazla uçuş seçeneği sunar. İstanbul, Ankara ve diğer büyük şehirlerden düzenli seferler yapılmaktadır. Özellikle yaz aylarında ve balon turu sezonu olan Nisan-Kasım döneminde uçuşların erken dolması nedeniyle erken rezervasyon önemlidir."
              : "Nevsehir Airport is closer to Göreme (40 km), but Kayseri Airport offers more flight options. Regular flights operate from Istanbul, Ankara, and other major cities. Early booking is important, especially during summer months and the balloon tour season from April to November, as flights fill up quickly."}
          </p>

          {/* Two Airport Comparison */}
          <div className="not-prose my-8 grid md:grid-cols-2 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  Kayseri (ASR)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>{language === 'TR' ? 'Mesafe:' : 'Distance:'}</strong> 80 km {language === 'TR' ? "Göreme'ye" : 'to Göreme'}</p>
                <p><strong>{language === 'TR' ? 'Süre:' : 'Duration:'}</strong> 60-75 {language === 'TR' ? 'dakika' : 'minutes'}</p>
                <p><strong>{language === 'TR' ? 'Avantaj:' : 'Advantage:'}</strong> {language === 'TR' ? 'Daha fazla uçuş seçeneği' : 'More flight options'}</p>
                <p><strong>{language === 'TR' ? 'Dezavantaj:' : 'Disadvantage:'}</strong> {language === 'TR' ? 'Daha uzun transfer süresi' : 'Longer transfer time'}</p>
              </CardContent>
            </Card>
            <Card className="bg-accent/5 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-accent" />
                  Nevşehir (NAV)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>{language === 'TR' ? 'Mesafe:' : 'Distance:'}</strong> 40 km {language === 'TR' ? "Göreme'ye" : 'to Göreme'}</p>
                <p><strong>{language === 'TR' ? 'Süre:' : 'Duration:'}</strong> 35-45 {language === 'TR' ? 'dakika' : 'minutes'}</p>
                <p><strong>{language === 'TR' ? 'Avantaj:' : 'Advantage:'}</strong> {language === 'TR' ? 'Daha kısa transfer' : 'Shorter transfer'}</p>
                <p><strong>{language === 'TR' ? 'Dezavantaj:' : 'Disadvantage:'}</strong> {language === 'TR' ? 'Sınırlı uçuş' : 'Limited flights'}</p>
              </CardContent>
            </Card>
          </div>

          <h2>
            {language === 'TR' 
              ? "Kayseri Havalimanı Transfer Fiyatları 2025" 
              : "Kayseri Airport Transfer Prices 2025"}
          </h2>
          <p>
            {language === 'TR'
              ? "Kayseri Erkilet Havalimanı, İstanbul ve Ankara'dan çok sayıda uçuş alır. Aşağıdaki tabloda güncel transfer fiyatlarını bulabilirsiniz:"
              : "Kayseri Erkilet Airport receives numerous flights from Istanbul and Ankara. You can find current transfer prices in the table below:"}
          </p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'TR' ? 'Bölge' : 'Area'}</TableHead>
                  <TableHead>{language === 'TR' ? 'Mesafe' : 'Distance'}</TableHead>
                  <TableHead>{language === 'TR' ? 'Süre' : 'Duration'}</TableHead>
                  <TableHead>Mercedes Vito</TableHead>
                  <TableHead>VIP Mercedes</TableHead>
                  <TableHead>Maybach</TableHead>
                  <TableHead>Minibüs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kayseriPrices.map((dest, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{dest.area}</TableCell>
                    <TableCell>{dest.distance}</TableCell>
                    <TableCell>{dest.time}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.vitoPrice}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.vipPrice}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.maybachPrice}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.minibusPrice}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h2>
            {language === 'TR' 
              ? "Nevşehir Havalimanı Transfer Fiyatları 2025" 
              : "Nevsehir Airport Transfer Prices 2025"}
          </h2>
          <p>
            {language === 'TR'
              ? "Nevşehir-Kapadokya Havalimanı, Göreme'ye en yakın havalimanıdır. Daha kısa transfer süresi ve uygun fiyatlar sunar:"
              : "Nevsehir-Cappadocia Airport is the closest airport to Göreme. It offers shorter transfer times and affordable prices:"}
          </p>

          <div className="overflow-x-auto not-prose my-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'TR' ? 'Bölge' : 'Area'}</TableHead>
                  <TableHead>{language === 'TR' ? 'Mesafe' : 'Distance'}</TableHead>
                  <TableHead>{language === 'TR' ? 'Süre' : 'Duration'}</TableHead>
                  <TableHead>Mercedes Vito</TableHead>
                  <TableHead>VIP Mercedes</TableHead>
                  <TableHead>Maybach</TableHead>
                  <TableHead>Minibüs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nevsehirPrices.map((dest, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{dest.area}</TableCell>
                    <TableCell>{dest.distance}</TableCell>
                    <TableCell>{dest.time}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.vitoPrice}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.vipPrice}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.maybachPrice}</TableCell>
                    <TableCell className="text-primary font-semibold">{dest.minibusPrice}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground">
            {language === 'TR'
              ? "* Fiyatlar araç başına olup 1-6 yolcu için geçerlidir. Minibüs 7-14 yolcu için uygundur. Tüm fiyatlara KDV dahildir."
              : "* Prices are per vehicle and valid for 1-6 passengers. Minibus is suitable for 7-14 passengers. All prices include VAT."}
          </p>

          {/* Balloon Tour Section */}
          <h2 className="flex items-center gap-2">
            <Sunrise className="h-6 w-6 text-orange-500" />
            {language === 'TR' 
              ? "Balon Turu Transferleri" 
              : "Balloon Tour Transfers"}
          </h2>
          <p>
            {language === 'TR'
              ? "Kapadokya'nın dünyaca ünlü balon turları her sabah gün doğumunda başlar. Balon turları için otelden alım genellikle 04:00-05:00 saatleri arasında yapılır. Meet Transfer olarak balon turu transferi hizmeti sunuyoruz:"
              : "Cappadocia's world-famous balloon tours start at sunrise every morning. Hotel pickup for balloon tours is usually between 04:00-05:00 AM. As Meet Transfer, we offer balloon tour transfer service:"}
          </p>

          <div className="not-prose my-8">
            <Card className="bg-orange-500/10 border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sunrise className="h-5 w-5 text-orange-500" />
                  {language === 'TR' ? 'Balon Turu Transfer Paketi' : 'Balloon Tour Transfer Package'}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === 'TR' ? 'Erken sabah otel alımı (04:00-05:00)' : 'Early morning hotel pickup (04:00-05:00)'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === 'TR' ? 'Balon kalkış noktasına transfer' : 'Transfer to balloon launch site'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === 'TR' ? 'Tur sonrası otele dönüş' : 'Return to hotel after tour'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === 'TR' ? 'Profesyonel şoför' : 'Professional driver'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h3>
            {language === 'TR' 
              ? "Popüler Balon Firmaları" 
              : "Popular Balloon Companies"}
          </h3>
          <ul>
            {balloonCompanies.map((company, index) => (
              <li key={index}>{company}</li>
            ))}
          </ul>
          <p>
            {language === 'TR'
              ? "Balon turları hava koşullarına bağlıdır ve özellikle kış aylarında iptal edilebilir. Balon turu rezervasyonunuzu yapmadan önce hava durumunu kontrol etmenizi öneririz. Balon turları genellikle 150-250 EUR arasında değişir ve yaklaşık 1 saat sürer."
              : "Balloon tours are weather dependent and may be cancelled especially in winter months. We recommend checking the weather before making your balloon tour reservation. Balloon tours typically cost between 150-250 EUR and last approximately 1 hour."}
          </p>

          {/* Popular Hotels */}
          <h2>
            {language === 'TR' 
              ? "Popüler Kapadokya Otelleri" 
              : "Popular Cappadocia Hotels"}
          </h2>
          <p>
            {language === 'TR'
              ? "Kapadokya'nın büyüleyici mağara otelleri dünyaca ünlüdür. En popüler otellere transfer hizmeti sunuyoruz:"
              : "Cappadocia's enchanting cave hotels are world-famous. We offer transfer service to the most popular hotels:"}
          </p>
          
          <div className="not-prose my-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {popularHotels.map((hotel, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{hotel}</span>
              </div>
            ))}
          </div>

          <h2>
            {language === 'TR' 
              ? "Transfer Hizmetimize Neler Dahil?" 
              : "What's Included in Our Transfer Service?"}
          </h2>

          <div className="not-prose my-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {language === 'TR' ? 'Dahil Olan Hizmetler' : 'Included Services'}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude1")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude2")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === 'TR' ? '60 dakika ücretsiz bekleme (havalimanı)' : '60 minutes free waiting (airport)'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude4")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === 'TR' ? 'Uçuş takip sistemi' : 'Flight tracking system'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{t("blogPriceInclude6")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === 'TR' ? 'İsim tabelası ile karşılama' : 'Meet & greet with name sign'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === 'TR' ? '7/24 müşteri desteği' : '24/7 customer support'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>
            {language === 'TR' 
              ? "Kapadokya'da Görülecek Yerler" 
              : "Places to Visit in Cappadocia"}
          </h2>
          <p>
            {language === 'TR'
              ? "Kapadokya, UNESCO Dünya Mirası Listesi'nde yer alan eşsiz bir bölgedir. Transfer hizmetimizle aşağıdaki popüler noktalara ulaşabilirsiniz:"
              : "Cappadocia is a unique region on the UNESCO World Heritage List. You can reach the following popular spots with our transfer service:"}
          </p>
          <ul>
            <li><strong>Göreme Açık Hava Müzesi</strong> - {language === 'TR' ? 'Bizans dönemi kaya kiliseleri' : 'Byzantine-era rock churches'}</li>
            <li><strong>Derinkuyu Yeraltı Şehri</strong> - {language === 'TR' ? '8 katlı antik yeraltı kompleksi' : '8-story ancient underground complex'}</li>
            <li><strong>Kaymakli Yeraltı Şehri</strong> - {language === 'TR' ? 'En büyük yeraltı şehirlerinden biri' : 'One of the largest underground cities'}</li>
            <li><strong>Uçhisar Kalesi</strong> - {language === 'TR' ? "Kapadokya'nın en yüksek noktası" : "Cappadocia's highest point"}</li>
            <li><strong>Paşabağ (Mantar Kaya)</strong> - {language === 'TR' ? 'İkonik peri bacaları' : 'Iconic fairy chimneys'}</li>
            <li><strong>Devrent Vadisi</strong> - {language === 'TR' ? 'Hayvan şeklinde kaya oluşumları' : 'Animal-shaped rock formations'}</li>
            <li><strong>Avanos</strong> - {language === 'TR' ? 'Geleneksel çömlek yapımı merkezi' : 'Traditional pottery making center'}</li>
          </ul>

          <h2>
            {language === 'TR' 
              ? "Neden Meet Transfer?" 
              : "Why Meet Transfer?"}
          </h2>
          <p>
            {language === 'TR'
              ? "Meet Transfer olarak Kapadokya bölgesinde 7/24 profesyonel transfer hizmeti sunuyoruz. Lüks Mercedes araç filomuz, deneyimli şoförlerimiz ve müşteri memnuniyeti odaklı hizmet anlayışımızla fark yaratıyoruz. Online rezervasyon sistemimiz sayesinde dakikalar içinde transfer rezervasyonunuzu tamamlayabilirsiniz."
              : "As Meet Transfer, we offer 24/7 professional transfer service in the Cappadocia region. We make a difference with our luxury Mercedes fleet, experienced drivers, and customer satisfaction-focused service approach. With our online booking system, you can complete your transfer reservation within minutes."}
          </p>
          <p>
            <Link to={getLocalizedPath("/cappadocia-transfer")} className="text-primary hover:underline">
              {language === 'TR' ? 'Kapadokya Transfer sayfamızı ziyaret edin' : 'Visit our Cappadocia Transfer page'}
            </Link>
            {' '}
            {language === 'TR' ? 'veya' : 'or'}
            {' '}
            <Link to={getLocalizedPath("/book")} className="text-primary hover:underline">
              {language === 'TR' ? 'hemen online rezervasyon yapın' : 'book online now'}
            </Link>.
          </p>
        </div>

        {/* Map Section */}
        <div className="my-12 p-6 bg-muted/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">
              {language === 'TR' ? 'Kapadokya Haritası' : 'Cappadocia Map'}
            </h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {language === 'TR'
              ? "Kapadokya bölgesi Nevşehir, Ürgüp, Göreme, Uçhisar ve Avanos'u kapsar. Her iki havalimanından da tüm bu bölgelere transfer hizmeti sunuyoruz."
              : "Cappadocia region covers Nevşehir, Ürgüp, Göreme, Uçhisar and Avanos. We offer transfer service to all these areas from both airports."}
          </p>
        </div>

        {/* CTA Section */}
        <div className="my-12 p-8 bg-primary/5 rounded-2xl text-center">
          <h3 className="font-serif text-2xl font-bold mb-4">
            {language === 'TR' 
              ? "Kapadokya Transferinizi Hemen Rezerve Edin" 
              : "Book Your Cappadocia Transfer Now"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {language === 'TR'
              ? "Kayseri veya Nevşehir havalimanından otelinize konforlu ve güvenli transfer. Anında fiyat alın!"
              : "Comfortable and safe transfer from Kayseri or Nevsehir airport to your hotel. Get instant price!"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getLocalizedPath("/cappadocia-transfer")}>
              <Button size="lg" variant="accent" className="gap-2">
                {language === 'TR' ? 'Fiyat Al' : 'Get Price'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a 
              href={getWhatsAppUrl(language === 'TR' 
                ? "Merhaba, Kapadokya havalimanı transferi hakkında bilgi almak istiyorum." 
                : "Hello, I need a transfer from Cappadocia Airport.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline">
                {t("whatsappBooking")}
              </Button>
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="my-12">
          <h2 className="font-serif text-2xl font-bold mb-8">{t("frequentlyAskedQuestions")}</h2>
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
        <section className="my-12">
          <h2 className="font-serif text-2xl font-bold mb-6">{t("relatedArticles")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link 
              to={getLocalizedPath("/blog/istanbul-airport-transfer-price-guide")}
              className="group p-4 border border-border rounded-lg hover:border-primary transition-colors"
            >
              <Badge variant="outline" className="mb-2">Istanbul</Badge>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{t("blogIstanbul2Title")}</h3>
            </Link>
            <Link 
              to={getLocalizedPath("/blog/antalya-airport-transfer-to-hotels")}
              className="group p-4 border border-border rounded-lg hover:border-primary transition-colors"
            >
              <Badge variant="outline" className="mb-2">Antalya</Badge>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{t("blogAntalyaTitle")}</h3>
            </Link>
          </div>
        </section>
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default CappadociaAirportTransferGuide;
