import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage, Language } from '@/contexts/LanguageContext';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
  // Article-specific props for blog posts
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  articleSection?: string;
}

// All supported language prefixes in URL paths
const LANGUAGE_PREFIXES = ["de", "fr", "ru", "it", "es", "ar", "tr", "uk", "ja"];

// Language code mapping for hreflang attributes
const LANGUAGE_CODES: Record<Language, string> = {
  EN: "en",
  DE: "de",
  FR: "fr",
  RU: "ru",
  IT: "it",
  ES: "es",
  AR: "ar",
  TR: "tr",
  UK: "uk",
  JA: "ja",
};

// Default OG images for different page types (1200x630 recommended for social media)
const DEFAULT_OG_IMAGES = {
  home: 'https://meettransfer.app/og/home-og.jpg',
  transfer: 'https://meettransfer.app/og/home-og.jpg',
  fleet: 'https://meettransfer.app/images/meet-transfer-vclass-interior.jpg',
  blog: 'https://meettransfer.app/images/meet-transfer-vclass-interior.jpg',
  default: 'https://meettransfer.app/og/home-og.jpg',
};

const SEOHead = ({
  title,
  description,
  keywords,
  canonicalPath,
  ogImage,
  ogType = 'website',
  noIndex = false,
  articlePublishedTime,
  articleModifiedTime,
  articleAuthor = 'Meet Transfer',
  articleSection,
}: SEOHeadProps) => {
  const location = useLocation();
  const { language } = useLanguage();
  const baseUrl = 'https://meettransfer.app';

  // Determine default OG image based on path
  const getDefaultOgImage = (): string => {
    const path = canonicalPath || location.pathname;
    if (path === '/' || path === '') return DEFAULT_OG_IMAGES.home;
    if (path.includes('/blog')) return DEFAULT_OG_IMAGES.blog;
    if (path.includes('/fleet')) return DEFAULT_OG_IMAGES.fleet;
    if (path.includes('transfer')) return DEFAULT_OG_IMAGES.transfer;
    return DEFAULT_OG_IMAGES.default;
  };

  const finalOgImage = ogImage || getDefaultOgImage();

  // Get the base path without any language prefix
  const getBasePath = (): string => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const firstPart = pathParts[0]?.toLowerCase();
    
    if (LANGUAGE_PREFIXES.includes(firstPart)) {
      const remainingPath = pathParts.slice(1).join("/");
      return remainingPath ? `/${remainingPath}` : "/";
    }
    return location.pathname || "/";
  };

  // Get the current language from URL
  const getCurrentLanguageFromUrl = (): string => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const firstPart = pathParts[0]?.toLowerCase();
    
    if (LANGUAGE_PREFIXES.includes(firstPart)) {
      return firstPart;
    }
    return "en"; // Default to English if no language prefix
  };

  const basePath = canonicalPath || getBasePath();
  const currentLangFromUrl = getCurrentLanguageFromUrl();
  
  // Build the correct canonical URL based on basePath and current language
  const buildCanonicalUrl = (): string => {
    if (canonicalPath) {
      if (currentLangFromUrl === "en") {
        return canonicalPath === "/" ? baseUrl : `${baseUrl}${canonicalPath}`;
      } else {
        return canonicalPath === "/" 
          ? `${baseUrl}/${currentLangFromUrl}` 
          : `${baseUrl}/${currentLangFromUrl}${canonicalPath}`;
      }
    }
    const cleanPathname = location.pathname === "/" ? "" : location.pathname;
    return `${baseUrl}${cleanPathname}`;
  };
  
  const canonicalUrl = buildCanonicalUrl();
  const fullUrl = canonicalUrl;

  useEffect(() => {
    // Update title
    document.title = title;

    // Helper to update or create meta tag
    const updateMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (meta) {
        meta.setAttribute('content', content);
      } else {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // Helper to remove meta tag
    const removeMeta = (name: string, property = false) => {
      const attr = property ? 'property' : 'name';
      const meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (meta) meta.remove();
    };

    // Update meta tags
    updateMeta('description', description);
    if (keywords) {
      updateMeta('keywords', keywords);
    }

    // Robots
    updateMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph basic
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:url', fullUrl, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:image', finalOgImage, true);
    updateMeta('og:image:width', '1200', true);
    updateMeta('og:image:height', '630', true);
    updateMeta('og:image:alt', title, true);
    updateMeta('og:site_name', 'Meet Transfer', true);
    updateMeta('og:image:type', 'image/jpeg', true);
    
    // Set og:locale based on current URL language
    const localeMap: Record<string, string> = {
      en: 'en_US',
      de: 'de_DE',
      fr: 'fr_FR',
      ru: 'ru_RU',
      it: 'it_IT',
      es: 'es_ES',
      ar: 'ar_SA',
      tr: 'tr_TR',
      uk: 'uk_UA',
      ja: 'ja_JP',
    };
    updateMeta('og:locale', localeMap[currentLangFromUrl] || 'en_US', true);

    // Article-specific meta tags for blog posts
    if (ogType === 'article') {
      if (articlePublishedTime) {
        updateMeta('article:published_time', articlePublishedTime, true);
      }
      if (articleModifiedTime) {
        updateMeta('article:modified_time', articleModifiedTime, true);
      }
      if (articleAuthor) {
        updateMeta('article:author', articleAuthor, true);
      }
      if (articleSection) {
        updateMeta('article:section', articleSection, true);
      }
      updateMeta('article:publisher', 'https://meettransfer.app', true);
    } else {
      // Remove article meta tags if not article type
      removeMeta('article:published_time', true);
      removeMeta('article:modified_time', true);
      removeMeta('article:author', true);
      removeMeta('article:section', true);
      removeMeta('article:publisher', true);
    }

    // Twitter Card - optimized for large image
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:site', '@meettransfer');
    updateMeta('twitter:creator', '@meettransfer');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', finalOgImage);
    updateMeta('twitter:image:alt', title);

    // Additional SEO meta tags
    updateMeta('author', 'Meet Transfer');
    updateMeta('publisher', 'Meet Transfer');

    // Update canonical - SELF-REFERENCING
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', canonicalUrl);
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', canonicalUrl);
      document.head.appendChild(canonical);
    }

    // Remove existing hreflang tags
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

    // All languages for hreflang
    const allLanguages = ["en", "de", "fr", "ru", "it", "es", "ar", "tr", "uk", "ja"];
    
    // Add hreflang tags for all languages
    allLanguages.forEach(lang => {
      const hreflang = document.createElement('link');
      hreflang.setAttribute('rel', 'alternate');
      hreflang.setAttribute('hreflang', lang);
      
      let langUrl: string;
      if (lang === "en") {
        langUrl = basePath === "/" ? baseUrl : `${baseUrl}${basePath}`;
      } else {
        langUrl = basePath === "/" 
          ? `${baseUrl}/${lang}` 
          : `${baseUrl}/${lang}${basePath}`;
      }
      
      hreflang.setAttribute('href', langUrl);
      document.head.appendChild(hreflang);
    });

    // Add x-default hreflang (pointing to English version)
    const xDefault = document.createElement('link');
    xDefault.setAttribute('rel', 'alternate');
    xDefault.setAttribute('hreflang', 'x-default');
    const xDefaultUrl = basePath === "/" ? baseUrl : `${baseUrl}${basePath}`;
    xDefault.setAttribute('href', xDefaultUrl);
    document.head.appendChild(xDefault);

    return () => {
      // Cleanup hreflang tags on unmount
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
    };
  }, [title, description, keywords, fullUrl, canonicalUrl, finalOgImage, ogType, noIndex, currentLangFromUrl, basePath, articlePublishedTime, articleModifiedTime, articleAuthor, articleSection]);

  return null;
};

export default SEOHead;
