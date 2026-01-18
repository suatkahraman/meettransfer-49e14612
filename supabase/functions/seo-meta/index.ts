import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cacheHeaders.ts";

// SEO meta data configuration for all pages
const seoConfig: Record<string, {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
  ogType?: string;
}> = {
  // Homepage
  "/": {
    title: "Meet Transfer | Premium Airport Transfers in Turkey",
    description: "Book premium airport transfers across Turkey. Professional drivers, luxury vehicles, 24/7 service. Best prices for Antalya, Istanbul, Bodrum & more.",
    keywords: "airport transfer Turkey, Antalya airport transfer, Istanbul airport transfer, private transfer Turkey, VIP transfer",
    ogImage: "https://meettransfer.app/og-image.jpg",
    ogType: "website"
  },
  "/de": {
    title: "Meet Transfer | Premium Flughafentransfers in der Türkei",
    description: "Buchen Sie Premium-Flughafentransfers in der Türkei. Professionelle Fahrer, Luxusfahrzeuge, 24/7 Service.",
    keywords: "Flughafentransfer Türkei, Antalya Flughafentransfer, Istanbul Flughafentransfer",
    ogImage: "https://meettransfer.app/og-image.jpg",
    ogType: "website"
  },
  "/tr": {
    title: "Meet Transfer | Türkiye'de Premium Havalimanı Transferleri",
    description: "Türkiye genelinde premium havalimanı transferi rezervasyonu yapın. Profesyonel sürücüler, lüks araçlar, 7/24 hizmet.",
    keywords: "havalimanı transferi Türkiye, Antalya havalimanı transferi, İstanbul havalimanı transferi",
    ogImage: "https://meettransfer.app/og-image.jpg",
    ogType: "website"
  },
  "/ru": {
    title: "Meet Transfer | Премиум трансферы из аэропорта в Турции",
    description: "Забронируйте премиум трансфер из аэропорта по всей Турции. Профессиональные водители, роскошные автомобили, круглосуточный сервис.",
    keywords: "трансфер аэропорт Турция, трансфер Анталья, трансфер Стамбул",
    ogImage: "https://meettransfer.app/og-image.jpg",
    ogType: "website"
  },
  
  // Services pages
  "/services": {
    title: "VIP Transfer Services | Meet Transfer",
    description: "Explore our premium transfer services: Airport transfers, city tours, intercity transfers, and hourly rentals across Turkey.",
    keywords: "VIP transfer services, airport transfer, city tour, intercity transfer, hourly rental Turkey",
    ogType: "website"
  },
  "/de/services": {
    title: "VIP Transferdienste | Meet Transfer",
    description: "Entdecken Sie unsere Premium-Transferdienste: Flughafentransfers, Stadtrundfahrten, Intercity-Transfers und Stundenmietfahrzeuge.",
    keywords: "VIP Transferdienste, Flughafentransfer, Stadtrundfahrt",
    ogType: "website"
  },
  
  // Pricing pages
  "/pricing": {
    title: "Transfer Prices | Transparent Pricing | Meet Transfer",
    description: "Check our transparent transfer prices. No hidden fees. Best rates for airport transfers across Turkey.",
    keywords: "transfer prices Turkey, airport transfer cost, Antalya transfer price",
    ogType: "website"
  },
  "/de/pricing": {
    title: "Transferpreise | Transparente Preise | Meet Transfer",
    description: "Überprüfen Sie unsere transparenten Transferpreise. Keine versteckten Gebühren. Beste Preise für Flughafentransfers.",
    keywords: "Transferpreise Türkei, Flughafentransfer Kosten",
    ogType: "website"
  },
  
  // About pages
  "/about": {
    title: "About Meet Transfer | Your Trusted Transfer Partner",
    description: "Learn about Meet Transfer - your trusted partner for premium airport transfers in Turkey since 2018. 50,000+ happy customers.",
    keywords: "about Meet Transfer, transfer company Turkey, reliable transfer service",
    ogType: "website"
  },
  
  // Contact pages
  "/contact": {
    title: "Contact Us | Meet Transfer",
    description: "Get in touch with Meet Transfer. 24/7 customer support available via phone, WhatsApp, or email.",
    keywords: "contact Meet Transfer, transfer booking support, customer service",
    ogType: "website"
  },
  
  // Blog pages
  "/blog": {
    title: "Travel Blog | Tips & Guides | Meet Transfer",
    description: "Explore our travel blog for Turkey travel tips, destination guides, and insider knowledge for your perfect trip.",
    keywords: "Turkey travel blog, travel tips, destination guides, Turkey tourism",
    ogType: "website"
  },
  "/blog/antalya-airport-transfer-guide": {
    title: "Antalya Airport Transfer Guide 2025 | Meet Transfer",
    description: "Complete guide to Antalya airport transfers. Prices, destinations, tips and booking information for hassle-free travel.",
    keywords: "Antalya airport transfer, AYT airport transfer, Antalya transfer guide",
    ogType: "article"
  },
  "/blog/istanbul-airport-transfer-guide": {
    title: "Istanbul Airport Transfer Guide 2025 | Meet Transfer",
    description: "Everything you need to know about Istanbul airport transfers. IST and SAW airport options, prices, and booking tips.",
    keywords: "Istanbul airport transfer, IST airport transfer, SAW airport transfer",
    ogType: "article"
  },
  "/blog/bodrum-airport-transfer-guide": {
    title: "Bodrum Airport Transfer Guide 2025 | Meet Transfer",
    description: "Complete guide to Bodrum Milas airport transfers. Destinations, prices, and tips for your Aegean coast trip.",
    keywords: "Bodrum airport transfer, Milas airport transfer, BJV transfer",
    ogType: "article"
  },
  "/blog/dalaman-airport-transfer-guide": {
    title: "Dalaman Airport Transfer Guide 2025 | Meet Transfer",
    description: "Your complete guide to Dalaman airport transfers. Fethiye, Marmaris, Oludeniz destinations covered.",
    keywords: "Dalaman airport transfer, DLM airport, Fethiye transfer",
    ogType: "article"
  },
  "/blog/izmir-airport-transfer-guide": {
    title: "Izmir Airport Transfer Guide 2025 | Meet Transfer",
    description: "Everything about Izmir Adnan Menderes airport transfers. Cesme, Kusadasi, Alacati destinations.",
    keywords: "Izmir airport transfer, ADB airport, Cesme transfer",
    ogType: "article"
  },
  "/blog/cappadocia-airport-transfer-guide": {
    title: "Cappadocia Airport Transfer Guide 2025 | Meet Transfer",
    description: "Complete guide to Cappadocia airport transfers. Kayseri and Nevsehir airports, Goreme and Urgup transfers.",
    keywords: "Cappadocia airport transfer, Kayseri airport, Nevsehir airport",
    ogType: "article"
  },
  "/blog/marmaris-airport-transfer-guide": {
    title: "Marmaris Airport Transfer Guide 2025 | Meet Transfer",
    description: "Your guide to Marmaris transfers from Dalaman airport. Prices, options, and booking tips.",
    keywords: "Marmaris airport transfer, Dalaman to Marmaris, Marmaris transfer",
    ogType: "article"
  },
  "/blog/fethiye-airport-transfer-guide": {
    title: "Fethiye Airport Transfer Guide 2025 | Meet Transfer",
    description: "Complete guide to Fethiye airport transfers from Dalaman. Oludeniz, Hisaronu destinations.",
    keywords: "Fethiye airport transfer, Dalaman to Fethiye, Oludeniz transfer",
    ogType: "article"
  },
  "/blog/alanya-airport-transfer-guide": {
    title: "Alanya Airport Transfer Guide 2025 | Meet Transfer",
    description: "Everything about Alanya airport transfers. Gazipaşa and Antalya airport options explained.",
    keywords: "Alanya airport transfer, Gazipasa airport, Antalya to Alanya",
    ogType: "article"
  },
  "/blog/belek-airport-transfer-guide": {
    title: "Belek Airport Transfer Guide 2025 | Meet Transfer",
    description: "Your guide to Belek golf resort transfers from Antalya airport. Fast, reliable service.",
    keywords: "Belek airport transfer, Antalya to Belek, Belek golf transfer",
    ogType: "article"
  },
  "/blog/side-airport-transfer-guide": {
    title: "Side Airport Transfer Guide 2025 | Meet Transfer",
    description: "Complete guide to Side and Manavgat airport transfers from Antalya airport.",
    keywords: "Side airport transfer, Manavgat transfer, Antalya to Side",
    ogType: "article"
  },
  "/blog/kemer-airport-transfer-guide": {
    title: "Kemer Airport Transfer Guide 2025 | Meet Transfer",
    description: "Your guide to Kemer resort transfers from Antalya airport. Goynuk, Tekirova, Cirali destinations.",
    keywords: "Kemer airport transfer, Antalya to Kemer, Kemer resort transfer",
    ogType: "article"
  },
  "/blog/kas-airport-transfer-guide": {
    title: "Kas Airport Transfer Guide 2025 | Meet Transfer",
    description: "Everything about Kas and Kalkan airport transfers from Dalaman and Antalya airports.",
    keywords: "Kas airport transfer, Kalkan transfer, Dalaman to Kas",
    ogType: "article"
  },
  "/blog/ai-booking-assistant": {
    title: "AI Booking Assistant | Smart Transfer Booking | Meet Transfer",
    description: "Meet our AI-powered booking assistant. Get instant quotes, real-time availability, and seamless booking experience.",
    keywords: "AI booking assistant, smart transfer booking, instant quote",
    ogType: "article"
  },
  "/blog/best-private-transfer-turkey": {
    title: "Best Private Transfer Services in Turkey 2025 | Meet Transfer",
    description: "Discover the best private transfer services across Turkey. Compare options and find your perfect ride.",
    keywords: "best private transfer Turkey, VIP transfer Turkey, luxury transfer",
    ogType: "article"
  },
  
  // Destination pages
  "/destinations": {
    title: "Transfer Destinations | All Routes | Meet Transfer",
    description: "Explore all our transfer destinations across Turkey. From airports to resorts, we cover every major route.",
    keywords: "transfer destinations Turkey, airport routes, resort transfers",
    ogType: "website"
  },
  "/destinations/antalya": {
    title: "Antalya Transfers | All Destinations | Meet Transfer",
    description: "Book transfers to all Antalya destinations. Belek, Side, Kemer, Alanya and more covered.",
    keywords: "Antalya transfer, Belek transfer, Side transfer, Kemer transfer",
    ogType: "website"
  },
  "/destinations/istanbul": {
    title: "Istanbul Transfers | City & Airport | Meet Transfer",
    description: "Book Istanbul airport and city transfers. IST Airport, Sabiha Gokcen, and all city destinations.",
    keywords: "Istanbul transfer, IST airport transfer, Sabiha Gokcen transfer",
    ogType: "website"
  },
  "/destinations/bodrum": {
    title: "Bodrum Transfers | Peninsula & Airport | Meet Transfer",
    description: "Book Bodrum peninsula transfers. Yalikavak, Turgutreis, Gumbet and all resort destinations.",
    keywords: "Bodrum transfer, Yalikavak transfer, Bodrum airport transfer",
    ogType: "website"
  },
  
  // Fleet page
  "/fleet": {
    title: "Our Fleet | Luxury Vehicles | Meet Transfer",
    description: "Explore our premium fleet. Mercedes, BMW, and luxury minivans for comfortable transfers.",
    keywords: "transfer fleet, Mercedes transfer, VIP vehicles Turkey",
    ogType: "website"
  },
  
  // FAQ page
  "/faq": {
    title: "Frequently Asked Questions | Meet Transfer",
    description: "Find answers to common questions about our transfer services, booking process, and policies.",
    keywords: "transfer FAQ, booking questions, transfer policies",
    ogType: "website"
  },
  
  // Reviews page
  "/reviews": {
    title: "Customer Reviews | 5-Star Rated | Meet Transfer",
    description: "Read what our customers say about Meet Transfer. 4.9 star rating with 2000+ verified reviews.",
    keywords: "transfer reviews, customer testimonials, Meet Transfer ratings",
    ogType: "website"
  }
};

