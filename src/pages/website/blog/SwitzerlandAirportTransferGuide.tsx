import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, Plane, MapPin, Mountain, Snowflake, Shield, Car } from "lucide-react";
import switzerlandTransferHero from "@/assets/blog/switzerland-transfer-hero.jpg";
import WebsiteLayout from "@/components/website/WebsiteLayout";
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
import { useBlogDate } from "@/hooks/useBlogDate";
import OptimizedBlogImage from "@/components/website/OptimizedBlogImage";

const SwitzerlandAirportTransferGuide = () => {
  const { getLocalizedPath, language } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  const translations = {
    en: {
      backToBlog: "Back to Blog",
      category: "Switzerland",
      readTime: "15 min read",
      h1: "Switzerland Airport Transfer Guide 2026: Zurich, Geneva, Basel & Milan to Swiss Ski Resorts",
      intro: "Planning a ski trip to the Swiss Alps? Getting from the airport to your resort is a crucial part of your journey. This comprehensive guide covers everything you need to know about private airport transfers from Zurich (ZRH), Geneva (GVA), Basel (BSL), and Milan Malpensa (MXP) airports to Switzerland's premier ski destinations including St. Moritz, Gstaad, Davos, Zermatt, and more.",
      seoTitle: "Switzerland Airport Transfer 2026 | Zurich, Geneva, Basel & Milan to Ski Resorts",
      seoDesc: "Complete guide to Switzerland airport transfers in 2026. Fixed prices from Zurich, Geneva, Basel & Milan to St. Moritz, Gstaad, Davos, Zermatt. Mercedes S-Class & V-Class luxury transfers.",
      
      // Section titles
      whyChooseTitle: "Why Choose Private Airport Transfer?",
      whyChoose1: "Door-to-door service directly to your ski resort",
      whyChoose2: "No waiting for trains or shared shuttles in cold weather",
      whyChoose3: "Ample space for ski equipment and luggage",
      whyChoose4: "Winter-equipped vehicles with professional alpine drivers",
      whyChoose5: "Fixed prices with no hidden fees or surge pricing",
      whyChoose6: "Flight tracking and flexible pickup times",
      
      airportsTitle: "Major Airports Serving Swiss Ski Resorts",
      
      zurichTitle: "Zurich Airport (ZRH)",
      zurichDesc: "Switzerland's largest international airport and the main gateway for eastern Swiss resorts. Excellent access to St. Moritz, Davos, Arosa, and other Graubünden destinations. The airport offers excellent facilities and is well-connected to the Swiss motorway network.",
      
      genevaTitle: "Geneva Airport (GVA)",
      genevaDesc: "The preferred gateway for western Swiss resorts including Verbier, Zermatt, Crans-Montana, and the Valais region. Located right on the French border, it also serves French ski resorts like Chamonix.",
      
      baselTitle: "Basel EuroAirport (BSL)",
      baselDesc: "A unique tri-national airport serving Switzerland, France, and Germany. Good option for central Swiss destinations and often has competitive flight prices. Convenient for destinations in the Bernese Oberland.",
      
      milanTitle: "Milan Malpensa Airport (MXP)",
      milanDesc: "Italy's largest airport in the north, offering an alternative route to southern Swiss resorts. Particularly convenient for St. Moritz and Engadin valley destinations, often with more flight options from intercontinental destinations.",
      
      pricingTitle: "Transfer Prices from Each Airport",
      zurichPricesTitle: "From Zurich Airport (ZRH)",
      genevaPricesTitle: "From Geneva Airport (GVA)",
      baselPricesTitle: "From Basel Airport (BSL)",
      milanPricesTitle: "From Milan Malpensa Airport (MXP)",
      priceNote: "All prices in EUR • Same rate for all vehicle types • Winter-equipped fleet",
      
      destinationCol: "Destination",
      priceCol: "Price",
      durationCol: "Duration",
      
      vehiclesTitle: "Our Switzerland Fleet",
      vehiclesDesc: "We offer premium Mercedes vehicles specifically equipped for alpine conditions:",
      
      sClassTitle: "Mercedes-Benz S-Class",
      sClassDesc: "The ultimate luxury sedan for executive transfers. Features heated massage seats, ambient lighting, premium sound system, climate control, and privacy glass. Perfect for couples or business travelers seeking maximum comfort. Accommodates 3 passengers with 3 luggage pieces.",
      
      vClassTitle: "Mercedes V-Class",
      vClassDesc: "Spacious luxury MPV ideal for families and groups. Features leather seats, extra legroom, dedicated ski equipment storage, USB chargers, and panoramic roof. Accommodates up to 7 passengers with 7 luggage pieces plus ski equipment.",
      
      skiEquipmentTitle: "Ski Equipment Transport",
      skiEquipmentDesc: "Both vehicles are fully equipped to transport your ski gear safely:",
      ski1: "Dedicated ski racks and secure storage",
      ski2: "Protection for skis, snowboards, and poles",
      ski3: "Boot bags and helmet storage",
      ski4: "Please mention equipment when booking for optimal space allocation",
      
      winterReadyTitle: "Winter-Ready Fleet",
      winterReadyDesc: "All our vehicles are prepared for alpine winter conditions:",
      winter1: "Premium winter tires (mandatory in Switzerland)",
      winter2: "Snow chains available for extreme conditions",
      winter3: "Experienced drivers trained for mountain roads",
      winter4: "Regular vehicle maintenance and safety checks",
      
      destinationsTitle: "Popular Ski Resort Destinations",
      
      stMoritzTitle: "St. Moritz",
      stMoritzDesc: "The birthplace of winter tourism, St. Moritz is synonymous with luxury skiing. Home to two Winter Olympics, it offers 350km of slopes, world-class restaurants, and glamorous après-ski. The frozen lake hosts unique events like polo and horse racing.",
      
      gstaadTitle: "Gstaad",
      gstaadDesc: "A charming car-free village center combined with exclusive luxury. Gstaad offers 220km of interconnected slopes across multiple resorts, traditional chalets, and celebrity sightings. The Glacier 3000 provides year-round skiing.",
      
      davosTitle: "Davos",
      davosDesc: "Europe's highest town and host of the World Economic Forum. Davos offers 300km of varied terrain across 6 ski areas, excellent cross-country skiing, and a vibrant town atmosphere with shops and restaurants.",
      
      zermattTitle: "Zermatt",
      zermattDesc: "Dominated by the iconic Matterhorn, Zermatt is a car-free village with 360km of slopes including the highest ski area in the Alps. Glacier skiing is available year-round, and the village retains its traditional alpine charm.",
      
      verbierTitle: "Verbier",
      verbierDesc: "Part of the massive 4 Vallées ski area with 412km of runs, Verbier is known for its extreme off-piste terrain and lively nightlife. It attracts a young, international crowd and hosts numerous freeride competitions.",
      
      cransMontanaTitle: "Crans-Montana",
      cransMontanaDesc: "A sunny plateau resort with stunning views over the Rhône Valley and the Alps. Known for its excellent golf courses and the annual Omega European Masters. 140km of slopes with a Mediterranean feel.",
      
      arosaTitle: "Arosa",
      arosaDesc: "A peaceful family-friendly resort connected to Lenzerheide, offering 225km of slopes. Known for its sunny weather, relaxed atmosphere, and excellent snow record. The car-free village center adds to its tranquil charm.",
      
      bookingTitle: "How to Book Your Transfer",
      booking1: "Use our AI-powered booking assistant for instant quotes",
      booking2: "Provide your flight details for precise pickup timing",
      booking3: "Specify any special requirements (child seats, ski equipment)",
      booking4: "Receive instant WhatsApp confirmation with driver details",
      booking5: "Enjoy 24/7 customer support throughout your journey",
      
      tipsTitle: "Travel Tips for Swiss Alps Transfers",
      tip1Title: "Book Early",
      tip1Desc: "During peak ski season (December-March), demand is high. Book your transfer at least 1-2 weeks in advance to secure your preferred vehicle.",
      tip2Title: "Share Flight Details",
      tip2Desc: "Provide your flight number so we can track arrivals and adjust pickup times if your flight is delayed. No extra charge for flight delays.",
      tip3Title: "Prepare for Customs",
      tip3Desc: "When traveling from Milan, you'll cross the Swiss border. Have passports ready and declare any duty-free purchases if applicable.",
      tip4Title: "Dress Warmly",
      tip4Desc: "Even with heated vehicles, wear layers for comfort. Mountain weather can change quickly, especially at higher elevations.",
      
      faq1Q: "What vehicles are available for Switzerland transfers?",
      faq1A: "We offer Mercedes-Benz S-Class sedan and Mercedes V-Class for all Switzerland transfers. Both vehicles are equipped with winter tires and can accommodate ski equipment.",
      faq2Q: "Are the prices the same for all vehicles?",
      faq2A: "Yes, we offer flat-rate pricing for all our Switzerland transfers. Whether you choose the S-Class or V-Class, the price remains the same for maximum flexibility.",
      faq3Q: "How long is the transfer from Zurich Airport to St. Moritz?",
      faq3A: "The transfer from Zurich Airport (ZRH) to St. Moritz takes approximately 2 hours and 30 minutes, depending on weather and road conditions.",
      faq4Q: "Can you transport ski equipment?",
      faq4A: "Yes, both our Mercedes S-Class and V-Class can accommodate ski equipment. Please mention your equipment when booking so we can ensure sufficient space.",
      faq5Q: "Do you provide transfers in winter conditions?",
      faq5A: "Yes, our vehicles are equipped with winter tires and our experienced drivers are trained for alpine road conditions. Safety is our priority.",
      faq6Q: "Can I pay in Swiss Francs?",
      faq6A: "Our prices are quoted in Euros, but we accept payment in Swiss Francs, Euros, or major credit cards. Cash payment to driver is also available.",
      
      ctaTitle: "Ready to Book Your Swiss Alps Transfer?",
      ctaDesc: "Get instant quotes and WhatsApp confirmation for your ski resort transfer.",
      ctaButton: "Book Now with AI Assistant",
      
      relatedTitle: "Related Articles",
    },
    tr: {
      backToBlog: "Blog'a Dön",
      category: "İsviçre",
      readTime: "15 dk okuma",
      h1: "İsviçre Havalimanı Transfer Rehberi 2026: Zürih, Cenevre, Basel ve Milano'dan Kayak Merkezlerine",
      intro: "İsviçre Alpleri'ne kayak tatili mi planlıyorsunuz? Havalimanından tatilinize ulaşmak yolculuğunuzun kritik bir parçasıdır. Bu kapsamlı rehber, Zürih (ZRH), Cenevre (GVA), Basel (BSL) ve Milano Malpensa (MXP) havalimanlarından St. Moritz, Gstaad, Davos, Zermatt ve daha fazlasına özel havalimanı transferleri hakkında bilmeniz gereken her şeyi kapsar.",
      seoTitle: "İsviçre Havalimanı Transfer 2026 | Zürih, Cenevre, Basel ve Milano'dan Kayak Merkezlerine",
      seoDesc: "2026 İsviçre havalimanı transferleri için kapsamlı rehber. Zürih, Cenevre, Basel ve Milano'dan St. Moritz, Gstaad, Davos, Zermatt'a sabit fiyatlar. Mercedes S-Class ve V-Class lüks transferler.",
      
      whyChooseTitle: "Neden Özel Havalimanı Transferi Seçmelisiniz?",
      whyChoose1: "Doğrudan kayak merkezinize kapıdan kapıya hizmet",
      whyChoose2: "Soğuk havada tren veya paylaşımlı servis bekleme yok",
      whyChoose3: "Kayak ekipmanı ve bagaj için geniş alan",
      whyChoose4: "Profesyonel alp sürücüleriyle kış donanımlı araçlar",
      whyChoose5: "Gizli ücret veya dinamik fiyatlama olmadan sabit fiyatlar",
      whyChoose6: "Uçuş takibi ve esnek alım saatleri",
      
      airportsTitle: "İsviçre Kayak Merkezlerine Hizmet Veren Havalimanları",
      
      zurichTitle: "Zürih Havalimanı (ZRH)",
      zurichDesc: "İsviçre'nin en büyük uluslararası havalimanı ve doğu İsviçre tatil merkezlerinin ana kapısı. St. Moritz, Davos, Arosa ve diğer Graubünden destinasyonlarına mükemmel erişim. Havalimanı mükemmel tesisler sunar ve İsviçre otoyol ağına iyi bağlantılıdır.",
      
      genevaTitle: "Cenevre Havalimanı (GVA)",
      genevaDesc: "Verbier, Zermatt, Crans-Montana ve Valais bölgesi dahil batı İsviçre tatil merkezleri için tercih edilen kapı. Fransız sınırında yer alır ve Chamonix gibi Fransız kayak merkezlerine de hizmet verir.",
      
      baselTitle: "Basel EuroAirport (BSL)",
      baselDesc: "İsviçre, Fransa ve Almanya'ya hizmet veren benzersiz bir üç ulusal havalimanı. Merkezi İsviçre destinasyonları için iyi bir seçenek ve genellikle rekabetçi uçuş fiyatları sunar. Bern Oberland'daki destinasyonlar için uygundur.",
      
      milanTitle: "Milano Malpensa Havalimanı (MXP)",
      milanDesc: "İtalya'nın kuzeydeki en büyük havalimanı, güney İsviçre tatil merkezlerine alternatif bir rota sunar. Özellikle St. Moritz ve Engadin vadisi destinasyonları için uygun, genellikle kıtalararası destinasyonlardan daha fazla uçuş seçeneği ile.",
      
      pricingTitle: "Her Havalimanından Transfer Fiyatları",
      zurichPricesTitle: "Zürih Havalimanı'ndan (ZRH)",
      genevaPricesTitle: "Cenevre Havalimanı'ndan (GVA)",
      baselPricesTitle: "Basel Havalimanı'ndan (BSL)",
      milanPricesTitle: "Milano Malpensa Havalimanı'ndan (MXP)",
      priceNote: "Tüm fiyatlar EUR cinsinden • Tüm araç tipleri için aynı ücret • Kış donanımlı filo",
      
      destinationCol: "Destinasyon",
      priceCol: "Fiyat",
      durationCol: "Süre",
      
      vehiclesTitle: "İsviçre Filomuz",
      vehiclesDesc: "Alp koşulları için özel olarak donatılmış premium Mercedes araçlar sunuyoruz:",
      
      sClassTitle: "Mercedes-Benz S-Class",
      sClassDesc: "Executive transferler için en üst düzey lüks sedan. Isıtmalı masaj koltukları, ortam aydınlatması, premium ses sistemi, klima kontrolü ve mahremiyet camı ile donatılmış. Maksimum konfor arayan çiftler veya iş seyahati yapanlar için ideal. 3 yolcu ve 3 bagaj kapasitesi.",
      
      vClassTitle: "Mercedes V-Class",
      vClassDesc: "Aileler ve gruplar için ideal geniş lüks MPV. Deri koltuklar, ekstra bacak mesafesi, özel kayak ekipmanı deposu, USB şarj cihazları ve panoramik tavan. 7 yolcu ve 7 bagaj artı kayak ekipmanı kapasitesi.",
      
      skiEquipmentTitle: "Kayak Ekipmanı Taşıma",
      skiEquipmentDesc: "Her iki araç da kayak ekipmanınızı güvenle taşımak için tam donanımlıdır:",
      ski1: "Özel kayak rafları ve güvenli depolama",
      ski2: "Kayak, snowboard ve sopalar için koruma",
      ski3: "Bot çantaları ve kask deposu",
      ski4: "Optimal alan tahsisi için rezervasyon yaparken ekipmanı belirtin",
      
      winterReadyTitle: "Kışa Hazır Filo",
      winterReadyDesc: "Tüm araçlarımız alp kış koşullarına hazırdır:",
      winter1: "Premium kış lastikleri (İsviçre'de zorunlu)",
      winter2: "Aşırı koşullar için kar zincirleri mevcut",
      winter3: "Dağ yolları için eğitimli deneyimli sürücüler",
      winter4: "Düzenli araç bakımı ve güvenlik kontrolleri",
      
      destinationsTitle: "Popüler Kayak Merkezi Destinasyonları",
      
      stMoritzTitle: "St. Moritz",
      stMoritzDesc: "Kış turizminin doğduğu yer olan St. Moritz, lüks kayakla eşanlamlıdır. İki Kış Olimpiyatı'na ev sahipliği yapmış, 350km pist, dünya standartında restoranlar ve görkemli après-ski sunar. Donmuş göl, polo ve at yarışı gibi benzersiz etkinliklere ev sahipliği yapar.",
      
      gstaadTitle: "Gstaad",
      gstaadDesc: "Arabasız köy merkezi ile özel lüksü birleştiren büyüleyici bir köy. Gstaad, birden fazla tesis genelinde 220km birbirine bağlı pist, geleneksel şaleler ve ünlü görüntüleri sunar. Glacier 3000, yıl boyunca kayak imkanı sağlar.",
      
      davosTitle: "Davos",
      davosDesc: "Avrupa'nın en yüksek kasabası ve Dünya Ekonomik Forumu'nun ev sahibi. Davos, 6 kayak alanında 300km çeşitli arazi, mükemmel kros kayağı ve dükkanlar ve restoranlarla canlı bir kasaba atmosferi sunar.",
      
      zermattTitle: "Zermatt",
      zermattDesc: "İkonik Matterhorn'un hakimiyetindeki Zermatt, Alpler'in en yüksek kayak alanı dahil 360km pist ile arabasız bir köydür. Yıl boyunca buzul kayağı mevcuttur ve köy geleneksel alp cazibesini korur.",
      
      verbierTitle: "Verbier",
      verbierDesc: "412km pist ile devasa 4 Vallées kayak alanının bir parçası olan Verbier, aşırı off-piste arazisi ve canlı gece hayatı ile tanınır. Genç, uluslararası bir kitle çeker ve çok sayıda freeride yarışmasına ev sahipliği yapar.",
      
      cransMontanaTitle: "Crans-Montana",
      cransMontanaDesc: "Rhône Vadisi ve Alpler üzerinde çarpıcı manzaralara sahip güneşli bir plato tatil merkezi. Mükemmel golf sahaları ve yıllık Omega European Masters ile tanınır. Akdeniz havası ile 140km pist.",
      
      arosaTitle: "Arosa",
      arosaDesc: "Lenzerheide'ye bağlı, 225km pist sunan huzurlu, aile dostu bir tatil merkezi. Güneşli havası, rahat atmosferi ve mükemmel kar kaydı ile tanınır. Arabasız köy merkezi sakin cazibesini artırır.",
      
      bookingTitle: "Transferinizi Nasıl Rezerve Edersiniz",
      booking1: "Anında fiyat teklifi için AI destekli rezervasyon asistanımızı kullanın",
      booking2: "Hassas alım zamanlaması için uçuş detaylarınızı sağlayın",
      booking3: "Özel gereksinimleri belirtin (çocuk koltuğu, kayak ekipmanı)",
      booking4: "Şoför detayları ile anında WhatsApp onayı alın",
      booking5: "Yolculuğunuz boyunca 7/24 müşteri desteğinin keyfini çıkarın",
      
      tipsTitle: "İsviçre Alpleri Transferleri için Seyahat İpuçları",
      tip1Title: "Erken Rezerve Edin",
      tip1Desc: "Yoğun kayak sezonunda (Aralık-Mart) talep yüksektir. Tercih ettiğiniz aracı güvence altına almak için transferinizi en az 1-2 hafta önceden rezerve edin.",
      tip2Title: "Uçuş Detaylarını Paylaşın",
      tip2Desc: "Varışları takip edip uçuşunuz gecikirse alım saatlerini ayarlayabilmemiz için uçuş numaranızı sağlayın. Uçuş gecikmeleri için ekstra ücret yok.",
      tip3Title: "Gümrüğe Hazırlıklı Olun",
      tip3Desc: "Milano'dan seyahat ederken İsviçre sınırını geçeceksiniz. Pasaportları hazır tutun ve gerekirse gümrüksüz alışverişleri beyan edin.",
      tip4Title: "Sıcak Giyinin",
      tip4Desc: "Isıtmalı araçlarla bile konfor için katmanlar giyin. Dağ havası özellikle yüksek rakımlarda hızla değişebilir.",
      
      faq1Q: "İsviçre transferleri için hangi araçlar mevcut?",
      faq1A: "Tüm İsviçre transferleri için Mercedes-Benz S-Class sedan ve Mercedes V-Class sunuyoruz. Her iki araç da kış lastikleri ile donatılmış olup kayak ekipmanı taşıyabilir.",
      faq2Q: "Fiyatlar tüm araçlar için aynı mı?",
      faq2A: "Evet, tüm İsviçre transferlerimiz için sabit fiyatlandırma sunuyoruz. S-Class veya V-Class seçseniz de fiyat maksimum esneklik için aynı kalır.",
      faq3Q: "Zürih Havalimanı'ndan St. Moritz'e transfer ne kadar sürer?",
      faq3A: "Zürih Havalimanı'ndan (ZRH) St. Moritz'e transfer, hava ve yol koşullarına bağlı olarak yaklaşık 2 saat 30 dakika sürer.",
      faq4Q: "Kayak ekipmanı taşıyabilir misiniz?",
      faq4A: "Evet, hem Mercedes S-Class hem de V-Class kayak ekipmanı taşıyabilir. Yeterli alanı sağlayabilmemiz için rezervasyon yaparken ekipmanınızı belirtin.",
      faq5Q: "Kış koşullarında transfer sağlıyor musunuz?",
      faq5A: "Evet, araçlarımız kış lastikleri ile donatılmış ve deneyimli sürücülerimiz alp yol koşulları için eğitimlidir. Güvenlik önceliğimizdir.",
      faq6Q: "İsviçre Frangı ile ödeme yapabilir miyim?",
      faq6A: "Fiyatlarımız Euro cinsinden kote edilmiştir, ancak İsviçre Frangı, Euro veya büyük kredi kartları ile ödeme kabul ediyoruz. Şoföre nakit ödeme de mevcuttur.",
      
      ctaTitle: "İsviçre Alpleri Transferinizi Rezerve Etmeye Hazır mısınız?",
      ctaDesc: "Kayak merkezi transferiniz için anında fiyat teklifi ve WhatsApp onayı alın.",
      ctaButton: "AI Asistan ile Şimdi Rezerve Et",
      
      relatedTitle: "İlgili Makaleler",
    },
  };

  const txt = translations[language as keyof typeof translations] || translations.en;

  const zurichPrices = [
    { destination: "St. Moritz", price: "€920", duration: "2h 30min" },
    { destination: "Gstaad", price: "€920", duration: "2h 15min" },
    { destination: "Davos", price: "€900", duration: "2h" },
    { destination: "Arosa", price: "€900", duration: "2h" },
    { destination: "Zermatt", price: "€1,100", duration: "3h 30min" },
    { destination: "Verbier", price: "€980", duration: "2h 45min" },
    { destination: "Crans-Montana", price: "€1,240", duration: "3h" },
  ];

  const genevaPrices = [
    { destination: "St. Moritz", price: "€1,850", duration: "4h 30min" },
    { destination: "Gstaad", price: "€820", duration: "2h" },
    { destination: "Davos", price: "€1,500", duration: "4h" },
    { destination: "Arosa", price: "€1,500", duration: "4h" },
    { destination: "Zermatt", price: "€1,050", duration: "2h 30min" },
    { destination: "Verbier", price: "€750", duration: "1h 45min" },
    { destination: "Crans-Montana", price: "€800", duration: "2h" },
  ];

  const baselPrices = [
    { destination: "St. Moritz", price: "€1,200", duration: "3h 30min" },
    { destination: "Gstaad", price: "€900", duration: "2h 30min" },
    { destination: "Davos", price: "€960", duration: "2h 45min" },
    { destination: "Arosa", price: "€960", duration: "2h 45min" },
    { destination: "Zermatt", price: "€1,070", duration: "3h" },
    { destination: "Verbier", price: "€1,080", duration: "3h" },
    { destination: "Crans-Montana", price: "€1,050", duration: "2h 45min" },
  ];

  const milanPrices = [
    { destination: "St. Moritz", price: "€960", duration: "2h 30min" },
    { destination: "Gstaad", price: "€1,200", duration: "3h 30min" },
    { destination: "Davos", price: "€1,080", duration: "3h" },
    { destination: "Arosa", price: "€1,080", duration: "3h" },
    { destination: "Zermatt", price: "€870", duration: "2h 30min" },
    { destination: "Verbier", price: "€1,050", duration: "3h" },
    { destination: "Crans-Montana", price: "€920", duration: "2h 30min" },
  ];

  const faqItems = [
    { question: txt.faq1Q, answer: txt.faq1A },
    { question: txt.faq2Q, answer: txt.faq2A },
    { question: txt.faq3Q, answer: txt.faq3A },
    { question: txt.faq4Q, answer: txt.faq4A },
    { question: txt.faq5Q, answer: txt.faq5A },
    { question: txt.faq6Q, answer: txt.faq6A },
  ];

  const tocItems = [
    { id: "why-private", title: txt.whyChooseTitle },
    { id: "airports", title: txt.airportsTitle },
    { id: "pricing", title: txt.pricingTitle },
    { id: "vehicles", title: txt.vehiclesTitle },
    { id: "destinations", title: txt.destinationsTitle },
    { id: "booking", title: txt.bookingTitle },
    { id: "tips", title: txt.tipsTitle },
    { id: "faq", title: "FAQ" },
  ];

  const PriceTable = ({ prices, title, colorClass }: { prices: typeof zurichPrices; title: string; colorClass: string }) => (
    <div className="mb-8">
      <h4 className={`text-lg font-bold mb-3 flex items-center gap-2 ${colorClass}`}>
        <Plane className="h-5 w-5" />
        {title}
      </h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{txt.destinationCol}</TableHead>
            <TableHead className="text-center">{txt.priceCol}</TableHead>
            <TableHead className="text-center">{txt.durationCol}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prices.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                <span className="flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-muted-foreground" />
                  {item.destination}
                </span>
              </TableCell>
              <TableCell className={`text-center font-bold ${colorClass}`}>{item.price}</TableCell>
              <TableCell className="text-center text-muted-foreground">{item.duration}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={txt.seoTitle}
        description={txt.seoDesc}
        keywords="Switzerland airport transfer 2026, Zurich airport transfer, Geneva airport transfer, Basel airport transfer, Milan Malpensa transfer, St Moritz transfer, Gstaad transfer, Davos transfer, Zermatt transfer, Verbier transfer, Swiss Alps private car, luxury chauffeur Switzerland, ski resort transfer, Mercedes S-Class Switzerland, Mercedes V-Class transfer, winter transfer Switzerland, ski equipment transport"
        canonicalPath="/blog/switzerland-airport-transfer-guide"
        ogImage="https://meettransfer.app/og/switzerland-transfer-og.jpg"
        ogType="article"
        articlePublishedTime="2026-01-19"
        articleModifiedTime="2026-01-19"
        articleSection="Travel Guide"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness' },
          {
            type: 'Article',
            headline: txt.h1,
            description: txt.seoDesc,
            image: 'https://meettransfer.app/og/switzerland-transfer-og.jpg',
            datePublished: '2026-01-19',
            dateModified: '2026-01-19',
            author: 'Meet Transfer',
            readingTime: '15',
            wordCount: 3500,
            keywords: ['Switzerland transfer', 'Zurich airport', 'Geneva airport', 'Basel airport', 'Milan Malpensa', 'St. Moritz', 'Gstaad', 'Davos', 'Zermatt', 'Verbier', 'ski resort transfer', 'Swiss Alps', 'luxury transfer'],
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
              { name: txt.h1, url: '/blog/switzerland-airport-transfer-guide' },
            ],
          },
        ]}
      />

      <article className="max-w-4xl mx-auto px-3 sm:px-4 py-8 md:py-12">
        {/* Back to Blog */}
        <Link 
          to={getLocalizedPath("/blog")} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {txt.backToBlog}
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className="bg-blue-500/20 text-blue-600 hover:bg-blue-500/30">
              <Snowflake className="h-3 w-3 mr-1" />
              {txt.category}
            </Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatBlogDate("2026-01-19")}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {txt.readTime}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
            {txt.h1}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {txt.intro}
          </p>
        </header>

        {/* Hero Image */}
        <OptimizedBlogImage
          src={switzerlandTransferHero}
          alt="Mercedes luxury transfer in Swiss Alps with snow-capped mountains"
          className="w-full aspect-video object-cover rounded-xl mb-8"
          priority
        />

        {/* Share & ToC */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <ShareButtons 
            url={`https://meettransfer.app/blog/switzerland-airport-transfer-guide`} 
            title={txt.h1} 
          />
          <TableOfContents items={tocItems} />
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {/* Why Private Transfer */}
          <section id="why-private" className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              {txt.whyChooseTitle}
            </h2>
            <ul className="space-y-3">
              {[txt.whyChoose1, txt.whyChoose2, txt.whyChoose3, txt.whyChoose4, txt.whyChoose5, txt.whyChoose6].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Airports */}
          <section id="airports" className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Plane className="h-6 w-6 text-primary" />
              {txt.airportsTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Badge variant="outline" className="text-xs">ZRH</Badge>
                    {txt.zurichTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{txt.zurichDesc}</p>
                </CardContent>
              </Card>
              <Card className="border-red-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <Badge variant="outline" className="text-xs">GVA</Badge>
                    {txt.genevaTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{txt.genevaDesc}</p>
                </CardContent>
              </Card>
              <Card className="border-amber-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-amber-600">
                    <Badge variant="outline" className="text-xs">BSL</Badge>
                    {txt.baselTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{txt.baselDesc}</p>
                </CardContent>
              </Card>
              <Card className="border-green-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Badge variant="outline" className="text-xs">MXP</Badge>
                    {txt.milanTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{txt.milanDesc}</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Pricing Tables */}
          <section id="pricing" className="mb-12">
            <h2 className="text-2xl font-bold mb-2">{txt.pricingTitle}</h2>
            <p className="text-muted-foreground mb-6">{txt.priceNote}</p>
            
            <PriceTable prices={zurichPrices} title={txt.zurichPricesTitle} colorClass="text-blue-600" />
            <PriceTable prices={genevaPrices} title={txt.genevaPricesTitle} colorClass="text-red-600" />
            <PriceTable prices={baselPrices} title={txt.baselPricesTitle} colorClass="text-amber-600" />
            <PriceTable prices={milanPrices} title={txt.milanPricesTitle} colorClass="text-green-600" />
          </section>

          {/* Vehicles */}
          <section id="vehicles" className="mb-12">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Car className="h-6 w-6 text-primary" />
              {txt.vehiclesTitle}
            </h2>
            <p className="text-muted-foreground mb-6">{txt.vehiclesDesc}</p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>{txt.sClassTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{txt.sClassDesc}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{txt.vClassTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{txt.vClassDesc}</p>
                </CardContent>
              </Card>
            </div>

            {/* Ski Equipment */}
            <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Snowflake className="h-5 w-5 text-blue-500" />
                  {txt.skiEquipmentTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">{txt.skiEquipmentDesc}</p>
                <ul className="space-y-2">
                  {[txt.ski1, txt.ski2, txt.ski3, txt.ski4].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Winter Ready */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {txt.winterReadyTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">{txt.winterReadyDesc}</p>
                <ul className="space-y-2">
                  {[txt.winter1, txt.winter2, txt.winter3, txt.winter4].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Destinations */}
          <section id="destinations" className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Mountain className="h-6 w-6 text-primary" />
              {txt.destinationsTitle}
            </h2>
            <div className="grid gap-4">
              {[
                { title: txt.stMoritzTitle, desc: txt.stMoritzDesc },
                { title: txt.gstaadTitle, desc: txt.gstaadDesc },
                { title: txt.davosTitle, desc: txt.davosDesc },
                { title: txt.zermattTitle, desc: txt.zermattDesc },
                { title: txt.verbierTitle, desc: txt.verbierDesc },
                { title: txt.cransMontanaTitle, desc: txt.cransMontanaDesc },
                { title: txt.arosaTitle, desc: txt.arosaDesc },
              ].map((dest, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Snowflake className="h-4 w-4 text-blue-500" />
                      {dest.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{dest.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Booking */}
          <section id="booking" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">{txt.bookingTitle}</h2>
            <ol className="space-y-3">
              {[txt.booking1, txt.booking2, txt.booking3, txt.booking4, txt.booking5].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Tips */}
          <section id="tips" className="mb-12">
            <h2 className="text-2xl font-bold mb-6">{txt.tipsTitle}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: txt.tip1Title, desc: txt.tip1Desc },
                { title: txt.tip2Title, desc: txt.tip2Desc },
                { title: txt.tip3Title, desc: txt.tip3Desc },
                { title: txt.tip4Title, desc: txt.tip4Desc },
              ].map((tip, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{tip.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{tip.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-12">
            <h2 className="text-2xl font-bold mb-6">FAQ</h2>
            <div className="space-y-4">
              {faqItems.map((item, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">{item.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA */}
          <BlogCTA destination="Switzerland Alps" />
        </div>

        {/* Related Articles */}
        <RelatedArticles currentArticleId="switzerland-airport-transfer-guide" maxArticles={3} />
      </article>
    </WebsiteLayout>
  );
};

export default SwitzerlandAirportTransferGuide;
