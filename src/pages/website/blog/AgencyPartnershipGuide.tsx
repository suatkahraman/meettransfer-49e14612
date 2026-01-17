import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CheckCircle2, Users, Globe, Shield, Handshake, TrendingUp, CreditCard, HeadphonesIcon, Clock4, Building2, Award, Star, Zap, Mail, Phone } from "lucide-react";
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
import vitoVipStarlightPurple from "@/assets/vito-vip-starlight-purple.jpg";

const AgencyPartnershipGuide = () => {
  const { t, getLocalizedPath, language } = useLanguage();
  const { formatBlogDate } = useBlogDate();

  // Multi-language content
  const content = {
    EN: {
      badge: "B2B Partnership",
      title: "Become a Meet Transfer Partner Agency – B2B Partnership for Travel Agencies",
      h1: "Turkey Airport Transfer Partner – Join Meet Transfer B2B Network",
      intro: "Are you a travel agency looking for a reliable airport transfer partner in Turkey? Meet Transfer offers a seamless B2B partnership program for agencies worldwide. Get exclusive rates, real-time booking, and dedicated support.",
      metaDesc: "Become a Meet Transfer B2B partner. Best Turkey airport transfer partner for travel agencies. Exclusive rates, instant booking, 24/7 support. Join our agency network today.",
      keywords: "Turkey transfer partner, B2B airport transfer Turkey, travel agency partner Turkey, Turkey ground transportation partner, airport transfer wholesale Turkey, DMC Turkey partner, incoming agency Turkey, Meet Transfer partner, agency partnership Turkey, Turkey transfer supplier",
      readTime: "10",
      
      // Sections
      whyPartnerTitle: "Why Partner with Meet Transfer?",
      whyPartnerDesc: "Join Turkey's most trusted airport transfer network and grow your business with confidence.",
      
      benefitsTitle: "Partnership Benefits",
      benefits: [
        { icon: "discount", title: "Exclusive Agency Rates", desc: "Get up to 25% discount on all transfers. Competitive B2B pricing for agencies." },
        { icon: "booking", title: "Real-Time Booking System", desc: "Dedicated agency portal with instant confirmation. No waiting, no manual processes." },
        { icon: "support", title: "24/7 Priority Support", desc: "Dedicated account manager and priority WhatsApp line for urgent requests." },
        { icon: "payment", title: "Flexible Payment Terms", desc: "Monthly billing, credit terms available for established partners. No advance payment required." },
        { icon: "fleet", title: "Premium Mercedes Fleet", desc: "VIP Vito, Sprinter, Maybach, S-Class. All vehicles 2020+ model year." },
        { icon: "coverage", title: "Nationwide Coverage", desc: "Istanbul, Antalya, Bodrum, Cappadocia, Izmir, Dubai, Cyprus - and growing." },
      ],
      
      howItWorksTitle: "How to Become a Partner",
      howItWorksSteps: [
        { step: "1", title: "Apply Online", desc: "Fill out the simple agency application form. Takes less than 5 minutes." },
        { step: "2", title: "Get Approved", desc: "Our team reviews your application within 24 hours. We verify your agency credentials." },
        { step: "3", title: "Access Dashboard", desc: "Receive your dedicated agency login. Start booking immediately with exclusive rates." },
        { step: "4", title: "Start Earning", desc: "Book transfers, earn commissions. We handle drivers, vehicles, and customer service." },
      ],
      
      whoCanJoinTitle: "Who Can Join Our Partner Network?",
      whoCanJoin: [
        "Travel Agencies & Tour Operators",
        "Destination Management Companies (DMCs)",
        "Online Travel Agencies (OTAs)",
        "Corporate Travel Managers",
        "Hotel Concierges & Guest Relations",
        "Wedding & Event Planners",
        "MICE Agencies",
        "Cruise Line Shore Excursion Operators",
      ],
      
      destinationsTitle: "Destinations We Cover",
      destinations: [
        { name: "Istanbul", airports: "IST, SAW", hotels: "500+" },
        { name: "Antalya", airports: "AYT", hotels: "300+" },
        { name: "Bodrum", airports: "BJV", hotels: "200+" },
        { name: "Cappadocia", airports: "ASR, NAV", hotels: "150+" },
        { name: "Izmir", airports: "ADB", hotels: "100+" },
        { name: "Dalaman", airports: "DLM", hotels: "200+" },
        { name: "Dubai", airports: "DXB, DWC", hotels: "400+" },
        { name: "Cyprus", airports: "ECN, LCA", hotels: "200+" },
      ],
      
      statsTitle: "Our Track Record",
      stats: [
        { value: "50,000+", label: "Transfers Completed" },
        { value: "4.7★", label: "Google Rating" },
        { value: "500+", label: "Partner Agencies" },
        { value: "99.8%", label: "On-Time Rate" },
      ],
      
      testimonialsTitle: "What Partner Agencies Say",
      testimonials: [
        { name: "TravelWorld Germany", quote: "Meet Transfer has been our go-to partner for Turkey transfers. Reliable, professional, and their B2B rates are unbeatable.", country: "Germany" },
        { name: "Euro Tours UK", quote: "The agency dashboard is incredibly easy to use. Our guests consistently praise the service quality.", country: "United Kingdom" },
        { name: "Voyage Plus France", quote: "Excellent communication and flexibility. They've never let us down, even with last-minute bookings.", country: "France" },
      ],
      
      faqTitle: "Frequently Asked Questions",
      faqs: [
        { q: "How much does it cost to become a partner?", a: "Partnership is completely free. No setup fees, no monthly costs. You only pay for the transfers you book." },
        { q: "What are the agency discount rates?", a: "Partner agencies receive 15-25% discount depending on volume. Rates are negotiable for high-volume partners." },
        { q: "How quickly can I start booking?", a: "Most applications are approved within 24 hours. Once approved, you can start booking immediately." },
        { q: "Do you offer credit terms?", a: "Yes, established partners can request monthly billing. We offer 15-30 day payment terms based on history." },
        { q: "What happens if a flight is delayed?", a: "We track all flights in real-time. Our drivers wait for free if flights are delayed. No extra charges." },
        { q: "Can I white-label your services?", a: "Yes, we offer white-label solutions for enterprise partners. Contact us for custom branding options." },
      ],
      
      ctaTitle: "Ready to Partner with Us?",
      ctaDesc: "Join 500+ travel agencies already growing with Meet Transfer. Apply now and start offering premium transfers to your clients.",
      ctaButton: "Apply for Partnership",
      ctaSecondary: "Contact Us First",
      
      contactTitle: "Contact Our Partnership Team",
      contactEmail: "partners@meettransfer.com",
      contactPhone: "+90 531 763 26 26",
    },
    TR: {
      badge: "B2B Ortaklık",
      title: "Meet Transfer Acenta Ortağı Olun – Seyahat Acentaları İçin B2B Ortaklık",
      h1: "Türkiye Havalimanı Transfer Ortağı – Meet Transfer B2B Ağına Katılın",
      intro: "Türkiye'de güvenilir bir havalimanı transfer ortağı arayan seyahat acentası mısınız? Meet Transfer, dünya genelindeki acentalar için sorunsuz bir B2B ortaklık programı sunuyor. Özel fiyatlar, anlık rezervasyon ve özel destek alın.",
      metaDesc: "Meet Transfer B2B ortağı olun. Seyahat acentaları için en iyi Türkiye transfer ortağı. Özel fiyatlar, anında rezervasyon, 7/24 destek. Bugün acenta ağımıza katılın.",
      keywords: "Türkiye transfer ortağı, B2B havalimanı transfer Türkiye, seyahat acentası ortağı Türkiye, Türkiye yer hizmetleri ortağı, havalimanı transfer toptancı Türkiye, DMC Türkiye ortağı, incoming acenta Türkiye, Meet Transfer ortağı, acenta ortaklığı Türkiye, Türkiye transfer tedarikçisi",
      readTime: "10",
      
      whyPartnerTitle: "Neden Meet Transfer ile Ortak Olmalısınız?",
      whyPartnerDesc: "Türkiye'nin en güvenilir havalimanı transfer ağına katılın ve işinizi güvenle büyütün.",
      
      benefitsTitle: "Ortaklık Avantajları",
      benefits: [
        { icon: "discount", title: "Özel Acenta Fiyatları", desc: "Tüm transferlerde %25'e varan indirim. Acentalar için rekabetçi B2B fiyatlandırması." },
        { icon: "booking", title: "Anlık Rezervasyon Sistemi", desc: "Anında onay ile özel acenta portalı. Bekleme yok, manuel işlem yok." },
        { icon: "support", title: "7/24 Öncelikli Destek", desc: "Özel hesap yöneticisi ve acil istekler için öncelikli WhatsApp hattı." },
        { icon: "payment", title: "Esnek Ödeme Koşulları", desc: "Aylık faturalandırma, yerleşik ortaklar için kredi koşulları. Ön ödeme gerekmez." },
        { icon: "fleet", title: "Premium Mercedes Filosu", desc: "VIP Vito, Sprinter, Maybach, S-Class. Tüm araçlar 2020+ model yılı." },
        { icon: "coverage", title: "Ülke Çapında Kapsama", desc: "İstanbul, Antalya, Bodrum, Kapadokya, İzmir, Dubai, Kıbrıs - ve genişliyor." },
      ],
      
      howItWorksTitle: "Nasıl Ortak Olunur",
      howItWorksSteps: [
        { step: "1", title: "Online Başvuru", desc: "Basit acenta başvuru formunu doldurun. 5 dakikadan az sürer." },
        { step: "2", title: "Onay Alın", desc: "Ekibimiz başvurunuzu 24 saat içinde inceler. Acenta bilgilerinizi doğrularız." },
        { step: "3", title: "Panele Erişin", desc: "Özel acenta girişinizi alın. Özel fiyatlarla hemen rezervasyon yapmaya başlayın." },
        { step: "4", title: "Kazanmaya Başlayın", desc: "Transfer rezervasyonu yapın, komisyon kazanın. Şoförler, araçlar ve müşteri hizmetleriyle biz ilgileniyoruz." },
      ],
      
      whoCanJoinTitle: "Kimler Ortak Ağımıza Katılabilir?",
      whoCanJoin: [
        "Seyahat Acentaları & Tur Operatörleri",
        "Destinasyon Yönetim Şirketleri (DMC)",
        "Online Seyahat Acentaları (OTA)",
        "Kurumsal Seyahat Yöneticileri",
        "Otel Concierge & Misafir İlişkileri",
        "Düğün & Etkinlik Planlayıcıları",
        "MICE Acentaları",
        "Kruvaziyer Kıyı Gezi Operatörleri",
      ],
      
      destinationsTitle: "Hizmet Verdiğimiz Destinasyonlar",
      destinations: [
        { name: "İstanbul", airports: "IST, SAW", hotels: "500+" },
        { name: "Antalya", airports: "AYT", hotels: "300+" },
        { name: "Bodrum", airports: "BJV", hotels: "200+" },
        { name: "Kapadokya", airports: "ASR, NAV", hotels: "150+" },
        { name: "İzmir", airports: "ADB", hotels: "100+" },
        { name: "Dalaman", airports: "DLM", hotels: "200+" },
        { name: "Dubai", airports: "DXB, DWC", hotels: "400+" },
        { name: "Kıbrıs", airports: "ECN, LCA", hotels: "200+" },
      ],
      
      statsTitle: "Başarı Geçmişimiz",
      stats: [
        { value: "50.000+", label: "Tamamlanan Transfer" },
        { value: "4.7★", label: "Google Puanı" },
        { value: "500+", label: "Ortak Acenta" },
        { value: "%99,8", label: "Zamanında Varış" },
      ],
      
      testimonialsTitle: "Ortak Acentalar Ne Diyor",
      testimonials: [
        { name: "TravelWorld Germany", quote: "Meet Transfer, Türkiye transferleri için başvurduğumuz ortak. Güvenilir, profesyonel ve B2B fiyatları rakipsiz.", country: "Almanya" },
        { name: "Euro Tours UK", quote: "Acenta panosu inanılmaz kullanışlı. Misafirlerimiz sürekli hizmet kalitesini övüyor.", country: "İngiltere" },
        { name: "Voyage Plus France", quote: "Mükemmel iletişim ve esneklik. Son dakika rezervasyonlarında bile bizi hiç yarı yolda bırakmadılar.", country: "Fransa" },
      ],
      
      faqTitle: "Sıkça Sorulan Sorular",
      faqs: [
        { q: "Ortak olmak ne kadar tutar?", a: "Ortaklık tamamen ücretsiz. Kurulum ücreti yok, aylık maliyet yok. Sadece rezerve ettiğiniz transferler için ödeme yaparsınız." },
        { q: "Acenta indirim oranları nedir?", a: "Ortak acentalar hacme göre %15-25 indirim alır. Yüksek hacimli ortaklar için fiyatlar müzakere edilebilir." },
        { q: "Ne kadar çabuk rezervasyon yapmaya başlayabilirim?", a: "Çoğu başvuru 24 saat içinde onaylanır. Onaylandıktan sonra hemen rezervasyon yapmaya başlayabilirsiniz." },
        { q: "Kredi koşulları sunuyor musunuz?", a: "Evet, yerleşik ortaklar aylık faturalandırma talep edebilir. Geçmişe göre 15-30 gün ödeme koşulları sunuyoruz." },
        { q: "Uçuş rötar yaparsa ne olur?", a: "Tüm uçuşları gerçek zamanlı takip ediyoruz. Uçuş rötar yaparsa şoförlerimiz ücretsiz bekler. Ekstra ücret yok." },
        { q: "Hizmetlerinizi white-label yapabilir miyim?", a: "Evet, kurumsal ortaklar için white-label çözümler sunuyoruz. Özel markalama seçenekleri için bize ulaşın." },
      ],
      
      ctaTitle: "Bizimle Ortak Olmaya Hazır mısınız?",
      ctaDesc: "Meet Transfer ile büyüyen 500+ seyahat acentasına katılın. Şimdi başvurun ve müşterilerinize premium transferler sunmaya başlayın.",
      ctaButton: "Ortaklık Başvurusu Yap",
      ctaSecondary: "Önce Bize Ulaşın",
      
      contactTitle: "Ortaklık Ekibimizle İletişim",
      contactEmail: "partners@meettransfer.com",
      contactPhone: "+90 531 763 26 26",
    },
    DE: {
      badge: "B2B Partnerschaft",
      title: "Werden Sie Meet Transfer Partner – B2B Partnerschaft für Reisebüros",
      h1: "Türkei Flughafentransfer Partner – Treten Sie dem Meet Transfer B2B Netzwerk bei",
      intro: "Sind Sie ein Reisebüro auf der Suche nach einem zuverlässigen Flughafentransfer-Partner in der Türkei? Meet Transfer bietet ein nahtloses B2B-Partnerschaftsprogramm für Agenturen weltweit. Erhalten Sie exklusive Preise, Echtzeit-Buchung und dedizierte Unterstützung.",
      metaDesc: "Werden Sie Meet Transfer B2B Partner. Bester Türkei Flughafentransfer Partner für Reisebüros. Exklusive Preise, sofortige Buchung, 24/7 Support. Treten Sie heute unserem Agenturnetzwerk bei.",
      keywords: "Türkei Transfer Partner, B2B Flughafentransfer Türkei, Reisebüro Partner Türkei, Türkei Bodentransport Partner, Flughafentransfer Großhandel Türkei, DMC Türkei Partner, Incoming Agentur Türkei, Meet Transfer Partner, Agenturpartnerschaft Türkei, Türkei Transfer Anbieter",
      readTime: "10",
      
      whyPartnerTitle: "Warum mit Meet Transfer zusammenarbeiten?",
      whyPartnerDesc: "Treten Sie dem vertrauenswürdigsten Flughafentransfer-Netzwerk der Türkei bei und erweitern Sie Ihr Geschäft mit Zuversicht.",
      
      benefitsTitle: "Partnerschaftsvorteile",
      benefits: [
        { icon: "discount", title: "Exklusive Agenturpreise", desc: "Bis zu 25% Rabatt auf alle Transfers. Wettbewerbsfähige B2B-Preise für Agenturen." },
        { icon: "booking", title: "Echtzeit-Buchungssystem", desc: "Dediziertes Agenturportal mit sofortiger Bestätigung. Kein Warten, keine manuellen Prozesse." },
        { icon: "support", title: "24/7 Prioritäts-Support", desc: "Dedizierter Account Manager und Prioritäts-WhatsApp-Leitung für dringende Anfragen." },
        { icon: "payment", title: "Flexible Zahlungsbedingungen", desc: "Monatliche Abrechnung, Kreditbedingungen für etablierte Partner verfügbar. Keine Vorauszahlung erforderlich." },
        { icon: "fleet", title: "Premium Mercedes Flotte", desc: "VIP Vito, Sprinter, Maybach, S-Klasse. Alle Fahrzeuge ab Modelljahr 2020." },
        { icon: "coverage", title: "Landesweite Abdeckung", desc: "Istanbul, Antalya, Bodrum, Kappadokien, Izmir, Dubai, Zypern - und wachsend." },
      ],
      
      howItWorksTitle: "So werden Sie Partner",
      howItWorksSteps: [
        { step: "1", title: "Online bewerben", desc: "Füllen Sie das einfache Agentur-Bewerbungsformular aus. Dauert weniger als 5 Minuten." },
        { step: "2", title: "Genehmigung erhalten", desc: "Unser Team prüft Ihre Bewerbung innerhalb von 24 Stunden. Wir verifizieren Ihre Agentur-Referenzen." },
        { step: "3", title: "Dashboard-Zugang", desc: "Erhalten Sie Ihr dediziertes Agentur-Login. Beginnen Sie sofort mit exklusiven Preisen zu buchen." },
        { step: "4", title: "Verdienen starten", desc: "Buchen Sie Transfers, verdienen Sie Provisionen. Wir kümmern uns um Fahrer, Fahrzeuge und Kundenservice." },
      ],
      
      whoCanJoinTitle: "Wer kann unserem Partnernetzwerk beitreten?",
      whoCanJoin: [
        "Reisebüros & Reiseveranstalter",
        "Destination Management Companies (DMCs)",
        "Online Reisebüros (OTAs)",
        "Geschäftsreise-Manager",
        "Hotel-Concierges & Gästebetreuung",
        "Hochzeits- & Eventplaner",
        "MICE-Agenturen",
        "Kreuzfahrt-Landausflug-Operatoren",
      ],
      
      destinationsTitle: "Unsere Zielgebiete",
      destinations: [
        { name: "Istanbul", airports: "IST, SAW", hotels: "500+" },
        { name: "Antalya", airports: "AYT", hotels: "300+" },
        { name: "Bodrum", airports: "BJV", hotels: "200+" },
        { name: "Kappadokien", airports: "ASR, NAV", hotels: "150+" },
        { name: "Izmir", airports: "ADB", hotels: "100+" },
        { name: "Dalaman", airports: "DLM", hotels: "200+" },
        { name: "Dubai", airports: "DXB, DWC", hotels: "400+" },
        { name: "Zypern", airports: "ECN, LCA", hotels: "200+" },
      ],
      
      statsTitle: "Unsere Erfolgsbilanz",
      stats: [
        { value: "50.000+", label: "Transfers Durchgeführt" },
        { value: "4,7★", label: "Google-Bewertung" },
        { value: "500+", label: "Partneragenturen" },
        { value: "99,8%", label: "Pünktlichkeitsrate" },
      ],
      
      testimonialsTitle: "Was Partneragenturen sagen",
      testimonials: [
        { name: "TravelWorld Germany", quote: "Meet Transfer ist unser bevorzugter Partner für Türkei-Transfers. Zuverlässig, professionell und ihre B2B-Preise sind unschlagbar.", country: "Deutschland" },
        { name: "Euro Tours UK", quote: "Das Agentur-Dashboard ist unglaublich einfach zu bedienen. Unsere Gäste loben konsequent die Servicequalität.", country: "Vereinigtes Königreich" },
        { name: "Voyage Plus France", quote: "Ausgezeichnete Kommunikation und Flexibilität. Sie haben uns nie im Stich gelassen, selbst bei Last-Minute-Buchungen.", country: "Frankreich" },
      ],
      
      faqTitle: "Häufig gestellte Fragen",
      faqs: [
        { q: "Was kostet es, Partner zu werden?", a: "Die Partnerschaft ist völlig kostenlos. Keine Einrichtungsgebühren, keine monatlichen Kosten. Sie zahlen nur für die Transfers, die Sie buchen." },
        { q: "Wie hoch sind die Agenturrabatte?", a: "Partneragenturen erhalten 15-25% Rabatt je nach Volumen. Die Preise sind für Großkunden verhandelbar." },
        { q: "Wie schnell kann ich mit dem Buchen beginnen?", a: "Die meisten Bewerbungen werden innerhalb von 24 Stunden genehmigt. Nach der Genehmigung können Sie sofort buchen." },
        { q: "Bieten Sie Kreditbedingungen an?", a: "Ja, etablierte Partner können eine monatliche Abrechnung anfordern. Wir bieten 15-30 Tage Zahlungsziele basierend auf der Historie." },
        { q: "Was passiert bei Flugverspätung?", a: "Wir verfolgen alle Flüge in Echtzeit. Unsere Fahrer warten kostenlos bei Verspätungen. Keine Zusatzkosten." },
        { q: "Kann ich Ihre Dienste unter eigenem Label anbieten?", a: "Ja, wir bieten White-Label-Lösungen für Unternehmenspartner. Kontaktieren Sie uns für individuelle Branding-Optionen." },
      ],
      
      ctaTitle: "Bereit, mit uns zusammenzuarbeiten?",
      ctaDesc: "Schließen Sie sich über 500 Reisebüros an, die bereits mit Meet Transfer wachsen. Bewerben Sie sich jetzt und bieten Sie Ihren Kunden Premium-Transfers an.",
      ctaButton: "Partnerschaft beantragen",
      ctaSecondary: "Erst kontaktieren",
      
      contactTitle: "Kontaktieren Sie unser Partnerschaftsteam",
      contactEmail: "partners@meettransfer.com",
      contactPhone: "+90 531 763 26 26",
    },
    RU: {
      badge: "B2B Партнерство",
      title: "Станьте партнером Meet Transfer – B2B партнерство для туристических агентств",
      h1: "Партнер по трансферу из аэропортов Турции – Присоединяйтесь к сети B2B Meet Transfer",
      intro: "Вы туристическое агентство, ищущее надежного партнера по трансферу из аэропортов в Турции? Meet Transfer предлагает удобную программу B2B-партнерства для агентств по всему миру. Получите эксклюзивные цены, бронирование в реальном времени и персональную поддержку.",
      metaDesc: "Станьте B2B партнером Meet Transfer. Лучший партнер по трансферу из аэропортов Турции для турагентств. Эксклюзивные цены, мгновенное бронирование, поддержка 24/7. Присоединяйтесь к нашей агентской сети.",
      keywords: "партнер по трансферу Турция, B2B трансфер аэропорт Турция, партнер турагентства Турция, партнер наземный транспорт Турция, оптовый трансфер аэропорт Турция, DMC Турция партнер, инкаминг агентство Турция, Meet Transfer партнер, агентское партнерство Турция, поставщик трансферов Турция",
      readTime: "10",
      
      whyPartnerTitle: "Почему стоит стать партнером Meet Transfer?",
      whyPartnerDesc: "Присоединяйтесь к самой надежной сети трансферов из аэропортов Турции и развивайте свой бизнес с уверенностью.",
      
      benefitsTitle: "Преимущества партнерства",
      benefits: [
        { icon: "discount", title: "Эксклюзивные агентские цены", desc: "Скидка до 25% на все трансферы. Конкурентные B2B цены для агентств." },
        { icon: "booking", title: "Система бронирования в реальном времени", desc: "Персональный агентский портал с мгновенным подтверждением. Без ожидания, без ручных процессов." },
        { icon: "support", title: "Приоритетная поддержка 24/7", desc: "Персональный менеджер и приоритетная линия WhatsApp для срочных запросов." },
        { icon: "payment", title: "Гибкие условия оплаты", desc: "Ежемесячное выставление счетов, кредитные условия для постоянных партнеров. Предоплата не требуется." },
        { icon: "fleet", title: "Премиальный автопарк Mercedes", desc: "VIP Vito, Sprinter, Maybach, S-Class. Все автомобили 2020+ года выпуска." },
        { icon: "coverage", title: "Покрытие по всей стране", desc: "Стамбул, Анталья, Бодрум, Каппадокия, Измир, Дубай, Кипр - и расширяется." },
      ],
      
      howItWorksTitle: "Как стать партнером",
      howItWorksSteps: [
        { step: "1", title: "Подайте заявку онлайн", desc: "Заполните простую форму заявки агентства. Занимает менее 5 минут." },
        { step: "2", title: "Получите одобрение", desc: "Наша команда рассматривает вашу заявку в течение 24 часов. Мы проверяем ваши агентские данные." },
        { step: "3", title: "Доступ к панели", desc: "Получите персональный логин агентства. Начните бронировать сразу по эксклюзивным ценам." },
        { step: "4", title: "Начните зарабатывать", desc: "Бронируйте трансферы, получайте комиссию. Водителями, автомобилями и обслуживанием клиентов занимаемся мы." },
      ],
      
      whoCanJoinTitle: "Кто может присоединиться к нашей партнерской сети?",
      whoCanJoin: [
        "Туристические агентства и туроператоры",
        "Компании по управлению направлениями (DMC)",
        "Онлайн туристические агентства (OTA)",
        "Менеджеры корпоративных поездок",
        "Консьержи отелей и отделы по работе с гостями",
        "Организаторы свадеб и мероприятий",
        "MICE агентства",
        "Операторы береговых экскурсий круизных линий",
      ],
      
      destinationsTitle: "Направления, которые мы охватываем",
      destinations: [
        { name: "Стамбул", airports: "IST, SAW", hotels: "500+" },
        { name: "Анталья", airports: "AYT", hotels: "300+" },
        { name: "Бодрум", airports: "BJV", hotels: "200+" },
        { name: "Каппадокия", airports: "ASR, NAV", hotels: "150+" },
        { name: "Измир", airports: "ADB", hotels: "100+" },
        { name: "Даламан", airports: "DLM", hotels: "200+" },
        { name: "Дубай", airports: "DXB, DWC", hotels: "400+" },
        { name: "Кипр", airports: "ECN, LCA", hotels: "200+" },
      ],
      
      statsTitle: "Наши достижения",
      stats: [
        { value: "50 000+", label: "Выполненных трансферов" },
        { value: "4,7★", label: "Рейтинг Google" },
        { value: "500+", label: "Агентств-партнеров" },
        { value: "99,8%", label: "Пунктуальность" },
      ],
      
      testimonialsTitle: "Что говорят агентства-партнеры",
      testimonials: [
        { name: "TravelWorld Germany", quote: "Meet Transfer - наш основной партнер по трансферам в Турции. Надежные, профессиональные, и их B2B цены непревзойденны.", country: "Германия" },
        { name: "Euro Tours UK", quote: "Панель агентства невероятно проста в использовании. Наши гости постоянно хвалят качество обслуживания.", country: "Великобритания" },
        { name: "Voyage Plus France", quote: "Отличная коммуникация и гибкость. Они никогда нас не подводили, даже с бронированиями в последнюю минуту.", country: "Франция" },
      ],
      
      faqTitle: "Часто задаваемые вопросы",
      faqs: [
        { q: "Сколько стоит стать партнером?", a: "Партнерство полностью бесплатно. Никаких сборов за настройку, никаких ежемесячных расходов. Вы платите только за забронированные трансферы." },
        { q: "Каковы агентские скидки?", a: "Агентства-партнеры получают скидку 15-25% в зависимости от объема. Цены обсуждаются для крупных партнеров." },
        { q: "Как быстро я могу начать бронировать?", a: "Большинство заявок одобряются в течение 24 часов. После одобрения вы можете сразу начать бронировать." },
        { q: "Предоставляете ли вы кредитные условия?", a: "Да, постоянные партнеры могут запросить ежемесячное выставление счетов. Мы предлагаем условия оплаты 15-30 дней на основе истории." },
        { q: "Что происходит при задержке рейса?", a: "Мы отслеживаем все рейсы в реальном времени. Наши водители ждут бесплатно при задержке рейсов. Никаких дополнительных сборов." },
        { q: "Могу ли я использовать ваши услуги под своим брендом?", a: "Да, мы предлагаем white-label решения для корпоративных партнеров. Свяжитесь с нами для индивидуальных опций брендирования." },
      ],
      
      ctaTitle: "Готовы стать нашим партнером?",
      ctaDesc: "Присоединяйтесь к более чем 500 туристическим агентствам, уже растущим с Meet Transfer. Подайте заявку сейчас и начните предлагать своим клиентам премиум-трансферы.",
      ctaButton: "Подать заявку на партнерство",
      ctaSecondary: "Сначала связаться",
      
      contactTitle: "Свяжитесь с нашей командой по партнерству",
      contactEmail: "partners@meettransfer.com",
      contactPhone: "+90 531 763 26 26",
    },
    FR: {
      badge: "Partenariat B2B",
      title: "Devenez Partenaire Meet Transfer – Partenariat B2B pour Agences de Voyages",
      h1: "Partenaire Transfert Aéroport Turquie – Rejoignez le Réseau B2B Meet Transfer",
      intro: "Vous êtes une agence de voyages à la recherche d'un partenaire fiable pour les transferts aéroport en Turquie? Meet Transfer propose un programme de partenariat B2B transparent pour les agences du monde entier. Obtenez des tarifs exclusifs, réservation en temps réel et support dédié.",
      metaDesc: "Devenez partenaire B2B Meet Transfer. Meilleur partenaire transfert aéroport Turquie pour agences de voyages. Tarifs exclusifs, réservation instantanée, support 24/7. Rejoignez notre réseau d'agences.",
      keywords: "partenaire transfert Turquie, B2B transfert aéroport Turquie, partenaire agence voyage Turquie, partenaire transport terrestre Turquie, grossiste transfert aéroport Turquie, DMC Turquie partenaire, agence incoming Turquie, Meet Transfer partenaire, partenariat agence Turquie, fournisseur transfert Turquie",
      readTime: "10",
      
      whyPartnerTitle: "Pourquoi devenir partenaire Meet Transfer?",
      whyPartnerDesc: "Rejoignez le réseau de transfert aéroport le plus fiable de Turquie et développez votre activité en toute confiance.",
      
      benefitsTitle: "Avantages du Partenariat",
      benefits: [
        { icon: "discount", title: "Tarifs Agence Exclusifs", desc: "Jusqu'à 25% de réduction sur tous les transferts. Prix B2B compétitifs pour les agences." },
        { icon: "booking", title: "Système de Réservation en Temps Réel", desc: "Portail agence dédié avec confirmation instantanée. Pas d'attente, pas de processus manuel." },
        { icon: "support", title: "Support Prioritaire 24/7", desc: "Gestionnaire de compte dédié et ligne WhatsApp prioritaire pour les demandes urgentes." },
        { icon: "payment", title: "Conditions de Paiement Flexibles", desc: "Facturation mensuelle, conditions de crédit pour les partenaires établis. Pas d'acompte requis." },
        { icon: "fleet", title: "Flotte Premium Mercedes", desc: "VIP Vito, Sprinter, Maybach, Classe S. Tous les véhicules année 2020+." },
        { icon: "coverage", title: "Couverture Nationale", desc: "Istanbul, Antalya, Bodrum, Cappadoce, Izmir, Dubai, Chypre - et en expansion." },
      ],
      
      howItWorksTitle: "Comment Devenir Partenaire",
      howItWorksSteps: [
        { step: "1", title: "Postuler en Ligne", desc: "Remplissez le simple formulaire de candidature agence. Prend moins de 5 minutes." },
        { step: "2", title: "Obtenir l'Approbation", desc: "Notre équipe examine votre candidature sous 24 heures. Nous vérifions vos références d'agence." },
        { step: "3", title: "Accéder au Tableau de Bord", desc: "Recevez votre accès agence dédié. Commencez à réserver immédiatement avec des tarifs exclusifs." },
        { step: "4", title: "Commencer à Gagner", desc: "Réservez des transferts, gagnez des commissions. Nous gérons chauffeurs, véhicules et service client." },
      ],
      
      whoCanJoinTitle: "Qui Peut Rejoindre Notre Réseau Partenaire?",
      whoCanJoin: [
        "Agences de Voyages & Tour-Opérateurs",
        "Sociétés de Gestion de Destination (DMC)",
        "Agences de Voyages en Ligne (OTA)",
        "Gestionnaires de Voyages d'Affaires",
        "Concierges d'Hôtel & Relations Clients",
        "Organisateurs de Mariages & Événements",
        "Agences MICE",
        "Opérateurs d'Excursions Terrestres Croisières",
      ],
      
      destinationsTitle: "Destinations Couvertes",
      destinations: [
        { name: "Istanbul", airports: "IST, SAW", hotels: "500+" },
        { name: "Antalya", airports: "AYT", hotels: "300+" },
        { name: "Bodrum", airports: "BJV", hotels: "200+" },
        { name: "Cappadoce", airports: "ASR, NAV", hotels: "150+" },
        { name: "Izmir", airports: "ADB", hotels: "100+" },
        { name: "Dalaman", airports: "DLM", hotels: "200+" },
        { name: "Dubaï", airports: "DXB, DWC", hotels: "400+" },
        { name: "Chypre", airports: "ECN, LCA", hotels: "200+" },
      ],
      
      statsTitle: "Notre Bilan",
      stats: [
        { value: "50 000+", label: "Transferts Effectués" },
        { value: "4,7★", label: "Note Google" },
        { value: "500+", label: "Agences Partenaires" },
        { value: "99,8%", label: "Taux de Ponctualité" },
      ],
      
      testimonialsTitle: "Ce que Disent les Agences Partenaires",
      testimonials: [
        { name: "TravelWorld Germany", quote: "Meet Transfer est notre partenaire de référence pour les transferts en Turquie. Fiable, professionnel, et leurs tarifs B2B sont imbattables.", country: "Allemagne" },
        { name: "Euro Tours UK", quote: "Le tableau de bord agence est incroyablement facile à utiliser. Nos clients louent constamment la qualité du service.", country: "Royaume-Uni" },
        { name: "Voyage Plus France", quote: "Excellente communication et flexibilité. Ils ne nous ont jamais laissé tomber, même avec des réservations de dernière minute.", country: "France" },
      ],
      
      faqTitle: "Questions Fréquemment Posées",
      faqs: [
        { q: "Combien coûte le partenariat?", a: "Le partenariat est totalement gratuit. Pas de frais d'installation, pas de coûts mensuels. Vous ne payez que les transferts réservés." },
        { q: "Quelles sont les réductions agence?", a: "Les agences partenaires bénéficient de 15-25% de réduction selon le volume. Les tarifs sont négociables pour les gros volumes." },
        { q: "Quand puis-je commencer à réserver?", a: "La plupart des candidatures sont approuvées sous 24 heures. Une fois approuvé, vous pouvez réserver immédiatement." },
        { q: "Proposez-vous des conditions de crédit?", a: "Oui, les partenaires établis peuvent demander une facturation mensuelle. Nous offrons des délais de paiement de 15-30 jours." },
        { q: "Que se passe-t-il en cas de retard de vol?", a: "Nous suivons tous les vols en temps réel. Nos chauffeurs attendent gratuitement en cas de retard. Pas de frais supplémentaires." },
        { q: "Puis-je utiliser vos services en marque blanche?", a: "Oui, nous proposons des solutions en marque blanche pour les partenaires entreprise. Contactez-nous pour les options de personnalisation." },
      ],
      
      ctaTitle: "Prêt à Devenir Notre Partenaire?",
      ctaDesc: "Rejoignez plus de 500 agences de voyages qui grandissent avec Meet Transfer. Postulez maintenant et commencez à offrir des transferts premium à vos clients.",
      ctaButton: "Demander le Partenariat",
      ctaSecondary: "Nous Contacter d'Abord",
      
      contactTitle: "Contactez Notre Équipe Partenariats",
      contactEmail: "partners@meettransfer.com",
      contactPhone: "+90 531 763 26 26",
    },
  };

  // Get content for current language or fallback to English
  const langKey = language.toUpperCase() as keyof typeof content;
  const c = content[langKey] || content.EN;

  const tocItems = [
    { id: "why-partner", title: c.whyPartnerTitle },
    { id: "benefits", title: c.benefitsTitle },
    { id: "how-it-works", title: c.howItWorksTitle },
    { id: "who-can-join", title: c.whoCanJoinTitle },
    { id: "destinations", title: c.destinationsTitle },
    { id: "stats", title: c.statsTitle },
    { id: "testimonials", title: c.testimonialsTitle },
    { id: "faq", title: c.faqTitle },
  ];

  const faqSchema = c.faqs.map(faq => ({
    question: faq.q,
    answer: faq.a,
  }));

  const iconMap: Record<string, React.ReactNode> = {
    discount: <TrendingUp className="h-6 w-6" />,
    booking: <Zap className="h-6 w-6" />,
    support: <HeadphonesIcon className="h-6 w-6" />,
    payment: <CreditCard className="h-6 w-6" />,
    fleet: <Award className="h-6 w-6" />,
    coverage: <Globe className="h-6 w-6" />,
  };

  return (
    <WebsiteLayout>
      <ReadingProgressBar />
      <SEOHead
        title={c.title}
        description={c.metaDesc}
        keywords={c.keywords}
        canonicalPath="/blog/agency-partnership-b2b-turkey"
        ogImage="https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg"
        ogType="article"
        articlePublishedTime="2025-01-17"
        articleModifiedTime="2025-01-17"
        articleSection="Business"
      />
      <SchemaOrg
        schemas={[
          { type: 'LocalBusiness', includeRating: true },
          {
            type: 'Article',
            headline: c.h1,
            description: c.metaDesc,
            image: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
            datePublished: '2025-01-17',
            dateModified: '2025-01-17',
            author: 'Meet Transfer',
            readingTime: c.readTime,
            wordCount: 2500,
            keywords: c.keywords.split(', '),
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: t("breadcrumbHome"), url: '/' },
              { name: t("breadcrumbBlog"), url: '/blog' },
              { name: c.badge, url: '/blog/agency-partnership-b2b-turkey' },
            ],
          },
          {
            type: 'FAQPage',
            questions: faqSchema
          }
        ]}
      />

      <article className="max-w-4xl mx-auto px-3 sm:px-4 py-8 md:py-12">
        {/* Back to Blog */}
        <Link 
          to={getLocalizedPath("/blog")} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToBlog')}
        </Link>

        {/* Article Header */}
        <header className="mb-8 md:mb-12">
          <Badge variant="secondary" className="mb-3 md:mb-4 bg-primary/10 text-primary">{c.badge}</Badge>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
            {c.h1}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 md:mb-6">
            {c.intro}
          </p>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {formatBlogDate("2025-01-17")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {c.readTime} {t('minRead')}
            </span>
          </div>
        </header>

        {/* Share Buttons */}
        <div className="mb-6">
          <ShareButtons title={c.title} />
        </div>

        {/* Hero Image */}
        <div className="relative rounded-xl overflow-hidden mb-8 md:mb-12 shadow-lg">
          <img 
            src={vitoVipStarlightPurple} 
            alt="Meet Transfer VIP Mercedes Fleet for B2B Partners" 
            className="w-full h-[200px] sm:h-[300px] md:h-[400px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div className="p-4 md:p-6 text-white">
              <p className="text-sm md:text-base font-medium">Premium Mercedes Fleet for Partner Agencies</p>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-8">
          {/* Sidebar - Table of Contents */}
          <aside className="hidden lg:block order-2">
            <div className="sticky top-24">
              <TableOfContents items={tocItems} />
              
              {/* Quick Apply CTA */}
              <Card className="mt-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <Handshake className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{c.ctaButton}</h3>
                  <p className="text-sm text-muted-foreground mb-3">Join 500+ partner agencies</p>
                  <Button asChild className="w-full" size="sm">
                    <a href="https://meettransfer.app/login/agency" target="_blank" rel="noopener noreferrer">
                      {c.ctaButton}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Article Content */}
          <div className="order-1">
            {/* Why Partner Section */}
            <section id="why-partner" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{c.whyPartnerTitle}</h2>
              <p className="text-muted-foreground mb-6">{c.whyPartnerDesc}</p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-green-800 dark:text-green-400">Trusted by 500+ Agencies</h3>
                      <p className="text-sm text-green-700 dark:text-green-500">Partner agencies from 40+ countries trust our service</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Star className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-blue-800 dark:text-blue-400">4.7★ Google Rating</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-500">Consistently rated as Turkey's best transfer service</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">{c.benefitsTitle}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {c.benefits.map((benefit, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {iconMap[benefit.icon]}
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{benefit.title}</h3>
                          <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">{c.howItWorksTitle}</h2>
              <div className="space-y-4">
                {c.howItWorksSteps.map((step, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1 pb-4 border-b border-border last:border-0">
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                      <p className="text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Apply CTA */}
              <div className="mt-6 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl text-center">
                <h3 className="text-xl font-bold mb-2">{c.ctaTitle}</h3>
                <p className="text-muted-foreground mb-4">{c.ctaDesc}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg">
                    <a href="https://meettransfer.app/login/agency" target="_blank" rel="noopener noreferrer">
                      <Handshake className="mr-2 h-5 w-5" />
                      {c.ctaButton}
                    </a>
                  </Button>
                  <Button variant="outline" asChild size="lg">
                    <Link to={getLocalizedPath("/contact")}>
                      <Mail className="mr-2 h-5 w-5" />
                      {c.ctaSecondary}
                    </Link>
                  </Button>
                </div>
              </div>
            </section>

            {/* Who Can Join Section */}
            <section id="who-can-join" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">{c.whoCanJoinTitle}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {c.whoCanJoin.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Destinations Section */}
            <section id="destinations" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">{c.destinationsTitle}</h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {c.destinations.map((dest, index) => (
                  <Card key={index} className="text-center hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-1">{dest.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{dest.airports}</p>
                      <Badge variant="secondary" className="text-xs">{dest.hotels} Hotels</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Stats Section */}
            <section id="stats" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">{c.statsTitle}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {c.stats.map((stat, index) => (
                  <Card key={index} className="text-center bg-gradient-to-br from-primary/5 to-transparent">
                    <CardContent className="p-4">
                      <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">{c.testimonialsTitle}</h2>
              <div className="space-y-4">
                {c.testimonials.map((testimonial, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <p className="italic text-muted-foreground mb-3">"{testimonial.quote}"</p>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{testimonial.name}</span>
                        <span className="text-sm text-muted-foreground">• {testimonial.country}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">{c.faqTitle}</h2>
              <div className="space-y-4">
                {c.faqs.map((faq, index) => (
                  <details key={index} className="group border rounded-lg">
                    <summary className="cursor-pointer p-4 font-semibold hover:bg-muted/50 transition-colors list-none flex items-center justify-between">
                      {faq.q}
                      <span className="ml-2 text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="px-4 pb-4 text-muted-foreground">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* Contact Section */}
            <section className="mb-12">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">{c.contactTitle}</h2>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a 
                      href={`mailto:${c.contactEmail}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Mail className="h-5 w-5" />
                      {c.contactEmail}
                    </a>
                    <a 
                      href={`tel:${c.contactPhone.replace(/\s/g, '')}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Phone className="h-5 w-5" />
                      {c.contactPhone}
                    </a>
                  </div>
                </CardContent>
              </Card>
            </section>

            <BlogCTA />
          </div>
        </div>

        {/* Related Articles */}
        <RelatedArticles currentArticleId="agency-partnership-b2b-turkey" maxArticles={3} />
      </article>

      <Footer />
    </WebsiteLayout>
  );
};

export default AgencyPartnershipGuide;
