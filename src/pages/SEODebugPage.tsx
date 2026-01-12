import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, CheckCircle, Code, Star, Search, Home, RefreshCw, 
  ExternalLink, AlertTriangle, Info, Globe, Languages, Link2, FileText, Tag,
  Bot, Gauge, Zap, Map, Share2, Image
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, type Language } from '@/hooks/useLanguageFromUrl';
import { useSitemapRobotsValidation } from '@/hooks/useSitemapRobotsValidation';
import { useCoreWebVitals } from '@/hooks/useCoreWebVitals';
import { useSocialPreview } from '@/hooks/useSocialPreview';
import {
  type SchemaScript,
  type AggregateRating,
  type ValidationIssue,
  type ScanResult,
  type LanguageScanResult,
  type LanguageComparisonSummary,
  type HreflangValidationResult,
  type HreflangIssue,
  type HreflangSummary,
  type CanonicalValidationResult,
  type CanonicalIssue,
  type CanonicalSummary,
  type MetaTagValidationResult,
  type MetaTagSummary,
  type SEODebugTab,
  LANGUAGE_TO_PREFIX,
  parsePageSchemas,
  parseHtmlString,
  parseHreflangTags,
  parseCanonicalUrl,
  parseMetaTags,
  validateMetaTags,
} from '@/components/seo/debug';
import { SEODebugSchemaTab } from '@/components/seo/debug/SEODebugSchemaTab';
import { SEODebugSocialTab } from '@/components/seo/debug/SEODebugSocialTab';
import { SEODebugLanguagesTab } from '@/components/seo/debug/SEODebugLanguagesTab';
import { SEODebugHreflangTab } from '@/components/seo/debug/SEODebugHreflangTab';
import { SEODebugCanonicalTab } from '@/components/seo/debug/SEODebugCanonicalTab';
import { SEODebugMetaTagsTab } from '@/components/seo/debug/SEODebugMetaTagsTab';
import { SEODebugSitemapTab } from '@/components/seo/debug/SEODebugSitemapTab';
import { SEODebugVitalsTab } from '@/components/seo/debug/SEODebugVitalsTab';

