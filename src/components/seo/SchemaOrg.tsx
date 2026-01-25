import { useEffect } from 'react';
import { DEFAULT_RATING, DEFAULT_TOTAL_REVIEWS } from '@/constants/ratings';

interface LocalBusinessSchema {
  type: 'LocalBusiness';
  includeRating?: boolean; // Only true on homepage to avoid duplicate ratings
}

interface TransportationServiceSchema {
  type: 'TransportationService';
  areaServed?: string[];
  isGlobal?: boolean; // Use the comprehensive global schema for homepage
}

interface FAQSchema {
  type: 'FAQPage';
  questions: { question: string; answer: string }[];
}

interface BreadcrumbSchema {
  type: 'BreadcrumbList';
  items: { name: string; url: string }[];
}

interface ProductSchema {
  type: 'Product';
  name: string;
  description: string;
  image?: string[];
  offers?: {
    price: string;
    priceCurrency: string;
  };
}

interface MerchantProductSchema {
  type: 'MerchantProduct';
}

interface ArticleSchema {
  type: 'Article';
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  readingTime?: string;
  wordCount?: number;
  keywords?: string[];
}

interface WebPageSchema {
  type: 'WebPage';
  name: string;
  description: string;
  url?: string;
  breadcrumb?: { name: string; url: string }[];
}

interface ServiceSchema {
  type: 'Service';
  name: string;
  description: string;
  provider?: string;
  areaServed?: string[];
  serviceType?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
}

interface AIBookingAssistantSchema {
  type: 'AIBookingAssistant';
}

type SchemaType = LocalBusinessSchema | TransportationServiceSchema | FAQSchema | BreadcrumbSchema | ProductSchema | MerchantProductSchema | ArticleSchema | WebPageSchema | ServiceSchema | AIBookingAssistantSchema;

interface SchemaOrgProps {
  schemas: SchemaType[];
}

const baseUrl = 'https://meettransfer.app';

const companyInfo = {
  name: 'Meet Transfer',
  legalName: 'Meet Transfer',
  url: baseUrl,
  logo: `${baseUrl}/favicon.png`,
  description: 'Premium VIP airport transfer and chauffeur service worldwide. Luxury Mercedes fleet with professional drivers.',
  telephone: '+15558051101',
  email: 'info@meettransfer.app',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'TR',
    addressLocality: 'Istanbul',
    addressRegion: 'Istanbul',
    postalCode: '34000',
    streetAddress: 'Atatürk Mahallesi',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 44.7972,
    longitude: -106.9561,
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '00:00',
    closes: '23:59',
  },
  sameAs: [
    'https://www.instagram.com/meettransfer/',
    'https://m.facebook.com/100095122861655/',
    'https://x.com/meettransfer',
    'https://www.youtube.com/@meettransfer',
  ],
  priceRange: '$$',
  areaServed: [
    { '@type': 'City', name: 'Istanbul' },
    { '@type': 'City', name: 'Antalya' },
    { '@type': 'City', name: 'Bodrum' },
    { '@type': 'City', name: 'Dalaman' },
    { '@type': 'City', name: 'Izmir' },
    { '@type': 'City', name: 'Cappadocia' },
    { '@type': 'City', name: 'Dubai' },
    { '@type': 'City', name: 'Cyprus' },
    { '@type': 'City', name: 'Bursa' },
    { '@type': 'City', name: 'Frankfurt' },
    { '@type': 'City', name: 'Athens' },
    { '@type': 'City', name: 'Greece' },
  ],
  // aggregateRating is conditionally added only on homepage
};

type AggregateRatingData = {
  ratingValue: string;
  reviewCount: string;
};

const generateLocalBusinessSchema = (
  includeRating: boolean = false,
  aggregateRating?: AggregateRatingData
) => {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}/#organization`,
    ...companyInfo,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Airport Transfer Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'VIP Airport Transfer',
            description: 'Luxury airport transfer with meet & greet service',
          },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'US',
          returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
        },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Hourly Chauffeur Service',
            description: 'Private chauffeur service by the hour',
          },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'US',
          returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
        },
        },
      ],
    },
  };

  // Only include aggregateRating on homepage to avoid "multiple aggregate ratings" warning
  if (includeRating && aggregateRating) {
    return {
      ...baseSchema,
      aggregateRating: {
        '@type': 'AggregateRating',
        '@id': `${baseUrl}/#aggregateRating`,
        ratingValue: aggregateRating.ratingValue,
        reviewCount: aggregateRating.reviewCount,
        bestRating: '5',
        worstRating: '1',
      },
    };
  }

  return baseSchema;
};

