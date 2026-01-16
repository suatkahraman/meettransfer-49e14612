import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import VehicleCard from "@/components/website/VehicleCard";
import PriceTable from "@/components/website/PriceTable";
import FAQSection from "@/components/website/FAQSection";
import FeatureList from "@/components/website/FeatureList";
import WhatsAppButton from "@/components/website/WhatsAppButton";
import { MapPin, ArrowRight, Clock, Shield, Star, Users, Plane, CheckCircle, BadgePercent, Phone, MessageCircle, Award, ThumbsUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead, SchemaOrg } from "@/components/seo";
import mercedesVipImage from "@/assets/mercedes-vip-transfer.webp";
import mercedesVitoFamilyImage from "@/assets/mercedes-vito-family.webp";
import { Footer } from "@/components/Footer";
import { useGoogleReviewStats } from "@/hooks/useGoogleReviewStats";

const destinations = [
  { name: "Taksim", price: "Fiyat Talep Et", time: "45 dk" },
  { name: "Sultanahmet", price: "Fiyat Talep Et", time: "50 dk" },
  { name: "Beşiktaş", price: "Fiyat Talep Et", time: "40 dk" },
  { name: "Kadıköy", price: "Fiyat Talep Et", time: "60 dk" },
  { name: "Şişli", price: "Fiyat Talep Et", time: "45 dk" },
  { name: "Nişantaşı", price: "Fiyat Talep Et", time: "45 dk" },
  { name: "Maslak", price: "Fiyat Talep Et", time: "35 dk" },
  { name: "Levent", price: "Fiyat Talep Et", time: "40 dk" },
  { name: "Bakırköy", price: "Fiyat Talep Et", time: "30 dk" },
  { name: "Galataport", price: "Fiyat Talep Et", time: "50 dk" },
];

const prices = [
  { from: "İstanbul Havalimanı", to: "Taksim", price: "Fiyat Talep Et" },
  { from: "İstanbul Havalimanı", to: "Sultanahmet", price: "Fiyat Talep Et" },
  { from: "İstanbul Havalimanı", to: "Beşiktaş", price: "Fiyat Talep Et" },
  { from: "İstanbul Havalimanı", to: "Kadıköy", price: "Fiyat Talep Et" },
  { from: "İstanbul Havalimanı", to: "Şişli / Levent", price: "Fiyat Talep Et" },
  { from: "İstanbul Havalimanı", to: "Bakırköy", price: "Fiyat Talep Et" },
  { from: "İstanbul Havalimanı", to: "Galataport", price: "Fiyat Talep Et" },
  { from: "İstanbul Havalimanı", to: "Sabiha Gökçen", price: "Fiyat Talep Et" },
];

const faqItems = [
  {
    question: "İstanbul Havalimanı transfer fiyatları ne kadar?",
    answer: "İstanbul Havalimanı transfer fiyatlarımız Taksim, Sultanahmet ve Beşiktaş için 45€'dan başlamaktadır. Tüm fiyatlarımız sabittir ve karşılama servisi, uçuş takibi, profesyonel şoför, lüks araç, ücretsiz su, WiFi ve tüm vergileri içermektedir. Gizli ücret veya ek masraf yoktur.",
  },
  {
    question: "En uygun İstanbul Havalimanı transferini nasıl bulurum?",
    answer: "En uygun fiyatlı transfer için erken rezervasyon yapmanızı öneririz. WhatsApp üzerinden anında fiyat teklifi alabilir, grup indirimi veya çoklu transfer için özel fiyat talep edebilirsiniz. Fiyatlarımız taksiden çok daha uygun ve konforludur.",
  },
  {
    question: "Taksi yerine neden özel transfer tercih etmeliyim?",
    answer: "Özel transfer sabit fiyat garantisi sunar - taksimetre stresi yok. Ayrıca kapıda karşılama, bagaj yardımı, klimalı lüks araç, profesyonel şoför ve 7/24 müşteri desteği gibi avantajlar sunuyoruz. Fiyatlarımız taksiye yakın ama hizmet kalitemiz çok üstün.",
  },
  {
    question: "Uçuşum gecikirse ne olur?",
    answer: "Tüm uçuşları gerçek zamanlı takip ediyoruz. Uçuşunuz gecikirse, karşılama saatinizi otomatik olarak ayarlıyoruz - ek ücret veya bildirim gerekmez. Siz indiğinizde biz orada olacağız.",
  },
  {
    question: "İstanbul Havalimanından şehir merkezine ne kadar sürer?",
    answer: "İstanbul Havalimanından Taksim'e yaklaşık 45-60 dakika, Sultanahmet'e 50-70 dakika, Kadıköy'e 60-80 dakika sürmektedir. Süre trafiğe göre değişebilir ancak şoförlerimiz en optimal rotayı kullanır.",
  },
  {
    question: "Gece veya sabah erken saatlerde transfer yapabiliyor musunuz?",
    answer: "Evet, 7/24 hizmet veriyoruz. Sabah 03:00'te veya gece 23:00'te inen uçuşlar için de transfer sağlıyoruz. Şoförlerimiz her zaman zamanında ve profesyonel kıyafetlidir.",
  },
];

