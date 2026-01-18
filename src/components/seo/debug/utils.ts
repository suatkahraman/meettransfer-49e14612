import { 
  SchemaScript, 
  AggregateRating, 
  ValidationIssue, 
  MetaTagData, 
  MetaTagIssue,
  HreflangTag 
} from './types';

// Schema.org validation rules
export const validateSchema = (parsed: Record<string, unknown>, index: number): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const schemaType = (parsed['@type'] as string) || 'Unknown';

  // Check for @context
  if (!parsed['@context']) {
    issues.push({
      level: 'error',
      schemaIndex: index,
      schemaType,
      field: '@context',
      message: '@context eksik - "https://schema.org" olmalı'
    });
  }

  // LocalBusiness validations
  if (schemaType === 'LocalBusiness' || schemaType === 'Organization') {
    if (!parsed['name']) {
      issues.push({ level: 'error', schemaIndex: index, schemaType, field: 'name', message: 'name alanı zorunlu' });
    }
    if (!parsed['url']) {
      issues.push({ level: 'warning', schemaIndex: index, schemaType, field: 'url', message: 'url alanı önerilir' });
    }
    if (!parsed['telephone'] && !parsed['email']) {
      issues.push({ level: 'warning', schemaIndex: index, schemaType, field: 'contact', message: 'telephone veya email önerilir' });
    }
    if (!parsed['address']) {
      issues.push({ level: 'warning', schemaIndex: index, schemaType, field: 'address', message: 'address alanı önerilir' });
    }
  }

  // AggregateRating validations
  if (parsed['aggregateRating']) {
    const rating = parsed['aggregateRating'] as Record<string, unknown>;
    
    if (!rating['ratingValue']) {
      issues.push({ level: 'error', schemaIndex: index, schemaType, field: 'aggregateRating.ratingValue', message: 'ratingValue zorunlu' });
    } else {
      const val = Number(rating['ratingValue']);
      if (isNaN(val) || val < 1 || val > 5) {
        issues.push({ level: 'warning', schemaIndex: index, schemaType, field: 'aggregateRating.ratingValue', message: 'ratingValue 1-5 arasında olmalı' });
      }
    }
    
    if (!rating['reviewCount'] && !rating['ratingCount']) {
      issues.push({ level: 'error', schemaIndex: index, schemaType, field: 'aggregateRating.reviewCount', message: 'reviewCount veya ratingCount zorunlu' });
    }
    
    if (!rating['bestRating']) {
      issues.push({ level: 'info', schemaIndex: index, schemaType, field: 'aggregateRating.bestRating', message: 'bestRating belirtilmemiş (varsayılan: 5)' });
    }
  }

  // Service validations
  if (schemaType === 'Service' || schemaType === 'TransportationService') {
    if (!parsed['provider']) {
      issues.push({ level: 'warning', schemaIndex: index, schemaType, field: 'provider', message: 'provider alanı önerilir' });
    }
    if (!parsed['areaServed']) {
      issues.push({ level: 'info', schemaIndex: index, schemaType, field: 'areaServed', message: 'areaServed belirtilmemiş' });
    }
  }

  // WebSite validations
  if (schemaType === 'WebSite') {
    if (!parsed['url']) {
      issues.push({ level: 'error', schemaIndex: index, schemaType, field: 'url', message: 'url alanı zorunlu' });
    }
  }

  // Article validations
  if (schemaType === 'Article' || schemaType === 'BlogPosting') {
    if (!parsed['headline']) {
      issues.push({ level: 'error', schemaIndex: index, schemaType, field: 'headline', message: 'headline alanı zorunlu' });
    }
    if (!parsed['author']) {
      issues.push({ level: 'warning', schemaIndex: index, schemaType, field: 'author', message: 'author alanı önerilir' });
    }
    if (!parsed['datePublished']) {
      issues.push({ level: 'warning', schemaIndex: index, schemaType, field: 'datePublished', message: 'datePublished alanı önerilir' });
    }
  }

  // FAQPage validations
  if (schemaType === 'FAQPage') {
    if (!parsed['mainEntity'] || !Array.isArray(parsed['mainEntity']) || (parsed['mainEntity'] as unknown[]).length === 0) {
      issues.push({ level: 'error', schemaIndex: index, schemaType, field: 'mainEntity', message: 'mainEntity dizisi zorunlu ve en az bir soru içermeli' });
    }
  }

  return issues;
};

