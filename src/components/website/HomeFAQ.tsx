import { useRef, useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePromo } from "@/contexts/PromoContext";
import { HelpCircle, MessageCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Complete translations for FAQ section
const faqTranslations: Record<string, {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  cta: string;
  ctaDesc: string;
  contactButton: string;
  faqs: Array<{ question: string; answer: string }>;
}> = {
  EN: {
    badge: "Got Questions?",
    title: "Frequently Asked",
    titleHighlight: "Questions",
    subtitle: "Find answers to the most common questions about our transfer services",
    cta: "Still have questions?",
    ctaDesc: "Our team is here to help you 24/7",
    contactButton: "Contact Us",
    faqs: [
      {
        question: "How do I book a transfer?",
        answer: "Booking is easy! You can book online through our website, via WhatsApp, or by calling our 24/7 support line. Simply enter your pickup and drop-off locations, select your vehicle, and confirm your booking. You'll receive instant confirmation with all the details.",
      },
      {
        question: "What happens if my flight is delayed?",
        answer: "Don't worry! We track all flights in real-time. If your flight is delayed, we automatically adjust your pickup time at no extra cost. Your driver will be there when you land, no matter what time that is.",
      },
      {
        question: "Can I cancel or modify my booking?",
        answer: "Yes, you can cancel or modify your booking for free up to 24 hours before your scheduled pickup time. Simply contact our support team via WhatsApp, email, or phone to make changes.",
      },
      {
        question: "What is included in the price?",
        answer: "Our prices are all-inclusive with no hidden fees. This includes: meet & greet service, 60 minutes free waiting time for airport pickups, luggage assistance, child seats on request, and free WiFi in all vehicles.",
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, debit cards, and cash payments. You can pay online during booking or pay the driver directly in cash. Corporate accounts with monthly invoicing are also available.",
      },
      {
        question: "Are child seats available?",
        answer: "Yes! We provide child seats (infant, toddler, and booster) free of charge. Simply request the type of seat you need during the booking process, and we'll have it ready in your vehicle.",
      },
    ],
  },
  TR: {
    badge: "Sorularınız mı Var?",
    title: "Sıkça Sorulan",
    titleHighlight: "Sorular",
    subtitle: "Transfer hizmetlerimiz hakkında en çok sorulan soruların cevaplarını bulun",
    cta: "Hala sorularınız mı var?",
    ctaDesc: "Ekibimiz 7/24 size yardımcı olmak için burada",
    contactButton: "Bize Ulaşın",
    faqs: [
      {
        question: "Nasıl transfer rezervasyonu yapabilirim?",
        answer: "Rezervasyon yapmak çok kolay! Web sitemizden online olarak, WhatsApp üzerinden veya 7/24 destek hattımızı arayarak rezervasyon yapabilirsiniz. Alış ve bırakış noktalarınızı girin, aracınızı seçin ve rezervasyonunuzu onaylayın. Tüm detaylarla birlikte anında onay alacaksınız.",
      },
      {
        question: "Uçuşum gecikirse ne olur?",
        answer: "Endişelenmeyin! Tüm uçuşları gerçek zamanlı takip ediyoruz. Uçuşunuz gecikirse, alış saatinizi ekstra ücret olmadan otomatik olarak ayarlıyoruz. Sürücünüz, ne zaman inerseniz inin orada olacak.",
      },
      {
        question: "Rezervasyonumu iptal edebilir veya değiştirebilir miyim?",
        answer: "Evet, planlanan alış saatinizden 24 saat öncesine kadar rezervasyonunuzu ücretsiz olarak iptal edebilir veya değiştirebilirsiniz. Değişiklik yapmak için WhatsApp, e-posta veya telefon ile destek ekibimizle iletişime geçmeniz yeterli.",
      },
      {
        question: "Fiyata neler dahil?",
        answer: "Fiyatlarımız gizli ücret olmadan her şey dahil. Buna şunlar dahildir: karşılama hizmeti, havalimanı alışları için 60 dakika ücretsiz bekleme süresi, bagaj yardımı, talep üzerine çocuk koltukları ve tüm araçlarda ücretsiz WiFi.",
      },
      {
        question: "Hangi ödeme yöntemlerini kabul ediyorsunuz?",
        answer: "Tüm büyük kredi kartları, banka kartları ve nakit ödemeleri kabul ediyoruz. Rezervasyon sırasında online ödeme yapabilir veya doğrudan sürücüye nakit ödeme yapabilirsiniz. Aylık faturalama ile kurumsal hesaplar da mevcuttur.",
      },
      {
        question: "Çocuk koltuğu mevcut mu?",
        answer: "Evet! Bebek, küçük çocuk ve yükseltici koltukları ücretsiz olarak sağlıyoruz. Rezervasyon sürecinde ihtiyacınız olan koltuk tipini belirtmeniz yeterli, aracınızda hazır olacaktır.",
      },
    ],
  },
  DE: {
    badge: "Haben Sie Fragen?",
    title: "Häufig Gestellte",
    titleHighlight: "Fragen",
    subtitle: "Finden Sie Antworten auf die häufigsten Fragen zu unseren Transferdiensten",
    cta: "Noch Fragen?",
    ctaDesc: "Unser Team hilft Ihnen rund um die Uhr",
    contactButton: "Kontaktieren Sie uns",
    faqs: [
      {
        question: "Wie buche ich einen Transfer?",
        answer: "Buchen ist einfach! Sie können online über unsere Website, per WhatsApp oder über unsere 24/7-Hotline buchen. Geben Sie einfach Ihre Abhol- und Zielorte ein, wählen Sie Ihr Fahrzeug und bestätigen Sie Ihre Buchung. Sie erhalten sofort eine Bestätigung mit allen Details.",
      },
      {
        question: "Was passiert, wenn mein Flug Verspätung hat?",
        answer: "Keine Sorge! Wir verfolgen alle Flüge in Echtzeit. Bei Verspätungen passen wir Ihre Abholzeit automatisch und ohne Aufpreis an. Ihr Fahrer wird da sein, wenn Sie landen.",
      },
      {
        question: "Kann ich meine Buchung stornieren oder ändern?",
        answer: "Ja, Sie können Ihre Buchung bis zu 24 Stunden vor der geplanten Abholzeit kostenlos stornieren oder ändern. Kontaktieren Sie einfach unser Support-Team per WhatsApp, E-Mail oder Telefon.",
      },
      {
        question: "Was ist im Preis enthalten?",
        answer: "Unsere Preise sind all-inclusive ohne versteckte Gebühren. Enthalten sind: Begrüßungsservice, 60 Minuten kostenlose Wartezeit bei Flughafenabholungen, Gepäckhilfe, Kindersitze auf Anfrage und kostenloses WLAN in allen Fahrzeugen.",
      },
      {
        question: "Welche Zahlungsmethoden akzeptieren Sie?",
        answer: "Wir akzeptieren alle gängigen Kredit- und Debitkarten sowie Barzahlung. Sie können online bei der Buchung oder direkt beim Fahrer bar bezahlen. Firmenkunden können auch monatliche Rechnungen erhalten.",
      },
      {
        question: "Sind Kindersitze verfügbar?",
        answer: "Ja! Wir stellen Kindersitze (Baby, Kleinkind und Sitzerhöhung) kostenlos zur Verfügung. Geben Sie bei der Buchung einfach an, welchen Sitz Sie benötigen, und er wird in Ihrem Fahrzeug bereitstehen.",
      },
    ],
  },
  FR: {
    badge: "Des Questions?",
    title: "Questions",
    titleHighlight: "Fréquentes",
    subtitle: "Trouvez les réponses aux questions les plus courantes sur nos services de transfert",
    cta: "Encore des questions?",
    ctaDesc: "Notre équipe est là pour vous aider 24h/24",
    contactButton: "Contactez-nous",
    faqs: [
      {
        question: "Comment réserver un transfert?",
        answer: "La réservation est simple! Vous pouvez réserver en ligne via notre site web, par WhatsApp ou en appelant notre ligne d'assistance 24h/24. Entrez simplement vos lieux de prise en charge et de destination, sélectionnez votre véhicule et confirmez. Vous recevrez une confirmation instantanée avec tous les détails.",
      },
      {
        question: "Que se passe-t-il si mon vol est retardé?",
        answer: "Ne vous inquiétez pas! Nous suivons tous les vols en temps réel. Si votre vol est retardé, nous ajustons automatiquement votre heure de prise en charge sans frais supplémentaires. Votre chauffeur sera là quand vous atterrirez.",
      },
      {
        question: "Puis-je annuler ou modifier ma réservation?",
        answer: "Oui, vous pouvez annuler ou modifier gratuitement jusqu'à 24 heures avant l'heure de prise en charge prévue. Contactez simplement notre équipe d'assistance via WhatsApp, e-mail ou téléphone.",
      },
      {
        question: "Qu'est-ce qui est inclus dans le prix?",
        answer: "Nos prix sont tout compris sans frais cachés. Cela inclut: service d'accueil, 60 minutes d'attente gratuite pour les transferts aéroport, assistance bagages, sièges enfants sur demande et WiFi gratuit dans tous les véhicules.",
      },
      {
        question: "Quels modes de paiement acceptez-vous?",
        answer: "Nous acceptons toutes les principales cartes de crédit, cartes de débit et paiements en espèces. Vous pouvez payer en ligne lors de la réservation ou directement au chauffeur en espèces. Les comptes professionnels avec facturation mensuelle sont également disponibles.",
      },
      {
        question: "Des sièges enfants sont-ils disponibles?",
        answer: "Oui! Nous fournissons des sièges enfants (bébé, bambin et rehausseur) gratuitement. Indiquez simplement le type de siège dont vous avez besoin lors de la réservation, et il sera prêt dans votre véhicule.",
      },
    ],
  },
  RU: {
    badge: "Есть Вопросы?",
    title: "Часто Задаваемые",
    titleHighlight: "Вопросы",
    subtitle: "Найдите ответы на самые распространенные вопросы о наших трансферных услугах",
    cta: "Остались вопросы?",
    ctaDesc: "Наша команда готова помочь вам 24/7",
    contactButton: "Связаться с нами",
    faqs: [
      {
        question: "Как забронировать трансфер?",
        answer: "Бронирование простое! Вы можете забронировать онлайн через наш сайт, через WhatsApp или позвонив на нашу линию поддержки 24/7. Просто введите места посадки и высадки, выберите автомобиль и подтвердите бронирование. Вы получите мгновенное подтверждение со всеми деталями.",
      },
      {
        question: "Что произойдет, если мой рейс задержится?",
        answer: "Не волнуйтесь! Мы отслеживаем все рейсы в реальном времени. Если ваш рейс задержится, мы автоматически скорректируем время встречи без дополнительной платы. Ваш водитель будет ждать вас, когда вы приземлитесь.",
      },
      {
        question: "Могу ли я отменить или изменить бронирование?",
        answer: "Да, вы можете бесплатно отменить или изменить бронирование за 24 часа до запланированного времени встречи. Просто свяжитесь с нашей службой поддержки через WhatsApp, электронную почту или телефон.",
      },
      {
        question: "Что включено в стоимость?",
        answer: "Наши цены включают всё без скрытых платежей. В стоимость входит: встреча с табличкой, 60 минут бесплатного ожидания для аэропортовых трансферов, помощь с багажом, детские кресла по запросу и бесплатный WiFi во всех автомобилях.",
      },
      {
        question: "Какие способы оплаты вы принимаете?",
        answer: "Мы принимаем все основные кредитные и дебетовые карты, а также наличные. Вы можете оплатить онлайн при бронировании или наличными водителю. Корпоративные счета с ежемесячной оплатой также доступны.",
      },
      {
        question: "Доступны ли детские кресла?",
        answer: "Да! Мы предоставляем детские кресла (для младенцев, малышей и бустеры) бесплатно. Просто укажите тип кресла при бронировании, и оно будет готово в вашем автомобиле.",
      },
    ],
  },
  IT: {
    badge: "Hai Domande?",
    title: "Domande",
    titleHighlight: "Frequenti",
    subtitle: "Trova le risposte alle domande più comuni sui nostri servizi di trasferimento",
    cta: "Altre domande?",
    ctaDesc: "Il nostro team è qui per aiutarti 24/7",
    contactButton: "Contattaci",
    faqs: [
      {
        question: "Come prenoto un trasferimento?",
        answer: "Prenotare è facile! Puoi prenotare online tramite il nostro sito web, via WhatsApp o chiamando la nostra linea di supporto 24/7. Inserisci semplicemente i luoghi di ritiro e consegna, seleziona il veicolo e conferma la prenotazione. Riceverai una conferma immediata con tutti i dettagli.",
      },
      {
        question: "Cosa succede se il mio volo è in ritardo?",
        answer: "Non preoccuparti! Monitoriamo tutti i voli in tempo reale. Se il tuo volo è in ritardo, regoliamo automaticamente l'orario di ritiro senza costi aggiuntivi. Il tuo autista sarà lì quando atterrerai.",
      },
      {
        question: "Posso cancellare o modificare la mia prenotazione?",
        answer: "Sì, puoi cancellare o modificare gratuitamente fino a 24 ore prima dell'orario di ritiro previsto. Contatta semplicemente il nostro team di supporto via WhatsApp, email o telefono.",
      },
      {
        question: "Cosa è incluso nel prezzo?",
        answer: "I nostri prezzi sono tutto incluso senza costi nascosti. Questo include: servizio di accoglienza, 60 minuti di attesa gratuita per i ritiri in aeroporto, assistenza bagagli, seggiolini per bambini su richiesta e WiFi gratuito in tutti i veicoli.",
      },
      {
        question: "Quali metodi di pagamento accettate?",
        answer: "Accettiamo tutte le principali carte di credito, carte di debito e pagamenti in contanti. Puoi pagare online durante la prenotazione o direttamente all'autista in contanti. Sono disponibili anche account aziendali con fatturazione mensile.",
      },
      {
        question: "Sono disponibili seggiolini per bambini?",
        answer: "Sì! Forniamo seggiolini (neonato, bambino e rialzo) gratuitamente. Basta indicare il tipo di seggiolino necessario durante la prenotazione e sarà pronto nel veicolo.",
      },
    ],
  },
  ES: {
    badge: "¿Tiene Preguntas?",
    title: "Preguntas",
    titleHighlight: "Frecuentes",
    subtitle: "Encuentre respuestas a las preguntas más comunes sobre nuestros servicios de traslado",
    cta: "¿Aún tiene preguntas?",
    ctaDesc: "Nuestro equipo está aquí para ayudarle 24/7",
    contactButton: "Contáctenos",
    faqs: [
      {
        question: "¿Cómo reservo un traslado?",
        answer: "¡Reservar es fácil! Puede reservar en línea a través de nuestro sitio web, por WhatsApp o llamando a nuestra línea de soporte 24/7. Simplemente ingrese los lugares de recogida y destino, seleccione su vehículo y confirme su reserva. Recibirá confirmación instantánea con todos los detalles.",
      },
      {
        question: "¿Qué pasa si mi vuelo se retrasa?",
        answer: "¡No se preocupe! Monitoreamos todos los vuelos en tiempo real. Si su vuelo se retrasa, ajustamos automáticamente la hora de recogida sin costo adicional. Su conductor estará allí cuando aterrice.",
      },
      {
        question: "¿Puedo cancelar o modificar mi reserva?",
        answer: "Sí, puede cancelar o modificar su reserva gratis hasta 24 horas antes de la hora de recogida programada. Simplemente contacte a nuestro equipo de soporte por WhatsApp, correo electrónico o teléfono.",
      },
      {
        question: "¿Qué está incluido en el precio?",
        answer: "Nuestros precios son todo incluido sin cargos ocultos. Esto incluye: servicio de bienvenida, 60 minutos de espera gratis para recogidas en aeropuerto, asistencia con equipaje, sillas para niños bajo petición y WiFi gratis en todos los vehículos.",
      },
      {
        question: "¿Qué métodos de pago aceptan?",
        answer: "Aceptamos todas las principales tarjetas de crédito, tarjetas de débito y pagos en efectivo. Puede pagar en línea durante la reserva o directamente al conductor en efectivo. También están disponibles cuentas corporativas con facturación mensual.",
      },
      {
        question: "¿Hay sillas para niños disponibles?",
        answer: "¡Sí! Proporcionamos sillas para niños (bebé, niño pequeño y elevador) sin cargo. Simplemente indique el tipo de silla que necesita durante la reserva y estará lista en su vehículo.",
      },
    ],
  },
  AR: {
    badge: "لديك أسئلة؟",
    title: "الأسئلة",
    titleHighlight: "الشائعة",
    subtitle: "اعثر على إجابات للأسئلة الأكثر شيوعًا حول خدمات النقل لدينا",
    cta: "لا تزال لديك أسئلة؟",
    ctaDesc: "فريقنا هنا لمساعدتك على مدار الساعة",
    contactButton: "اتصل بنا",
    faqs: [
      {
        question: "كيف أحجز نقل؟",
        answer: "الحجز سهل! يمكنك الحجز عبر الإنترنت من خلال موقعنا أو عبر واتساب أو بالاتصال بخط الدعم على مدار الساعة. أدخل مواقع الاستلام والتوصيل، اختر مركبتك وأكد حجزك. ستتلقى تأكيدًا فوريًا مع جميع التفاصيل.",
      },
      {
        question: "ماذا يحدث إذا تأخرت رحلتي؟",
        answer: "لا تقلق! نتتبع جميع الرحلات في الوقت الفعلي. إذا تأخرت رحلتك، نقوم بتعديل وقت الاستلام تلقائيًا بدون تكلفة إضافية. سيكون سائقك في انتظارك عند هبوطك.",
      },
      {
        question: "هل يمكنني إلغاء أو تعديل حجزي؟",
        answer: "نعم، يمكنك إلغاء أو تعديل حجزك مجانًا حتى 24 ساعة قبل وقت الاستلام المحدد. ما عليك سوى الاتصال بفريق الدعم عبر واتساب أو البريد الإلكتروني أو الهاتف.",
      },
      {
        question: "ما الذي يشمله السعر؟",
        answer: "أسعارنا شاملة بدون رسوم خفية. يشمل ذلك: خدمة الاستقبال، 60 دقيقة انتظار مجاني لاستقبال المطار، المساعدة في الأمتعة، مقاعد الأطفال عند الطلب، وواي فاي مجاني في جميع المركبات.",
      },
      {
        question: "ما طرق الدفع التي تقبلونها؟",
        answer: "نقبل جميع بطاقات الائتمان والخصم الرئيسية والمدفوعات النقدية. يمكنك الدفع عبر الإنترنت أثناء الحجز أو الدفع للسائق نقدًا مباشرة. حسابات الشركات مع الفواتير الشهرية متاحة أيضًا.",
      },
      {
        question: "هل تتوفر مقاعد الأطفال؟",
        answer: "نعم! نوفر مقاعد الأطفال (الرضع والصغار والمعززة) مجانًا. فقط حدد نوع المقعد الذي تحتاجه أثناء الحجز وسيكون جاهزًا في مركبتك.",
      },
    ],
  },
  UK: {
    badge: "Маєте Запитання?",
    title: "Часті",
    titleHighlight: "Запитання",
    subtitle: "Знайдіть відповіді на найпоширеніші запитання про наші трансферні послуги",
    cta: "Залишилися запитання?",
    ctaDesc: "Наша команда готова допомогти вам 24/7",
    contactButton: "Зв'яжіться з нами",
    faqs: [
      {
        question: "Як забронювати трансфер?",
        answer: "Бронювання просте! Ви можете забронювати онлайн через наш сайт, через WhatsApp або зателефонувавши на нашу лінію підтримки 24/7. Просто введіть місця посадки та висадки, виберіть автомобіль та підтвердіть бронювання. Ви отримаєте миттєве підтвердження з усіма деталями.",
      },
      {
        question: "Що станеться, якщо мій рейс затримається?",
        answer: "Не хвилюйтеся! Ми відстежуємо всі рейси в реальному часі. Якщо ваш рейс затримається, ми автоматично скоригуємо час зустрічі без додаткової плати. Ваш водій чекатиме на вас, коли ви приземлитеся.",
      },
      {
        question: "Чи можу я скасувати або змінити бронювання?",
        answer: "Так, ви можете безкоштовно скасувати або змінити бронювання за 24 години до запланованого часу зустрічі. Просто зв'яжіться з нашою службою підтримки через WhatsApp, електронну пошту або телефон.",
      },
      {
        question: "Що входить у вартість?",
        answer: "Наші ціни включають все без прихованих платежів. У вартість входить: зустріч з табличкою, 60 хвилин безкоштовного очікування для аеропортових трансферів, допомога з багажем, дитячі крісла на замовлення та безкоштовний WiFi у всіх автомобілях.",
      },
      {
        question: "Які способи оплати ви приймаєте?",
        answer: "Ми приймаємо всі основні кредитні та дебетові картки, а також готівку. Ви можете оплатити онлайн при бронюванні або готівкою водію. Корпоративні рахунки з щомісячною оплатою також доступні.",
      },
      {
        question: "Чи доступні дитячі крісла?",
        answer: "Так! Ми надаємо дитячі крісла (для немовлят, малюків та бустери) безкоштовно. Просто вкажіть тип крісла при бронюванні, і воно буде готове у вашому автомобілі.",
      },
    ],
  },
  JA: {
    badge: "ご質問がありますか？",
    title: "よくある",
    titleHighlight: "ご質問",
    subtitle: "送迎サービスに関するよくあるご質問への回答をご覧ください",
    cta: "まだご質問がありますか？",
    ctaDesc: "私たちのチームが24時間年中無休でお手伝いします",
    contactButton: "お問い合わせ",
    faqs: [
      {
        question: "送迎を予約するにはどうすればよいですか？",
        answer: "予約は簡単です！ウェブサイトからオンラインで、WhatsAppで、または24時間対応のサポートラインにお電話いただけます。乗車地と降車地を入力し、車両を選択して予約を確定するだけです。すべての詳細が記載された確認を即座に受け取れます。",
      },
      {
        question: "フライトが遅延した場合はどうなりますか？",
        answer: "ご心配なく！すべてのフライトをリアルタイムで追跡しています。フライトが遅延した場合、追加料金なしで自動的に迎えの時間を調整します。着陸時間に関係なく、ドライバーがお待ちしています。",
      },
      {
        question: "予約をキャンセルまたは変更できますか？",
        answer: "はい、予定されている迎えの時間の24時間前まで無料でキャンセルまたは変更できます。WhatsApp、メール、または電話でサポートチームにご連絡ください。",
      },
      {
        question: "料金に何が含まれていますか？",
        answer: "料金は隠れた費用なしのオールインクルーシブです。含まれるもの：出迎えサービス、空港送迎の60分無料待機時間、荷物のお手伝い、リクエストに応じたチャイルドシート、全車両での無料WiFi。",
      },
      {
        question: "どのような支払い方法を受け付けていますか？",
        answer: "主要なクレジットカード、デビットカード、現金払いを受け付けています。予約時にオンラインで支払うか、ドライバーに直接現金で支払うことができます。月次請求書による法人アカウントもご利用いただけます。",
      },
      {
        question: "チャイルドシートは利用できますか？",
        answer: "はい！チャイルドシート（乳児用、幼児用、ブースター）を無料で提供しています。予約時に必要なシートの種類をお知らせいただければ、車両に用意しておきます。",
      },
    ],
  },
};

const HomeFAQ = () => {
  const { language, getLocalizedPath } = useLanguage();
  const { promoCode: activePromo } = usePromo();
  const lang = language || "EN";
  const discountPercent = activePromo?.discountPercentage || 25;

  const t = faqTranslations[lang] || faqTranslations["EN"];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-muted/30 via-background to-muted/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-5xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
            <HelpCircle className="h-4 w-4" />
            {t.badge}
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {t.title}{" "}
            <span className="text-primary">{t.titleHighlight}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-card rounded-2xl border p-6 md:p-8 shadow-lg animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {t.faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-xl px-4 md:px-6 data-[state=open]:border-primary/30 data-[state=open]:bg-primary/5 transition-all duration-300"
              >
                <AccordionTrigger className="text-left py-5 hover:no-underline group">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {faq.question}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pl-11 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA Section */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-card rounded-2xl border">
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-lg">{t.cta}</h3>
              <p className="text-sm text-muted-foreground">{t.ctaDesc}</p>
            </div>
            <Link to={getLocalizedPath("/contact")}>
              <Button className="gap-2 px-6">
                <MessageCircle className="h-4 w-4" />
                {t.contactButton}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeFAQ;