const vehicles = [
  {
    name: "Mercedes Vito VIP",
    description: "Deri koltuklu lüks 6 kişilik araç. İş seyahati ve aileler için mükemmel konfor. Klima, WiFi ve USB şarj dahil.",
    passengers: 6,
    luggage: 6,
    features: ["Deri koltuklar", "WiFi", "Ücretsiz su", "USB şarj", "Klima kontrol"],
    image: mercedesVipImage,
  },
  {
    name: "Mercedes Vito Aile",
    description: "Geniş 7 kişilik araç, aileler ve gruplar için ideal. Konfordan ödün vermeden ekonomik seçenek.",
    passengers: 7,
    luggage: 7,
    features: ["Konforlu koltuklar", "WiFi", "Ücretsiz su", "USB şarj", "Klima", "Ekstra bacak mesafesi"],
    image: mercedesVitoFamilyImage,
  },
];

const AirportTransferIstanbul = () => {
  const { rating, totalReviews } = useGoogleReviewStats();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": "https://meettransfer.app/airporttransfer/istanbul#product",
    "name": "İstanbul Havalimanı Transfer Hizmeti",
    "description": "İstanbul Havalimanından şehir merkezine VIP transfer. Sabit fiyat, lüks Mercedes araçlar.",
    "brand": {
      "@type": "Brand",
      "name": "Meet Transfer"
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "40",
      "highPrice": "120",
      "priceCurrency": "EUR",
      "offerCount": "8"
    }
    // aggregateRating removed - using organization-level rating only to avoid Google warning
  };

  return (
    <WebsiteLayout>
      <SEOHead
        title="İstanbul Havalimanı Transfer Fiyatları 2025 | En Uygun VIP Transfer | Meet Transfer"
        description="İstanbul Havalimanı transfer fiyatları 45€'dan başlıyor. Taksim, Sultanahmet, Kadıköy'e sabit fiyatlı VIP transfer. 7/24 hizmet, lüks Mercedes araçlar. Hemen WhatsApp'tan teklif alın!"
        keywords="istanbul havalimanı transfer fiyatları, ist havalimanı transfer, istanbul havalimanı taksi fiyatı, istanbul airport transfer, havalimanı transfer ücretleri, ist airport taksi, taksim transfer fiyat, sultanahmet transfer"
        canonicalPath="/airporttransfer/istanbul"
      />
      <SchemaOrg
        schemas={[
          { type: 'TransportationService', areaServed: ['İstanbul Havalimanı', 'IST', 'Taksim', 'Sultanahmet', 'Kadıköy', 'Beşiktaş'] },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Ana Sayfa', url: '/' },
              { name: 'Havalimanı Transfer', url: '/airporttransfer/istanbul' },
            ],
          },
          { type: 'FAQPage', questions: faqItems },
        ]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <PageHeader
        title="İstanbul Havalimanı Transfer"
        subtitle="En Uygun Fiyatlarla VIP Transfer Hizmeti"
        backgroundImage="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Hero CTA Section */}
        <section className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-primary-foreground text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BadgePercent className="h-8 w-8" />
            <span className="text-2xl font-bold">EN UYGUN FİYAT GARANTİSİ</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            İstanbul Havalimanı Transfer Fiyatları
          </h1>
          <p className="text-xl mb-6 opacity-90">
            Taksim'e sadece <span className="font-bold text-2xl">45€</span> - Sabit fiyat, gizli ücret yok!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <WhatsAppButton
              variant="large"
              message="Merhaba, İstanbul Havalimanı transfer fiyatı almak istiyorum."
            />
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 text-center shadow-sm">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{rating.toFixed(1)}/5</div>
            <div className="text-sm text-muted-foreground">{totalReviews.toLocaleString()}+ Değerlendirme</div>
          </div>
          <div className="bg-card rounded-xl p-4 text-center shadow-sm">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">15,000+</div>
            <div className="text-sm text-muted-foreground">Mutlu Müşteri</div>
          </div>
          <div className="bg-card rounded-xl p-4 text-center shadow-sm">
            <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">7/24</div>
            <div className="text-sm text-muted-foreground">Kesintisiz Hizmet</div>
          </div>
          <div className="bg-card rounded-xl p-4 text-center shadow-sm">
            <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">%100</div>
            <div className="text-sm text-muted-foreground">Sabit Fiyat</div>
          </div>
        </section>

        {/* Main SEO Content */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4 text-foreground">İstanbul Havalimanı Transfer: En İyi Fiyatı Nasıl Alırsınız?</h2>
          <p className="text-muted-foreground leading-relaxed text-lg mb-4">
            İstanbul Havalimanı (IST) Türkiye'nin en büyük ve dünyanın en işlek havalimanlarından biridir. Şehir merkezine 35 km uzaklıkta bulunan havalimanından ulaşım, özellikle ilk kez gelenler için kafa karıştırıcı olabilir. <strong>Taksi, metro, otobüs veya özel transfer</strong> - hangisi sizin için en uygun?
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg mb-4">
            Eğer <strong>konfor, güvenlik ve uygun fiyatı</strong> bir arada arıyorsanız, özel transfer en mantıklı seçimdir. Neden mi? Sabit fiyat garantisi sayesinde taksimetre stresi yaşamazsınız. Ayrıca kapıda karşılama, bagaj yardımı ve lüks araç konforu standart olarak dahildir.
          </p>
          <div className="bg-accent/10 border-l-4 border-accent p-6 rounded-r-lg my-6">
            <p className="text-foreground font-semibold mb-2">💡 En İyi Fiyat İpucu:</p>
            <p className="text-muted-foreground">WhatsApp üzerinden anında fiyat teklifi alın. Grup transferleri ve çoklu rezervasyonlar için ek indirimler sunuyoruz. Erken rezervasyon avantajlarından yararlanın!</p>
          </div>
        </section>

        {/* Price Comparison Section */}
        <section className="bg-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Taksi vs. Özel Transfer: Fiyat Karşılaştırması</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-destructive/30 rounded-xl p-6 bg-destructive/5">
              <h3 className="text-lg font-semibold mb-4 text-destructive flex items-center gap-2">
                <span>🚕</span> Taksi Dezavantajları
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✗</span>
                  <span>Taksimetre - trafikte fiyat artar (70-100€ olabilir)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✗</span>
                  <span>Kuyrukta bekleme süresi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✗</span>
                  <span>Araç kalitesi belirsiz</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✗</span>
                  <span>Dil bariyeri sorunu</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✗</span>
                  <span>Bagaj için ek ücret riski</span>
                </li>
              </ul>
            </div>
            <div className="border border-green-500/30 rounded-xl p-6 bg-green-500/5">
              <h3 className="text-lg font-semibold mb-4 text-green-600 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Özel Transfer Avantajları
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span><strong>Sabit fiyat</strong> - 45€'dan başlayan fiyatlar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Kapıda isim tabelasıyla karşılama</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Lüks Mercedes araçlar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>İngilizce/Türkçe bilen şoförler</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Ücretsiz WiFi, su ve bebek koltuğu</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Destination Prices */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-foreground">İstanbul Havalimanı Transfer Fiyat Listesi 2025</h2>
          <p className="text-muted-foreground mb-6">
            Aşağıdaki fiyatlar sabit olup karşılama, uçuş takibi, bagaj yardımı ve tüm vergileri içermektedir:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {destinations.map((dest) => (
              <div
                key={dest.name}
                className="flex items-center justify-between bg-card p-4 rounded-xl shadow-sm border border-border/50 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-medium">{dest.name}</span>
                    <span className="text-sm text-muted-foreground block">~{dest.time}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-primary">{dest.price}</span>
                  <span className="text-xs text-muted-foreground block">sabit fiyat</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <WhatsAppButton
              variant="default"
              message="Merhaba, İstanbul Havalimanından transfer fiyatı almak istiyorum."
            />
          </div>
        </section>

        {/* How to Get Best Price */}
        <section className="bg-secondary/50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">En Uygun Fiyatı Almanın 5 Yolu</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <h3 className="font-semibold mb-1">Erken Rezervasyon</h3>
                <p className="text-sm text-muted-foreground">7 gün önceden rezervasyon yaparak en iyi fiyatı garantileyin.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <h3 className="font-semibold mb-1">WhatsApp'tan Teklif Alın</h3>
                <p className="text-sm text-muted-foreground">Anında fiyat teklifi ve özel indirimler için WhatsApp'tan yazın.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <h3 className="font-semibold mb-1">Grup İndirimi</h3>
                <p className="text-sm text-muted-foreground">4+ kişilik gruplar için kişi başı fiyat daha uygun olur.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0">4</div>
              <div>
                <h3 className="font-semibold mb-1">Gidiş-Dönüş Paketi</h3>
                <p className="text-sm text-muted-foreground">Hem gidiş hem dönüş için rezervasyon yaparak tasarruf edin.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0">5</div>
              <div>
                <h3 className="font-semibold mb-1">Doğru Araç Seçimi</h3>
                <p className="text-sm text-muted-foreground">Kişi sayınıza uygun araç seçerek gereksiz maliyet önleyin.</p>
              </div>
            </div>
          </div>
        </section>

        <FeatureList />

        {/* Fleet Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-foreground">Transfer Araç Filomuz</h2>
          <p className="text-muted-foreground mb-6">Tüm araçlarımız düzenli bakımlı Mercedes modellerdir:</p>
          <div className="grid md:grid-cols-2 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.name} {...vehicle} />
            ))}
          </div>
          <Link to="/fleet" className="inline-block mt-4">
            <Button variant="outline" className="gap-2">
              Tüm Araçları Görüntüle <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>

        {/* Full Price Table */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-foreground">Detaylı Fiyat Tablosu</h2>
          <PriceTable items={prices} title="İstanbul Havalimanı Transfer Fiyatları" />
        </section>

        {/* Why Us Section */}
        <section className="prose max-w-none">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Neden Meet Transfer?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            2018'den bu yana İstanbul'da binlerce misafire güvenli ve konforlu transfer hizmeti sunuyoruz. <strong>Google'da {rating.toFixed(1)}/5</strong> ortalama puanımız ve <strong>{totalReviews.toLocaleString()}+ olumlu değerlendirmemiz</strong> hizmet kalitemizin kanıtıdır.
          </p>
          <div className="grid md:grid-cols-3 gap-6 my-8">
            <div className="text-center">
              <Award className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Profesyonel Hizmet</h3>
              <p className="text-sm text-muted-foreground">Tüm şoförlerimiz lisanslı, sigortalı ve İngilizce bilir.</p>
            </div>
            <div className="text-center">
              <ThumbsUp className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">%99.9 Zamanında</h3>
              <p className="text-sm text-muted-foreground">Uçuş takip sistemimiz sayesinde her zaman zamanında oradayız.</p>
            </div>
            <div className="text-center">
              <Zap className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Anında Onay</h3>
              <p className="text-sm text-muted-foreground">WhatsApp'tan yazın, dakikalar içinde onay alın.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary rounded-2xl p-8 text-center text-primary-foreground">
          <h3 className="text-2xl font-bold mb-2">Hemen Fiyat Teklifi Alın!</h3>
          <p className="mb-6 opacity-90 max-w-2xl mx-auto">
            WhatsApp'tan uçuş bilgilerinizi gönderin, 5 dakika içinde size en uygun fiyat teklifimizi iletiyoruz. 7/24 hizmetinizdeyiz.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <WhatsAppButton
              variant="large"
              message="Merhaba, İstanbul Havalimanı transfer fiyatı almak istiyorum. Uçuş bilgilerim:"
            />
            <Link to="/contact">
              <Button variant="secondary" size="lg" className="gap-2">
                <Phone className="h-5 w-5" />
                Bizi Arayın
              </Button>
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-foreground">Sık Sorulan Sorular</h2>
          <FAQSection items={faqItems} />
        </section>

        {/* Related Links */}
        <section className="bg-card rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4 text-foreground">İlgili Sayfalar</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/istanbul-airport-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Istanbul Airport Transfer (EN)
            </Link>
            <Link to="/istanbul-airport-hotel-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              İstanbul Havalimanı Otel Transfer
            </Link>
            <Link to="/sabiha-gokcen-private-transfer" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Sabiha Gökçen Transfer
            </Link>
            <Link to="/blog/istanbul-transfer-price-guide" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              İstanbul Transfer Fiyat Rehberi
            </Link>
            <Link to="/fleet" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Araç Filomuz
            </Link>
            <Link to="/reviews" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowRight className="h-4 w-4" />
              Müşteri Yorumları
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </WebsiteLayout>
  );
};

export default AirportTransferIstanbul;