export const parsePageSchemas = (doc: Document): { schemas: SchemaScript[]; ratings: AggregateRating[]; issues: ValidationIssue[] } => {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const foundSchemas: SchemaScript[] = [];
  const foundRatings: AggregateRating[] = [];
  let allIssues: ValidationIssue[] = [];

  scripts.forEach((script, index) => {
    try {
      const content = script.textContent || '';
      const parsed = JSON.parse(content);
      
      const schemaType = parsed['@type'] || 'Unknown';
      let hasAggregateRating = false;
      let aggregateRating: AggregateRating | undefined;

      if (parsed.aggregateRating) {
        hasAggregateRating = true;
        aggregateRating = {
          ratingValue: parsed.aggregateRating.ratingValue,
          reviewCount: parsed.aggregateRating.reviewCount,
          bestRating: parsed.aggregateRating.bestRating,
          worstRating: parsed.aggregateRating.worstRating,
          source: `Script #${index + 1}`,
          schemaType: schemaType,
        };
        foundRatings.push(aggregateRating);
      }

      // Validate schema
      const schemaIssues = validateSchema(parsed, index + 1);
      allIssues = [...allIssues, ...schemaIssues];

      foundSchemas.push({
        index: index + 1,
        type: schemaType,
        hasAggregateRating,
        aggregateRating,
        raw: JSON.stringify(parsed, null, 2),
        parsed,
      });
    } catch (e) {
      foundSchemas.push({
        index: index + 1,
        type: 'Parse Error',
        hasAggregateRating: false,
        raw: script.textContent || 'Empty',
      });
      allIssues.push({
        level: 'error',
        schemaIndex: index + 1,
        schemaType: 'Unknown',
        field: 'JSON',
        message: 'JSON parse hatası - geçersiz format'
      });
    }
  });

  // Check for multiple aggregate ratings (global issue)
  if (foundRatings.length > 1) {
    allIssues.unshift({
      level: 'error',
      schemaIndex: 0,
      schemaType: 'Global',
      field: 'aggregateRating',
      message: `Birden fazla aggregateRating tespit edildi (${foundRatings.length} adet) - Google "multiple ratings" hatası verecektir!`
    });
  }

  return { schemas: foundSchemas, ratings: foundRatings, issues: allIssues };
};

export const parseHtmlString = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return parsePageSchemas(doc);
};

// Parse hreflang tags from HTML
export const parseHreflangTags = (html: string): HreflangTag[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.querySelectorAll('link[rel="alternate"][hreflang]');
  const tags: HreflangTag[] = [];
  
  links.forEach(link => {
    const hreflang = link.getAttribute('hreflang');
    const href = link.getAttribute('href');
    if (hreflang && href) {
      tags.push({ hreflang, href });
    }
  });
  
  return tags;
};

// Parse canonical URL from HTML
export const parseCanonicalUrl = (html: string): string | null => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const canonicalLink = doc.querySelector('link[rel="canonical"]');
  return canonicalLink?.getAttribute('href') || null;
};

// Parse meta tags from HTML
export const parseMetaTags = (html: string): MetaTagData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const getMetaContent = (name: string, property?: string): string | null => {
    let meta = doc.querySelector(`meta[name="${name}"]`);
    if (!meta && property) {
      meta = doc.querySelector(`meta[property="${property}"]`);
    }
    return meta?.getAttribute('content') || null;
  };

  const title = doc.querySelector('title')?.textContent || null;
  const description = getMetaContent('description');
  const robots = getMetaContent('robots');
  const keywords = getMetaContent('keywords');
  const viewport = getMetaContent('viewport');
  const ogTitle = getMetaContent('og:title', 'og:title');
  const ogDescription = getMetaContent('og:description', 'og:description');
  const ogImage = getMetaContent('og:image', 'og:image');
  const ogType = getMetaContent('og:type', 'og:type');
  const twitterCard = getMetaContent('twitter:card');
  const twitterTitle = getMetaContent('twitter:title');
  const twitterDescription = getMetaContent('twitter:description');

  return {
    title,
    titleLength: title?.length || 0,
    description,
    descriptionLength: description?.length || 0,
    robots,
    keywords,
    viewport,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    twitterCard,
    twitterTitle,
    twitterDescription,
  };
};

