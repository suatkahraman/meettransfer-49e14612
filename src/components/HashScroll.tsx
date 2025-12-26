import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Enables reliable hash-anchor scrolling (e.g. /#booking-form) in SPA navigation.
 * React Router doesn't scroll to hash targets by default.
 */
export default function HashScroll() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const id = decodeURIComponent(hash.replace(/^#/, ""));
    let cancelled = false;

    const tryScroll = (attempt: number) => {
      if (cancelled) return;

      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      // Retry briefly to allow lazy routes/components to mount.
      if (attempt < 25) {
        window.setTimeout(() => tryScroll(attempt + 1), 50);
      }
    };

    // Wait for paint, then attempt scrolling.
    requestAnimationFrame(() => tryScroll(0));

    return () => {
      cancelled = true;
    };
  }, [hash]);

  return null;
}
