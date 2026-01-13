import * as React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MobileTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  contentClassName?: string;
  longPressThreshold?: number;
  autoHideDelay?: number;
}

/**
 * A tooltip component that works on both desktop (hover) and mobile (long-press).
 * On mobile, users can long-press to show the tooltip, which auto-hides after a delay.
 */
export function MobileTooltip({
  children,
  content,
  side = "left",
  className,
  contentClassName,
  longPressThreshold = 400,
  autoHideDelay = 2000,
}: MobileTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (autoHideRef.current) {
      clearTimeout(autoHideRef.current);
      autoHideRef.current = null;
    }
  }, []);

  const showTooltip = useCallback(() => {
    setIsOpen(true);
    // Auto-hide after delay
    autoHideRef.current = setTimeout(() => {
      setIsOpen(false);
    }, autoHideDelay);
  }, [autoHideDelay]);

  const hideTooltip = useCallback(() => {
    clearTimeouts();
    setIsOpen(false);
  }, [clearTimeouts]);

  // Touch handlers for long-press
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      clearTimeouts();
      timeoutRef.current = setTimeout(() => {
        showTooltip();
      }, longPressThreshold);
    },
    [clearTimeouts, showTooltip, longPressThreshold]
  );

  const handleTouchEnd = useCallback(() => {
    // Don't immediately hide - let autoHideDelay handle it if already shown
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    // Cancel long-press if finger moves
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Mouse handlers for desktop hover
  const handleMouseEnter = useCallback(() => {
    if (!isTouchDevice) {
      clearTimeouts();
      showTooltip();
    }
  }, [isTouchDevice, clearTimeouts, showTooltip]);

  const handleMouseLeave = useCallback(() => {
    if (!isTouchDevice) {
      hideTooltip();
    }
  }, [isTouchDevice, hideTooltip]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  // Position styles based on side
  const positionStyles: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      ref={triggerRef}
      className={cn("relative inline-flex", className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchCancel={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-[10000] whitespace-nowrap rounded-md px-3 py-1.5 text-sm shadow-md pointer-events-none",
              positionStyles[side],
              contentClassName
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