// Get language prefix from path
function getLanguageFromPath(path: string): string {
  const langPrefixes = ["/de", "/tr", "/ru", "/nl", "/pl", "/uk", "/ar", "/he", "/cs", "/fr"];
  for (const prefix of langPrefixes) {
    if (path.startsWith(prefix + "/") || path === prefix) {
      return prefix.substring(1);
    }
  }
  return "en";
}

// Get base path without language prefix
function getBasePath(path: string): string {
  const langPrefixes = ["/de", "/tr", "/ru", "/nl", "/pl", "/uk", "/ar", "/he", "/cs", "/fr"];
  for (const prefix of langPrefixes) {
    if (path.startsWith(prefix + "/")) {
      return path.substring(prefix.length);
    }
    if (path === prefix) {
      return "/";
    }
  }
  return path;
}

// Generate hreflang tags
function generateHreflangTags(path: string): string {
  const basePath = getBasePath(path);
  const baseUrl = "https://meettransfer.app";
  const languages = ["en", "de", "tr", "ru", "nl", "pl", "uk", "ar", "he", "cs", "fr"];
  
  let tags = "";
  for (const lang of languages) {
    const langPath = lang === "en" ? basePath : `/${lang}${basePath === "/" ? "" : basePath}`;
    const fullUrl = `${baseUrl}${langPath}`;
    tags += `<link rel="alternate" hreflang="${lang}" href="${fullUrl}" />\n`;
  }
  tags += `<link rel="alternate" hreflang="x-default" href="${baseUrl}${basePath}" />\n`;
  
  return tags;
}

