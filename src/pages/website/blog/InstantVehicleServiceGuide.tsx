import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, Car, Shield, Timer, Tag, Users, Phone, CheckCircle2, Zap, ArrowRight, Percent, CreditCard, Star } from "lucide-react";
import WebsiteLayout from "@/components/website/WebsiteLayout";
import { Footer } from "@/components/Footer";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShareButtons from "@/components/website/ShareButtons";
import RelatedArticles from "@/components/website/RelatedArticles";
import ReadingProgressBar from "@/components/website/ReadingProgressBar";
import TableOfContents from "@/components/website/TableOfContents";
import BlogCTA from "@/components/website/BlogCTA";
import { useBlogDate } from "@/hooks/useBlogDate";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";
import instantHero from "@/assets/blog/instant-vehicle-service-hero.jpg";
import instantArriving from "@/assets/blog/instant-vehicle-arriving.jpg";

const InstantVehicleServiceGuide = () => {
  const { t, getLocalizedPath, language } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const tocItems = [
    { id: "how-it-works", title: language === "TR" ? "Nasıl Çalışır?" : "How It Works?" },
    { id: "select-location", title: language === "TR" ? "Konumunuzu Seçin" : "Select Your Location" },
    { id: "driver-info", title: language === "TR" ? "Şoför Bilgileri" : "Driver Information" },
    { id: "round-trip-discount", title: language === "TR" ? "Gidiş-Dönüş %25 İndirim" : "Round Trip 25% Discount" },
    { id: "fixed-pricing", title: language === "TR" ? "Fix Fiyat Garantisi" : "Fixed Price Guarantee" },
    { id: "vehicle-options", title: language === "TR" ? "Her Bütçeye Uygun Araçlar" : "Vehicles for Every Budget" },
    { id: "20-min-experience", title: language === "TR" ? "20 Dakikada Aracınız Kapınızda" : "Vehicle at Your Door in 20 Minutes" },
    { id: "faq", title: t("frequentlyAskedQuestions") },
  ];

  const faqItems = [
    {
      question: language === "TR" ? "Anlık araç hizmeti hangi şehirlerde geçerli?" : "In which cities is the instant vehicle service available?",
      answer: language === "TR" ? "İstanbul, Antalya, İzmir, Bodrum, Kapadokya, Ankara, Adana, Bursa, Dubai ve daha birçok şehirde anlık araç hizmeti sunuyoruz." : "We offer instant vehicle service in Istanbul, Antalya, Izmir, Bodrum, Cappadocia, Ankara, Adana, Bursa, Dubai and many more cities.",
    },
    {
      question: language === "TR" ? "Araç en geç kaç dakikada gelir?" : "How fast does the vehicle arrive?",
      answer: language === "TR" ? "Konumunuza bağlı olarak genellikle 15-20 dakika içinde aracınız kapınızda olur. Havalimanı transferlerinde şoför sizi kapıda karşılar." : "Depending on your location, your vehicle typically arrives within 15-20 minutes. For airport transfers, the driver meets you at the gate.",
    },
    {
      question: language === "TR" ? "Fiyatlar neden sabit?" : "Why are the prices fixed?",
      answer: language === "TR" ? "Tüm fiyatlarımız önceden belirlenmiştir. Trafik, mesafe veya saat farkı nedeniyle ek ücret alınmaz. Gördüğünüz fiyat, ödeyeceğiniz fiyattır." : "All our prices are predetermined. No extra charges for traffic, distance, or time. The price you see is the price you pay.",
    },
    {
      question: language === "TR" ? "Gidiş-dönüş indiriminden nasıl yararlanırım?" : "How do I get the round-trip discount?",
      answer: language === "TR" ? "Rezervasyon yaparken 'Dönüş Ekle' seçeneğini işaretleyin, otomatik olarak %25 indirim uygulanır." : "Simply select 'Add Return' when booking, and the 25% discount is automatically applied.",
    },
    {
      question: language === "TR" ? "Şoför bilgilerini önceden görebilir miyim?" : "Can I see driver information in advance?",
      answer: language === "TR" ? "Evet! Rezervasyonunuz onaylandıktan sonra şoförünüzün adı, telefon numarası, araç plakası ve aracın fotoğrafı paylaşılır." : "Yes! After your reservation is confirmed, you receive the driver's name, phone number, vehicle plate, and photo.",
    },
    {
      question: language === "TR" ? "Hangi araç tiplerini seçebilirim?" : "What vehicle types can I choose?",
      answer: language === "TR" ? "Ekonomik Sedan'dan VIP Mercedes Maybach'a kadar geniş bir yelpazede araç seçenekleri sunuyoruz. Her bütçeye ve ihtiyaca uygun araç mevcuttur." : "We offer a wide range from Economy Sedan to VIP Mercedes Maybach. There's a vehicle for every budget and need.",
    },
  ];

  const steps = [
    {
      icon: MapPin,
      title: language === "TR" ? "Konumunuzu Seçin" : "Select Your Location",
      desc: language === "TR" ? "Alış ve bırakış noktanızı harita üzerinden veya adres yazarak belirleyin." : "Set your pickup and drop-off points on the map or by typing an address.",
    },
    {
      icon: Car,
      title: language === "TR" ? "Aracınızı Seçin" : "Choose Your Vehicle",
      desc: language === "TR" ? "Bütçenize uygun Sedan, Vito veya VIP araçlardan birini seçin." : "Pick from Sedan, Vito, or VIP vehicles that fit your budget.",
    },
    {
      icon: CreditCard,
      title: language === "TR" ? "Hemen Rezervasyon Yapın" : "Book Instantly",
      desc: language === "TR" ? "Giriş yapın, fiyatınızı görün ve tek tıkla onaylayın." : "Log in, see your price, and confirm with one click.",
    },
    {
      icon: Timer,
      title: language === "TR" ? "20 dk İçinde Aracınız Gelsin" : "Vehicle Arrives in 20 min",
      desc: language === "TR" ? "Şoför bilgileriniz anında paylaşılır, aracınız kapınızda!" : "Driver info shared instantly, vehicle at your door!",
    },
  ];

  const vehicles = [
    {
      name: language === "TR" ? "Ekonomik Sedan" : "Economy Sedan",
      desc: language === "TR" ? "1-3 yolcu, temel konfor" : "1-3 passengers, basic comfort",
      price: "€25",
      icon: "🚗",
    },
    {
      name: "Mercedes Vito",
      desc: language === "TR" ? "1-6 yolcu, geniş alan" : "1-6 passengers, spacious",
      price: "€40",
      icon: "🚐",
    },
    {
      name: "VIP Mercedes",
      desc: language === "TR" ? "1-6 yolcu, lüks deneyim" : "1-6 passengers, luxury",
      price: "€60",
      icon: "✨",
    },
    {
      name: "Mercedes Maybach",
      desc: language === "TR" ? "1-3 yolcu, ultra premium" : "1-3 passengers, ultra premium",
      price: "€120",
      icon: "👑",
    },
  ];

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={language === "TR" ? "Anlık Araç Hizmeti – 20 Dakikada Kapınızda | Meet Transfer" : "Instant Vehicle Service – At Your Door in 20 Minutes | Meet Transfer"}
        description={language === "TR" ? "Konumunuzu seçin, aracınızı belirleyin, 20 dakikada kapınızda olsun. Fix fiyat, şoför bilgileri, gidiş-dönüş %25 indirim. Türkiye genelinde anlık transfer hizmeti." : "Select your location, choose your vehicle, at your door in 20 minutes. Fixed price, driver info, round-trip 25% discount. Instant transfer service across Turkey."}
        keywords="anlık araç hizmeti, instant vehicle service, anında transfer, 20 dakika araç, fix fiyat transfer, gidiş dönüş indirim, şoför bilgileri, havalimanı transfer, meet transfer, Turkey instant car service"
        canonicalPath="/blog/instant-vehicle-service-guide"
        ogImage="https://meettransfer.lovable.app/og/instant-vehicle-service.jpg"
        ogType="article"
        articlePublishedTime="2026-02-07"
        articleModifiedTime="2026-02-07"
        articleSection="Service"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: language === "TR" ? "Anlık Araç Hizmeti – 20 Dakikada Kapınızda" : "Instant Vehicle Service – At Your Door in 20 Minutes",
            description: language === "TR" ? "Konumunuzu seçin, aracınızı belirleyin, 20 dakikada kapınızda olsun." : "Select your location, choose your vehicle, at your door in 20 minutes.",
            image: 'https://meettransfer.lovable.app/og/instant-vehicle-service.jpg',
            datePublished: '2026-02-07',
            dateModified: '2026-02-07',
            author: 'Meet Transfer',
            readingTime: '8',
            wordCount: 1500,
            keywords: ['instant vehicle service', 'anlık araç', 'fix fiyat', '20 dakika', 'round trip discount'],
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: t("breadcrumbHome"), url: '/' },
              { name: t("breadcrumbBlog"), url: '/blog' },
              { name: language === "TR" ? "Anlık Araç Hizmeti" : "Instant Vehicle Service", url: '/blog/instant-vehicle-service-guide' },
            ],
          },
          {
            type: 'FAQPage',
            questions: faqItems.map(item => ({ question: item.question, answer: item.answer })),
          },
        ]}
      />

      <article className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative h-[55vh] md:h-[65vh] overflow-hidden">
          <img 
            src={instantHero} 
            alt={language === "TR" ? "Anlık araç hizmeti - 20 dakikada kapınızda" : "Instant vehicle service - at your door in 20 minutes"} 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-12">
            <div className="container mx-auto">
              <Link 
                to={getLocalizedPath("/blog")} 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-3 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("backToBlog")}
              </Link>
              
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  {language === "TR" ? "Anlık Hizmet" : "Instant Service"}
                </Badge>
                <Badge variant="outline" className="text-xs border-accent/50 text-accent-foreground">
                  <Percent className="w-3 h-3 mr-1" />
                  {language === "TR" ? "%25 Dönüş İndirimi" : "25% Return Discount"}
                </Badge>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatBlogDate("2026-02-07")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    8 {t("minRead")}
                  </span>
                </div>
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 leading-tight">
                {language === "TR" 
                  ? "Anlık Araç Hizmeti: Konumunuzu Seçin, 20 Dakikada Aracınız Kapınızda" 
                  : "Instant Vehicle Service: Select Your Location, Vehicle at Your Door in 20 Minutes"}
              </h1>
              
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl">
                {language === "TR"
                  ? "Fix fiyat, şoför bilgileri anlık, gidiş-dönüş %25 indirim. Her bütçeye uygun araç seçimi ile Türkiye genelinde hizmetinizdeyiz."
                  : "Fixed prices, instant driver info, 25% round-trip discount. Vehicle options for every budget, serving you across Turkey."}
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid lg:grid-cols-[1fr_300px] gap-8 lg:gap-12">
            {/* Main Content */}
            <div className="prose prose-sm md:prose-lg dark:prose-invert max-w-none">

              {/* How It Works */}
              <section id="how-it-works" className="scroll-mt-20">
                <h2 className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-6">
                  <Zap className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                  {language === "TR" ? "Nasıl Çalışır? 4 Basit Adım" : "How It Works? 4 Simple Steps"}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
                  {language === "TR"
                    ? "Meet Transfer ile anlık araç çağırmak hiç bu kadar kolay olmamıştı. Sadece 4 adımda profesyonel şoförlü araç hizmetine ulaşın."
                    : "Calling an instant vehicle with Meet Transfer has never been easier. Reach professional chauffeured vehicle service in just 4 steps."}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
                  {steps.map((step, index) => (
                    <Card key={index} className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
                      <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {index + 1}
                      </div>
                      <CardHeader className="p-5 pb-2">
                        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                          <step.icon className="w-5 h-5 text-primary shrink-0" />
                          {step.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 pt-0">
                        <p className="text-xs md:text-sm text-muted-foreground">{step.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Select Location */}
              <section id="select-location" className="scroll-mt-20 mt-10">
                <h2 className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-6">
                  <MapPin className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                  {language === "TR" ? "Konumunuzu Seçin, Fiyatınızı Anında Görün" : "Select Your Location, See Your Price Instantly"}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                  {language === "TR"
                    ? "Alış noktanızı ve bırakış noktanızı girin, sistem otomatik olarak en uygun fiyatı hesaplar. Google Maps entegrasyonu sayesinde adresinizi kolayca seçebilir, güzergah haritanızı ve tahmini sürenizi görebilirsiniz."
                    : "Enter your pickup and drop-off points, the system automatically calculates the best price. With Google Maps integration, you can easily select your address, see your route map and estimated time."}
                </p>
                <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl p-5 md:p-6 my-6 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground text-sm md:text-base mb-1">
                        {language === "TR" ? "Türkiye'nin 81 İli + Dubai" : "All 81 Cities of Turkey + Dubai"}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {language === "TR"
                          ? "İstanbul, Antalya, İzmir, Bodrum, Kapadokya, Ankara, Adana, Bursa ve daha fazlası. İstediğiniz yerden istediğiniz yere transfer."
                          : "Istanbul, Antalya, Izmir, Bodrum, Cappadocia, Ankara, Adana, Bursa and more. Transfer from anywhere to anywhere."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Driver Info */}
              <section id="driver-info" className="scroll-mt-20 mt-10">
                <h2 className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-6">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                  {language === "TR" ? "Şoför Bilgileriniz Anında Elinizde" : "Driver Information Instantly Available"}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                  {language === "TR"
                    ? "Rezervasyonunuz onaylandığı anda şoförünüzün tüm bilgilerine erişin. Güvenliğiniz ve rahatlığınız için her detay şeffaftır."
                    : "Access all your driver's information the moment your reservation is confirmed. Every detail is transparent for your safety and comfort."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
                  {[
                    { icon: "👤", text: language === "TR" ? "Şoförün adı ve fotoğrafı" : "Driver name and photo" },
                    { icon: "📱", text: language === "TR" ? "Direkt telefon numarası" : "Direct phone number" },
                    { icon: "🚗", text: language === "TR" ? "Araç plakası ve modeli" : "Vehicle plate and model" },
                    { icon: "⭐", text: language === "TR" ? "Şoför puanı ve yorumları" : "Driver rating and reviews" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm font-medium text-foreground">{item.text}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Round Trip Discount */}
              <section id="round-trip-discount" className="scroll-mt-20 mt-10">
                <h2 className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-6">
                  <Tag className="w-6 h-6 md:w-8 md:h-8 text-accent shrink-0" />
                  {language === "TR" ? "Gidiş-Dönüş Rezervasyonda %25 İndirim" : "25% Discount on Round-Trip Bookings"}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                  {language === "TR"
                    ? "Dönüş transferinizi de ekleyin ve otomatik olarak %25 indirim kazanın! Ekstra kod girmenize gerek yok, sistem otomatik olarak indirimi uygular."
                    : "Add your return transfer and automatically get a 25% discount! No need to enter an extra code, the system applies the discount automatically."}
                </p>
                <div className="bg-gradient-to-r from-accent/10 via-accent/15 to-accent/10 rounded-xl p-5 md:p-6 my-6 border border-accent/30">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-3xl font-bold text-accent-foreground shrink-0">
                      %25
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-base md:text-lg mb-1 text-center sm:text-left">
                        {language === "TR" ? "Dönüş Ekle & Tasarruf Et" : "Add Return & Save"}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground text-center sm:text-left">
                        {language === "TR"
                          ? "Örnek: İstanbul Havalimanı → Taksim gidiş 40€, dönüş sadece 30€ (normal 40€). Toplam 70€ yerine 60€!"
                          : "Example: Istanbul Airport → Taksim one-way 40€, return only 30€ (normally 40€). Total 60€ instead of 70€!"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Fixed Pricing */}
              <section id="fixed-pricing" className="scroll-mt-20 mt-10">
                <h2 className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-6">
                  <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                  {language === "TR" ? "Fix Fiyat Garantisi – Sürpriz Yok!" : "Fixed Price Guarantee – No Surprises!"}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                  {language === "TR"
                    ? "Meet Transfer'ın en büyük farkı: FİX FİYAT. Trafik yoğunluğu, gece saati, bayram dönemi... Fark etmez! Gördüğünüz fiyat, ödeyeceğiniz fiyattır. Taksimetre stresi yok, sürpriz fatura yok."
                    : "Meet Transfer's biggest difference: FIXED PRICE. Traffic congestion, night hours, holiday season... Doesn't matter! The price you see is the price you pay. No meter stress, no surprise bills."}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                  {[
                    {
                      icon: "🚫",
                      title: language === "TR" ? "Taksimetre Yok" : "No Meter",
                      desc: language === "TR" ? "Sabit fiyat, trafik sürprizi yok" : "Fixed price, no traffic surprises",
                    },
                    {
                      icon: "🌙",
                      title: language === "TR" ? "Gece Farkı Yok" : "No Night Surcharge",
                      desc: language === "TR" ? "7/24 aynı fiyat" : "Same price 24/7",
                    },
                    {
                      icon: "✅",
                      title: language === "TR" ? "Şeffaf Fiyatlandırma" : "Transparent Pricing",
                      desc: language === "TR" ? "Tüm vergiler dahil" : "All taxes included",
                    },
                  ].map((item, i) => (
                    <Card key={i} className="text-center border-primary/20">
                      <CardContent className="p-5">
                        <div className="text-3xl mb-2">{item.icon}</div>
                        <p className="font-semibold text-foreground text-sm mb-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Vehicle Options */}
              <section id="vehicle-options" className="scroll-mt-20 mt-10">
                <h2 className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-6">
                  <Car className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                  {language === "TR" ? "Her Bütçeye Uygun Araç Seçenekleri" : "Vehicle Options for Every Budget"}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                  {language === "TR"
                    ? "Ekonomik sedan'dan ultra-lüks Maybach'a kadar ihtiyacınıza ve bütçenize uygun araç seçin. Tüm araçlarımız profesyonel şoförler tarafından kullanılır."
                    : "Choose a vehicle that fits your needs and budget, from economy sedan to ultra-luxury Maybach. All our vehicles are operated by professional drivers."}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
                  {vehicles.map((v, i) => (
                    <Card key={i} className="text-center border-primary/20 hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="text-3xl mb-2">{v.icon}</div>
                        <p className="font-bold text-foreground text-sm mb-1">{v.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{v.desc}</p>
                        <Badge className="bg-primary/10 text-primary text-xs">
                          {language === "TR" ? `${v.price}'dan` : `From ${v.price}`}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* 20 Min Experience */}
              <section id="20-min-experience" className="scroll-mt-20 mt-10">
                <h2 className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-6">
                  <Timer className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                  {language === "TR" ? "20 Dakikada Aracınız Kapınızda!" : "Vehicle at Your Door in 20 Minutes!"}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                  {language === "TR"
                    ? "Rezervasyonunuzu yaptıktan sonra geri sayım başlar. Telefonunuzda aracınızın yaklaştığını izleyin. 20 dakika dolmadan kapınızda!"
                    : "After you make your reservation, the countdown starts. Watch your vehicle approach on your phone. At your door before 20 minutes!"}
                </p>
                
                <div className="relative my-8 rounded-xl overflow-hidden shadow-lg">
                  <OptimizedBlogImage
                    src={instantArriving}
                    alt={language === "TR" ? "Beklerken ekranda araç takibi ve 20 dakikada araç gelişi" : "Vehicle tracking on screen while waiting and arrival in 20 minutes"}
                    aspectRatio="wide"
                  />
                </div>

                {/* Timeline */}
                <div className="relative pl-8 space-y-6 my-8">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />
                  {[
                    { time: "0:00", label: language === "TR" ? "Rezervasyon onaylandı ✅" : "Reservation confirmed ✅", color: "bg-primary" },
                    { time: "0:30", label: language === "TR" ? "Şoför bilgileri paylaşıldı 📱" : "Driver info shared 📱", color: "bg-primary" },
                    { time: "5:00", label: language === "TR" ? "Şoför yola çıktı 🚗" : "Driver on the way 🚗", color: "bg-primary/80" },
                    { time: "15:00", label: language === "TR" ? "Aracınız yaklaşıyor 📍" : "Vehicle approaching 📍", color: "bg-primary/60" },
                    { time: "18:00", label: language === "TR" ? "Aracınız kapınızda! 🎉" : "Vehicle at your door! 🎉", color: "bg-accent" },
                  ].map((item, i) => (
                    <div key={i} className="relative flex items-center gap-4">
                      <div className={`absolute -left-5 w-4 h-4 rounded-full ${item.color} border-2 border-background`} />
                      <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">{item.time}</span>
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* CTA */}
              <div className="my-10">
                <BlogCTA />
              </div>

              {/* FAQ */}
              <section id="faq" className="scroll-mt-20 mt-10">
                <h2 className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-6">
                  <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
                  {t("frequentlyAskedQuestions")}
                </h2>
                <div className="space-y-4 my-6">
                  {faqItems.map((item, index) => (
                    <Card key={index} className="border-border">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm md:text-base font-semibold text-foreground">
                          {item.question}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-xs md:text-sm text-muted-foreground">{item.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Book Now Button */}
              <div className="flex justify-center my-10">
                <Link to={getLocalizedPath("/book")}>
                  <Button size="lg" className="text-base px-8 py-6 shadow-lg">
                    <Car className="w-5 h-5 mr-2" />
                    {language === "TR" ? "Hemen Araç Çağır" : "Book a Vehicle Now"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Share & Related */}
              <ShareButtons title={language === "TR" ? "Anlık Araç Hizmeti" : "Instant Vehicle Service"} />
              <RelatedArticles currentArticleId="instant-vehicle-service-guide" />
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                <TableOfContents items={tocItems} />
                
                <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                  <CardContent className="p-5">
                    <div className="text-center">
                      <div className="text-3xl mb-2">⚡</div>
                      <p className="font-bold text-foreground text-sm mb-2">
                        {language === "TR" ? "Hemen Başlayın" : "Get Started Now"}
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {language === "TR" ? "20 dakikada aracınız kapınızda olsun!" : "Vehicle at your door in 20 minutes!"}
                      </p>
                      <Link to={getLocalizedPath("/book")}>
                        <Button size="sm" className="w-full">
                          {language === "TR" ? "Araç Çağır" : "Book Now"}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-accent/20 bg-gradient-to-b from-accent/5 to-transparent">
                  <CardContent className="p-5">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🏷️</div>
                      <p className="font-bold text-foreground text-sm mb-1">
                        {language === "TR" ? "Dönüş İndirimi" : "Return Discount"}
                      </p>
                      <p className="text-2xl font-bold text-accent-foreground mb-1">%25</p>
                      <p className="text-xs text-muted-foreground">
                        {language === "TR" ? "Dönüş transferi ekleyin" : "Add return transfer"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </article>
      <Footer />
    </WebsiteLayout>
  );
};

export default InstantVehicleServiceGuide;
