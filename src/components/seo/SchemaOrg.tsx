import { useEffect } from 'react';

interface LocalBusinessSchema {
  type: 'LocalBusiness';
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
  offers?: {
    price: string;
    priceCurrency: string;
  };
}

type SchemaType = LocalBusinessSchema | TransportationServiceSchema | FAQSchema | BreadcrumbSchema | ProductSchema;

interface SchemaOrgProps {
  schemas: SchemaType[];
}

const baseUrl = 'https://meettransfer.app';

const companyInfo = {
  name: 'Meet Transfer',
  legalName: 'Meet Transfer Ltd.',
  url: baseUrl,
  logo: `${baseUrl}/favicon.png`,
  description: 'Premium VIP airport transfer and chauffeur service in Turkey. Luxury Mercedes fleet with professional drivers.',
  telephone: '+905321748390',
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
  ],
};

const generateLocalBusinessSchema = () => ({
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
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Hourly Chauffeur Service',
          description: 'Private chauffeur service by the hour',
        },
      },
    ],
  },
});

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

const SchemaOrg = ({ schemas }: SchemaOrgProps) => {
  useEffect(() => {
    // Remove existing schema scripts
    const existingScripts = document.querySelectorAll('script[data-schema-org]');
    existingScripts.forEach(script => script.remove());

    // Generate and inject schemas
    schemas.forEach((schema, index) => {
      let schemaData;

      switch (schema.type) {
        case 'LocalBusiness':
          schemaData = generateLocalBusinessSchema();
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
        default:
          return;
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-schema-org', `schema-${index}`);
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    });

    return () => {
      const scripts = document.querySelectorAll('script[data-schema-org]');
      scripts.forEach(script => script.remove());
    };
  }, [schemas]);

  return null;
};

export default SchemaOrg;
