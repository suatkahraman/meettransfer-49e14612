import { Variants, Transition } from "framer-motion";

// iOS Safari optimized motion configurations
export const iosOptimizedTransitions = {
  // Fast, simple transitions for iOS Safari
  fast: {
    duration: 0.15,
    ease: "easeOut"
  },
  // Medium transitions
  medium: {
    duration: 0.2,
    ease: "easeOut"
  },
  // Slow transitions (reduced for iOS)
  slow: {
    duration: 0.25,
    ease: "easeOut"
  }
} as const;

// Hardware accelerated variants for iOS Safari
export const iosOptimizedVariants = {
  fadeIn: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  }
} as const;

// iOS Safari specific styles for hardware acceleration
export const iosHardwareAcceleration = {
  WebkitTransform: "translateZ(0)",
  transform: "translateZ(0)",
  WebkitBackfaceVisibility: "hidden",
  backfaceVisibility: "hidden",
  WebkitPerspective: 1000,
  perspective: 1000
} as const;

// Reduced motion variants for accessibility
export const reducedMotionVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }
} as const;

// Helper function to get optimized motion props
export const getOptimizedMotionProps = (variant: keyof typeof iosOptimizedVariants, transition: keyof typeof iosOptimizedTransitions = "medium") => {
  return {
    variants: iosOptimizedVariants[variant],
    transition: iosOptimizedTransitions[transition],
    style: iosHardwareAcceleration
  };
};

// Helper function to get accessibility-friendly motion props
export const getAccessibleMotionProps = (variant: keyof typeof reducedMotionVariants) => {
  return {
    variants: reducedMotionVariants[variant],
    transition: { duration: 0.01 },
    style: iosHardwareAcceleration
  };
};