// Validate meta tags
export const validateMetaTags = (metaTags: MetaTagData): MetaTagIssue[] => {
  const issues: MetaTagIssue[] = [];

  // Title validation - Google typically displays 50-60 chars, but allows up to ~70
  if (!metaTags.title) {
    issues.push({ level: 'error', field: 'title', message: 'Title etiketi eksik - her sayfada title olmalı' });
  } else {
    if (metaTags.titleLength < 20) {
      issues.push({ level: 'warning', field: 'title', message: `Title çok kısa (${metaTags.titleLength} karakter) - 30-60 karakter önerilir` });
    } else if (metaTags.titleLength > 70) {
      issues.push({ level: 'info', field: 'title', message: `Title uzun (${metaTags.titleLength} karakter) - 60 karaktere kadarı Google'da tam görünür` });
    }
  }

  // Description validation - Google shows ~155-160 chars on desktop, ~120 on mobile
  if (!metaTags.description) {
    issues.push({ level: 'error', field: 'description', message: 'Meta description eksik - SEO için kritik' });
  } else {
    if (metaTags.descriptionLength < 50) {
      issues.push({ level: 'warning', field: 'description', message: `Description çok kısa (${metaTags.descriptionLength} karakter) - 120-160 karakter önerilir` });
    } else if (metaTags.descriptionLength > 170) {
      issues.push({ level: 'info', field: 'description', message: `Description uzun (${metaTags.descriptionLength} karakter) - 160 karaktere kadarı Google'da görünür` });
    }
  }

  // Robots validation - only warn if noindex is set
  if (metaTags.robots?.includes('noindex')) {
    issues.push({ level: 'warning', field: 'robots', message: 'Sayfa noindex olarak işaretlenmiş - Google\'da görünmeyecek' });
  }

  // Viewport validation
  if (!metaTags.viewport) {
    issues.push({ level: 'error', field: 'viewport', message: 'Viewport meta etiketi eksik - mobil uyumluluk için gerekli' });
  }

  // Open Graph validation - only warn if ALL are missing
  const hasAnyOgTag = metaTags.ogTitle || metaTags.ogDescription || metaTags.ogImage;
  if (!hasAnyOgTag) {
    issues.push({ level: 'warning', field: 'og:*', message: 'Open Graph etiketleri eksik - sosyal medya paylaşımları için önemli' });
  } else {
    // Only info level for individual missing OG tags if some exist
    if (!metaTags.ogImage) {
      issues.push({ level: 'info', field: 'og:image', message: 'Open Graph image eksik' });
    }
  }

  // Twitter Card validation - info only
  if (!metaTags.twitterCard && !hasAnyOgTag) {
    issues.push({ level: 'info', field: 'twitter:card', message: 'Twitter Card tipi eksik' });
  }

  return issues;
};

// Get issue level badge color
export const getIssueLevelColor = (level: 'error' | 'warning' | 'info'): string => {
  switch (level) {
    case 'error': return 'text-destructive';
    case 'warning': return 'text-yellow-600';
    case 'info': return 'text-blue-600';
    default: return '';
  }
};

// Get issue level badge variant
export const getIssueLevelVariant = (level: 'error' | 'warning' | 'info'): 'destructive' | 'outline' | 'secondary' => {
  switch (level) {
    case 'error': return 'destructive';
    case 'warning': return 'outline';
    case 'info': return 'secondary';
    default: return 'outline';
  }
};
