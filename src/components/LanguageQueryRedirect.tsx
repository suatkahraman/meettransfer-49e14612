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

    if (!langParam) return;

    const supportedLangs = ["de", "fr", "ru", "it", "es", "ar", "tr", "uk", "ja", "pt"];
    const normalizedLang = langParam.toLowerCase();

    // Always strip ?lang= from URL
    searchParams.delete("lang");
    const remainingParams = searchParams.toString();

    const stripExistingLangPrefix = (pathname: string) => {
      const parts = pathname.split("/").filter(Boolean);
      const first = parts[0]?.toLowerCase();
      const allLangs = [...supportedLangs, "en"]; // 'en' is default

      if (first && allLangs.includes(first)) {
        const rest = parts.slice(1);
        return rest.length ? `/${rest.join("/")}` : "/";
      }

      return pathname;
    };

    const basePath = stripExistingLangPrefix(location.pathname);

    // These routes are intentionally NOT localized with a /xx prefix.
    // If we prefix them (e.g. /tr/auth, /tr/customer), the app shows a 404.
    // For these, we only strip ?lang= and keep the path as-is.
    const NON_LOCALIZED_PREFIXES = [
      "/auth",
      "/login",
      "/signup",
      "/customer",
      "/admin",
      "/driver",
      "/agency",
      "/embed",
      "/install",
      "/security-settings",
      "/customer-portal",
      "/confirm-booking",
      "/quick-booking-info",
      "/payment-success",
      "/payment-cancel",
      "/payment-error",
      "/payment",
      "/s",
    ];

    const isNonLocalized = NON_LOCALIZED_PREFIXES.some(
      (p) => basePath === p || basePath.startsWith(`${p}/`)
    );

    // Build target path
    let targetPath: string;

    if (isNonLocalized) {
      // Just remove ?lang= and keep the route unchanged.
      targetPath = basePath;
    } else if (supportedLangs.includes(normalizedLang)) {
      targetPath = basePath === "/" ? `/${normalizedLang}` : `/${normalizedLang}${basePath}`;
    } else if (normalizedLang === "en") {
      // English is default (no prefix)
      targetPath = basePath;
    } else {
      return;
    }

    if (remainingParams) {
      targetPath += `?${remainingParams}`;
    }

    // Use replace to avoid adding to browser history
    navigate(targetPath, { replace: true });
  }, [location.search, location.pathname, navigate]);

  return null;
};

export default LanguageQueryRedirect;
