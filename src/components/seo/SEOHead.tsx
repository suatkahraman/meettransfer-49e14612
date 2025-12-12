import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

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
  const baseUrl = 'https://meettransfer.app';
  const fullUrl = canonicalPath ? `${baseUrl}${canonicalPath}` : `${baseUrl}${location.pathname}`;

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
    updateMeta('og:locale', 'en_US', true);

    // Twitter
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);

    // Update canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', fullUrl);
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', fullUrl);
      document.head.appendChild(canonical);
    }

    return () => {
      // Cleanup is optional since we're updating the same tags
    };
  }, [title, description, keywords, fullUrl, ogImage, ogType, noIndex]);

  return null;
};

export default SEOHead;
