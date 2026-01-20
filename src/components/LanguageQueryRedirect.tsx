import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Redirects URLs with ?lang=xx query parameters to proper /xx/ path-based URLs
 * This fixes Google Search Console issues with alternate pages
 */
const LanguageQueryRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const langParam = searchParams.get("lang");

    if (langParam) {
      const supportedLangs = ["de", "fr", "ru", "it", "es", "ar", "tr", "uk", "ja", "pt"];
      const normalizedLang = langParam.toLowerCase();

      if (supportedLangs.includes(normalizedLang)) {
        // Remove the lang param and redirect to path-based URL
        searchParams.delete("lang");
        const remainingParams = searchParams.toString();
        const basePath = location.pathname === "/" ? "" : location.pathname;
        
        // Build the new URL with language prefix
        let newPath = `/${normalizedLang}${basePath}`;
        if (remainingParams) {
          newPath += `?${remainingParams}`;
        }

        // Use replace to avoid adding to browser history
        navigate(newPath, { replace: true });
      } else if (normalizedLang === "en") {
        // English is default, just remove the param
        searchParams.delete("lang");
        const remainingParams = searchParams.toString();
        let newPath = location.pathname;
        if (remainingParams) {
          newPath += `?${remainingParams}`;
        }
        navigate(newPath, { replace: true });
      }
    }
  }, [location.search, location.pathname, navigate]);

  return null;
};

export default LanguageQueryRedirect;