const SEODebugPage = () => {
  const [currentPageSchemas, setCurrentPageSchemas] = useState<SchemaScript[]>([]);
  const [currentPageRatings, setCurrentPageRatings] = useState<AggregateRating[]>([]);
  const [currentPageIssues, setCurrentPageIssues] = useState<ValidationIssue[]>([]);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [customUrl, setCustomUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<SEODebugTab>('current');
  
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

  const scanUrl = async (url: string) => {
    setIsScanning(true);
    try {
      const response = await fetch(url, { headers: { 'Accept': 'text/html' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
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

  const scanHomepage = () => scanUrl(window.location.origin + '/');
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

  const blogQuickPaths = [
    { label: 'Cappadocia', path: '/blog/cappadocia-airport-transfer-guide' },
    { label: 'Istanbul City', path: '/blog/istanbul-airport-to-city-best-way' },
    { label: 'Istanbul Price', path: '/blog/istanbul-airport-transfer-price-guide' },
    { label: 'Antalya', path: '/blog/antalya-airport-transfer-to-hotels' },
    { label: 'Marmaris', path: '/blog/marmaris-airport-transfer-guide' },
    { label: 'Fethiye', path: '/blog/fethiye-airport-transfer-guide' },
    { label: 'Ölüdeniz', path: '/blog/oludeniz-airport-transfer-guide' },
    { label: 'Cyprus', path: '/blog/cyprus-airport-transfer-guide' },
    { label: 'Dubai', path: '/blog/dubai-airport-transfer-guide' },
    { label: 'Mugla', path: '/blog/mugla-airport-transfer-guide' },
    { label: 'Aydin', path: '/blog/aydin-airport-transfer-guide' },
    { label: 'Bursa Tour', path: '/blog/istanbul-bursa-day-tour-guide' },
    { label: 'Taxi Comparison', path: '/blog/private-vs-taxi-transfer-turkey' },
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
        const response = await fetch(url, { headers: { 'Accept': 'text/html' } });
        if (!response.ok) {
          results.push({ language: lang, path: path || '/', url, schemas: [], aggregateRatings: [], validationIssues: [], scannedAt: new Date(), error: `HTTP ${response.status}` });
        } else {
          const html = await response.text();
          const result = parseHtmlString(html);
          results.push({ language: lang, path: path || '/', url, schemas: result.schemas, aggregateRatings: result.ratings, validationIssues: result.issues, scannedAt: new Date() });
        }
      } catch (error) {
        results.push({ language: lang, path: path || '/', url, schemas: [], aggregateRatings: [], validationIssues: [], scannedAt: new Date(), error: error instanceof Error ? error.message : 'Bilinmeyen hata' });
      }

      setLanguageScanProgress(((i + 1) / SUPPORTED_LANGUAGES.length) * 100);
      setLanguageScanResults([...results]);
    }
    setIsScanningLanguages(false);
  };

  const getLanguageComparisonSummary = (): LanguageComparisonSummary => {
    const successfulScans = languageScanResults.filter(r => !r.error);
    const withErrors = languageScanResults.filter(r => r.validationIssues.some(i => i.level === 'error'));
    const withRatings = languageScanResults.filter(r => r.aggregateRatings.length > 0);
    const ratingValues = successfulScans.filter(r => r.aggregateRatings.length > 0).map(r => r.aggregateRatings[0]?.ratingValue);
    const uniqueRatings = [...new Set(ratingValues)];
    return { totalLanguages: SUPPORTED_LANGUAGES.length, scannedLanguages: successfulScans.length, languagesWithErrors: withErrors.length, languagesWithRatings: withRatings.length, inconsistentRatings: uniqueRatings.length > 1 };
  };

  // Hreflang scan
  const scanHreflangTags = async (basePath: string = '/') => {
    setIsScanningHreflang(true);
    setHreflangScanProgress(0);
    setHreflangResults([]);
    setActiveTab('hreflang');

    const baseUrl = window.location.origin;
    const results: HreflangValidationResult[] = [];

    for (let i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
      const lang = SUPPORTED_LANGUAGES[i];
      const prefix = LANGUAGE_TO_PREFIX[lang];
      const path = prefix + (basePath === '/' ? '' : basePath);
      const url = baseUrl + (path || '/');

      try {
        const response = await fetch(url, { headers: { 'Accept': 'text/html' } });
        if (!response.ok) {
          results.push({ language: lang, url, hreflangTags: [], issues: [], hasXDefault: false, hasSelfReference: false, scannedAt: new Date(), error: `HTTP ${response.status}` });
        } else {
          const html = await response.text();
          const hreflangTags = parseHreflangTags(html);
          results.push({ language: lang, url, hreflangTags, issues: [], hasXDefault: hreflangTags.some(t => t.hreflang === 'x-default'), hasSelfReference: hreflangTags.some(t => t.href === url), scannedAt: new Date() });
        }
      } catch (error) {
        results.push({ language: lang, url, hreflangTags: [], issues: [], hasXDefault: false, hasSelfReference: false, scannedAt: new Date(), error: error instanceof Error ? error.message : 'Bilinmeyen hata' });
      }

      setHreflangScanProgress(((i + 1) / SUPPORTED_LANGUAGES.length) * 100);
      setHreflangResults([...results]);
    }

    // Validate issues
    const validatedResults = results.map(result => {
      if (result.error) return result;
      const issues: HreflangIssue[] = [];
      if (!result.hasXDefault) issues.push({ level: 'warning', message: 'x-default hreflang etiketi eksik' });
      if (!result.hasSelfReference) issues.push({ level: 'error', message: 'Kendine referans (self-referencing) hreflang etiketi eksik' });
      return { ...result, issues };
    });

    setHreflangResults(validatedResults);
    setIsScanningHreflang(false);
  };

  const getHreflangSummary = (): HreflangSummary => {
    const successfulScans = hreflangResults.filter(r => !r.error);
    const withIssues = hreflangResults.filter(r => r.issues.some(i => i.level === 'error' || i.level === 'warning'));
    const missingXDefault = hreflangResults.filter(r => !r.error && !r.hasXDefault);
    const missingSelfRef = hreflangResults.filter(r => !r.error && !r.hasSelfReference);
    const bidirectionalErrors = hreflangResults.filter(r => r.issues.some(i => i.message.includes('geri bağlantı')));
    return { totalLanguages: SUPPORTED_LANGUAGES.length, scannedLanguages: successfulScans.length, languagesWithIssues: withIssues.length, missingBidirectional: bidirectionalErrors.length, missingXDefault: missingXDefault.length, missingSelfReference: missingSelfRef.length };
  };

  // Canonical scan
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
        const response = await fetch(url, { headers: { 'Accept': 'text/html' } });
        if (!response.ok) {
          results.push({ language: lang, url, canonicalUrl: null, issues: [], isSelfReferencing: false, isAbsoluteUrl: false, scannedAt: new Date(), error: `HTTP ${response.status}` });
        } else {
          const html = await response.text();
          const canonicalUrl = parseCanonicalUrl(html);
          const issues: CanonicalIssue[] = [];
          let isSelfReferencing = false;
          let isAbsoluteUrl = false;

          if (!canonicalUrl) {
            issues.push({ level: 'error', message: 'Canonical tag eksik' });
          } else {
            isAbsoluteUrl = canonicalUrl.startsWith('http');
            if (!isAbsoluteUrl) issues.push({ level: 'error', message: 'Canonical URL mutlak olmalı' });
            isSelfReferencing = canonicalUrl === url;
            if (!isSelfReferencing) issues.push({ level: 'warning', message: `Canonical başka URL'ye işaret ediyor: ${canonicalUrl}` });
          }

          results.push({ language: lang, url, canonicalUrl, issues, isSelfReferencing, isAbsoluteUrl, scannedAt: new Date() });
        }
      } catch (error) {
        results.push({ language: lang, url, canonicalUrl: null, issues: [], isSelfReferencing: false, isAbsoluteUrl: false, scannedAt: new Date(), error: error instanceof Error ? error.message : 'Bilinmeyen hata' });
      }

      setCanonicalScanProgress(((i + 1) / SUPPORTED_LANGUAGES.length) * 100);
      setCanonicalResults([...results]);
    }
    setIsScanningCanonical(false);
  };

  const getCanonicalSummary = (): CanonicalSummary => {
    const successfulScans = canonicalResults.filter(r => !r.error);
    const withIssues = canonicalResults.filter(r => r.issues.some(i => i.level === 'error' || i.level === 'warning'));
    const missingCanonical = canonicalResults.filter(r => !r.error && !r.canonicalUrl);
    const nonSelfRef = canonicalResults.filter(r => !r.error && r.canonicalUrl && !r.isSelfReferencing);
    const relativeUrls = canonicalResults.filter(r => !r.error && r.canonicalUrl && !r.isAbsoluteUrl);
    const canonicalPatterns = successfulScans.filter(r => r.canonicalUrl).map(r => r.isSelfReferencing ? 'self' : 'other');
    const uniquePatterns = [...new Set(canonicalPatterns)];
    return { totalLanguages: SUPPORTED_LANGUAGES.length, scannedLanguages: successfulScans.length, languagesWithIssues: withIssues.length, missingCanonical: missingCanonical.length, nonSelfReferencing: nonSelfRef.length, relativeUrls: relativeUrls.length, inconsistentPatterns: uniquePatterns.length > 1 };
  };

  // Meta tag scan
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
        const response = await fetch(url, { headers: { 'Accept': 'text/html' } });
        if (!response.ok) {
          results.push({ language: lang, url, metaTags: { title: null, titleLength: 0, description: null, descriptionLength: 0, robots: null, keywords: null, viewport: null, ogTitle: null, ogDescription: null, ogImage: null, ogType: null, twitterCard: null, twitterTitle: null, twitterDescription: null }, issues: [], scannedAt: new Date(), error: `HTTP ${response.status}` });
        } else {
          const html = await response.text();
          const metaTags = parseMetaTags(html);
          const issues = validateMetaTags(metaTags);
          results.push({ language: lang, url, metaTags, issues, scannedAt: new Date() });
        }
      } catch (error) {
        results.push({ language: lang, url, metaTags: { title: null, titleLength: 0, description: null, descriptionLength: 0, robots: null, keywords: null, viewport: null, ogTitle: null, ogDescription: null, ogImage: null, ogType: null, twitterCard: null, twitterTitle: null, twitterDescription: null }, issues: [], scannedAt: new Date(), error: error instanceof Error ? error.message : 'Bilinmeyen hata' });
      }

      setMetaTagScanProgress(((i + 1) / SUPPORTED_LANGUAGES.length) * 100);
      setMetaTagResults([...results]);
    }
    setIsScanningMetaTags(false);
  };

  const getMetaTagSummary = (): MetaTagSummary => {
    const successfulScans = metaTagResults.filter(r => !r.error);
    const withIssues = metaTagResults.filter(r => r.issues.some(i => i.level === 'error' || i.level === 'warning'));
    const missingTitle = metaTagResults.filter(r => !r.error && !r.metaTags.title);
    const missingDescription = metaTagResults.filter(r => !r.error && !r.metaTags.description);
    const titleTooLong = metaTagResults.filter(r => !r.error && r.metaTags.titleLength > 60);
    const descriptionTooLong = metaTagResults.filter(r => !r.error && r.metaTags.descriptionLength > 160);
    const missingOgTags = metaTagResults.filter(r => !r.error && (!r.metaTags.ogTitle || !r.metaTags.ogDescription || !r.metaTags.ogImage));
    const titles = successfulScans.filter(r => r.metaTags.title).map(r => r.metaTags.title);
    const uniqueTitles = [...new Set(titles)];
    return { totalLanguages: SUPPORTED_LANGUAGES.length, scannedLanguages: successfulScans.length, languagesWithIssues: withIssues.length, missingTitle: missingTitle.length, missingDescription: missingDescription.length, titleTooLong: titleTooLong.length, descriptionTooLong: descriptionTooLong.length, missingOgTags: missingOgTags.length, inconsistentTitles: uniqueTitles.length === successfulScans.length && successfulScans.length > 1 };
  };

  const getIssueCounts = (issues: ValidationIssue[]) => ({
    errors: issues.filter(i => i.level === 'error').length,
    warnings: issues.filter(i => i.level === 'warning').length,
    infos: issues.filter(i => i.level === 'info').length,
  });

  const renderValidationCard = (issues: ValidationIssue[]) => {
    const counts = getIssueCounts(issues);
    const hasErrors = counts.errors > 0;
    const hasWarnings = counts.warnings > 0;

    return (
      <Card className={hasErrors ? 'border-destructive' : hasWarnings ? 'border-yellow-500' : 'border-green-500'}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            {hasErrors ? <><AlertCircle className="h-5 w-5 text-destructive" /><span className="text-destructive">Validasyon Hataları</span></> : hasWarnings ? <><AlertTriangle className="h-5 w-5 text-yellow-500" /><span className="text-yellow-600">Uyarılar Var</span></> : <><CheckCircle className="h-5 w-5 text-green-500" /><span className="text-green-500">Validasyon Başarılı</span></>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg"><div className="text-xl font-bold text-destructive">{counts.errors}</div><div className="text-xs text-muted-foreground">Hata</div></div>
            <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg"><div className="text-xl font-bold text-yellow-600">{counts.warnings}</div><div className="text-xs text-muted-foreground">Uyarı</div></div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded-lg"><div className="text-xl font-bold text-blue-600">{counts.infos}</div><div className="text-xs text-muted-foreground">Bilgi</div></div>
          </div>
          {issues.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {issues.map((issue, idx) => (
                <div key={idx} className={`p-2 rounded-lg text-xs flex items-start gap-2 ${issue.level === 'error' ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' : issue.level === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300' : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'}`}>
                  {issue.level === 'error' ? <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /> : issue.level === 'warning' ? <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" /> : <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                  <div><span className="font-medium">{issue.schemaType}</span>{issue.schemaIndex > 0 && <span className="opacity-70"> (#{issue.schemaIndex})</span>}<span className="opacity-70"> → {issue.field}:</span><span className="ml-1">{issue.message}</span></div>
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
            {hasMultipleRatings ? <><AlertCircle className="h-5 w-5 text-destructive" /><span className="text-destructive">Multiple Ratings! ({title})</span></> : <><CheckCircle className="h-5 w-5 text-green-500" /><span className="text-green-500">OK ({title})</span></>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-muted rounded-lg"><div className={`text-xl font-bold ${hasMultipleRatings ? 'text-destructive' : 'text-foreground'}`}>{ratings.length}</div><div className="text-xs text-muted-foreground">Ratings</div></div>
            {ratings[0] && (<><div className="text-center p-3 bg-muted rounded-lg"><div className="text-xl font-bold text-foreground flex items-center justify-center gap-1"><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />{ratings[0].ratingValue}</div><div className="text-xs text-muted-foreground">Rating</div></div><div className="text-center p-3 bg-muted rounded-lg"><div className="text-xl font-bold text-foreground">{ratings[0].reviewCount}</div><div className="text-xs text-muted-foreground">Reviews</div></div><div className="text-center p-3 bg-muted rounded-lg"><div className="text-xl font-bold text-foreground">{ratings[0].schemaType}</div><div className="text-xs text-muted-foreground">Type</div></div></>)}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSchemaList = (schemas: SchemaScript[], ratings: AggregateRating[]) => (
    <>
      {ratings.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Star className="h-4 w-4" />Aggregate Ratings ({ratings.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ratings.map((rating, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-lg text-sm">
                  <Badge variant="outline" className="text-xs">{rating.source}</Badge>
                  <Badge variant="secondary" className="text-xs">{rating.schemaType}</Badge>
                  <div className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /><span className="font-semibold">{rating.ratingValue}</span></div>
                  <span className="text-muted-foreground">|</span>
                  <span>{rating.reviewCount} reviews</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Code className="h-4 w-4" />JSON-LD Scripts ({schemas.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {schemas.map((schema) => (
              <div key={schema.index} className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 p-2 bg-muted"><Badge className="text-xs">#{schema.index}</Badge><Badge variant="secondary" className="text-xs">{schema.type}</Badge>{schema.hasAggregateRating && <Badge variant="default" className="bg-yellow-500 text-xs">Rating</Badge>}</div>
                <details className="group"><summary className="px-3 py-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground">JSON göster</summary><pre className="p-2 bg-black text-green-400 text-[10px] overflow-x-auto max-h-60">{schema.raw}</pre></details>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );

  const tabs = [
    { id: 'current' as SEODebugTab, label: `Bu Sayfa (${currentPageSchemas.length})`, icon: null },
    { id: 'scanned' as SEODebugTab, label: `Taranan Sayfalar (${scanResults.length})`, icon: null },
    { id: 'languages' as SEODebugTab, label: `Dil Karşılaştırması (${languageScanResults.length})`, icon: Globe },
    { id: 'hreflang' as SEODebugTab, label: `Hreflang (${hreflangResults.length})`, icon: Link2 },
    { id: 'canonical' as SEODebugTab, label: `Canonical (${canonicalResults.length})`, icon: FileText },
    { id: 'metatags' as SEODebugTab, label: `Meta Tags (${metaTagResults.length})`, icon: Tag },
    { id: 'sitemap' as SEODebugTab, label: `Sitemap ${robotsResult ? '✓' : ''}`, icon: Map },
    { id: 'vitals' as SEODebugTab, label: `Web Vitals ${vitalsResult ? '✓' : ''}`, icon: Gauge },
    { id: 'social' as SEODebugTab, label: `Sosyal ${socialResult ? '✓' : ''}`, icon: Share2 },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">SEO Debug - JSON-LD Validator</h1>
          <p className="text-sm text-muted-foreground">Schema.org validasyonu ile JSON-LD scriptlerini kontrol edin</p>
        </div>

        {/* Scan Cards */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4" />Sayfa Tara</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button onClick={scanHomepage} disabled={isScanning} variant="default" size="sm"><Home className="h-4 w-4 mr-1" />Ana Sayfa{isScanning && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}</Button>
              {quickScanUrls.slice(1).map((item) => <Button key={item.path} onClick={() => scanUrl(window.location.origin + item.path)} disabled={isScanning} variant="outline" size="sm">{item.label}</Button>)}
            </div>
            <div className="flex gap-2"><Input placeholder="/sayfa-yolu veya tam URL" value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && scanCustomUrl()} className="text-sm" /><Button onClick={scanCustomUrl} disabled={isScanning || !customUrl} size="sm"><Search className="h-4 w-4" /></Button></div>
          </CardContent>
        </Card>

        {/* Language Scan */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Languages className="h-4 w-4" />Tüm Dilleri Tara</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Sayfa yolu (örn: / veya /reviews)" value={languageScanPath} onChange={(e) => setLanguageScanPath(e.target.value)} className="text-sm" />
              <Button onClick={() => scanAllLanguages(languageScanPath)} disabled={isScanningLanguages} size="sm">
                <Globe className="h-4 w-4 mr-1" />{SUPPORTED_LANGUAGES.length} Dili Tara{isScanningLanguages && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-muted-foreground mr-2">Blog:</span>
              {blogQuickPaths.map((item) => (
                <Button 
                  key={item.path} 
                  onClick={() => { 
                    setLanguageScanPath(item.path);
                    setHreflangScanPath(item.path);
                    setCanonicalScanPath(item.path);
                    setMetaTagScanPath(item.path);
                  }} 
                  variant={languageScanPath === item.path ? "default" : "ghost"} 
                  size="sm" 
                  className="h-6 text-xs px-2"
                >
                  {item.label}
                </Button>
              ))}
            </div>
            {isScanningLanguages && <Progress value={languageScanProgress} className="h-2" />}
          </CardContent>
        </Card>

        {/* Quick scan buttons for other features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button onClick={() => { scanHreflangTags(hreflangScanPath); }} disabled={isScanningHreflang} variant="outline" size="sm" className="w-full"><Link2 className="h-4 w-4 mr-1" />Hreflang</Button>
          <Button onClick={() => { scanCanonicalUrls(canonicalScanPath); }} disabled={isScanningCanonical} variant="outline" size="sm" className="w-full"><FileText className="h-4 w-4 mr-1" />Canonical</Button>
          <Button onClick={() => { scanMetaTags(metaTagScanPath); }} disabled={isScanningMetaTags} variant="outline" size="sm" className="w-full"><Tag className="h-4 w-4 mr-1" />Meta Tags</Button>
          <Button onClick={() => { scanRobotsAndSitemap(); setActiveTab('sitemap'); }} disabled={isScanningRobots} variant="outline" size="sm" className="w-full"><Bot className="h-4 w-4 mr-1" />Robots</Button>
          <Button onClick={() => { scanWebVitals(); setActiveTab('vitals'); }} disabled={isScanningVitals} variant="outline" size="sm" className="w-full"><Zap className="h-4 w-4 mr-1" />Vitals</Button>
          <Button onClick={() => { scanSocialPreview(); setActiveTab('social'); }} disabled={isScanningSocial} variant="outline" size="sm" className="w-full"><Image className="h-4 w-4 mr-1" />Sosyal</Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {tab.icon && <tab.icon className="h-3 w-3" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'current' && <div className="space-y-4">{renderValidationCard(currentPageIssues)}{renderSummaryCard(currentPageRatings, 'Bu Sayfa')}{renderSchemaList(currentPageSchemas, currentPageRatings)}</div>}
        
        {activeTab === 'scanned' && (
          <div className="space-y-6">
            {scanResults.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Henüz sayfa taranmadı.</CardContent></Card> : scanResults.map((result, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center gap-2 text-sm"><ExternalLink className="h-4 w-4 text-muted-foreground" /><a href={result.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">{result.url}</a></div>
                {renderValidationCard(result.validationIssues)}{renderSummaryCard(result.aggregateRatings, new URL(result.url).pathname)}{renderSchemaList(result.schemas, result.aggregateRatings)}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'languages' && <SEODebugLanguagesTab languageScanResults={languageScanResults} getLanguageComparisonSummary={getLanguageComparisonSummary} />}
        {activeTab === 'hreflang' && <SEODebugHreflangTab hreflangResults={hreflangResults} getHreflangSummary={getHreflangSummary} />}
        {activeTab === 'canonical' && <SEODebugCanonicalTab canonicalResults={canonicalResults} getCanonicalSummary={getCanonicalSummary} />}
        {activeTab === 'metatags' && <SEODebugMetaTagsTab metaTagResults={metaTagResults} getMetaTagSummary={getMetaTagSummary} />}
        {activeTab === 'sitemap' && <SEODebugSitemapTab robotsResult={robotsResult} sitemapResults={sitemapResults} />}
        {activeTab === 'vitals' && <SEODebugVitalsTab vitalsResult={vitalsResult} />}
        {activeTab === 'social' && <SEODebugSocialTab socialResult={socialResult} imageLoading={socialImageLoading} />}
      </div>
    </div>
  );
};

export default SEODebugPage;
