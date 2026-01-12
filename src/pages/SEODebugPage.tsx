import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, CheckCircle, Code, Star, Search, Home, RefreshCw, 
  ExternalLink, AlertTriangle, Info, Globe, Languages, Link2, FileText, Tag,
  Bot, Gauge, Clock, Zap, FileCode, Map, Share2, Twitter, Facebook, Image
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, type Language } from '@/hooks/useLanguageFromUrl';
import { useSitemapRobotsValidation } from '@/hooks/useSitemapRobotsValidation';
import { useCoreWebVitals } from '@/hooks/useCoreWebVitals';
import { useSocialPreview } from '@/hooks/useSocialPreview';

interface AggregateRating {
  ratingValue: string | number;
  reviewCount: string | number;
  bestRating?: string | number;
  worstRating?: string | number;
  source: string;
  schemaType: string;
}

interface SchemaScript {
  index: number;
  type: string;
  hasAggregateRating: boolean;
  aggregateRating?: AggregateRating;
  raw: string;
  parsed?: Record<string, unknown>;
}

interface ValidationIssue {
  level: 'error' | 'warning' | 'info';
  schemaIndex: number;
  schemaType: string;
  field: string;
  message: string;
}

interface ScanResult {
  url: string;
  schemas: SchemaScript[];
  aggregateRatings: AggregateRating[];
  validationIssues: ValidationIssue[];
  scannedAt: Date;
}

