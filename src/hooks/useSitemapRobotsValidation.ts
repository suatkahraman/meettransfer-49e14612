import { useState, useCallback } from 'react';
import { SUPPORTED_LANGUAGES, type Language } from '@/hooks/useLanguageFromUrl';

export interface RobotsResult {
  accessible: boolean;
  content: string | null;
  sitemapUrls: string[];
  disallowRules: string[];
  allowRules: string[];
  crawlDelay: number | null;
  issues: { level: 'error' | 'warning' | 'info'; message: string }[];
  scannedAt: Date;
  error?: string;
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  hreflangLinks?: { hreflang: string; href: string }[];
}

export interface SitemapResult {
  url: string;
  accessible: boolean;
  urlCount: number;
  urls: SitemapUrl[];
  hasHreflang: boolean;
  languageCoverage: { language: Language; count: number }[];
  issues: { level: 'error' | 'warning' | 'info'; message: string }[];
  scannedAt: Date;
  error?: string;
}

export interface SitemapRobotsValidation {
  robots: RobotsResult | null;
  sitemaps: SitemapResult[];
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
  PT: "/pt",
};

export const useSitemapRobotsValidation = () => {
  const [robotsResult, setRobotsResult] = useState<RobotsResult | null>(null);
  const [sitemapResults, setSitemapResults] = useState<SitemapResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const parseRobotsTxt = (content: string): Partial<RobotsResult> => {
    const lines = content.split('\n');
    const sitemapUrls: string[] = [];
    const disallowRules: string[] = [];
    const allowRules: string[] = [];
    let crawlDelay: number | null = null;
    const issues: { level: 'error' | 'warning' | 'info'; message: string }[] = [];

    let currentUserAgent = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const [directive, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();

      switch (directive.toLowerCase()) {
        case 'user-agent':
          currentUserAgent = value;
          break;
        case 'sitemap':
          if (value) sitemapUrls.push(value);
          break;
        case 'disallow':
          if (value) disallowRules.push(`${currentUserAgent}: ${value}`);
          break;
        case 'allow':
          if (value) allowRules.push(`${currentUserAgent}: ${value}`);
          break;
        case 'crawl-delay':
          crawlDelay = parseInt(value, 10) || null;
          break;
      }
    }

    // Validation
    if (sitemapUrls.length === 0) {
      issues.push({ level: 'warning', message: 'Sitemap URL tanımlı değil - Sitemap: direktifi ekleyin' });
    }

    if (disallowRules.some(r => r.includes('/'))) {
      const blockAll = disallowRules.find(r => r.endsWith(': /') && !r.includes('/tr') && !r.includes('/admin'));
      if (blockAll) {
        issues.push({ level: 'error', message: 'Tüm içerik engelleniyor - Disallow: / kuralı var' });
      }
    }

    if (crawlDelay && crawlDelay > 10) {
      issues.push({ level: 'warning', message: `Crawl-delay çok yüksek (${crawlDelay}s) - SEO'yu olumsuz etkileyebilir` });
    }

    return { sitemapUrls, disallowRules, allowRules, crawlDelay, issues };
  };

  const parseSitemap = (xmlText: string, baseUrl: string): { urls: SitemapUrl[]; hasHreflang: boolean } => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const urls: SitemapUrl[] = [];
    let hasHreflang = false;

    // Check for sitemap index
    const sitemapIndexUrls = doc.querySelectorAll('sitemapindex > sitemap > loc');
    if (sitemapIndexUrls.length > 0) {
      // This is a sitemap index, return the sitemap URLs
      sitemapIndexUrls.forEach(loc => {
        urls.push({ loc: loc.textContent || '' });
      });
      return { urls, hasHreflang: false };
    }

    // Parse urlset
    const urlElements = doc.querySelectorAll('urlset > url');
    urlElements.forEach(urlEl => {
      const loc = urlEl.querySelector('loc')?.textContent || '';
      const lastmod = urlEl.querySelector('lastmod')?.textContent || undefined;
      const changefreq = urlEl.querySelector('changefreq')?.textContent || undefined;
      const priority = urlEl.querySelector('priority')?.textContent || undefined;

      // Check for xhtml:link hreflang
      const hreflangLinks: { hreflang: string; href: string }[] = [];
      const linkElements = urlEl.querySelectorAll('link');
      linkElements.forEach(link => {
        const rel = link.getAttribute('rel');
        const hreflang = link.getAttribute('hreflang');
        const href = link.getAttribute('href');
        if (rel === 'alternate' && hreflang && href) {
          hasHreflang = true;
          hreflangLinks.push({ hreflang, href });
        }
      });

      urls.push({ loc, lastmod, changefreq, priority, hreflangLinks: hreflangLinks.length > 0 ? hreflangLinks : undefined });
    });

    return { urls, hasHreflang };
  };

  const analyzeLanguageCoverage = (urls: SitemapUrl[], baseUrl: string): { language: Language; count: number }[] => {
    const coverage: Record<Language, number> = {} as Record<Language, number>;

    SUPPORTED_LANGUAGES.forEach(lang => {
      coverage[lang] = 0;
    });

    urls.forEach(url => {
      const path = url.loc.replace(baseUrl, '');
      
      for (const [lang, prefix] of Object.entries(LANGUAGE_TO_PREFIX)) {
        if (prefix === '' && !path.startsWith('/tr') && !path.startsWith('/de') && !path.startsWith('/fr') && 
            !path.startsWith('/ru') && !path.startsWith('/it') && !path.startsWith('/es') && 
            !path.startsWith('/ar') && !path.startsWith('/uk') && !path.startsWith('/ja')) {
          coverage[lang as Language]++;
        } else if (prefix && path.startsWith(prefix)) {
          coverage[lang as Language]++;
        }
      }
    });

    return SUPPORTED_LANGUAGES.map(lang => ({ language: lang, count: coverage[lang] }));
  };

  const scanRobotsAndSitemap = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);
    setRobotsResult(null);
    setSitemapResults([]);

    const baseUrl = window.location.origin;

    try {
      // Step 1: Fetch robots.txt
      setScanProgress(10);
      let robotsData: RobotsResult;

      try {
        const robotsResponse = await fetch(`${baseUrl}/robots.txt`);
        if (!robotsResponse.ok) {
          robotsData = {
            accessible: false,
            content: null,
            sitemapUrls: [],
            disallowRules: [],
            allowRules: [],
            crawlDelay: null,
            issues: [{ level: 'error', message: `robots.txt erişilemedi (HTTP ${robotsResponse.status})` }],
            scannedAt: new Date(),
            error: `HTTP ${robotsResponse.status}`,
          };
        } else {
          const content = await robotsResponse.text();
          const parsed = parseRobotsTxt(content);
          robotsData = {
            accessible: true,
            content,
            sitemapUrls: parsed.sitemapUrls || [],
            disallowRules: parsed.disallowRules || [],
            allowRules: parsed.allowRules || [],
            crawlDelay: parsed.crawlDelay || null,
            issues: parsed.issues || [],
            scannedAt: new Date(),
          };
        }
      } catch (error) {
        robotsData = {
          accessible: false,
          content: null,
          sitemapUrls: [],
          disallowRules: [],
          allowRules: [],
          crawlDelay: null,
          issues: [{ level: 'error', message: 'robots.txt dosyası bulunamadı veya erişilemedi' }],
          scannedAt: new Date(),
          error: error instanceof Error ? error.message : 'Network error',
        };
      }

      setRobotsResult(robotsData);
      setScanProgress(30);

      // Step 2: Fetch sitemaps
      const sitemapUrls = robotsData.sitemapUrls.length > 0 
        ? robotsData.sitemapUrls 
        : [`${baseUrl}/sitemap.xml`];

      const sitemapResultsList: SitemapResult[] = [];

      for (let i = 0; i < sitemapUrls.length; i++) {
        const sitemapUrl = sitemapUrls[i];
        
        try {
          const sitemapResponse = await fetch(sitemapUrl);
          
          if (!sitemapResponse.ok) {
            sitemapResultsList.push({
              url: sitemapUrl,
              accessible: false,
              urlCount: 0,
              urls: [],
              hasHreflang: false,
              languageCoverage: [],
              issues: [{ level: 'error', message: `Sitemap erişilemedi (HTTP ${sitemapResponse.status})` }],
              scannedAt: new Date(),
              error: `HTTP ${sitemapResponse.status}`,
            });
          } else {
            const xmlText = await sitemapResponse.text();
            const { urls, hasHreflang } = parseSitemap(xmlText, baseUrl);
            const languageCoverage = analyzeLanguageCoverage(urls, baseUrl);
            
            const issues: { level: 'error' | 'warning' | 'info'; message: string }[] = [];

            // Validate sitemap
            if (urls.length === 0) {
              issues.push({ level: 'warning', message: 'Sitemap boş - URL bulunamadı' });
            }

            if (!hasHreflang && SUPPORTED_LANGUAGES.length > 1) {
              issues.push({ level: 'info', message: 'Sitemap\'te hreflang tanımı yok - çoklu dil için önerilir' });
            }

            // Check language coverage
            const missingLanguages = languageCoverage.filter(lc => lc.count === 0);
            if (missingLanguages.length > 0 && urls.length > 0) {
              issues.push({ 
                level: 'warning', 
                message: `Eksik dil URL'leri: ${missingLanguages.map(l => l.language).join(', ')}` 
              });
            }

            // Check for outdated lastmod
            const oldUrls = urls.filter(u => {
              if (!u.lastmod) return false;
              const lastmod = new Date(u.lastmod);
              const oneYearAgo = new Date();
              oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
              return lastmod < oneYearAgo;
            });

            if (oldUrls.length > 10) {
              issues.push({ 
                level: 'info', 
                message: `${oldUrls.length} URL 1 yıldan eski lastmod değerine sahip` 
              });
            }

            sitemapResultsList.push({
              url: sitemapUrl,
              accessible: true,
              urlCount: urls.length,
              urls: urls.slice(0, 100), // Limit to first 100 for display
              hasHreflang,
              languageCoverage,
              issues,
              scannedAt: new Date(),
            });
          }
        } catch (error) {
          sitemapResultsList.push({
            url: sitemapUrl,
            accessible: false,
            urlCount: 0,
            urls: [],
            hasHreflang: false,
            languageCoverage: [],
            issues: [{ level: 'error', message: 'Sitemap yüklenemedi' }],
            scannedAt: new Date(),
            error: error instanceof Error ? error.message : 'Network error',
          });
        }

        setScanProgress(30 + ((i + 1) / sitemapUrls.length) * 70);
        setSitemapResults([...sitemapResultsList]);
      }

    } catch (error) {
      console.error('Robots/Sitemap scan error:', error);
    } finally {
      setIsScanning(false);
      setScanProgress(100);
    }
  }, []);

  return {
    robotsResult,
    sitemapResults,
    isScanning,
    scanProgress,
    scanRobotsAndSitemap,
  };
};
