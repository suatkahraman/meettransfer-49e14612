import WebsiteLayout from "@/components/website/WebsiteLayout";
import PageHeader from "@/components/website/PageHeader";
import { SEOHead, SchemaOrg } from "@/components/seo";
import { Shield, CreditCard, User, Calendar, Check, Banknote, Clock, Plane } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const TermsPage = () => {
  const { language, getLocalizedPath } = useLanguage();
  const isTurkish = language === "TR";

  return (
    <WebsiteLayout>
      <SEOHead
        title={isTurkish ? "Şartlar & Koşullar - Meet Transfer Havalimanı Transfer Hizmeti" : "Terms & Conditions - Meet Transfer Airport Transfer Service"}
        description={isTurkish ? "Meet Transfer havalimanı transfer hizmetleri için şartlar ve koşullar. Rezervasyon, ödeme, iptal politikası, bekleme süresi ve gizlilik bilgileri." : "Terms and conditions for Meet Transfer airport transfer services. Booking, payment, cancellation policy, waiting time, and privacy information."}
        keywords={isTurkish ? "Meet Transfer şartlar, transfer hizmeti şartları, iptal politikası, rezervasyon şartları, havalimanı transfer koşulları" : "Meet Transfer terms, transfer service terms, cancellation policy, booking terms, airport transfer conditions"}
        canonicalPath="/terms"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
        noIndex={false}
      />
      <SchemaOrg
        schemas={[
          {
            type: 'BreadcrumbList',
            items: [
              { name: isTurkish ? 'Ana Sayfa' : 'Home', url: '/' },
              { name: isTurkish ? 'Şartlar & Koşullar' : 'Terms & Conditions', url: '/terms' },
            ],
          },
        ]}
      />

      <PageHeader
        title={isTurkish ? "Şartlar & Koşullar" : "Terms & Conditions"}
        subtitle={isTurkish ? "Rezervasyon yapmadan önce lütfen dikkatle okuyun" : "Please read carefully before booking"}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Benefits Section */}
        <div className="not-prose mb-10 bg-gradient-to-br from-primary/5 via-accent/5 to-green-500/5 border-2 border-primary/20 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {isTurkish ? "Neden Meet Transfer?" : "Why Meet Transfer?"}
            </h2>
            <p className="text-muted-foreground">
              {isTurkish ? "Güvenli, esnek ve şeffaf transfer hizmeti" : "Safe, flexible and transparent transfer service"}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {/* Login Benefits */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">
                {isTurkish ? "Üye Avantajları" : "Member Benefits"}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{isTurkish ? "Tüm rezervasyonlarınızı tek yerden yönetin" : "Manage all your bookings in one place"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{isTurkish ? "Hızlı rezervasyon için bilgilerinizi kaydedin" : "Save your details for quick booking"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{isTurkish ? "Özel indirimler ve kampanyalardan yararlanın" : "Access exclusive discounts and offers"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{isTurkish ? "Transfer geçmişinizi görüntüleyin" : "View your transfer history"}</span>
                </li>
              </ul>
              <Link 
                to={getLocalizedPath("/login")}
                className="inline-flex items-center gap-2 mt-4 text-primary font-medium text-sm hover:underline"
              >
                {isTurkish ? "Hemen Üye Olun →" : "Sign Up Now →"}
              </Link>
            </div>

            {/* Free Cancellation */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">
                {isTurkish ? "Esnek İptal Politikası" : "Flexible Cancellation"}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="font-medium text-green-600">{isTurkish ? "24 saat öncesine kadar ÜCRETSİZ iptal" : "FREE cancellation up to 24 hours"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{isTurkish ? "İstediğiniz zaman rezervasyonunuzu değiştirin" : "Modify your booking anytime"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{isTurkish ? "Uçuş gecikmelerinde otomatik ayarlama" : "Auto-adjustment for flight delays"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{isTurkish ? "Koşulsuz tam iade garantisi" : "No-questions-asked full refund"}</span>
                </li>
              </ul>
            </div>

            {/* Cash Payment */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-2xl p-5 border-2 border-amber-400/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                <Banknote className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground flex items-center gap-2">
                {isTurkish ? "Nakit Ödeme" : "Cash Payment"}
                <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {isTurkish ? "Popüler" : "Popular"}
                </span>
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="font-medium text-amber-700 dark:text-amber-400">{isTurkish ? "Şoföre nakit ödeme imkanı" : "Pay cash directly to driver"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{isTurkish ? "EUR, USD, TRY, GBP kabul edilir" : "EUR, USD, TRY, GBP accepted"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{isTurkish ? "Ön ödeme veya kredi kartı gerekmez" : "No upfront payment or card needed"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{isTurkish ? "Sabit fiyat garantisi" : "Fixed price guarantee"}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Prominent Cancellation Policy Banner */}
        <div className="not-prose mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-500 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-2xl">
              ✓
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-700 dark:text-green-400 m-0">
                {isTurkish ? "Ücretsiz İptal Politikası" : "Free Cancellation Policy"}
              </h2>
              <p className="text-green-600 dark:text-green-500 text-sm m-0">
                {isTurkish ? "Esnek rezervasyon, gönül rahatlığı" : "Flexible booking with peace of mind"}
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-green-200 dark:border-green-800 text-center">
              <div className="text-3xl mb-2">🆓</div>
              <p className="font-bold text-green-700 dark:text-green-400 text-lg mb-1">
                {isTurkish ? "ÜCRETSİZ" : "FREE"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isTurkish ? "24 saat öncesine kadar" : "Up to 24 hours before pickup"}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800 text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <p className="font-bold text-yellow-600 dark:text-yellow-400 text-lg mb-1">
                {isTurkish ? "%50 Ücret" : "50% Charge"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isTurkish ? "Son 24 saat içinde" : "Within 24 hours of pickup"}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-200 dark:border-red-800 text-center">
              <div className="text-3xl mb-2">❌</div>
              <p className="font-bold text-red-600 dark:text-red-400 text-lg mb-1">
                {isTurkish ? "%100 Ücret" : "100% Charge"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isTurkish ? "Gelmeme veya 2 saat içinde" : "No-shows or within 2 hours"}
              </p>
            </div>
          </div>
        </div>

        {/* Terms Content */}
        <div className="prose prose-sm max-w-none">
          <h1 className="text-3xl font-bold mb-6 text-foreground">
            {isTurkish ? "Meet Transfer - Şartlar & Koşullar" : "Meet Transfer - Terms & Conditions"}
          </h1>

          <h2>{isTurkish ? "1. Rezervasyon & Onay" : "1. Booking & Confirmation"}</h2>
          <p>
            {isTurkish 
              ? "Tüm rezervasyonlar müsaitliğe tabidir. Başarılı rezervasyon sonrasında, transfer detaylarınızı içeren bir onay e-postası ve/veya WhatsApp mesajı alacaksınız. Lütfen tüm bilgileri kontrol edin ve herhangi bir hata durumunda bizi hemen bilgilendirin."
              : "All bookings are subject to availability. Upon successful booking, you will receive a confirmation email and/or WhatsApp message with your transfer details. Please review all information and notify us immediately of any errors."
            }
          </p>

          <h2>{isTurkish ? "2. Ödeme Koşulları" : "2. Payment Terms"}</h2>
          <div className="not-prose bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="h-5 w-5 text-amber-600" />
              <span className="font-bold text-amber-700 dark:text-amber-400">
                {isTurkish ? "Nakit Ödeme Seçeneği" : "Cash Payment Option"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground m-0">
              {isTurkish 
                ? "Şoföre nakit ödeme yapabilirsiniz. EUR, USD, TRY ve GBP kabul edilir. Ön ödeme veya kredi kartı gerekmez!"
                : "You can pay cash directly to your driver. We accept EUR, USD, TRY, and GBP. No upfront payment or credit card required!"
              }
            </p>
          </div>
          <p>
            {isTurkish 
              ? "Şoföre nakit ödeme, kredi kartı ve kurumsal müşteriler için fatura ile ödeme kabul ediyoruz. Nakit ödemelerde lütfen anlaşılan para biriminde tam tutarı hazır bulundurun."
              : "We accept cash payment to driver, credit card, and invoice payment for corporate clients. For cash payments, please ensure you have the exact amount in the agreed currency."
            }
          </p>

          <h2>{isTurkish ? "3. İptal Politikası" : "3. Cancellation Policy"}</h2>
          <p>
            {isTurkish 
              ? "İptal politikamız adil ve esnek olacak şekilde tasarlanmıştır:"
              : "Our cancellation policy is designed to be fair and flexible:"
            }
          </p>
          <ul>
            <li><strong className="text-green-600">{isTurkish ? "Ücretsiz iptal" : "Free cancellation"}</strong> {isTurkish ? "alış saatinden 24 saat öncesine kadar" : "up to 24 hours before pickup"}</li>
            <li><strong className="text-yellow-600">{isTurkish ? "%50 ücret" : "50% charge"}</strong> {isTurkish ? "son 24 saat içindeki iptaller için" : "for cancellations within 24 hours"}</li>
            <li><strong className="text-red-600">{isTurkish ? "%100 ücret" : "100% charge"}</strong> {isTurkish ? "gelmeme veya 2 saat içindeki iptaller için" : "for no-shows or cancellations within 2 hours"}</li>
          </ul>

          <h2>{isTurkish ? "4. Bekleme Süresi" : "4. Waiting Time"}</h2>
          <p>
            {isTurkish 
              ? "Havalimanı alışlarında, planlanan uçuş varışından itibaren 60 dakika ücretsiz bekleme süresi sağlıyoruz. Diğer alışlarda 15 dakika ücretsiz bekleme süresi dahildir. Ek bekleme süresi dakikada 1€ olarak ücretlendirilebilir."
              : "For airport pickups, we provide 60 minutes of free waiting time from the scheduled flight arrival. For other pickups, 15 minutes of free waiting time is included. Additional waiting time may be charged at €1 per minute."
            }
          </p>

          <h2>{isTurkish ? "5. Uçuş Gecikmeleri" : "5. Flight Delays"}</h2>
          <p>
            {isTurkish 
              ? "Tüm uçuşları takip ediyor ve alış saatlerini buna göre ücretsiz olarak ayarlıyoruz. Önemli gecikmelerde (2 saatten fazla), transferinizi onaylamak için lütfen bizimle iletişime geçin."
              : "We monitor all flights and adjust pickup times accordingly at no extra cost. In case of significant delays (more than 2 hours), please contact us to confirm your transfer."
            }
          </p>

          <h2>{isTurkish ? "6. Bagaj & Yolcular" : "6. Luggage & Passengers"}</h2>
          <p>
            {isTurkish 
              ? "Lütfen rezervasyon yaptığınız araç tipinin grup büyüklüğünüze ve bagajınıza uygun olduğundan emin olun. Her yolcuya bir bavul ve bir el bagajı izni verilir. Ek bagaj, ekstra ücretle daha büyük bir araç gerektirebilir."
              : "Please ensure the vehicle type you book can accommodate your group size and luggage. Each passenger is allowed one suitcase and one carry-on bag. Additional luggage may require a larger vehicle at extra cost."
            }
          </p>

          <h2>{isTurkish ? "7. Çocuk Koltukları" : "7. Child Seats"}</h2>
          <p>
            {isTurkish 
              ? "Çocuk koltukları ve yükseltici koltuklar talep üzerine ücretsiz olarak sağlanmaktadır. Lütfen uygun koltuğu sağlayabilmemiz için rezervasyon sırasında çocuğun yaşını ve kilosunu belirtin."
              : "Child seats and booster seats are available free of charge upon request. Please specify the child's age and weight when booking so we can provide the appropriate seat."
            }
          </p>

          <h2>{isTurkish ? "8. Gizlilik" : "8. Privacy"}</h2>
          <p>
            {isTurkish ? "Gizliliğiniz bizim için önemlidir. Kişisel verilerinizi nasıl topladığımız, kullandığımız ve koruduğumuz hakkında ayrıntılı bilgi için lütfen " : "Your privacy is important to us. Please review our "}
            <a href={getLocalizedPath("/privacy")} className="text-primary hover:underline">
              {isTurkish ? "Gizlilik Politikamızı" : "Privacy Policy"}
            </a>
            {isTurkish ? " inceleyin." : " for detailed information about how we collect, use, and protect your personal data."}
          </p>

          <h2>{isTurkish ? "9. Sorumluluk" : "9. Liability"}</h2>
          <p>
            {isTurkish 
              ? "Meet Transfer, yolcu taşımacılığı için tamamen sigortalıdır. Ancak trafik, hava koşulları veya kontrolümüz dışındaki diğer durumlardan kaynaklanan gecikmelerden sorumlu değiliz. Havalimanı transferleri için yeterli süre ayırmanızı öneririz."
              : "Meet Transfer is fully insured for passenger transportation. However, we are not liable for delays caused by traffic, weather, or other circumstances beyond our control. We recommend allowing sufficient time for airport transfers."
            }
          </p>

          <h2>{isTurkish ? "10. Şartlarda Değişiklikler" : "10. Changes to Terms"}</h2>
          <p>
            {isTurkish 
              ? "Bu şartlar ve koşulları istediğimiz zaman güncelleme hakkını saklı tutarız. En güncel versiyon her zaman web sitemizde mevcut olacaktır. Hizmetlerimizi kullanmaya devam etmeniz, herhangi bir değişikliği kabul ettiğiniz anlamına gelir."
              : "We reserve the right to update these terms and conditions at any time. The latest version will always be available on our website. Continued use of our services constitutes acceptance of any changes."
            }
          </p>

          <h2>{isTurkish ? "İletişim Bilgileri" : "Contact Information"}</h2>
          <p>
            <strong>Meet Transfer</strong><br />
            Email: info@meettransfer.app<br />
            {isTurkish ? "Telefon/WhatsApp" : "Phone/WhatsApp"}: +1 (555) 805-1101
          </p>

          <p className="text-muted-foreground text-sm mt-8">
            {isTurkish ? "Son güncelleme: Ocak 2025" : "Last updated: January 2025"}
          </p>
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default TermsPage;