// Schema.org validation rules
const validateSchema = (parsed: Record<string, unknown>, index: number): ValidationIssue[] => {
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

// Language scan result interface
interface LanguageScanResult {
  language: Language;
  path: string;
  url: string;
  schemas: SchemaScript[];
  aggregateRatings: AggregateRating[];
  validationIssues: ValidationIssue[];
  scannedAt: Date;
  error?: string;
}

interface LanguageComparisonSummary {
  totalLanguages: number;
  scannedLanguages: number;
  languagesWithErrors: number;
  languagesWithRatings: number;
  inconsistentRatings: boolean;
}

// Hreflang validation interfaces
interface HreflangTag {
  hreflang: string;
  href: string;
}

interface HreflangValidationResult {
  language: Language;
  url: string;
  hreflangTags: HreflangTag[];
  issues: HreflangIssue[];
  hasXDefault: boolean;
  hasSelfReference: boolean;
  scannedAt: Date;
  error?: string;
}

interface HreflangIssue {
  level: 'error' | 'warning' | 'info';
  message: string;
  affectedLanguages?: string[];
}

interface HreflangSummary {
  totalLanguages: number;
  scannedLanguages: number;
  languagesWithIssues: number;
  missingBidirectional: number;
  missingXDefault: number;
  missingSelfReference: number;
}

// Canonical validation interfaces
interface CanonicalValidationResult {
  language: Language;
  url: string;
  canonicalUrl: string | null;
  issues: CanonicalIssue[];
  isSelfReferencing: boolean;
  isAbsoluteUrl: boolean;
  scannedAt: Date;
  error?: string;
}

interface CanonicalIssue {
  level: 'error' | 'warning' | 'info';
  message: string;
}

interface CanonicalSummary {
  totalLanguages: number;
  scannedLanguages: number;
  languagesWithIssues: number;
  missingCanonical: number;
  nonSelfReferencing: number;
  relativeUrls: number;
  inconsistentPatterns: boolean;
}

// Meta tag validation interfaces
interface MetaTagData {
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  robots: string | null;
  keywords: string | null;
  viewport: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
}

interface MetaTagValidationResult {
  language: Language;
  url: string;
  metaTags: MetaTagData;
  issues: MetaTagIssue[];
  scannedAt: Date;
  error?: string;
}

interface MetaTagIssue {
  level: 'error' | 'warning' | 'info';
  field: string;
  message: string;
}

interface MetaTagSummary {
  totalLanguages: number;
  scannedLanguages: number;
  languagesWithIssues: number;
  missingTitle: number;
  missingDescription: number;
  titleTooLong: number;
  descriptionTooLong: number;
  missingOgTags: number;
  inconsistentTitles: boolean;
}

const LANGUAGE_TO_PREFIX: Record<Language, string> = {
  EN: "",
  TR: "/tr",
  DE: "/de",
  FR: "/fr",
  RU: "/ru",
  IT: "/it",
  ES: "/es",
  AR: "/ar",
  UK: "/uk",
  JA: "/ja",
};

const SEODebugPage = () => {
  const [currentPageSchemas, setCurrentPageSchemas] = useState<SchemaScript[]>([]);
  const [currentPageRatings, setCurrentPageRatings] = useState<AggregateRating[]>([]);
  const [currentPageIssues, setCurrentPageIssues] = useState<ValidationIssue[]>([]);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [customUrl, setCustomUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'scanned' | 'languages' | 'hreflang' | 'canonical' | 'metatags' | 'sitemap' | 'vitals' | 'social'>('current');
  
  // Robots/Sitemap validation
  const { robotsResult, sitemapResults, isScanning: isScanningRobots, scanProgress: robotsScanProgress, scanRobotsAndSitemap } = useSitemapRobotsValidation();
  
  // Core Web Vitals
  const { result: vitalsResult, liveMetrics, isScanning: isScanningVitals, scanWebVitals } = useCoreWebVitals();
  
  // Social preview
  const { result: socialResult, isScanning: isScanningSocial, imageLoading: socialImageLoading, scanPage: scanSocialPreview } = useSocialPreview();
  
  // Language scanning state
  const [languageScanResults, setLanguageScanResults] = useState<LanguageScanResult[]>([]);
  const [isScanningLanguages, setIsScanningLanguages] = useState(false);
  const [languageScanProgress, setLanguageScanProgress] = useState(0);
  const [languageScanPath, setLanguageScanPath] = useState('/');

  // Hreflang validation state
  const [hreflangResults, setHreflangResults] = useState<HreflangValidationResult[]>([]);
  const [isScanningHreflang, setIsScanningHreflang] = useState(false);
  const [hreflangScanProgress, setHreflangScanProgress] = useState(0);
  const [hreflangScanPath, setHreflangScanPath] = useState('/');

  // Canonical validation state
  const [canonicalResults, setCanonicalResults] = useState<CanonicalValidationResult[]>([]);
  const [isScanningCanonical, setIsScanningCanonical] = useState(false);
  const [canonicalScanProgress, setCanonicalScanProgress] = useState(0);
  const [canonicalScanPath, setCanonicalScanPath] = useState('/');

  // Meta tag validation state
  const [metaTagResults, setMetaTagResults] = useState<MetaTagValidationResult[]>([]);
  const [isScanningMetaTags, setIsScanningMetaTags] = useState(false);
  const [metaTagScanProgress, setMetaTagScanProgress] = useState(0);
  const [metaTagScanPath, setMetaTagScanPath] = useState('/');

  // Scan current page
  useEffect(() => {
    const scanCurrentPage = () => {
      const result = parsePageSchemas(document);
      setCurrentPageSchemas(result.schemas);
      setCurrentPageRatings(result.ratings);
      setCurrentPageIssues(result.issues);
    };

    scanCurrentPage();
    const timer = setTimeout(scanCurrentPage, 2000);
    return () => clearTimeout(timer);
  }, []);

  const parsePageSchemas = (doc: Document): { schemas: SchemaScript[]; ratings: AggregateRating[]; issues: ValidationIssue[] } => {
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

  const parseHtmlString = (html: string): { schemas: SchemaScript[]; ratings: AggregateRating[]; issues: ValidationIssue[] } => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return parsePageSchemas(doc);
  };

  const scanUrl = async (url: string) => {
    setIsScanning(true);
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'text/html' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const result = parseHtmlString(html);

      const scanResult: ScanResult = {
        url,
        schemas: result.schemas,
        aggregateRatings: result.ratings,
        validationIssues: result.issues,
        scannedAt: new Date(),
      };

      setScanResults(prev => [scanResult, ...prev.filter(r => r.url !== url)]);
      setActiveTab('scanned');
    } catch (error) {
      console.error('Scan error:', error);
      alert(`Sayfa taranamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsScanning(false);
    }
  };

  const scanHomepage = () => {
    const baseUrl = window.location.origin;
    scanUrl(baseUrl + '/');
  };

  const scanCustomUrl = () => {
    if (!customUrl) return;
    let url = customUrl;
    if (!url.startsWith('http')) {
      url = window.location.origin + (url.startsWith('/') ? url : '/' + url);
    }
    scanUrl(url);
  };

  const quickScanUrls = [
    { label: 'Ana Sayfa', path: '/' },
    { label: 'Reviews', path: '/reviews' },
    { label: 'Istanbul Transfer', path: '/istanbul-transfer' },
    { label: 'About', path: '/about' },
  ];

  // Scan all language versions
  const scanAllLanguages = async (basePath: string = '/') => {
    setIsScanningLanguages(true);
    setLanguageScanProgress(0);
    setLanguageScanResults([]);
    setActiveTab('languages');

    const baseUrl = window.location.origin;
    const results: LanguageScanResult[] = [];

    for (let i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
      const lang = SUPPORTED_LANGUAGES[i];
      const prefix = LANGUAGE_TO_PREFIX[lang];
      const path = prefix + (basePath === '/' ? '' : basePath);
      const url = baseUrl + (path || '/');

      try {
        const response = await fetch(url, {
          headers: { 'Accept': 'text/html' },
        });

        if (!response.ok) {
          results.push({
            language: lang,
            path: path || '/',
            url,
            schemas: [],
            aggregateRatings: [],
            validationIssues: [],
            scannedAt: new Date(),
            error: `HTTP ${response.status}`,
          });
        } else {
          const html = await response.text();
          const result = parseHtmlString(html);

          results.push({
            language: lang,
            path: path || '/',
            url,
            schemas: result.schemas,
            aggregateRatings: result.ratings,
            validationIssues: result.issues,
            scannedAt: new Date(),
          });
        }
      } catch (error) {
        results.push({
          language: lang,
          path: path || '/',
          url,
          schemas: [],
          aggregateRatings: [],
          validationIssues: [],
          scannedAt: new Date(),
          error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        });
      }

      setLanguageScanProgress(((i + 1) / SUPPORTED_LANGUAGES.length) * 100);
      setLanguageScanResults([...results]);
    }

    setIsScanningLanguages(false);
  };

  // Calculate language comparison summary
  const getLanguageComparisonSummary = (): LanguageComparisonSummary => {
    const successfulScans = languageScanResults.filter(r => !r.error);
    const withErrors = languageScanResults.filter(r => 
      r.validationIssues.some(i => i.level === 'error')
    );
    const withRatings = languageScanResults.filter(r => r.aggregateRatings.length > 0);
    
    // Check if ratings are consistent across languages
    const ratingValues = successfulScans
      .filter(r => r.aggregateRatings.length > 0)
      .map(r => r.aggregateRatings[0]?.ratingValue);
    const uniqueRatings = [...new Set(ratingValues)];
    
    return {
      totalLanguages: SUPPORTED_LANGUAGES.length,
      scannedLanguages: successfulScans.length,
      languagesWithErrors: withErrors.length,
      languagesWithRatings: withRatings.length,
      inconsistentRatings: uniqueRatings.length > 1,
    };
  };

  // Parse hreflang tags from HTML
  const parseHreflangTags = (html: string): HreflangTag[] => {
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

  // Scan all languages for hreflang validation
  const scanHreflangTags = async (basePath: string = '/') => {
    setIsScanningHreflang(true);
    setHreflangScanProgress(0);
    setHreflangResults([]);
    setActiveTab('hreflang');

    const baseUrl = window.location.origin;
    const results: HreflangValidationResult[] = [];

    // First, collect all hreflang data from all language versions
    for (let i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
      const lang = SUPPORTED_LANGUAGES[i];
      const prefix = LANGUAGE_TO_PREFIX[lang];
      const path = prefix + (basePath === '/' ? '' : basePath);
      const url = baseUrl + (path || '/');

      try {
        const response = await fetch(url, {
          headers: { 'Accept': 'text/html' },
        });

        if (!response.ok) {
          results.push({
            language: lang,
            url,
            hreflangTags: [],
            issues: [],
            hasXDefault: false,
            hasSelfReference: false,
            scannedAt: new Date(),
            error: `HTTP ${response.status}`,
          });
        } else {
          const html = await response.text();
          const hreflangTags = parseHreflangTags(html);
          
          results.push({
            language: lang,
            url,
            hreflangTags,
            issues: [],
            hasXDefault: hreflangTags.some(t => t.hreflang === 'x-default'),
            hasSelfReference: hreflangTags.some(t => t.href === url),
            scannedAt: new Date(),
          });
        }
      } catch (error) {
        results.push({
          language: lang,
          url,
          hreflangTags: [],
          issues: [],
          hasXDefault: false,
          hasSelfReference: false,
          scannedAt: new Date(),
          error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        });
      }

      setHreflangScanProgress(((i + 1) / SUPPORTED_LANGUAGES.length) * 100);
      setHreflangResults([...results]);
    }

    // Now validate bidirectional links and other issues
    const validatedResults = results.map(result => {
      if (result.error) return result;
      
      const issues: HreflangIssue[] = [];
      
      // Check for x-default
      if (!result.hasXDefault) {
        issues.push({
          level: 'warning',
          message: 'x-default hreflang etiketi eksik',
        });
      }
      
      // Check for self-reference
      if (!result.hasSelfReference) {
        issues.push({
          level: 'error',
          message: 'Kendine referans (self-referencing) hreflang etiketi eksik',
        });
      }

      // Check if all supported languages are covered
      const languagesInTags = result.hreflangTags.map(t => t.hreflang.toUpperCase().split('-')[0]);
      const missingLanguages = SUPPORTED_LANGUAGES.filter(lang => {
        const langCode = lang.toLowerCase();
        return !languagesInTags.some(t => t.toLowerCase() === langCode);
      });
      
      if (missingLanguages.length > 0) {
        issues.push({
          level: 'warning',
          message: `Eksik dil etiketleri: ${missingLanguages.join(', ')}`,
          affectedLanguages: missingLanguages,
        });
      }

      // Check bidirectional linking
      result.hreflangTags.forEach(tag => {
        if (tag.hreflang === 'x-default') return;
        
        // Find the target page in our results
        const targetResult = results.find(r => r.url === tag.href);
        if (targetResult && !targetResult.error) {
          // Check if target page links back to this page
          const hasBacklink = targetResult.hreflangTags.some(t => t.href === result.url);
          if (!hasBacklink) {
            issues.push({
              level: 'error',
              message: `${tag.hreflang} sayfası (${tag.href}) bu sayfaya geri bağlantı vermiyor`,
            });
          }
        }
      });

      return { ...result, issues };
    });

    setHreflangResults(validatedResults);
    setIsScanningHreflang(false);
  };

  // Calculate hreflang summary
  const getHreflangSummary = (): HreflangSummary => {
    const successfulScans = hreflangResults.filter(r => !r.error);
    const withIssues = hreflangResults.filter(r => 
      r.issues.some(i => i.level === 'error' || i.level === 'warning')
    );
    const missingXDefault = hreflangResults.filter(r => !r.error && !r.hasXDefault);
    const missingSelfRef = hreflangResults.filter(r => !r.error && !r.hasSelfReference);
    const bidirectionalErrors = hreflangResults.filter(r => 
      r.issues.some(i => i.message.includes('geri bağlantı'))
    );
    
    return {
      totalLanguages: SUPPORTED_LANGUAGES.length,
      scannedLanguages: successfulScans.length,
      languagesWithIssues: withIssues.length,
      missingBidirectional: bidirectionalErrors.length,
      missingXDefault: missingXDefault.length,
      missingSelfReference: missingSelfRef.length,
    };
  };

  // Parse canonical URL from HTML
  const parseCanonicalUrl = (html: string): string | null => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const canonicalLink = doc.querySelector('link[rel="canonical"]');
    return canonicalLink?.getAttribute('href') || null;
  };

  // Scan all languages for canonical validation
  const scanCanonicalUrls = async (basePath: string = '/') => {
    setIsScanningCanonical(true);
    setCanonicalScanProgress(0);
    setCanonicalResults([]);
    setActiveTab('canonical');

    const baseUrl = window.location.origin;
    const results: CanonicalValidationResult[] = [];

    for (let i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
      const lang = SUPPORTED_LANGUAGES[i];
      const prefix = LANGUAGE_TO_PREFIX[lang];
      const path = prefix + (basePath === '/' ? '' : basePath);
      const url = baseUrl + (path || '/');

      try {
        const response = await fetch(url, {
          headers: { 'Accept': 'text/html' },
        });

        if (!response.ok) {
          results.push({
            language: lang,
            url,
            canonicalUrl: null,
            issues: [],
            isSelfReferencing: false,
            isAbsoluteUrl: false,
            scannedAt: new Date(),
            error: `HTTP ${response.status}`,
          });
        } else {
          const html = await response.text();
          const canonicalUrl = parseCanonicalUrl(html);
          
          const issues: CanonicalIssue[] = [];
          let isSelfReferencing = false;
          let isAbsoluteUrl = false;

          if (!canonicalUrl) {
            issues.push({
              level: 'error',
              message: 'Canonical tag eksik - her sayfada canonical URL olmalı',
            });
          } else {
            // Check if absolute URL
            isAbsoluteUrl = canonicalUrl.startsWith('http://') || canonicalUrl.startsWith('https://');
            if (!isAbsoluteUrl) {
              issues.push({
                level: 'error',
                message: 'Canonical URL mutlak (absolute) olmalı, göreli (relative) değil',
              });
            }

            // Check if self-referencing
            isSelfReferencing = canonicalUrl === url;
            if (!isSelfReferencing) {
              // Check if it's pointing to another language version (might be intentional)
              const canonicalPointsToAnotherLang = SUPPORTED_LANGUAGES.some(l => {
                const langPrefix = LANGUAGE_TO_PREFIX[l];
                const expectedUrl = baseUrl + langPrefix + (basePath === '/' ? '' : basePath);
                return canonicalUrl === expectedUrl && l !== lang;
              });

              if (canonicalPointsToAnotherLang) {
                issues.push({
                  level: 'warning',
                  message: `Canonical başka bir dil versiyonuna işaret ediyor: ${canonicalUrl}`,
                });
              } else if (canonicalUrl.includes(baseUrl)) {
                issues.push({
                  level: 'info',
                  message: `Canonical kendi URL'si değil: ${canonicalUrl}`,
                });
              } else {
                issues.push({
                  level: 'error',
                  message: `Canonical harici bir URL'ye işaret ediyor: ${canonicalUrl}`,
                });
              }
            }

            // Check for trailing slash consistency
            const urlHasTrailingSlash = url.endsWith('/');
            const canonicalHasTrailingSlash = canonicalUrl.endsWith('/');
            if (isSelfReferencing === false && urlHasTrailingSlash !== canonicalHasTrailingSlash) {
              // Only warn if they're otherwise the same
              const normalizedUrl = url.replace(/\/$/, '');
              const normalizedCanonical = canonicalUrl.replace(/\/$/, '');
              if (normalizedUrl === normalizedCanonical) {
                issues.push({
                  level: 'warning',
                  message: 'Trailing slash tutarsızlığı: URL ve canonical farklı bitiyor',
                });
              }
            }
          }

          results.push({
            language: lang,
            url,
            canonicalUrl,
            issues,
            isSelfReferencing,
            isAbsoluteUrl,
            scannedAt: new Date(),
          });
        }
      } catch (error) {
        results.push({
          language: lang,
          url,
          canonicalUrl: null,
          issues: [],
          isSelfReferencing: false,
          isAbsoluteUrl: false,
          scannedAt: new Date(),
          error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        });
      }

      setCanonicalScanProgress(((i + 1) / SUPPORTED_LANGUAGES.length) * 100);
      setCanonicalResults([...results]);
    }

    setIsScanningCanonical(false);
  };

  // Calculate canonical summary
  const getCanonicalSummary = (): CanonicalSummary => {
    const successfulScans = canonicalResults.filter(r => !r.error);
    const withIssues = canonicalResults.filter(r => 
      r.issues.some(i => i.level === 'error' || i.level === 'warning')
    );
    const missingCanonical = canonicalResults.filter(r => !r.error && !r.canonicalUrl);
    const nonSelfRef = canonicalResults.filter(r => !r.error && r.canonicalUrl && !r.isSelfReferencing);
    const relativeUrls = canonicalResults.filter(r => !r.error && r.canonicalUrl && !r.isAbsoluteUrl);

    // Check for consistent pattern (all self-referencing or all pointing to same base)
    const canonicalPatterns = successfulScans
      .filter(r => r.canonicalUrl)
      .map(r => r.isSelfReferencing ? 'self' : 'other');
    const uniquePatterns = [...new Set(canonicalPatterns)];
    
    return {
      totalLanguages: SUPPORTED_LANGUAGES.length,
      scannedLanguages: successfulScans.length,
      languagesWithIssues: withIssues.length,
      missingCanonical: missingCanonical.length,
      nonSelfReferencing: nonSelfRef.length,
      relativeUrls: relativeUrls.length,
      inconsistentPatterns: uniquePatterns.length > 1,
    };
  };

  // Parse meta tags from HTML
  const parseMetaTags = (html: string): MetaTagData => {
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
  const validateMetaTags = (metaTags: MetaTagData): MetaTagIssue[] => {
    const issues: MetaTagIssue[] = [];

    // Title validation
    if (!metaTags.title) {
      issues.push({ level: 'error', field: 'title', message: 'Title etiketi eksik - her sayfada title olmalı' });
    } else {
      if (metaTags.titleLength < 30) {
        issues.push({ level: 'warning', field: 'title', message: `Title çok kısa (${metaTags.titleLength} karakter) - 50-60 karakter önerilir` });
      } else if (metaTags.titleLength > 60) {
        issues.push({ level: 'warning', field: 'title', message: `Title çok uzun (${metaTags.titleLength} karakter) - 60 karakteri geçmemeli` });
      }
    }

    // Description validation
    if (!metaTags.description) {
      issues.push({ level: 'error', field: 'description', message: 'Meta description eksik - SEO için kritik' });
    } else {
      if (metaTags.descriptionLength < 70) {
        issues.push({ level: 'warning', field: 'description', message: `Description çok kısa (${metaTags.descriptionLength} karakter) - 120-160 karakter önerilir` });
      } else if (metaTags.descriptionLength > 160) {
        issues.push({ level: 'warning', field: 'description', message: `Description çok uzun (${metaTags.descriptionLength} karakter) - 160 karakteri geçmemeli` });
      }
    }

    // Robots validation
    if (!metaTags.robots) {
      issues.push({ level: 'info', field: 'robots', message: 'Robots meta etiketi tanımlı değil (varsayılan: index, follow)' });
    } else if (metaTags.robots.includes('noindex')) {
      issues.push({ level: 'warning', field: 'robots', message: 'Sayfa noindex olarak işaretlenmiş - Google\'da görünmeyecek' });
    }

    // Viewport validation
    if (!metaTags.viewport) {
      issues.push({ level: 'error', field: 'viewport', message: 'Viewport meta etiketi eksik - mobil uyumluluk için gerekli' });
    }

    // Open Graph validation
    if (!metaTags.ogTitle) {
      issues.push({ level: 'warning', field: 'og:title', message: 'Open Graph title eksik - sosyal medya paylaşımları için önemli' });
    }
    if (!metaTags.ogDescription) {
      issues.push({ level: 'warning', field: 'og:description', message: 'Open Graph description eksik' });
    }
    if (!metaTags.ogImage) {
      issues.push({ level: 'warning', field: 'og:image', message: 'Open Graph image eksik - sosyal medya görseleri için' });
    }
    if (!metaTags.ogType) {
      issues.push({ level: 'info', field: 'og:type', message: 'Open Graph type tanımlı değil (varsayılan: website)' });
    }

    // Twitter Card validation
    if (!metaTags.twitterCard) {
      issues.push({ level: 'info', field: 'twitter:card', message: 'Twitter Card meta etiketi eksik' });
    }

    return issues;
  };

  // Scan all languages for meta tags
  const scanMetaTags = async (basePath: string = '/') => {
    setIsScanningMetaTags(true);
    setMetaTagScanProgress(0);
    setMetaTagResults([]);
    setActiveTab('metatags');

    const baseUrl = window.location.origin;
    const results: MetaTagValidationResult[] = [];

    for (let i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
      const lang = SUPPORTED_LANGUAGES[i];
      const prefix = LANGUAGE_TO_PREFIX[lang];
      const path = prefix + (basePath === '/' ? '' : basePath);
      const url = baseUrl + (path || '/');

      try {
        const response = await fetch(url, {
          headers: { 'Accept': 'text/html' },
        });

        if (!response.ok) {
          results.push({
            language: lang,
            url,
            metaTags: {
              title: null, titleLength: 0,
              description: null, descriptionLength: 0,
              robots: null, keywords: null, viewport: null,
              ogTitle: null, ogDescription: null, ogImage: null, ogType: null,
              twitterCard: null, twitterTitle: null, twitterDescription: null,
            },
            issues: [],
            scannedAt: new Date(),
            error: `HTTP ${response.status}`,
          });
        } else {
          const html = await response.text();
          const metaTags = parseMetaTags(html);
          const issues = validateMetaTags(metaTags);

          results.push({
            language: lang,
            url,
            metaTags,
            issues,
            scannedAt: new Date(),
          });
        }
      } catch (error) {
        results.push({
          language: lang,
          url,
          metaTags: {
            title: null, titleLength: 0,
            description: null, descriptionLength: 0,
            robots: null, keywords: null, viewport: null,
            ogTitle: null, ogDescription: null, ogImage: null, ogType: null,
            twitterCard: null, twitterTitle: null, twitterDescription: null,
          },
          issues: [],
          scannedAt: new Date(),
          error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        });
      }

      setMetaTagScanProgress(((i + 1) / SUPPORTED_LANGUAGES.length) * 100);
      setMetaTagResults([...results]);
    }

    setIsScanningMetaTags(false);
  };

  // Calculate meta tag summary
  const getMetaTagSummary = (): MetaTagSummary => {
    const successfulScans = metaTagResults.filter(r => !r.error);
    const withIssues = metaTagResults.filter(r => 
      r.issues.some(i => i.level === 'error' || i.level === 'warning')
    );
    const missingTitle = metaTagResults.filter(r => !r.error && !r.metaTags.title);
    const missingDescription = metaTagResults.filter(r => !r.error && !r.metaTags.description);
    const titleTooLong = metaTagResults.filter(r => !r.error && r.metaTags.titleLength > 60);
    const descriptionTooLong = metaTagResults.filter(r => !r.error && r.metaTags.descriptionLength > 160);
    const missingOgTags = metaTagResults.filter(r => 
      !r.error && (!r.metaTags.ogTitle || !r.metaTags.ogDescription || !r.metaTags.ogImage)
    );

    // Check title consistency across languages
    const titles = successfulScans
      .filter(r => r.metaTags.title)
      .map(r => r.metaTags.title);
    const uniqueTitles = [...new Set(titles)];
    
    return {
      totalLanguages: SUPPORTED_LANGUAGES.length,
      scannedLanguages: successfulScans.length,
      languagesWithIssues: withIssues.length,
      missingTitle: missingTitle.length,
      missingDescription: missingDescription.length,
      titleTooLong: titleTooLong.length,
      descriptionTooLong: descriptionTooLong.length,
      missingOgTags: missingOgTags.length,
      inconsistentTitles: uniqueTitles.length === successfulScans.length && successfulScans.length > 1, // All different = localized
    };
  };

  const getIssueCounts = (issues: ValidationIssue[]) => {
    return {
      errors: issues.filter(i => i.level === 'error').length,
      warnings: issues.filter(i => i.level === 'warning').length,
      infos: issues.filter(i => i.level === 'info').length,
    };
  };

  const renderValidationCard = (issues: ValidationIssue[]) => {
    const counts = getIssueCounts(issues);
    const hasErrors = counts.errors > 0;
    const hasWarnings = counts.warnings > 0;

    return (
      <Card className={hasErrors ? 'border-destructive' : hasWarnings ? 'border-yellow-500' : 'border-green-500'}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            {hasErrors ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-destructive">Validasyon Hataları</span>
              </>
            ) : hasWarnings ? (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-yellow-600">Uyarılar Var</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-500">Validasyon Başarılı</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-xl font-bold text-destructive">{counts.errors}</div>
              <div className="text-xs text-muted-foreground">Hata</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">{counts.warnings}</div>
              <div className="text-xs text-muted-foreground">Uyarı</div>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{counts.infos}</div>
              <div className="text-xs text-muted-foreground">Bilgi</div>
            </div>
          </div>

          {issues.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                    issue.level === 'error' ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' :
                    issue.level === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300' :
                    'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {issue.level === 'error' ? <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /> :
                   issue.level === 'warning' ? <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" /> :
                   <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                  <div>
                    <span className="font-medium">{issue.schemaType}</span>
                    {issue.schemaIndex > 0 && <span className="opacity-70"> (#{issue.schemaIndex})</span>}
                    <span className="opacity-70"> → {issue.field}:</span>
                    <span className="ml-1">{issue.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSummaryCard = (ratings: AggregateRating[], title: string) => {
    const hasMultipleRatings = ratings.length > 1;
    
    return (
      <Card className={hasMultipleRatings ? 'border-destructive' : 'border-green-500'}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            {hasMultipleRatings ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-destructive">Multiple Ratings! ({title})</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-500">OK ({title})</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className={`text-xl font-bold ${hasMultipleRatings ? 'text-destructive' : 'text-foreground'}`}>
                {ratings.length}
              </div>
              <div className="text-xs text-muted-foreground">Ratings</div>
            </div>
            {ratings[0] && (
              <>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-foreground flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {ratings[0].ratingValue}
                  </div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-foreground">{ratings[0].reviewCount}</div>
                  <div className="text-xs text-muted-foreground">Reviews</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-foreground">{ratings[0].schemaType}</div>
                  <div className="text-xs text-muted-foreground">Type</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSchemaList = (schemas: SchemaScript[], ratings: AggregateRating[]) => (
    <>
      {ratings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4" />
              Aggregate Ratings ({ratings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ratings.map((rating, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-lg text-sm"
                >
                  <Badge variant="outline" className="text-xs">{rating.source}</Badge>
                  <Badge variant="secondary" className="text-xs">{rating.schemaType}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{rating.ratingValue}</span>
                  </div>
                  <span className="text-muted-foreground">|</span>
                  <span>{rating.reviewCount} reviews</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Code className="h-4 w-4" />
            JSON-LD Scripts ({schemas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {schemas.map((schema) => (
              <div key={schema.index} className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 p-2 bg-muted">
                  <Badge className="text-xs">#{schema.index}</Badge>
                  <Badge variant="secondary" className="text-xs">{schema.type}</Badge>
                  {schema.hasAggregateRating && (
                    <Badge variant="default" className="bg-yellow-500 text-xs">Rating</Badge>
                  )}
                </div>
                <details className="group">
                  <summary className="px-3 py-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    JSON göster
                  </summary>
                  <pre className="p-2 bg-black text-green-400 text-[10px] overflow-x-auto max-h-60">
                    {schema.raw}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">SEO Debug - JSON-LD Validator</h1>
          <p className="text-sm text-muted-foreground">
            Schema.org validasyonu ile JSON-LD scriptlerini kontrol edin
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Sayfa Tara
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={scanHomepage}
                disabled={isScanning}
                variant="default"
                size="sm"
              >
                <Home className="h-4 w-4 mr-1" />
                Ana Sayfa
                {isScanning && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
              </Button>
              {quickScanUrls.slice(1).map((item) => (
                <Button
                  key={item.path}
                  onClick={() => scanUrl(window.location.origin + item.path)}
                  disabled={isScanning}
                  variant="outline"
                  size="sm"
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="/sayfa-yolu veya tam URL"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && scanCustomUrl()}
                className="text-sm"
              />
              <Button
                onClick={scanCustomUrl}
                disabled={isScanning || !customUrl}
                size="sm"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Language Scan Card */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Tüm Dilleri Tara
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Bir sayfanın tüm dil versiyonlarını (/tr, /de, /fr, vb.) tarayıp karşılaştırın
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Sayfa yolu (örn: / veya /reviews)"
                value={languageScanPath}
                onChange={(e) => setLanguageScanPath(e.target.value)}
                className="text-sm"
              />
              <Button
                onClick={() => scanAllLanguages(languageScanPath)}
                disabled={isScanningLanguages}
                size="sm"
                variant="default"
              >
                <Globe className="h-4 w-4 mr-1" />
                {SUPPORTED_LANGUAGES.length} Dili Tara
                {isScanningLanguages && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
              </Button>
            </div>

            {isScanningLanguages && (
              <div className="space-y-1">
                <Progress value={languageScanProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round(languageScanProgress)}% tamamlandı
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Canonical Scan Card */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Canonical URL Kontrolü
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Tüm dil versiyonlarının canonical URL etiketlerini doğrulayın
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Sayfa yolu (örn: / veya /reviews)"
                value={canonicalScanPath}
                onChange={(e) => setCanonicalScanPath(e.target.value)}
                className="text-sm"
              />
              <Button
                onClick={() => scanCanonicalUrls(canonicalScanPath)}
                disabled={isScanningCanonical}
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                <FileText className="h-4 w-4 mr-1" />
                Canonical Tara
                {isScanningCanonical && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
              </Button>
            </div>

            {isScanningCanonical && (
              <div className="space-y-1">
                <Progress value={canonicalScanProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round(canonicalScanProgress)}% tamamlandı
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Hreflang Kontrolü
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Tüm dil versiyonlarının hreflang etiketlerini doğrulayın (çift yönlü bağlantı, x-default, vb.)
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Sayfa yolu (örn: / veya /reviews)"
                value={hreflangScanPath}
                onChange={(e) => setHreflangScanPath(e.target.value)}
                className="text-sm"
              />
              <Button
                onClick={() => scanHreflangTags(hreflangScanPath)}
                disabled={isScanningHreflang}
                size="sm"
                variant="default"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Link2 className="h-4 w-4 mr-1" />
                Hreflang Tara
                {isScanningHreflang && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
              </Button>
            </div>

            {isScanningHreflang && (
              <div className="space-y-1">
                <Progress value={hreflangScanProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round(hreflangScanProgress)}% tamamlandı
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meta Tag Scan Card */}
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Meta Tag Kontrolü
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Tüm dil versiyonlarının title, description, robots, Open Graph etiketlerini doğrulayın
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Sayfa yolu (örn: / veya /reviews)"
                value={metaTagScanPath}
                onChange={(e) => setMetaTagScanPath(e.target.value)}
                className="text-sm"
              />
              <Button
                onClick={() => scanMetaTags(metaTagScanPath)}
                disabled={isScanningMetaTags}
                size="sm"
                variant="default"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Tag className="h-4 w-4 mr-1" />
                Meta Tara
                {isScanningMetaTags && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
              </Button>
            </div>

            {isScanningMetaTags && (
              <div className="space-y-1">
                <Progress value={metaTagScanProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round(metaTagScanProgress)}% tamamlandı
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Robots/Sitemap Scan Card */}
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Robots.txt & Sitemap Kontrolü
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              robots.txt ve sitemap.xml dosyalarını kontrol edin, dil kapsama ve hreflang tanımlarını doğrulayın
            </p>
            <Button
              onClick={() => {
                scanRobotsAndSitemap();
                setActiveTab('sitemap');
              }}
              disabled={isScanningRobots}
              size="sm"
              variant="default"
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Map className="h-4 w-4 mr-1" />
              Robots & Sitemap Tara
              {isScanningRobots && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
            </Button>

            {isScanningRobots && (
              <div className="space-y-1">
                <Progress value={robotsScanProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round(robotsScanProgress)}% tamamlandı
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Core Web Vitals Card */}
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Core Web Vitals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Sayfa hızı ve kullanıcı deneyimi metriklerini ölçün (LCP, FID, CLS, INP, FCP, TTFB)
            </p>
            <Button
              onClick={() => {
                scanWebVitals();
                setActiveTab('vitals');
              }}
              disabled={isScanningVitals}
              size="sm"
              variant="default"
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Zap className="h-4 w-4 mr-1" />
              Vitals Ölç
              {isScanningVitals && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
            </Button>

            {/* Live metrics preview */}
            {Object.keys(liveMetrics).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.values(liveMetrics).map(metric => metric && (
                  <Badge 
                    key={metric.name}
                    variant={metric.rating === 'good' ? 'default' : metric.rating === 'needs-improvement' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {metric.name}: {metric.name === 'CLS' ? metric.value.toFixed(3) : `${metric.value}ms`}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Preview Card */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Sosyal Medya Önizleme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Open Graph ve Twitter Card meta etiketlerini kontrol edin, paylaşım önizlemelerini görün
            </p>
            <Button
              onClick={() => {
                scanSocialPreview();
                setActiveTab('social');
              }}
              disabled={isScanningSocial}
              size="sm"
              variant="default"
            >
              <Image className="h-4 w-4 mr-1" />
              Sosyal Önizleme Tara
              {isScanningSocial && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
            </Button>

            {/* Quick preview of issues */}
            {socialResult && (
              <div className="flex flex-wrap gap-1">
                {socialResult.issues.filter(i => i.level === 'error').length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {socialResult.issues.filter(i => i.level === 'error').length} Hata
                  </Badge>
                )}
                {socialResult.issues.filter(i => i.level === 'warning').length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {socialResult.issues.filter(i => i.level === 'warning').length} Uyarı
                  </Badge>
                )}
                {socialResult.issues.length === 0 && (
                  <Badge variant="default" className="text-xs">Sorun Yok ✓</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'current'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Bu Sayfa ({currentPageSchemas.length})
          </button>
          <button
            onClick={() => setActiveTab('scanned')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'scanned'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Taranan Sayfalar ({scanResults.length})
          </button>
          <button
            onClick={() => setActiveTab('languages')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'languages'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="h-3 w-3" />
            Dil Karşılaştırması ({languageScanResults.length})
          </button>
          <button
            onClick={() => setActiveTab('hreflang')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'hreflang'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Link2 className="h-3 w-3" />
            Hreflang ({hreflangResults.length})
          </button>
          <button
            onClick={() => setActiveTab('canonical')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'canonical'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-3 w-3" />
            Canonical ({canonicalResults.length})
          </button>
          <button
            onClick={() => setActiveTab('metatags')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'metatags'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Tag className="h-3 w-3" />
            Meta Tags ({metaTagResults.length})
          </button>
          <button
            onClick={() => setActiveTab('sitemap')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'sitemap'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Map className="h-3 w-3" />
            Sitemap {robotsResult ? '✓' : ''}
          </button>
          <button
            onClick={() => setActiveTab('vitals')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'vitals'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Gauge className="h-3 w-3" />
            Web Vitals {vitalsResult ? '✓' : ''}
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'social'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Share2 className="h-3 w-3" />
            Sosyal {socialResult ? '✓' : ''}
          </button>
        </div>

        {activeTab === 'current' ? (
          <div className="space-y-4">
            {renderValidationCard(currentPageIssues)}
            {renderSummaryCard(currentPageRatings, 'Bu Sayfa')}
            {renderSchemaList(currentPageSchemas, currentPageRatings)}
          </div>
        ) : activeTab === 'scanned' ? (
          <div className="space-y-6">
            {scanResults.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Henüz sayfa taranmadı. Yukarıdaki butonları kullanarak sayfa tarayın.
                </CardContent>
              </Card>
            ) : (
              scanResults.map((result, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      {result.url}
                    </a>
                    <span className="text-xs text-muted-foreground">
                      ({result.scannedAt.toLocaleTimeString()})
                    </span>
                  </div>
                  {renderValidationCard(result.validationIssues)}
                  {renderSummaryCard(result.aggregateRatings, new URL(result.url).pathname)}
                  {renderSchemaList(result.schemas, result.aggregateRatings)}
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'languages' ? (
          // Languages tab
          <div className="space-y-4">
            {languageScanResults.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Henüz dil taraması yapılmadı. Yukarıdaki "Tüm Dilleri Tara" butonunu kullanın.
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Card */}
                {(() => {
                  const summary = getLanguageComparisonSummary();
                  return (
                    <Card className={summary.languagesWithErrors > 0 || summary.inconsistentRatings ? 'border-destructive' : 'border-green-500'}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {summary.languagesWithErrors > 0 || summary.inconsistentRatings ? (
                            <>
                              <AlertCircle className="h-5 w-5 text-destructive" />
                              <span className="text-destructive">Dil Karşılaştırması - Sorunlar Var</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <span className="text-green-500">Dil Karşılaştırması - Tutarlı</span>
                            </>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                          <div className="text-center p-2 bg-muted rounded-lg">
                            <div className="text-xl font-bold">{summary.totalLanguages}</div>
                            <div className="text-xs text-muted-foreground">Toplam Dil</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                            <div className="text-xl font-bold text-green-600">{summary.scannedLanguages}</div>
                            <div className="text-xs text-muted-foreground">Başarılı</div>
                          </div>
                          <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                            <div className="text-xl font-bold text-destructive">{summary.languagesWithErrors}</div>
                            <div className="text-xs text-muted-foreground">Hatalı</div>
                          </div>
                          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                            <div className="text-xl font-bold text-yellow-600">{summary.languagesWithRatings}</div>
                            <div className="text-xs text-muted-foreground">Rating Var</div>
                          </div>
                          <div className={`text-center p-2 rounded-lg ${summary.inconsistentRatings ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950'}`}>
                            <div className={`text-xl font-bold ${summary.inconsistentRatings ? 'text-destructive' : 'text-green-600'}`}>
                              {summary.inconsistentRatings ? '✗' : '✓'}
                            </div>
                            <div className="text-xs text-muted-foreground">Rating Tutarlı</div>
                          </div>
                        </div>

                        {summary.inconsistentRatings && (
                          <div className="p-2 bg-red-50 dark:bg-red-950 rounded-lg text-sm text-destructive flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>Farklı dillerde farklı rating değerleri tespit edildi. Tüm dillerde aynı değer olmalı!</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Language-by-language comparison table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      Dil Bazlı Sonuçlar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Dil</th>
                            <th className="text-left py-2 px-3">URL</th>
                            <th className="text-center py-2 px-3">Schema</th>
                            <th className="text-center py-2 px-3">Rating</th>
                            <th className="text-center py-2 px-3">Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {languageScanResults.map((result, idx) => {
                            const errorCount = result.validationIssues.filter(i => i.level === 'error').length;
                            const hasRating = result.aggregateRatings.length > 0;
                            
                            return (
                              <tr key={idx} className="border-b hover:bg-muted/50">
                                <td className="py-2 px-3">
                                  <Badge variant="outline" className="text-xs">{result.language}</Badge>
                                </td>
                                <td className="py-2 px-3">
                                  <a
                                    href={result.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline text-xs truncate block max-w-[200px]"
                                  >
                                    {result.path}
                                  </a>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {result.error ? (
                                    <Badge variant="destructive" className="text-xs">Hata</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">{result.schemas.length}</Badge>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {hasRating ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                      <span className="text-xs font-medium">{result.aggregateRatings[0].ratingValue}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {result.error ? (
                                    <Badge variant="destructive" className="text-xs">{result.error}</Badge>
                                  ) : errorCount > 0 ? (
                                    <Badge variant="destructive" className="text-xs">{errorCount} hata</Badge>
                                  ) : (
                                    <Badge className="bg-green-500 text-xs">OK</Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed view for each language */}
                <details className="group">
                  <summary className="cursor-pointer p-3 bg-muted rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-muted/80">
                    <Code className="h-4 w-4" />
                    Detaylı Sonuçları Göster
                  </summary>
                  <div className="mt-4 space-y-6">
                    {languageScanResults.map((result, idx) => (
                      <div key={idx} className="space-y-3 border-l-4 border-primary pl-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="default">{result.language}</Badge>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            {result.url}
                          </a>
                          <span className="text-xs text-muted-foreground">
                            ({result.scannedAt.toLocaleTimeString()})
                          </span>
                        </div>
                        {result.error ? (
                          <Card className="border-destructive">
                            <CardContent className="py-4 text-destructive text-sm">
                              Sayfa yüklenemedi: {result.error}
                            </CardContent>
                          </Card>
                        ) : (
                          <>
                            {renderValidationCard(result.validationIssues)}
                            {renderSummaryCard(result.aggregateRatings, result.language)}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </>
            )}
          </div>
        ) : activeTab === 'hreflang' ? (
          // Hreflang tab
          <div className="space-y-4">
            {hreflangResults.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Henüz hreflang taraması yapılmadı. Yukarıdaki "Hreflang Tara" butonunu kullanın.
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Hreflang Summary Card */}
                {(() => {
                  const summary = getHreflangSummary();
                  const hasIssues = summary.languagesWithIssues > 0 || summary.missingBidirectional > 0;
                  return (
                    <Card className={hasIssues ? 'border-destructive' : 'border-green-500'}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {hasIssues ? (
                            <>
                              <AlertCircle className="h-5 w-5 text-destructive" />
                              <span className="text-destructive">Hreflang Kontrolü - Sorunlar Var</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <span className="text-green-500">Hreflang Kontrolü - Tamamlandı</span>
                            </>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                          <div className="text-center p-2 bg-muted rounded-lg">
                            <div className="text-xl font-bold">{summary.totalLanguages}</div>
                            <div className="text-xs text-muted-foreground">Toplam Dil</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                            <div className="text-xl font-bold text-green-600">{summary.scannedLanguages}</div>
                            <div className="text-xs text-muted-foreground">Başarılı</div>
                          </div>
                          <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                            <div className="text-xl font-bold text-destructive">{summary.languagesWithIssues}</div>
                            <div className="text-xs text-muted-foreground">Sorunlu</div>
                          </div>
                          <div className={`text-center p-2 rounded-lg ${summary.missingBidirectional > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950'}`}>
                            <div className={`text-xl font-bold ${summary.missingBidirectional > 0 ? 'text-destructive' : 'text-green-600'}`}>
                              {summary.missingBidirectional}
                            </div>
                            <div className="text-xs text-muted-foreground">Çift Yön Eksik</div>
                          </div>
                          <div className={`text-center p-2 rounded-lg ${summary.missingXDefault > 0 ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-green-50 dark:bg-green-950'}`}>
                            <div className={`text-xl font-bold ${summary.missingXDefault > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {summary.missingXDefault}
                            </div>
                            <div className="text-xs text-muted-foreground">x-default Eksik</div>
                          </div>
                          <div className={`text-center p-2 rounded-lg ${summary.missingSelfReference > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950'}`}>
                            <div className={`text-xl font-bold ${summary.missingSelfReference > 0 ? 'text-destructive' : 'text-green-600'}`}>
                              {summary.missingSelfReference}
                            </div>
                            <div className="text-xs text-muted-foreground">Self-Ref Eksik</div>
                          </div>
                        </div>

                        {summary.missingBidirectional > 0 && (
                          <div className="p-2 bg-red-50 dark:bg-red-950 rounded-lg text-sm text-destructive flex items-start gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>Çift yönlü bağlantı hatası: A sayfası B'ye bağlanıyorsa, B de A'ya bağlanmalı!</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Hreflang by language table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Dil Bazlı Hreflang Sonuçları
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Dil</th>
                            <th className="text-center py-2 px-3">Etiket</th>
                            <th className="text-center py-2 px-3">x-default</th>
                            <th className="text-center py-2 px-3">Self-Ref</th>
                            <th className="text-center py-2 px-3">Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hreflangResults.map((result, idx) => {
                            const errorCount = result.issues.filter(i => i.level === 'error').length;
                            const warningCount = result.issues.filter(i => i.level === 'warning').length;
                            
                            return (
                              <tr key={idx} className="border-b hover:bg-muted/50">
                                <td className="py-2 px-3">
                                  <Badge variant="outline" className="text-xs">{result.language}</Badge>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {result.error ? (
                                    <Badge variant="destructive" className="text-xs">Hata</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">{result.hreflangTags.length}</Badge>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {result.hasXDefault ? (
                                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {result.hasSelfReference ? (
                                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {result.error ? (
                                    <Badge variant="destructive" className="text-xs">{result.error}</Badge>
                                  ) : errorCount > 0 ? (
                                    <Badge variant="destructive" className="text-xs">{errorCount} hata</Badge>
                                  ) : warningCount > 0 ? (
                                    <Badge className="bg-yellow-500 text-xs">{warningCount} uyarı</Badge>
                                  ) : (
                                    <Badge className="bg-green-500 text-xs">OK</Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed hreflang issues */}
                <details className="group">
                  <summary className="cursor-pointer p-3 bg-muted rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-muted/80">
                    <Code className="h-4 w-4" />
                    Detaylı Hreflang Sonuçları
                  </summary>
                  <div className="mt-4 space-y-6">
                    {hreflangResults.map((result, idx) => (
                      <div key={idx} className="space-y-3 border-l-4 border-blue-500 pl-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="default">{result.language}</Badge>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            {result.url}
                          </a>
                        </div>
                        
                        {result.error ? (
                          <Card className="border-destructive">
                            <CardContent className="py-4 text-destructive text-sm">
                              Sayfa yüklenemedi: {result.error}
                            </CardContent>
                          </Card>
                        ) : (
                          <>
                            {/* Issues list */}
                            {result.issues.length > 0 && (
                              <div className="space-y-2">
                                {result.issues.map((issue, issueIdx) => (
                                  <div
                                    key={issueIdx}
                                    className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                                      issue.level === 'error' ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' :
                                      issue.level === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300' :
                                      'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                    }`}
                                  >
                                    {issue.level === 'error' ? <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /> :
                                     issue.level === 'warning' ? <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" /> :
                                     <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                                    <span>{issue.message}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Hreflang tags list */}
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-xs">Hreflang Etiketleri ({result.hreflangTags.length})</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {result.hreflangTags.map((tag, tagIdx) => (
                                    <div key={tagIdx} className="flex items-center gap-2 text-xs">
                                      <Badge variant="outline" className="text-[10px]">{tag.hreflang}</Badge>
                                      <span className="text-muted-foreground truncate">{tag.href}</span>
                                    </div>
                                  ))}
                                  {result.hreflangTags.length === 0 && (
                                    <p className="text-muted-foreground text-xs">Hreflang etiketi bulunamadı</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </>
            )}
          </div>
        ) : activeTab === 'canonical' ? (
          // Canonical tab
          <div className="space-y-4">
            {canonicalResults.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Henüz canonical taraması yapılmadı. Yukarıdaki "Canonical Tara" butonunu kullanın.
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Canonical Summary Card */}
                {(() => {
                  const summary = getCanonicalSummary();
                  const hasIssues = summary.languagesWithIssues > 0 || summary.missingCanonical > 0;
                  return (
                    <Card className={hasIssues ? 'border-destructive' : 'border-green-500'}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {hasIssues ? (
                            <>
                              <AlertCircle className="h-5 w-5 text-destructive" />
                              <span className="text-destructive">Canonical Kontrolü - Sorunlar Var</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <span className="text-green-500">Canonical Kontrolü - Tamamlandı</span>
                            </>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                          <div className="text-center p-2 bg-muted rounded-lg">
                            <div className="text-xl font-bold">{summary.totalLanguages}</div>
                            <div className="text-xs text-muted-foreground">Toplam Dil</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                            <div className="text-xl font-bold text-green-600">{summary.scannedLanguages}</div>
                            <div className="text-xs text-muted-foreground">Başarılı</div>
                          </div>
                          <div className={`text-center p-2 rounded-lg ${summary.missingCanonical > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950'}`}>
                            <div className={`text-xl font-bold ${summary.missingCanonical > 0 ? 'text-destructive' : 'text-green-600'}`}>
                              {summary.missingCanonical}
                            </div>
                            <div className="text-xs text-muted-foreground">Eksik</div>
                          </div>
                          <div className={`text-center p-2 rounded-lg ${summary.nonSelfReferencing > 0 ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-green-50 dark:bg-green-950'}`}>
                            <div className={`text-xl font-bold ${summary.nonSelfReferencing > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {summary.nonSelfReferencing}
                            </div>
                            <div className="text-xs text-muted-foreground">Farklı URL</div>
                          </div>
                          <div className={`text-center p-2 rounded-lg ${summary.relativeUrls > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950'}`}>
                            <div className={`text-xl font-bold ${summary.relativeUrls > 0 ? 'text-destructive' : 'text-green-600'}`}>
                              {summary.relativeUrls}
                            </div>
                            <div className="text-xs text-muted-foreground">Göreli URL</div>
                          </div>
                          <div className={`text-center p-2 rounded-lg ${summary.inconsistentPatterns ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-green-50 dark:bg-green-950'}`}>
                            <div className={`text-xl font-bold ${summary.inconsistentPatterns ? 'text-yellow-600' : 'text-green-600'}`}>
                              {summary.inconsistentPatterns ? '✗' : '✓'}
                            </div>
                            <div className="text-xs text-muted-foreground">Tutarlı</div>
                          </div>
                        </div>

                        {summary.missingCanonical > 0 && (
                          <div className="p-2 bg-red-50 dark:bg-red-950 rounded-lg text-sm text-destructive flex items-start gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>Canonical etiketi eksik olan sayfalar var - SEO için her sayfada canonical olmalı!</span>
                          </div>
                        )}

                        {summary.relativeUrls > 0 && (
                          <div className="p-2 bg-red-50 dark:bg-red-950 rounded-lg text-sm text-destructive flex items-start gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>Göreli URL kullanan canonical etiketleri var - mutlak URL kullanılmalı!</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Canonical by language table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Dil Bazlı Canonical Sonuçları
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Dil</th>
                            <th className="text-left py-2 px-3">Canonical URL</th>
                            <th className="text-center py-2 px-3">Self-Ref</th>
                            <th className="text-center py-2 px-3">Absolute</th>
                            <th className="text-center py-2 px-3">Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {canonicalResults.map((result, idx) => {
                            const errorCount = result.issues.filter(i => i.level === 'error').length;
                            const warningCount = result.issues.filter(i => i.level === 'warning').length;
                            
                            return (
                              <tr key={idx} className="border-b hover:bg-muted/50">
                                <td className="py-2 px-3">
                                  <Badge variant="outline" className="text-xs">{result.language}</Badge>
                                </td>
                                <td className="py-2 px-3">
                                  {result.error ? (
                                    <Badge variant="destructive" className="text-xs">Hata</Badge>
                                  ) : result.canonicalUrl ? (
                                    <span className="text-xs text-muted-foreground truncate block max-w-[300px]" title={result.canonicalUrl}>
                                      {result.canonicalUrl}
                                    </span>
                                  ) : (
                                    <Badge variant="destructive" className="text-xs">Eksik</Badge>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {result.canonicalUrl ? (
                                    result.isSelfReferencing ? (
                                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                    ) : (
                                      <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />
                                    )
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {result.canonicalUrl ? (
                                    result.isAbsoluteUrl ? (
                                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
                                    )
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {result.error ? (
                                    <Badge variant="destructive" className="text-xs">{result.error}</Badge>
                                  ) : errorCount > 0 ? (
                                    <Badge variant="destructive" className="text-xs">{errorCount} hata</Badge>
                                  ) : warningCount > 0 ? (
                                    <Badge className="bg-yellow-500 text-xs">{warningCount} uyarı</Badge>
                                  ) : (
                                    <Badge className="bg-green-500 text-xs">OK</Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed canonical issues */}
                <details className="group">
                  <summary className="cursor-pointer p-3 bg-muted rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-muted/80">
                    <Code className="h-4 w-4" />
                    Detaylı Canonical Sonuçları
                  </summary>
                  <div className="mt-4 space-y-6">
                    {canonicalResults.map((result, idx) => (
                      <div key={idx} className="space-y-3 border-l-4 border-green-500 pl-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="default">{result.language}</Badge>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            {result.url}
                          </a>
                        </div>
                        
                        {result.error ? (
                          <Card className="border-destructive">
                            <CardContent className="py-4 text-destructive text-sm">
                              Sayfa yüklenemedi: {result.error}
                            </CardContent>
                          </Card>
                        ) : (
                          <>
                            {/* Canonical URL display */}
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-xs text-muted-foreground mb-1">Canonical URL:</div>
                              {result.canonicalUrl ? (
                                <code className="text-xs break-all">{result.canonicalUrl}</code>
                              ) : (
                                <span className="text-destructive text-xs">Canonical tag bulunamadı!</span>
                              )}
                            </div>

                            {/* Issues list */}
                            {result.issues.length > 0 && (
                              <div className="space-y-2">
                                {result.issues.map((issue, issueIdx) => (
                                  <div
                                    key={issueIdx}
                                    className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                                      issue.level === 'error' ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' :
                                      issue.level === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300' :
                                      'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                    }`}
                                  >
                                    {issue.level === 'error' ? <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /> :
                                     issue.level === 'warning' ? <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" /> :
                                     <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                                    <span>{issue.message}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {result.issues.length === 0 && result.canonicalUrl && (
                              <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg text-xs text-green-700 dark:text-green-300 flex items-center gap-2">
                                <CheckCircle className="h-3 w-3" />
                                <span>Canonical URL doğru yapılandırılmış</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </>
            )}
          </div>
        ) : activeTab === 'metatags' ? (
          <div className="space-y-4">
            {metaTagResults.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Henüz meta tag taraması yapılmadı. Yukarıdaki "Meta Tara" butonunu kullanın.
                </CardContent>
              </Card>
            ) : (
              <>
                {(() => {
                  const summary = getMetaTagSummary();
                  const hasIssues =
                    summary.languagesWithIssues > 0 ||
                    summary.missingTitle > 0 ||
                    summary.missingDescription > 0 ||
                    summary.missingOgTags > 0;

                  return (
                    <Card className={hasIssues ? 'border-destructive' : 'border-primary'}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {hasIssues ? (
                            <>
                              <AlertCircle className="h-5 w-5 text-destructive" />
                              <span className="text-destructive">Meta Tag Kontrolü - Sorunlar Var</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-5 w-5 text-primary" />
                              <span className="text-primary">Meta Tag Kontrolü - Tamamlandı</span>
                            </>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                          <div className="text-center p-2 bg-muted rounded-lg">
                            <div className="text-xl font-bold">{summary.totalLanguages}</div>
                            <div className="text-xs text-muted-foreground">Toplam Dil</div>
                          </div>
                          <div className="text-center p-2 bg-primary/10 rounded-lg">
                            <div className="text-xl font-bold text-primary">{summary.scannedLanguages}</div>
                            <div className="text-xs text-muted-foreground">Başarılı</div>
                          </div>
                          <div className={`text-center p-2 rounded-lg ${summary.languagesWithIssues > 0 ? 'bg-accent' : 'bg-primary/10'}`}>
                            <div className={`text-xl font-bold ${summary.languagesWithIssues > 0 ? 'text-foreground' : 'text-primary'}`}>
                              {summary.languagesWithIssues}
                            </div>
                            <div className="text-xs text-muted-foreground">Sorunlu</div>
                          </div>
                          <div className={`text-center p-2 rounded-lg ${summary.missingTitle > 0 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                            <div className={`text-xl font-bold ${summary.missingTitle > 0 ? 'text-destructive' : 'text-primary'}`}>
                              {summary.missingTitle}
                            </div>
                            <div className="text-xs text-muted-foreground">Title Eksik</div>
                          </div>
                          <div className={`text-center p-2 rounded-lg ${summary.missingDescription > 0 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                            <div className={`text-xl font-bold ${summary.missingDescription > 0 ? 'text-destructive' : 'text-primary'}`}>
                              {summary.missingDescription}
                            </div>
                            <div className="text-xs text-muted-foreground">Desc Eksik</div>
                          </div>
                          <div className={`text-center p-2 rounded-lg ${summary.missingOgTags > 0 ? 'bg-accent' : 'bg-primary/10'}`}>
                            <div className={`text-xl font-bold ${summary.missingOgTags > 0 ? 'text-foreground' : 'text-primary'}`}>
                              {summary.missingOgTags}
                            </div>
                            <div className="text-xs text-muted-foreground">OG Eksik</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Dil Bazlı Meta Tag Sonuçları
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Dil</th>
                            <th className="text-left py-2 px-3">Title</th>
                            <th className="text-left py-2 px-3">Description</th>
                            <th className="text-left py-2 px-3">Robots</th>
                            <th className="text-center py-2 px-3">Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metaTagResults.map((result, idx) => {
                            const errorCount = result.issues.filter(i => i.level === 'error').length;
                            const warningCount = result.issues.filter(i => i.level === 'warning').length;

                            return (
                              <tr key={idx} className="border-b hover:bg-muted/50">
                                <td className="py-2 px-3">
                                  <Badge variant="outline" className="text-xs">{result.language}</Badge>
                                </td>
                                <td className="py-2 px-3">
                                  {result.error ? (
                                    <Badge variant="destructive" className="text-xs">Hata</Badge>
                                  ) : result.metaTags.title ? (
                                    <span className="text-xs text-muted-foreground truncate block max-w-[240px]" title={result.metaTags.title}>
                                      {result.metaTags.title}
                                    </span>
                                  ) : (
                                    <Badge variant="destructive" className="text-xs">Eksik</Badge>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  {result.error ? (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  ) : result.metaTags.description ? (
                                    <span className="text-xs text-muted-foreground truncate block max-w-[300px]" title={result.metaTags.description}>
                                      {result.metaTags.description}
                                    </span>
                                  ) : (
                                    <Badge variant="destructive" className="text-xs">Eksik</Badge>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  {result.error ? (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  ) : result.metaTags.robots ? (
                                    <code className="text-xs text-muted-foreground">{result.metaTags.robots}</code>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">varsayılan</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {result.error ? (
                                    <Badge variant="destructive" className="text-xs">{result.error}</Badge>
                                  ) : errorCount > 0 ? (
                                    <Badge variant="destructive" className="text-xs">{errorCount} hata</Badge>
                                  ) : warningCount > 0 ? (
                                    <Badge variant="secondary" className="text-xs">{warningCount} uyarı</Badge>
                                  ) : (
                                    <Badge className="text-xs">OK</Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <details className="group">
                  <summary className="cursor-pointer p-3 bg-muted rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-muted/80">
                    <Code className="h-4 w-4" />
                    Detaylı Meta Tag Sonuçları
                  </summary>

                  <div className="mt-4 space-y-6">
                    {metaTagResults.map((result, idx) => (
                      <div key={idx} className="space-y-3 border-l-4 border-primary pl-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="default">{result.language}</Badge>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            {result.url}
                          </a>
                        </div>

                        {result.error ? (
                          <Card className="border-destructive">
                            <CardContent className="py-4 text-destructive text-sm">
                              Sayfa yüklenemedi: {result.error}
                            </CardContent>
                          </Card>
                        ) : (
                          <>
                            <div className="grid md:grid-cols-2 gap-3">
                              <div className="p-3 bg-muted rounded-lg">
                                <div className="text-xs text-muted-foreground mb-1">Title ({result.metaTags.titleLength}):</div>
                                <div className="text-xs break-words">{result.metaTags.title ?? '—'}</div>
                              </div>
                              <div className="p-3 bg-muted rounded-lg">
                                <div className="text-xs text-muted-foreground mb-1">Description ({result.metaTags.descriptionLength}):</div>
                                <div className="text-xs break-words">{result.metaTags.description ?? '—'}</div>
                              </div>
                            </div>

                            {result.issues.length > 0 ? (
                              <div className="space-y-2">
                                {result.issues.map((issue, issueIdx) => (
                                  <div
                                    key={issueIdx}
                                    className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                                      issue.level === 'error'
                                        ? 'bg-destructive/10 text-destructive'
                                        : issue.level === 'warning'
                                          ? 'bg-accent text-foreground'
                                          : 'bg-primary/10 text-primary'
                                    }`}
                                  >
                                    {issue.level === 'error' ? (
                                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    ) : issue.level === 'warning' ? (
                                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    ) : (
                                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    )}
                                    <span>{issue.message}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-2 bg-primary/10 rounded-lg text-xs text-primary flex items-center gap-2">
                                <CheckCircle className="h-3 w-3" />
                                <span>Meta tag'ler beklenen seviyede</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </>
            )}
          </div>
        ) : activeTab === 'sitemap' ? (
          <div className="space-y-4">
            {!robotsResult && sitemapResults.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Henüz robots.txt/sitemap taraması yapılmadı. Yukarıdaki "Robots & Sitemap Tara" butonunu kullanın.
                </CardContent>
              </Card>
            ) : (
              <>
                {robotsResult && (
                  <Card className={robotsResult.issues.some(i => i.level === 'error') ? 'border-destructive' : robotsResult.accessible ? 'border-green-500' : 'border-yellow-500'}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {robotsResult.accessible ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                        <span>robots.txt - {robotsResult.accessible ? 'Erişilebilir' : 'Bulunamadı'}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-2 bg-muted rounded"><div className="font-bold">{robotsResult.sitemapUrls.length}</div><div className="text-muted-foreground">Sitemap</div></div>
                        <div className="p-2 bg-muted rounded"><div className="font-bold">{robotsResult.disallowRules.length}</div><div className="text-muted-foreground">Disallow</div></div>
                        <div className="p-2 bg-muted rounded"><div className="font-bold">{robotsResult.allowRules.length}</div><div className="text-muted-foreground">Allow</div></div>
                        <div className="p-2 bg-muted rounded"><div className="font-bold">{robotsResult.crawlDelay ?? '—'}</div><div className="text-muted-foreground">Delay</div></div>
                      </div>
                      {robotsResult.issues.map((issue, i) => (
                        <div key={i} className={`p-2 rounded text-xs flex gap-2 ${issue.level === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700'}`}>
                          <AlertCircle className="h-3 w-3 mt-0.5" /><span>{issue.message}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {sitemapResults.map((sitemap, idx) => (
                  <Card key={idx} className={sitemap.accessible ? 'border-green-500' : 'border-destructive'}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        {sitemap.accessible ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-destructive" />}
                        <span className="truncate">{sitemap.url}</span>
                        <Badge variant="secondary" className="text-xs">{sitemap.urlCount} URL</Badge>
                        {sitemap.hasHreflang && <Badge className="text-xs">Hreflang ✓</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sitemap.issues.map((issue, i) => (
                        <div key={i} className={`p-2 rounded text-xs mb-2 ${issue.level === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700'}`}>
                          {issue.message}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        ) : activeTab === 'vitals' ? (
          <div className="space-y-4">
            {!vitalsResult ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Henüz Web Vitals ölçümü yapılmadı. Yukarıdaki "Vitals Ölç" butonunu kullanın.
                </CardContent>
              </Card>
            ) : (
              <Card className={vitalsResult.overallScore === 'good' ? 'border-green-500' : vitalsResult.overallScore === 'needs-improvement' ? 'border-yellow-500' : 'border-destructive'}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Core Web Vitals - {vitalsResult.overallScore === 'good' ? 'İyi' : vitalsResult.overallScore === 'needs-improvement' ? 'Orta' : 'Zayıf'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {vitalsResult.metrics.map(metric => (
                      <div key={metric.name} className={`p-3 rounded-lg ${metric.rating === 'good' ? 'bg-green-50 dark:bg-green-950' : metric.rating === 'needs-improvement' ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-red-50 dark:bg-red-950'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold">{metric.name}</span>
                          <Badge variant={metric.rating === 'good' ? 'default' : metric.rating === 'needs-improvement' ? 'secondary' : 'destructive'} className="text-xs">
                            {metric.rating === 'good' ? 'İyi' : metric.rating === 'needs-improvement' ? 'Orta' : 'Zayıf'}
                          </Badge>
                        </div>
                        <div className={`text-xl font-bold ${metric.rating === 'good' ? 'text-green-600' : metric.rating === 'needs-improvement' ? 'text-yellow-600' : 'text-destructive'}`}>
                          {metric.name === 'CLS' ? metric.value.toFixed(3) : `${metric.value}ms`}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : activeTab === 'social' ? (
          <div className="space-y-4">
            {!socialResult ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Henüz sosyal önizleme taraması yapılmadı. Yukarıdaki "Sosyal Önizleme Tara" butonunu kullanın.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Facebook className="h-4 w-4 text-primary" />
                      Facebook Önizleme
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="aspect-[1.91/1] bg-muted flex items-center justify-center">
                        {socialResult.meta.ogImage ? (
                          <img src={socialResult.meta.ogImage.startsWith('/') ? window.location.origin + socialResult.meta.ogImage : socialResult.meta.ogImage} alt="OG" className="w-full h-full object-cover" />
                        ) : <Image className="h-12 w-12 opacity-30" />}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-muted-foreground">{socialResult.meta.ogSiteName || new URL(socialResult.url).hostname}</p>
                        <h3 className="font-semibold line-clamp-2">{socialResult.meta.ogTitle || socialResult.meta.title || 'Başlık Yok'}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{socialResult.meta.ogDescription || 'Açıklama yok'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Twitter className="h-4 w-4 text-primary" />
                      Twitter Önizleme
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-2xl overflow-hidden">
                      <div className="aspect-[2/1] bg-muted flex items-center justify-center">
                        {(socialResult.meta.twitterImage || socialResult.meta.ogImage) ? (
                          <img src={(socialResult.meta.twitterImage || socialResult.meta.ogImage || '').startsWith('/') ? window.location.origin + (socialResult.meta.twitterImage || socialResult.meta.ogImage) : (socialResult.meta.twitterImage || socialResult.meta.ogImage)} alt="Twitter" className="w-full h-full object-cover" />
                        ) : <Image className="h-12 w-12 opacity-30" />}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold line-clamp-2">{socialResult.meta.twitterTitle || socialResult.meta.ogTitle || 'Başlık Yok'}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{socialResult.meta.twitterDescription || socialResult.meta.ogDescription || 'Açıklama yok'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : null}

        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Validasyon Kuralları</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>• <strong className="text-destructive">Hata:</strong> Zorunlu alanlar eksik veya geçersiz format</p>
            <p>• <strong className="text-yellow-600">Uyarı:</strong> Önerilen alanlar eksik</p>
            <p>• <strong className="text-blue-600">Bilgi:</strong> Opsiyonel iyileştirmeler</p>
            <p className="pt-2">• Birden fazla aggregateRating olması Google "multiple ratings" hatasına neden olur</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SEODebugPage;