const generateTransportationServiceSchema = (areaServed?: string[], isGlobal?: boolean) => {
  // Global schema for homepage - comprehensive TransportationService
  if (isGlobal) {
    return {
      '@context': 'https://schema.org',
      '@type': 'TransportationService',
      name: 'Meet Transfer Airport Transfer Service',
      description: 'Meet Transfer provides private airport transfer and chauffeur services in Turkey, Dubai, Cyprus and Germany. This is a transportation service, not a physical product store.',
      url: baseUrl,
      provider: {
        '@type': 'Organization',
        name: 'Meet Transfer',
        url: baseUrl,
      },
      serviceType: 'Airport Transfer Service',
      areaServed: [
        { '@type': 'Country', name: 'Turkey' },
        { '@type': 'Country', name: 'United Arab Emirates' },
        { '@type': 'Country', name: 'Cyprus' },
        { '@type': 'Country', name: 'Germany' },
      ],
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceLocation: {
          '@type': 'Place',
          name: 'Airport',
        },
      },
    };
  }
  
  // Existing schema for other pages
  return {
    '@context': 'https://schema.org',
    '@type': 'TransportationService',
    name: 'Meet Transfer',
    description: 'Premium VIP airport transfer and private chauffeur service worldwide',
    provider: {
      '@type': 'Organization',
      name: 'Meet Transfer',
      url: baseUrl,
    },
    serviceType: ['Airport Transfer', 'VIP Transfer', 'Private Chauffeur', 'Luxury Transportation'],
    areaServed: areaServed?.map(area => ({ '@type': 'City', name: area })) || companyInfo.areaServed,
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: baseUrl,
      servicePhone: companyInfo.telephone,
    },
  };
};

const generateFAQSchema = (questions: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: questions.map(q => ({
    '@type': 'Question',
    name: q.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: q.answer,
    },
  })),
});

const generateBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${baseUrl}${item.url}`,
  })),
});

const generateProductSchema = (product: ProductSchema) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  brand: {
    '@type': 'Brand',
    name: 'Meet Transfer',
  },
  ...(product.image && { image: product.image }),
  ...(product.offers && {
    offers: {
      '@type': 'Offer',
      price: product.offers.price,
      priceCurrency: product.offers.priceCurrency,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Meet Transfer',
      },
    },
  }),
});

const generateMerchantProductSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Meet Transfer – VIP Airport Transfer Service',
  description: 'Luxury private airport transfer service worldwide with fixed prices, professional chauffeurs and VIP Mercedes Vito vehicles.',
  provider: {
    '@type': 'Organization',
    name: 'Meet Transfer',
    url: baseUrl,
    logo: companyInfo.logo,
  },
  serviceType: 'Airport Transfer',
  areaServed: [
    { '@type': 'Country', name: 'Turkey' },
    { '@type': 'Country', name: 'United Arab Emirates' },
    { '@type': 'Country', name: 'Cyprus' },
    { '@type': 'Country', name: 'Germany' },
    { '@type': 'Country', name: 'Greece' },
  ],
  image: [
    'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
    'https://meettransfer.app/images/meet-transfer-vclass-interior.jpg',
  ],
  offers: {
    '@type': 'Offer',
    url: 'https://meettransfer.app/',
    priceCurrency: 'EUR',
    price: '50',
    priceValidUntil: '2026-12-31',
    availability: 'https://schema.org/InStock',
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'US',
      returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
    },
  },
});

const generateArticleSchema = (article: ArticleSchema) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.headline,
  description: article.description,
  image: article.image || 'https://meettransfer.app/images/meet-transfer-vip-mercedes-vito.jpg',
  datePublished: article.datePublished,
  dateModified: article.dateModified || article.datePublished,
  author: {
    '@type': 'Organization',
    name: article.author || 'Meet Transfer',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/pwa-512x512.png`,
    },
  },
  publisher: {
    '@type': 'Organization',
    name: 'Meet Transfer',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/pwa-512x512.png`,
      width: 512,
      height: 512,
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': baseUrl,
  },
  ...(article.readingTime && {
    timeRequired: `PT${parseInt(article.readingTime)}M`,
  }),
  ...(article.wordCount && {
    wordCount: article.wordCount,
  }),
  ...(article.keywords && article.keywords.length > 0 && {
    keywords: article.keywords.join(', '),
  }),
  articleSection: 'Travel & Transportation',
  inLanguage: 'en',
});

const generateWebPageSchema = (webPage: WebPageSchema) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: webPage.name,
  description: webPage.description,
  url: webPage.url || baseUrl,
  isPartOf: {
    '@id': `${baseUrl}/#website`,
  },
  about: {
    '@id': `${baseUrl}/#organization`,
  },
  ...(webPage.breadcrumb && {
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: webPage.breadcrumb.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${baseUrl}${item.url}`,
      })),
    },
  }),
});

const generateServiceSchema = (service: ServiceSchema) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: service.name,
  description: service.description,
  provider: {
    '@type': 'Organization',
    name: service.provider || 'Meet Transfer',
    '@id': `${baseUrl}/#organization`,
  },
  ...(service.serviceType && { serviceType: service.serviceType }),
  ...(service.areaServed && {
    areaServed: service.areaServed.map(area => ({ '@type': 'City', name: area })),
  }),
  ...(service.offers && {
    offers: {
      '@type': 'Offer',
      price: service.offers.price,
      priceCurrency: service.offers.priceCurrency,
      availability: 'https://schema.org/InStock',
    },
  }),
});

