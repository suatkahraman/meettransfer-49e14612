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

const LANGUAGE_PREFIXES = ["de", "fr", "ru", "it", "es", "ar"];
const LANGUAGE_CODES: Record<Language, string> = {
  EN: "en",
  DE: "de",
  FR: "fr",
  RU: "ru",
  IT: "it",
  ES: "es",
  AR: "ar",
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

  // Get base path without language prefix
  const getBasePath = () => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const firstPart = pathParts[0]?.toLowerCase();
    
    if (LANGUAGE_PREFIXES.includes(firstPart)) {
      return "/" + pathParts.slice(1).join("/") || "/";
    }
    return location.pathname;
  };

  const basePath = canonicalPath || getBasePath();
  const fullUrl = `${baseUrl}${location.pathname}`;
  const canonicalUrl = `${baseUrl}${language === "EN" ? basePath : `/${language.toLowerCase()}${basePath === "/" ? "" : basePath}`}`;

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
    updateMeta('og:site_name', 'Meet Transfer', true);
    updateMeta('og:locale', `${LANGUAGE_CODES[language]}_${LANGUAGE_CODES[language].toUpperCase()}`, true);

    // Twitter
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);

    // Update canonical
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

    // Add hreflang tags for all languages
    const languages: Language[] = ["EN", "DE", "FR", "RU", "IT", "ES", "AR"];
    languages.forEach(lang => {
      const hreflang = document.createElement('link');
      hreflang.setAttribute('rel', 'alternate');
      hreflang.setAttribute('hreflang', LANGUAGE_CODES[lang]);
      const langPath = lang === "EN" 
        ? basePath 
        : `/${lang.toLowerCase()}${basePath === "/" ? "" : basePath}`;
      hreflang.setAttribute('href', `${baseUrl}${langPath}`);
      document.head.appendChild(hreflang);
    });

    // Add x-default hreflang (pointing to English)
    const xDefault = document.createElement('link');
    xDefault.setAttribute('rel', 'alternate');
    xDefault.setAttribute('hreflang', 'x-default');
    xDefault.setAttribute('href', `${baseUrl}${basePath}`);
    document.head.appendChild(xDefault);

    return () => {
      // Cleanup hreflang tags on unmount
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
    };
  }, [title, description, keywords, fullUrl, canonicalUrl, ogImage, ogType, noIndex, language, basePath]);

  return null;
};

export default SEOHead;