// Get SEO config for a path
function getSeoConfig(path: string) {
  // First try exact match
  if (seoConfig[path]) {
    return seoConfig[path];
  }
  
  // Try base path for localized versions
  const basePath = getBasePath(path);
  if (seoConfig[basePath]) {
    return seoConfig[basePath];
  }
  
  // Default config
  return {
    title: "Meet Transfer | Premium Airport Transfers in Turkey",
    description: "Book premium airport transfers across Turkey. Professional drivers, luxury vehicles, 24/7 service.",
    keywords: "airport transfer Turkey, private transfer, VIP transfer",
    ogImage: "https://meettransfer.app/og-image.jpg",
    ogType: "website"
  };
}

// Generate meta tags HTML
function generateMetaTags(path: string): Record<string, string> {
  const config = getSeoConfig(path);
  const baseUrl = "https://meettransfer.app";
  const canonicalUrl = `${baseUrl}${path}`;
  const lang = getLanguageFromPath(path);
  
  return {
    title: config.title,
    metaTags: `
    <meta name="description" content="${config.description}" />
    <meta name="keywords" content="${config.keywords}" />
    <link rel="canonical" href="${canonicalUrl}" />
    ${generateHreflangTags(path)}
    <meta property="og:title" content="${config.title}" />
    <meta property="og:description" content="${config.description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="${config.ogType || 'website'}" />
    <meta property="og:image" content="${config.ogImage || baseUrl + '/og-image.jpg'}" />
    <meta property="og:locale" content="${lang === 'en' ? 'en_US' : lang}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${config.title}" />
    <meta name="twitter:description" content="${config.description}" />
    <meta name="twitter:image" content="${config.ogImage || baseUrl + '/og-image.jpg'}" />
    `.trim()
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/";
    
    console.log(`[seo-meta] Generating meta tags for path: ${path}`);
    
    const metaData = generateMetaTags(path);
    
    return new Response(JSON.stringify({
      success: true,
      path,
      title: metaData.title,
      metaTags: metaData.metaTags,
      language: getLanguageFromPath(path)
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        // Cache for 1 hour
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[seo-meta] Error:", errorMessage);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
