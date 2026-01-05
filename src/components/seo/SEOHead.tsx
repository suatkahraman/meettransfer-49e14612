import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage, Language } from '@/contexts/LanguageContext';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
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

const SEOHead = ({
  title,
  description,
  keywords,
  canonicalPath,
  ogImage = 'https://meettransfer.app/og-image.jpg',
  ogType = 'website',
  noIndex = false,
}: SEOHeadProps) => {
  const location = useLocation();
  const { language } = useLanguage();
  const baseUrl = 'https://meettransfer.app';

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
  // This ensures each language version has its own canonical URL pointing to itself
  const buildCanonicalUrl = (): string => {
    // If canonicalPath is provided, build the canonical for the current language version
    if (canonicalPath) {
      if (currentLangFromUrl === "en") {
        // English version - no prefix
        return canonicalPath === "/" ? baseUrl : `${baseUrl}${canonicalPath}`;
      } else {
        // Other languages - add language prefix
        return canonicalPath === "/" 
          ? `${baseUrl}/${currentLangFromUrl}` 
          : `${baseUrl}/${currentLangFromUrl}${canonicalPath}`;
      }
    }
    // Fallback to current URL path without query strings
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

    // Update meta tags
    updateMeta('description', description);
    if (keywords) {
      updateMeta('keywords', keywords);
    }

    // Robots
    updateMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:url', fullUrl, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:image', ogImage, true);
    updateMeta('og:image:width', '1200', true);
    updateMeta('og:image:height', '630', true);
    updateMeta('og:image:alt', title, true);
    updateMeta('og:site_name', 'Meet Transfer', true);
    
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

    // Twitter
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:site', '@meettransfer');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);
    updateMeta('twitter:image:alt', title);

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

    // All languages for hreflang (including Turkish and Ukrainian)
    const allLanguages = ["en", "de", "fr", "ru", "it", "es", "ar", "tr", "uk", "ja"];
    
    // Add hreflang tags for all languages
    allLanguages.forEach(lang => {
      const hreflang = document.createElement('link');
      hreflang.setAttribute('rel', 'alternate');
      hreflang.setAttribute('hreflang', lang);
      
      // Build the URL for this language version
      let langUrl: string;
      if (lang === "en") {
        // English is the default (no prefix)
        langUrl = basePath === "/" ? baseUrl : `${baseUrl}${basePath}`;
      } else {
        // Other languages have a prefix
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
  }, [title, description, keywords, fullUrl, canonicalUrl, ogImage, ogType, noIndex, currentLangFromUrl, basePath]);

  return null;
};

export default SEOHead;