// AI Booking Assistant Schema - For AI search visibility
const generateAIBookingAssistantSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${baseUrl}/#ai-assistant`,
  name: 'Meet Transfer AI Booking Assistant',
  alternateName: ['AI Transfer Booking', 'AI Havalimanı Transfer Asistanı', 'KI Flughafentransfer Assistent'],
  description: 'AI-powered instant booking assistant for airport transfers. Get real-time prices, make reservations, and receive 24/7 multilingual support through our intelligent chatbot.',
  applicationCategory: 'TravelApplication',
  applicationSubCategory: 'AI Booking Assistant',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Free AI-powered booking assistance',
  },
  featureList: [
    'Instant price quotes for airport transfers',
    'Real-time booking without forms',
    'Multilingual support (10+ languages)',
    '24/7 availability',
    'Smart route suggestions',
    'One-click Google login booking',
    'Automatic price calculation',
    'Natural language booking queries'
  ],
  provider: {
    '@type': 'Organization',
    name: 'Meet Transfer',
    '@id': `${baseUrl}/#organization`,
    url: baseUrl,
  },
  potentialAction: {
    '@type': 'UseAction',
    name: 'Book Transfer with AI',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: baseUrl,
      actionPlatform: [
        'https://schema.org/DesktopWebPlatform',
        'https://schema.org/MobileWebPlatform'
      ],
    },
    description: 'Start a conversation with our AI assistant to book your airport transfer instantly',
  },
  audience: {
    '@type': 'Audience',
    audienceType: 'Travelers, Tourists, Business Travelers',
    geographicArea: [
      { '@type': 'Country', name: 'Turkey' },
      { '@type': 'Country', name: 'United Arab Emirates' },
      { '@type': 'Country', name: 'Cyprus' },
      { '@type': 'Country', name: 'Germany' },
      { '@type': 'Country', name: 'Greece' },
    ],
  },
  keywords: 'AI booking, artificial intelligence transfer, yapay zeka transfer, AI airport transfer, chatbot booking, instant booking AI, KI Transfer Buchung, réservation IA transfert',
  inLanguage: ['en', 'tr', 'de', 'fr', 'ru', 'ar', 'es', 'it', 'uk', 'ja'],
  availableLanguage: [
    { '@type': 'Language', name: 'English', alternateName: 'en' },
    { '@type': 'Language', name: 'Turkish', alternateName: 'tr' },
    { '@type': 'Language', name: 'German', alternateName: 'de' },
    { '@type': 'Language', name: 'French', alternateName: 'fr' },
    { '@type': 'Language', name: 'Russian', alternateName: 'ru' },
    { '@type': 'Language', name: 'Arabic', alternateName: 'ar' },
    { '@type': 'Language', name: 'Spanish', alternateName: 'es' },
    { '@type': 'Language', name: 'Italian', alternateName: 'it' },
  ],
  isAccessibleForFree: true,
  screenshot: `${baseUrl}/images/ai-chat-assistant.png`,
});

