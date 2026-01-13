import { forwardRef, useCallback, useMemo } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { prefetchRoute } from '@/utils/prefetch';

interface PrefetchLinkProps extends LinkProps {
  /** Delay before starting prefetch (ms) */
  prefetchDelay?: number;
  /** Disable prefetch behavior */
  noPrefetch?: boolean;
}

/**
 * Enhanced Link component with prefetch on hover/focus
 * Preloads the target page's component when user shows intent
 */
const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  ({ to, prefetchDelay = 100, noPrefetch = false, onMouseEnter, onFocus, children, ...props }, ref) => {
    const path = useMemo(() => {
      if (typeof to === 'string') return to;
      if (typeof to === 'object' && to.pathname) return to.pathname;
      return '';
    }, [to]);

    const handlePrefetch = useCallback(() => {
      if (!noPrefetch && path) {
        // Small delay to avoid prefetching on quick mouse movements
        const timeoutId = setTimeout(() => {
          prefetchRoute(path);
        }, prefetchDelay);
        
        return () => clearTimeout(timeoutId);
      }
    }, [noPrefetch, path, prefetchDelay]);

    const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
      handlePrefetch();
      onMouseEnter?.(e);
    }, [handlePrefetch, onMouseEnter]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLAnchorElement>) => {
      handlePrefetch();
      onFocus?.(e);
    }, [handlePrefetch, onFocus]);

    return (
      <Link
        ref={ref}
        to={to}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

PrefetchLink.displayName = 'PrefetchLink';

export { PrefetchLink };
export type { PrefetchLinkProps };
