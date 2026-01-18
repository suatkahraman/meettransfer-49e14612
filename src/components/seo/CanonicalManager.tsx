import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PROD_BASE_URL = "https://meettransfer.app";

/**
 * Ensures every route has a self-referencing, absolute canonical URL.
 * Pages that render SEOHead can still override this.
 */
export default function CanonicalManager() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname || "/";

    // Normalize trailing slash (keep root '/')
    const normalizedPath = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

    const canonicalUrl = normalizedPath === "/" ? PROD_BASE_URL : `${PROD_BASE_URL}${normalizedPath}`;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }

    canonical.setAttribute("href", canonicalUrl);
  }, [location.pathname]);

  return null;
}
