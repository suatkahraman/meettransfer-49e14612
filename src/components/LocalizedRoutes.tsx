import { ReactNode } from "react";
import { Routes, Route } from "react-router-dom";

interface LocalizedRoutesProps {
  children: ReactNode;
}

// Language prefixes for non-English routes
const LANGUAGE_PREFIXES = ["tr", "de", "fr", "ru", "it", "es", "ar"];

/**
 * Creates routes for a page that supports multiple languages.
 * English uses the base path, other languages use prefixed paths.
 */
export const createLocalizedRoutes = (
  basePath: string,
  element: ReactNode
): ReactNode[] => {
  const routes: ReactNode[] = [];
  
  // English (default) - no prefix
  routes.push(
    <Route key={`en-${basePath}`} path={basePath} element={element} />
  );
  
  // Other languages - with prefix
  LANGUAGE_PREFIXES.forEach((prefix) => {
    const localizedPath = basePath === "/" 
      ? `/${prefix}` 
      : `/${prefix}${basePath}`;
    routes.push(
      <Route key={`${prefix}-${basePath}`} path={localizedPath} element={element} />
    );
  });
  
  return routes;
};

/**
 * Helper to generate all localized path variations for a given base path.
 */
export const getLocalizedPaths = (basePath: string): string[] => {
  const paths = [basePath];
  
  LANGUAGE_PREFIXES.forEach((prefix) => {
    const localizedPath = basePath === "/" 
      ? `/${prefix}` 
      : `/${prefix}${basePath}`;
    paths.push(localizedPath);
  });
  
  return paths;
};

export default function LocalizedRoutes({ children }: LocalizedRoutesProps) {
  return <Routes>{children}</Routes>;
}
