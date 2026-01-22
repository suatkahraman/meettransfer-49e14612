import * as React from "react";
import { runAfterInteractive } from "@/utils/afterInteractive";

type LazyMotionMainProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const pageTransition = {
  duration: 0.3,
  ease: "easeOut" as const,
};

/**
 * Drops framer-motion from the initial bundle.
 * - First paint: renders a plain <main> (no JS animation cost)
 * - After first interaction/idle: upgrades to <motion.main>
 */
export default function LazyMotionMain({ children, className, style }: LazyMotionMainProps) {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    runAfterInteractive(
      () => {
        setEnabled(true);
      },
      { requireInteraction: true, idleTimeoutMs: 4500, minDelayMs: 0 }
    );
  }, []);

  // CSS-only transition: initial render has no animation; after interaction we add fade.
  // Keeps framer-motion out of the critical path and avoids TS prop conflicts.
  const animateClass = enabled ? "animate-fade-in" : "";
  return (
    <main className={[className, animateClass].filter(Boolean).join(" ")} style={style}>
      {children}
    </main>
  );
}
