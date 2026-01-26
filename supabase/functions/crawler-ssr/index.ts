import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common crawler user agents
const CRAWLER_PATTERNS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'slurp',
  'baiduspider',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'applebot',
  'pinterest',
  'tumblr',
  'slack',
  'discord',
  'embedly',
  'quora',
  'outbrain',
  'w3c_validator',
  'lighthouse',
  'pagespeed',
  'gtmetrix',
  'semrush',
  'ahrefs',
  'mj12bot',
  'dotbot',
  'petalbot',
  'seznambot',
  'sogou',
  'exabot',
  'ia_archiver',
  'archive.org_bot',
];

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern));
}

// SEO configuration - same as seo-meta function
const seoConfig: Record<string, { title: string; description: string; keywords: string; ogImage?: string; ogType?: string }> = {
  '/': {
    title: 'Meet Transfer - Premium VIP Airport Transfers & Luxury Car Service',
    description: 'Experience luxury VIP airport transfers with Mercedes vehicles. Professional chauffeurs, 24/7 service across Turkey, Dubai & Cyprus. Book your premium transfer now!',
    keywords: 'VIP transfer, airport transfer, luxury car service, Mercedes transfer, private driver, Turkey transfer, Istanbul airport, Antalya transfer',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  // Turkish
  '/tr': {
    title: 'Meet Transfer - VIP Havalimanı Transferi & Lüks Araç Hizmeti',
    description: 'Mercedes araçlarla lüks VIP havalimanı transferi. Profesyonel şoförler, Türkiye genelinde 7/24 hizmet. Premium transferinizi hemen rezerve edin!',
    keywords: 'VIP transfer, havalimanı transferi, lüks araç kiralama, Mercedes transfer, özel şoför, İstanbul havalimanı, Antalya transfer',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  // Russian
  '/ru': {
    title: 'Meet Transfer - VIP Трансфер из Аэропорта & Люкс Автосервис',
    description: 'Роскошные VIP трансферы на Mercedes. Профессиональные водители, круглосуточный сервис по Турции, Дубаю и Кипру. Забронируйте премиум трансфер!',
    keywords: 'VIP трансфер, трансфер аэропорт, люкс автомобиль, Mercedes трансфер, частный водитель, Турция трансфер, Стамбул аэропорт',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  // German
  '/de': {
    title: 'Meet Transfer - VIP Flughafentransfer & Luxus Chauffeurservice',
    description: 'Erleben Sie luxuriöse VIP-Flughafentransfers mit Mercedes-Fahrzeugen. Professionelle Chauffeure, 24/7 Service in der Türkei, Dubai & Zypern.',
    keywords: 'VIP Transfer, Flughafentransfer, Luxus Autoservice, Mercedes Transfer, Privatfahrer, Türkei Transfer, Istanbul Flughafen',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  // Arabic
  '/ar': {
    title: 'Meet Transfer - نقل VIP من المطار وخدمة السيارات الفاخرة',
    description: 'استمتع بنقل VIP فاخر من المطار بسيارات مرسيدس. سائقون محترفون، خدمة على مدار الساعة في تركيا ودبي وقبرص.',
    keywords: 'نقل VIP، نقل المطار، خدمة سيارات فاخرة، نقل مرسيدس، سائق خاص، نقل تركيا، مطار اسطنبول',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  // French
  '/fr': {
    title: 'Meet Transfer - Transfert VIP Aéroport & Service de Voiture de Luxe',
    description: 'Découvrez les transferts VIP de luxe avec véhicules Mercedes. Chauffeurs professionnels, service 24/7 en Turquie, Dubaï et Chypre.',
    keywords: 'transfert VIP, transfert aéroport, service voiture luxe, transfert Mercedes, chauffeur privé, transfert Turquie, aéroport Istanbul',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  // Spanish
  '/es': {
    title: 'Meet Transfer - Traslado VIP Aeropuerto & Servicio de Autos de Lujo',
    description: 'Experimente traslados VIP de lujo con vehículos Mercedes. Choferes profesionales, servicio 24/7 en Turquía, Dubái y Chipre.',
    keywords: 'traslado VIP, traslado aeropuerto, servicio auto lujo, traslado Mercedes, chofer privado, traslado Turquía, aeropuerto Estambul',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  // Italian
  '/it': {
    title: 'Meet Transfer - Transfer VIP Aeroporto & Servizio Auto di Lusso',
    description: 'Scopri i transfer VIP di lusso con veicoli Mercedes. Autisti professionisti, servizio 24/7 in Turchia, Dubai e Cipro.',
    keywords: 'transfer VIP, transfer aeroporto, servizio auto lusso, transfer Mercedes, autista privato, transfer Turchia, aeroporto Istanbul',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  // Portuguese
  '/pt': {
    title: 'Meet Transfer - Transfer VIP Aeroporto & Serviço de Carros de Luxo',
    description: 'Experimente transfers VIP de luxo com veículos Mercedes. Motoristas profissionais, serviço 24/7 na Turquia, Dubai e Chipre.',
    keywords: 'transfer VIP, transfer aeroporto, serviço carro luxo, transfer Mercedes, motorista particular, transfer Turquia, aeroporto Istambul',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  // Japanese
  '/ja': {
    title: 'Meet Transfer - VIP空港送迎＆高級車サービス',
    description: 'メルセデス車両による豪華なVIP空港送迎をご体験ください。プロのドライバー、トルコ、ドバイ、キプロスで24時間対応。',
    keywords: 'VIP送迎、空港送迎、高級車サービス、メルセデス送迎、プライベートドライバー、トルコ送迎、イスタンブール空港',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  // Chinese
  '/zh': {
    title: 'Meet Transfer - VIP机场接送及豪华汽车服务',
    description: '体验梅赛德斯豪华VIP机场接送服务。专业司机，土耳其、迪拜和塞浦路斯全天候服务。立即预订您的高端接送！',
    keywords: 'VIP接送、机场接送、豪华汽车服务、梅赛德斯接送、私人司机、土耳其接送、伊斯坦布尔机场',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  // Service pages
  '/services': {
    title: 'Premium Transfer Services - Airport, Intercity & Hourly Rentals',
    description: 'Comprehensive VIP transfer services including airport pickups, intercity travel, and hourly rentals with luxury Mercedes vehicles.',
    keywords: 'transfer services, airport pickup, intercity transfer, hourly rental, VIP service, luxury transport',
    ogType: 'website',
  },
  '/pricing': {
    title: 'Transparent Pricing - VIP Transfer Rates & Packages',
    description: 'Clear and competitive pricing for all VIP transfer services. No hidden fees, instant quotes for airport transfers and city tours.',
    keywords: 'transfer pricing, airport transfer cost, VIP rates, luxury car prices, transfer packages',
    ogType: 'website',
  },
  '/about': {
    title: 'About Meet Transfer - Your Trusted VIP Transfer Partner',
    description: 'Learn about Meet Transfer\'s commitment to excellence in VIP transportation. Professional team, premium fleet, and unmatched service quality.',
    keywords: 'about us, VIP transfer company, professional drivers, luxury fleet, transfer expertise',
    ogType: 'website',
  },
  '/contact': {
    title: 'Contact Meet Transfer - 24/7 Customer Support',
    description: 'Get in touch with Meet Transfer for bookings, inquiries, or support. Available 24/7 via WhatsApp, phone, or email.',
    keywords: 'contact, customer support, booking inquiry, WhatsApp support, transfer booking',
    ogType: 'website',
  },
  // Standalone Reservation Page - for Google Business Profile
  '/reserve': {
    title: 'Online Reservation | Meet Transfer - VIP Airport Transfer Booking',
    description: 'Book your VIP airport transfer online. Mercedes vehicles, professional drivers, instant pricing. Complete your reservation in minutes!',
    keywords: 'online booking, airport transfer reservation, VIP transfer booking, Mercedes transfer, instant booking',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  '/tr/reserve': {
    title: 'Online Rezervasyon | Meet Transfer - VIP Havalimanı Transfer',
    description: 'VIP havalimanı transfer rezervasyonunuzu online yapın. Mercedes araçlar, profesyonel şoförler, anında fiyat. Birkaç dakikada rezervasyonunuzu tamamlayın!',
    keywords: 'online rezervasyon, havalimanı transfer, VIP transfer, Mercedes transfer, hızlı rezervasyon',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  '/de/reserve': {
    title: 'Online Reservierung | Meet Transfer - VIP Flughafentransfer',
    description: 'Buchen Sie Ihren VIP Flughafentransfer online. Mercedes Fahrzeuge, professionelle Fahrer, sofortige Preise. Reservierung in wenigen Minuten!',
    keywords: 'online buchung, flughafentransfer, VIP transfer, Mercedes transfer, schnelle buchung',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  '/ru/reserve': {
    title: 'Онлайн бронирование | Meet Transfer - VIP трансфер из аэропорта',
    description: 'Забронируйте VIP трансфер из аэропорта онлайн. Автомобили Mercedes, профессиональные водители, мгновенные цены. Завершите бронирование за минуты!',
    keywords: 'онлайн бронирование, трансфер аэропорт, VIP трансфер, Mercedes трансфер, быстрое бронирование',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
  '/fr/reserve': {
    title: 'Réservation en Ligne | Meet Transfer - Transfert VIP Aéroport',
    description: 'Réservez votre transfert VIP aéroport en ligne. Véhicules Mercedes, chauffeurs professionnels, tarifs instantanés. Finalisez votre réservation en quelques minutes!',
    keywords: 'réservation en ligne, transfert aéroport, transfert VIP, transfert Mercedes, réservation rapide',
    ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    ogType: 'website',
  },
};

// Default SEO config
const defaultSeo = {
  title: 'Meet Transfer - Premium VIP Transfer Services',
  description: 'Professional VIP airport transfers and luxury car services across Turkey, Dubai, and Cyprus. Book your premium transfer today!',
  keywords: 'VIP transfer, airport transfer, luxury transport, premium car service',
  ogImage: 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
  ogType: 'website',
};

function getSeoConfig(path: string) {
  // Try exact match first
  if (seoConfig[path]) {
    return { ...defaultSeo, ...seoConfig[path] };
  }
  
  // Try with trailing slash removed
  const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
  if (seoConfig[cleanPath]) {
    return { ...defaultSeo, ...seoConfig[cleanPath] };
  }
  
  // Try language prefix match
  const langMatch = path.match(/^\/(tr|ru|de|ar|fr|es|it|pt|ja|zh)/);
  if (langMatch) {
    const langPath = `/${langMatch[1]}`;
    if (seoConfig[langPath]) {
      return { ...defaultSeo, ...seoConfig[langPath] };
    }
  }
  
  return defaultSeo;
}

// Supported language prefixes
const LANG_PREFIXES = ['tr', 'de', 'fr', 'ru', 'it', 'es', 'ar', 'uk', 'ja', 'zh', 'pt'];
const LANG_REGEX = new RegExp(`^/(${LANG_PREFIXES.join('|')})(?=/|$)`);

function normalizeCanonicalPath(path: string): string {
  // Remove trailing slash except for root
  let normalized = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
  // Ensure starts with /
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  return normalized;
}

function getBasePath(path: string): string {
  // Remove language prefix to get base path
  const normalized = normalizeCanonicalPath(path);
  const withoutLang = normalized.replace(LANG_REGEX, '');
  return withoutLang || '/';
}

function generateMetaTags(path: string, config: typeof defaultSeo): string {
  const baseUrl = 'https://meettransfer.app';
  const normalizedPath = normalizeCanonicalPath(path);
  const basePath = getBasePath(normalizedPath);
  
  // Canonical URL should be self-referencing (exact current path)
  const canonicalUrl = normalizedPath === '/' 
    ? baseUrl 
    : `${baseUrl}${normalizedPath}`;
  
  // For hreflang, generate URLs for all language variants
  const generateHreflangUrl = (lang: string): string => {
    if (lang === 'en' || lang === 'x-default') {
      // English and x-default use the base path without language prefix
      return basePath === '/' ? baseUrl : `${baseUrl}${basePath}`;
    }
    // Other languages add prefix
    return basePath === '/' ? `${baseUrl}/${lang}` : `${baseUrl}/${lang}${basePath}`;
  };
  
  return `
    <title>${config.title}</title>
    <meta name="description" content="${config.description}">
    <meta name="keywords" content="${config.keywords}">
    <link rel="canonical" href="${canonicalUrl}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${config.title}">
    <meta property="og:description" content="${config.description}">
    <meta property="og:type" content="${config.ogType}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:image" content="${config.ogImage}">
    <meta property="og:site_name" content="Meet Transfer">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${config.title}">
    <meta name="twitter:description" content="${config.description}">
    <meta name="twitter:image" content="${config.ogImage}">
    
    <!-- Hreflang Tags -->
    <link rel="alternate" hreflang="en" href="${generateHreflangUrl('en')}">
    <link rel="alternate" hreflang="tr" href="${generateHreflangUrl('tr')}">
    <link rel="alternate" hreflang="de" href="${generateHreflangUrl('de')}">
    <link rel="alternate" hreflang="fr" href="${generateHreflangUrl('fr')}">
    <link rel="alternate" hreflang="ru" href="${generateHreflangUrl('ru')}">
    <link rel="alternate" hreflang="it" href="${generateHreflangUrl('it')}">
    <link rel="alternate" hreflang="es" href="${generateHreflangUrl('es')}">
    <link rel="alternate" hreflang="ar" href="${generateHreflangUrl('ar')}">
    <link rel="alternate" hreflang="uk" href="${generateHreflangUrl('uk')}">
    <link rel="alternate" hreflang="ja" href="${generateHreflangUrl('ja')}">
    <link rel="alternate" hreflang="zh" href="${generateHreflangUrl('zh')}">
    <link rel="alternate" hreflang="pt" href="${generateHreflangUrl('pt')}">
    <link rel="alternate" hreflang="x-default" href="${generateHreflangUrl('x-default')}">
  `;
}

// Base HTML template for SSR
const baseHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <meta name="theme-color" content="#1a1a2e">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  
  <!-- Preconnect for performance -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  
  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="https://meettransfer.app/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="https://meettransfer.app/apple-touch-icon.png">
  
  <!-- PWA -->
  <link rel="manifest" href="https://meettransfer.app/manifest.json">
  
  {{META_TAGS}}
  
  <style>
    /* Critical CSS for above-the-fold content */
    :root {
      --background: 222.2 84% 4.9%;
      --foreground: 210 40% 98%;
      --primary: 45 93% 47%;
      --primary-foreground: 222.2 84% 4.9%;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: hsl(var(--background));
      color: hsl(var(--foreground));
      min-height: 100vh;
    }
    
    .hero-skeleton {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      text-align: center;
    }
    
    .logo-skeleton {
      width: 200px;
      height: 60px;
      background: linear-gradient(90deg, hsl(var(--primary) / 0.1) 25%, hsl(var(--primary) / 0.2) 50%, hsl(var(--primary) / 0.1) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    
    .title-skeleton {
      width: 80%;
      max-width: 600px;
      height: 48px;
      background: linear-gradient(90deg, hsl(var(--foreground) / 0.1) 25%, hsl(var(--foreground) / 0.2) 50%, hsl(var(--foreground) / 0.1) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    
    .subtitle-skeleton {
      width: 60%;
      max-width: 400px;
      height: 24px;
      background: linear-gradient(90deg, hsl(var(--foreground) / 0.1) 25%, hsl(var(--foreground) / 0.2) 50%, hsl(var(--foreground) / 0.1) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    .noscript-content {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .noscript-content h1 {
      font-family: 'Playfair Display', serif;
      font-size: 2.5rem;
      color: hsl(var(--primary));
      margin-bottom: 1rem;
    }
    
    .noscript-content p {
      font-size: 1.125rem;
      line-height: 1.75;
      margin-bottom: 1rem;
    }
    
    .noscript-content ul {
      list-style: none;
      padding: 0;
    }
    
    .noscript-content li {
      padding: 0.5rem 0;
      border-bottom: 1px solid hsl(var(--foreground) / 0.1);
    }
    
    .noscript-content a {
      color: hsl(var(--primary));
      text-decoration: none;
    }
    
    .noscript-content a:hover {
      text-decoration: underline;
    }
  </style>
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Meet Transfer",
    "url": "https://meettransfer.app",
    "logo": "https://meettransfer.app/images/meet-transfer-logo.png",
    "description": "Premium VIP airport transfer and luxury car services",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "TR"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["English", "Turkish", "Russian", "German", "Arabic", "French", "Spanish", "Italian", "Portuguese", "Japanese", "Chinese"]
    },
    "sameAs": [
      "https://www.instagram.com/meettransfer",
      "https://www.facebook.com/meettransfer"
    ]
  }
  </script>
</head>
<body>
  <div id="root">
    <!-- Loading skeleton for React app -->
    <div class="hero-skeleton">
      <div class="logo-skeleton"></div>
      <div class="title-skeleton"></div>
      <div class="subtitle-skeleton"></div>
    </div>
  </div>
  
  <!-- Content for crawlers/noscript -->
  <noscript>
    <div class="noscript-content">
      {{NOSCRIPT_CONTENT}}
    </div>
  </noscript>
  
  <!-- App will hydrate here -->
  <script>
    // Redirect to main app for JavaScript-enabled browsers
    if (typeof window !== 'undefined') {
      // App will load normally
    }
  </script>
</body>
</html>`;

function generateNoscriptContent(path: string, config: typeof defaultSeo): string {
  const baseUrl = 'https://meettransfer.app';
  
  return `
    <h1>${config.title}</h1>
    <p>${config.description}</p>
    
    <h2>Our Services</h2>
    <ul>
      <li><a href="${baseUrl}/services">VIP Airport Transfers</a></li>
      <li><a href="${baseUrl}/services">Intercity Travel</a></li>
      <li><a href="${baseUrl}/services">Hourly Rentals</a></li>
      <li><a href="${baseUrl}/pricing">View Pricing</a></li>
    </ul>
    
    <h2>Popular Destinations</h2>
    <ul>
      <li><a href="${baseUrl}/destinations/istanbul">Istanbul Airport Transfers</a></li>
      <li><a href="${baseUrl}/destinations/antalya">Antalya Airport Transfers</a></li>
      <li><a href="${baseUrl}/destinations/bodrum">Bodrum Airport Transfers</a></li>
      <li><a href="${baseUrl}/destinations/dubai">Dubai Airport Transfers</a></li>
    </ul>
    
    <h2>Contact Us</h2>
    <p>
      <a href="${baseUrl}/contact">Contact Page</a> | 
      <a href="https://wa.me/905551234567">WhatsApp</a> |
      Email: info@meettransfer.app
    </p>
    
    <h2>Languages</h2>
    <ul>
      <li><a href="${baseUrl}">English</a></li>
      <li><a href="${baseUrl}/tr">Türkçe</a></li>
      <li><a href="${baseUrl}/ru">Русский</a></li>
      <li><a href="${baseUrl}/de">Deutsch</a></li>
      <li><a href="${baseUrl}/ar">العربية</a></li>
      <li><a href="${baseUrl}/fr">Français</a></li>
      <li><a href="${baseUrl}/es">Español</a></li>
    </ul>
  `;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/';
    const userAgent = req.headers.get('user-agent') || '';
    const forceSSR = url.searchParams.get('force') === 'true';
    
    // Check if this is a crawler or force SSR mode
    const isBot = isCrawler(userAgent) || forceSSR;
    
    console.log(`[crawler-ssr] Path: ${path}, UserAgent: ${userAgent.substring(0, 50)}..., IsBot: ${isBot}`);
    
    if (!isBot) {
      // Return JSON response for non-crawlers (can be used for debugging)
      const headers = new Headers(corsHeaders);
      headers.set('content-type', 'application/json; charset=utf-8');

      return new Response(
        JSON.stringify({
          isCrawler: false,
          message: 'Not a crawler, serve regular SPA',
          path,
          userAgent: userAgent.substring(0, 100),
        }),
        { headers }
      );
    }

    // Generate SSR HTML for crawlers
    const seoConfig = getSeoConfig(path);
    const metaTags = generateMetaTags(path, seoConfig);
    const noscriptContent = generateNoscriptContent(path, seoConfig);

    const html = baseHtml
      .replace('{{META_TAGS}}', metaTags)
      .replace('{{NOSCRIPT_CONTENT}}', noscriptContent)
      .replace('lang="en"', `lang="${getLanguageCode(path)}"`);

    console.log(`[crawler-ssr] Generated SSR HTML for ${path}, Title: ${seoConfig.title}`);

    const headers = new Headers(corsHeaders);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'public, max-age=3600, s-maxage=86400');
    headers.set('x-ssr-mode', 'crawler');
    headers.set('x-robots-tag', 'index, follow');

    return new Response(html, { headers });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[crawler-ssr] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: errorMessage }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function getLanguageCode(path: string): string {
  const langMatch = path.match(/^\/(tr|ru|de|ar|fr|es|it|pt|ja|zh)/);
  if (langMatch) {
    return langMatch[1];
  }
  return 'en';
}
