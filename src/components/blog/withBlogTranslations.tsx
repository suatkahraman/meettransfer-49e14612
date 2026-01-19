import { ComponentType, Suspense, lazy } from "react";
import { BlogTranslationProvider } from "./BlogTranslationProvider";

/**
 * Wraps a blog page component to:
 * 1. Lazy-load the BlogTranslations chunk
 * 2. Provide tBlog via context
 * 
 * Usage in App.tsx routes:
 *   const IstanbulGuide = withBlogTranslations(
 *     lazy(() => import("./pages/website/blog/IstanbulAirportToCityGuide"))
 *   );
 */
export function withBlogTranslations<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  const Wrapped = (props: P) => (
    <BlogTranslationProvider>
      <Component {...props} />
    </BlogTranslationProvider>
  );

  Wrapped.displayName = `withBlogTranslations(${Component.displayName || Component.name || "Component"})`;

  return Wrapped;
}

/**
 * Simple loading placeholder for blog pages during lazy load.
 */
export const BlogPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);