const SchemaOrg = ({ schemas }: SchemaOrgProps) => {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Remove existing schema scripts
      const existingScripts = document.querySelectorAll('script[data-schema-org]');
      existingScripts.forEach(script => script.remove());

      // Fetch rating once (only if needed) - but defer to idle time
      let aggregateRating: AggregateRatingData | undefined;
      const needsRating = schemas.some(
        (s) => s.type === 'LocalBusiness' && (s as LocalBusinessSchema).includeRating
      );

      const fallback: AggregateRatingData = { ratingValue: DEFAULT_RATING.toFixed(1), reviewCount: String(DEFAULT_TOTAL_REVIEWS) };

      if (needsRating) {
        // Use fallback immediately for initial schema injection
        aggregateRating = fallback;
        
        // Defer the actual API call to idle time - don't block initial render
        const fetchRating = async () => {
          if (cancelled) return;
          
          try {
            const { supabase } = await import('@/integrations/supabase/client');

            // Request EN to keep rating consistent across locales.
            const { data, error } = await supabase.functions.invoke('get-google-reviews', {
              body: { language: 'en' },
            });

            const apiError = (data as any)?.error;
            if (error || apiError) throw new Error(String(error?.message ?? apiError));

            const nextRating = Number((data as any)?.rating);
            const nextTotal = Number((data as any)?.totalReviews);

            const ratingValue =
              Number.isFinite(nextRating) && nextRating > 0
                ? nextRating.toFixed(1)
                : fallback.ratingValue;

            const reviewCount =
              Number.isFinite(nextTotal) && nextTotal > 0
                ? String(Math.round(nextTotal))
                : fallback.reviewCount;

            // Only update if values actually changed from fallback
            if (ratingValue !== fallback.ratingValue || reviewCount !== fallback.reviewCount) {
              // Update the existing LocalBusiness schema script with fresh data
              const existingScript = document.querySelector('script[data-schema-org="LocalBusiness"]');
              if (existingScript && !cancelled) {
                try {
                  const schemaData = JSON.parse(existingScript.textContent || '{}');
                  if (schemaData.aggregateRating) {
                    schemaData.aggregateRating.ratingValue = ratingValue;
                    schemaData.aggregateRating.reviewCount = reviewCount;
                    existingScript.textContent = JSON.stringify(schemaData);
                  }
                } catch {
                  // Ignore parse errors
                }
              }
            }
          } catch {
            // Keep fallback values - already injected
          }
        };

        // Use requestIdleCallback to defer API call, with 3s timeout fallback
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(fetchRating, { timeout: 3000 });
        } else {
          // Fallback: defer after load + 1s delay
          if (document.readyState === 'complete') {
            setTimeout(fetchRating, 1000);
          } else {
            (window as Window).addEventListener('load', () => setTimeout(fetchRating, 1000), { once: true });
          }
        }
      }

      if (cancelled) return;

      // Generate and inject schemas
      schemas.forEach((schema, index) => {
        let schemaData;

        switch (schema.type) {
          case 'LocalBusiness':
            schemaData = generateLocalBusinessSchema(
              (schema as LocalBusinessSchema).includeRating,
              aggregateRating
            );
            break;
          case 'TransportationService':
            schemaData = generateTransportationServiceSchema((schema as TransportationServiceSchema).areaServed, (schema as TransportationServiceSchema).isGlobal);
            break;
          case 'FAQPage':
            schemaData = generateFAQSchema((schema as FAQSchema).questions);
            break;
          case 'BreadcrumbList':
            schemaData = generateBreadcrumbSchema((schema as BreadcrumbSchema).items);
            break;
          case 'Product':
            schemaData = generateProductSchema(schema as ProductSchema);
            break;
          case 'MerchantProduct':
            schemaData = generateMerchantProductSchema();
            break;
          case 'Article':
            schemaData = generateArticleSchema(schema as ArticleSchema);
            break;
          case 'WebPage':
            schemaData = generateWebPageSchema(schema as WebPageSchema);
            break;
        case 'Service':
            schemaData = generateServiceSchema(schema as ServiceSchema);
            break;
          case 'AIBookingAssistant':
            schemaData = generateAIBookingAssistantSchema();
            break;
          default:
            return;
        }

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-schema-org', `schema-${index}`);
        script.textContent = JSON.stringify(schemaData);
        document.head.appendChild(script);
      });
    };

    run();

    return () => {
      cancelled = true;
      const scripts = document.querySelectorAll('script[data-schema-org]');
      scripts.forEach(script => script.remove());
    };
  }, [schemas]);

  return null;
};

export default SchemaOrg;
