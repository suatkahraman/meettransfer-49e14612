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
  const [motion, setMotion] = React.useState<null | typeof import("framer-motion")>(null);

  React.useEffect(() => {
    runAfterInteractive(
      () => {
        import("framer-motion").then(setMotion).catch(() => {
          // If motion chunk fails, keep plain <main>
        });
      },
      { requireInteraction: true, idleTimeoutMs: 4500, minDelayMs: 0 }
    );
  }, []);

  if (!motion) {
    return (
      <main className={className} style={style}>
        {children}
      </main>
    );
  }

  const { motion: m } = motion;
  // TS note: framer-motion's HTMLMotionProps defines onDrag differently than React's DragEvent.
  // In this lazy-loaded pattern, TS may surface an incompatibility at the JSX call site.
  // Casting avoids a type-only conflict; runtime behavior is unaffected.
  const MotionMain = m.main as any;
  return (
    <MotionMain
      className={className}
      style={style}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </MotionMain>
  );
}
