import { useLanguage } from "@/contexts/LanguageContext";

type ContactTranslations = {
  // SEO
  seoTitle: string;
  seoDesc: string;
  
  // Page Header
  pageTitle: string;
  pageSubtitle: string;
  
  // Hero Section
  mainTitle: string;
  servingWorldwide: string;
  
  // Quick Contact
  preferredContact: string;
  emailDesc: string;
  
  // Features
  support247: string;
  support247Desc: string;
  instantResponse: string;
  instantResponseDesc: string;
  multiLanguage: string;
  multiLanguageDesc: string;
  
  // Global Offices
  globalOfficesDesc: string;
  headquarters: string;
  whatsappOnly: string;
  
  // CTA
  fastestWay: string;
  instantResponses: string;
};

const translations: Record<string, ContactTranslations> = {
  en: {
    seoTitle: "Contact Us | Meet Transfer - 24/7 Support",
    seoDesc: "Contact Meet Transfer for airport transfers in Turkey. WhatsApp support, email, and phone available 24/7. Quick response guaranteed.",
    pageTitle: "Contact Us",
    pageSubtitle: "We're here to help you 24/7",
    mainTitle: "Get in Touch",
    servingWorldwide: "Serving customers worldwide with premium airport transfer services across Turkey and beyond.",
    preferredContact: "Fastest response time",
    emailDesc: "For detailed inquiries",
    support247: "24/7 Support",
    support247Desc: "Our team is available around the clock to assist you with bookings and inquiries.",
    instantResponse: "Instant Response",
    instantResponseDesc: "Get quick answers to your questions via WhatsApp or email.",
    multiLanguage: "Multi-Language",
    multiLanguageDesc: "We provide support in multiple languages for your convenience.",
    globalOfficesDesc: "Our global presence ensures reliable service wherever you are.",
    headquarters: "Headquarters",
    whatsappOnly: "WhatsApp only",
    fastestWay: "The Fastest Way to Reach Us",
    instantResponses: "Send us a message on WhatsApp and get instant responses from our team. We're available 24/7 to help with your transfer needs.",
  },
  tr: {
    seoTitle: "İletişim | Meet Transfer - 7/24 Destek",
    seoDesc: "Türkiye'de havalimanı transferleri için Meet Transfer ile iletişime geçin. WhatsApp desteği, e-posta ve telefon 7/24 mevcuttur.",
    pageTitle: "İletişim",
    pageSubtitle: "7/24 size yardımcı olmak için buradayız",
    mainTitle: "Bize Ulaşın",
    servingWorldwide: "Türkiye ve ötesinde premium havalimanı transfer hizmetleriyle dünya çapında müşterilere hizmet veriyoruz.",
    preferredContact: "En hızlı yanıt süresi",
    emailDesc: "Detaylı sorular için",
    support247: "7/24 Destek",
    support247Desc: "Ekibimiz rezervasyonlar ve sorularınız için günün her saati hizmetinizdedir.",
    instantResponse: "Anında Yanıt",
    instantResponseDesc: "WhatsApp veya e-posta ile sorularınıza hızlı cevaplar alın.",
    multiLanguage: "Çoklu Dil",
    multiLanguageDesc: "Kolaylığınız için birden fazla dilde destek sağlıyoruz.",
    globalOfficesDesc: "Global varlığımız nerede olursanız olun güvenilir hizmet sağlar.",
    headquarters: "Merkez Ofis",
    whatsappOnly: "Sadece WhatsApp",
    fastestWay: "Bize Ulaşmanın En Hızlı Yolu",
    instantResponses: "WhatsApp'tan bize mesaj gönderin ve ekibimizden anında yanıt alın. Transfer ihtiyaçlarınız için 7/24 hizmetinizdeyiz.",
  },
  de: {
    seoTitle: "Kontakt | Meet Transfer - 24/7 Support",
    seoDesc: "Kontaktieren Sie Meet Transfer für Flughafentransfers in der Türkei. WhatsApp-Support, E-Mail und Telefon rund um die Uhr verfügbar.",
    pageTitle: "Kontakt",
    pageSubtitle: "Wir sind rund um die Uhr für Sie da",
    mainTitle: "Kontaktieren Sie uns",
    servingWorldwide: "Wir bedienen Kunden weltweit mit Premium-Flughafentransfers in der Türkei und darüber hinaus.",
    preferredContact: "Schnellste Reaktionszeit",
    emailDesc: "Für detaillierte Anfragen",
    support247: "24/7 Support",
    support247Desc: "Unser Team steht Ihnen rund um die Uhr für Buchungen und Anfragen zur Verfügung.",
    instantResponse: "Sofortige Antwort",
    instantResponseDesc: "Erhalten Sie schnelle Antworten auf Ihre Fragen per WhatsApp oder E-Mail.",
    multiLanguage: "Mehrsprachig",
    multiLanguageDesc: "Wir bieten Support in mehreren Sprachen für Ihre Bequemlichkeit.",
    globalOfficesDesc: "Unsere globale Präsenz gewährleistet zuverlässigen Service, wo immer Sie sind.",
    headquarters: "Hauptsitz",
    whatsappOnly: "Nur WhatsApp",
    fastestWay: "Der schnellste Weg, uns zu erreichen",
    instantResponses: "Senden Sie uns eine Nachricht auf WhatsApp und erhalten Sie sofortige Antworten von unserem Team. Wir sind rund um die Uhr für Ihre Transferbedürfnisse da.",
  },
  fr: {
    seoTitle: "Contact | Meet Transfer - Support 24/7",
    seoDesc: "Contactez Meet Transfer pour les transferts aéroport en Turquie. Support WhatsApp, email et téléphone disponibles 24/7.",
    pageTitle: "Contact",
    pageSubtitle: "Nous sommes là pour vous aider 24/7",
    mainTitle: "Contactez-nous",
    servingWorldwide: "Nous servons des clients du monde entier avec des services de transfert aéroport premium en Turquie et au-delà.",
    preferredContact: "Temps de réponse le plus rapide",
    emailDesc: "Pour les demandes détaillées",
    support247: "Support 24/7",
    support247Desc: "Notre équipe est disponible 24 heures sur 24 pour vous aider avec les réservations et les demandes.",
    instantResponse: "Réponse instantanée",
    instantResponseDesc: "Obtenez des réponses rapides à vos questions via WhatsApp ou email.",
    multiLanguage: "Multilingue",
    multiLanguageDesc: "Nous offrons un support dans plusieurs langues pour votre commodité.",
    globalOfficesDesc: "Notre présence mondiale garantit un service fiable où que vous soyez.",
    headquarters: "Siège social",
    whatsappOnly: "WhatsApp uniquement",
    fastestWay: "Le moyen le plus rapide de nous joindre",
    instantResponses: "Envoyez-nous un message sur WhatsApp et obtenez des réponses instantanées de notre équipe. Nous sommes disponibles 24/7 pour vos besoins de transfert.",
  },
  ru: {
    seoTitle: "Контакты | Meet Transfer - Поддержка 24/7",
    seoDesc: "Свяжитесь с Meet Transfer для трансферов из аэропорта в Турции. Поддержка WhatsApp, email и телефон доступны 24/7.",
    pageTitle: "Контакты",
    pageSubtitle: "Мы готовы помочь вам 24/7",
    mainTitle: "Свяжитесь с нами",
    servingWorldwide: "Обслуживаем клиентов по всему миру премиальными трансферами из аэропорта в Турции и за её пределами.",
    preferredContact: "Самое быстрое время ответа",
    emailDesc: "Для подробных запросов",
    support247: "Поддержка 24/7",
    support247Desc: "Наша команда доступна круглосуточно для помощи с бронированием и запросами.",
    instantResponse: "Мгновенный ответ",
    instantResponseDesc: "Получайте быстрые ответы на ваши вопросы через WhatsApp или email.",
    multiLanguage: "Многоязычность",
    multiLanguageDesc: "Мы предоставляем поддержку на нескольких языках для вашего удобства.",
    globalOfficesDesc: "Наше глобальное присутствие обеспечивает надёжный сервис, где бы вы ни находились.",
    headquarters: "Главный офис",
    whatsappOnly: "Только WhatsApp",
    fastestWay: "Самый быстрый способ связаться с нами",
    instantResponses: "Отправьте нам сообщение в WhatsApp и получите мгновенные ответы от нашей команды. Мы доступны 24/7 для помощи с трансферами.",
  },
  it: {
    seoTitle: "Contatti | Meet Transfer - Supporto 24/7",
    seoDesc: "Contatta Meet Transfer per i trasferimenti aeroportuali in Turchia. Supporto WhatsApp, email e telefono disponibili 24/7.",
    pageTitle: "Contatti",
    pageSubtitle: "Siamo qui per aiutarti 24/7",
    mainTitle: "Contattaci",
    servingWorldwide: "Serviamo clienti in tutto il mondo con servizi di trasferimento aeroportuale premium in Turchia e oltre.",
    preferredContact: "Tempo di risposta più veloce",
    emailDesc: "Per richieste dettagliate",
    support247: "Supporto 24/7",
    support247Desc: "Il nostro team è disponibile 24 ore su 24 per assisterti con prenotazioni e richieste.",
    instantResponse: "Risposta istantanea",
    instantResponseDesc: "Ottieni risposte rapide alle tue domande tramite WhatsApp o email.",
    multiLanguage: "Multilingue",
    multiLanguageDesc: "Forniamo supporto in più lingue per la tua comodità.",
    globalOfficesDesc: "La nostra presenza globale garantisce un servizio affidabile ovunque tu sia.",
    headquarters: "Sede centrale",
    whatsappOnly: "Solo WhatsApp",
    fastestWay: "Il modo più veloce per raggiungerci",
    instantResponses: "Inviaci un messaggio su WhatsApp e ottieni risposte immediate dal nostro team. Siamo disponibili 24/7 per le tue esigenze di trasferimento.",
  },
  es: {
    seoTitle: "Contacto | Meet Transfer - Soporte 24/7",
    seoDesc: "Contacta con Meet Transfer para traslados de aeropuerto en Turquía. Soporte WhatsApp, email y teléfono disponibles 24/7.",
    pageTitle: "Contacto",
    pageSubtitle: "Estamos aquí para ayudarte 24/7",
    mainTitle: "Contáctanos",
    servingWorldwide: "Servimos a clientes en todo el mundo con servicios premium de traslado de aeropuerto en Turquía y más allá.",
    preferredContact: "Tiempo de respuesta más rápido",
    emailDesc: "Para consultas detalladas",
    support247: "Soporte 24/7",
    support247Desc: "Nuestro equipo está disponible las 24 horas para ayudarte con reservas y consultas.",
    instantResponse: "Respuesta instantánea",
    instantResponseDesc: "Obtén respuestas rápidas a tus preguntas a través de WhatsApp o email.",
    multiLanguage: "Multilingüe",
    multiLanguageDesc: "Proporcionamos soporte en varios idiomas para tu comodidad.",
    globalOfficesDesc: "Nuestra presencia global garantiza un servicio confiable dondequiera que estés.",
    headquarters: "Sede central",
    whatsappOnly: "Solo WhatsApp",
    fastestWay: "La forma más rápida de contactarnos",
    instantResponses: "Envíanos un mensaje en WhatsApp y obtén respuestas instantáneas de nuestro equipo. Estamos disponibles 24/7 para tus necesidades de traslado.",
  },
  ar: {
    seoTitle: "اتصل بنا | Meet Transfer - دعم على مدار الساعة",
    seoDesc: "تواصل مع Meet Transfer لخدمات النقل من المطار في تركيا. دعم واتساب والبريد الإلكتروني والهاتف متاح على مدار الساعة.",
    pageTitle: "اتصل بنا",
    pageSubtitle: "نحن هنا لمساعدتك على مدار الساعة",
    mainTitle: "تواصل معنا",
    servingWorldwide: "نخدم العملاء في جميع أنحاء العالم بخدمات نقل مطار متميزة في تركيا وخارجها.",
    preferredContact: "أسرع وقت استجابة",
    emailDesc: "للاستفسارات التفصيلية",
    support247: "دعم على مدار الساعة",
    support247Desc: "فريقنا متاح على مدار الساعة لمساعدتك في الحجوزات والاستفسارات.",
    instantResponse: "استجابة فورية",
    instantResponseDesc: "احصل على إجابات سريعة لأسئلتك عبر واتساب أو البريد الإلكتروني.",
    multiLanguage: "متعدد اللغات",
    multiLanguageDesc: "نقدم الدعم بعدة لغات لراحتك.",
    globalOfficesDesc: "تواجدنا العالمي يضمن خدمة موثوقة أينما كنت.",
    headquarters: "المقر الرئيسي",
    whatsappOnly: "واتساب فقط",
    fastestWay: "أسرع طريقة للتواصل معنا",
    instantResponses: "أرسل لنا رسالة على واتساب واحصل على ردود فورية من فريقنا. نحن متاحون على مدار الساعة لاحتياجات النقل الخاصة بك.",
  },
  uk: {
    seoTitle: "Контакти | Meet Transfer - Підтримка 24/7",
    seoDesc: "Зв'яжіться з Meet Transfer для трансферів з аеропорту в Туреччині. Підтримка WhatsApp, email та телефон доступні 24/7.",
    pageTitle: "Контакти",
    pageSubtitle: "Ми тут, щоб допомогти вам 24/7",
    mainTitle: "Зв'яжіться з нами",
    servingWorldwide: "Обслуговуємо клієнтів по всьому світу преміальними трансферами з аеропорту в Туреччині та за її межами.",
    preferredContact: "Найшвидший час відповіді",
    emailDesc: "Для детальних запитів",
    support247: "Підтримка 24/7",
    support247Desc: "Наша команда доступна цілодобово для допомоги з бронюванням та запитами.",
    instantResponse: "Миттєва відповідь",
    instantResponseDesc: "Отримуйте швидкі відповіді на ваші запитання через WhatsApp або email.",
    multiLanguage: "Багатомовність",
    multiLanguageDesc: "Ми надаємо підтримку кількома мовами для вашої зручності.",
    globalOfficesDesc: "Наша глобальна присутність забезпечує надійний сервіс, де б ви не були.",
    headquarters: "Головний офіс",
    whatsappOnly: "Тільки WhatsApp",
    fastestWay: "Найшвидший спосіб зв'язатися з нами",
    instantResponses: "Надішліть нам повідомлення в WhatsApp і отримайте миттєві відповіді від нашої команди. Ми доступні 24/7 для допомоги з трансферами.",
  },
  ja: {
    seoTitle: "お問い合わせ | Meet Transfer - 24時間サポート",
    seoDesc: "トルコの空港送迎についてMeet Transferにお問い合わせください。WhatsApp、メール、電話サポートは24時間対応。",
    pageTitle: "お問い合わせ",
    pageSubtitle: "24時間年中無休でサポートいたします",
    mainTitle: "お問い合わせ",
    servingWorldwide: "トルコおよび世界各地でプレミアム空港送迎サービスを提供しています。",
    preferredContact: "最速の応答時間",
    emailDesc: "詳細なお問い合わせ用",
    support247: "24時間サポート",
    support247Desc: "予約やお問い合わせについて、24時間体制でサポートいたします。",
    instantResponse: "即時対応",
    instantResponseDesc: "WhatsAppまたはメールでご質問に迅速にお答えします。",
    multiLanguage: "多言語対応",
    multiLanguageDesc: "お客様の便宜のため、複数の言語でサポートを提供しています。",
    globalOfficesDesc: "グローバルな拠点により、どこにいても信頼できるサービスを保証します。",
    headquarters: "本社",
    whatsappOnly: "WhatsAppのみ",
    fastestWay: "最速のお問い合わせ方法",
    instantResponses: "WhatsAppでメッセージを送信すると、チームから即座に返信が届きます。送迎のご要望に24時間対応いたします。",
  },
};

export const useContactTranslations = () => {
  const { language } = useLanguage();
  return translations[language] || translations.en;
};
