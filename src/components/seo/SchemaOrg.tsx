import { useEffect } from 'react';

interface LocalBusinessSchema {
  type: 'LocalBusiness';
  includeRating?: boolean; // Only true on homepage to avoid duplicate ratings
}

interface TransportationServiceSchema {
  type: 'TransportationService';
  areaServed?: string[];
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

type SchemaType = LocalBusinessSchema | TransportationServiceSchema | FAQSchema | BreadcrumbSchema | ProductSchema | MerchantProductSchema | ArticleSchema | WebPageSchema | ServiceSchema;

interface SchemaOrgProps {
  schemas: SchemaType[];
}

const baseUrl = 'https://meettransfer.app';

const companyInfo = {
  name: 'Meet Transfer',
  legalName: 'Meet Transfer Ltd.',
  url: baseUrl,
  logo: `${baseUrl}/favicon.png`,
  description: 'Premium VIP airport transfer and chauffeur service in Turkey, Dubai and Cyprus. Luxury Mercedes fleet with professional drivers.',
  telephone: '+15558051101',
  email: 'info@meettransfer.app',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'TR',
    addressLocality: 'Istanbul',
    addressRegion: 'Istanbul',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 41.0082,
    longitude: 28.9784,
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
            applicableCountry: 'TR',
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
            applicableCountry: 'TR',
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

const generateTransportationServiceSchema = (areaServed?: string[]) => ({
  '@context': 'https://schema.org',
  '@type': 'TransportationService',
  name: 'Meet Transfer',
  description: 'Premium VIP airport transfer and private chauffeur service across Turkey',
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
  offers: {
    '@type': 'Offer',
    url: baseUrl,
    priceCurrency: 'EUR',
    price: '50',
    priceValidUntil: '2026-12-31',
    availability: 'https://schema.org/InStock',
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'TR',
      returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
    },
  },
});

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
  description: 'Luxury private airport transfer service in Turkey with fixed prices, professional chauffeurs and VIP Mercedes vehicles.',
  provider: {
    '@type': 'Organization',
    name: 'Meet Transfer',
    url: baseUrl,
    logo: companyInfo.logo,
  },
  serviceType: 'Airport Transfer',
  areaServed: {
    '@type': 'Country',
    name: 'Turkey',
  },
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
      applicableCountry: 'TR',
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

const SchemaOrg = ({ schemas }: SchemaOrgProps) => {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Remove existing schema scripts
      const existingScripts = document.querySelectorAll('script[data-schema-org]');
      existingScripts.forEach(script => script.remove());

      // Fetch rating once (only if needed)
      let aggregateRating: AggregateRatingData | undefined;
      const needsRating = schemas.some(
        (s) => s.type === 'LocalBusiness' && (s as LocalBusinessSchema).includeRating
      );

      const fallback: AggregateRatingData = { ratingValue: '4.8', reviewCount: '2847' };

      if (needsRating) {
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

          aggregateRating = { ratingValue, reviewCount };
        } catch {
          aggregateRating = fallback;
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
            schemaData = generateTransportationServiceSchema((schema as TransportationServiceSchema).areaServed);
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
