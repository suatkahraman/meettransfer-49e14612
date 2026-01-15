import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Volume2 } from "lucide-react";

interface SpeakingBubbleOverlayProps {
  isActive: boolean;
  variant?: "mobile" | "desktop";
  className?: string;
}

/**
 * Animated overlay that appears on chat bubbles when AI is speaking
 * Shows pulsing border and animated wave bars
 */
export function SpeakingBubbleOverlay({
  isActive,
  variant = "desktop",
  className
}: SpeakingBubbleOverlayProps) {
  if (!isActive) return null;

  const barCount = variant === "mobile" ? 8 : 12;
  const barWidth = variant === "mobile" ? "w-[2px]" : "w-[3px]";
  const containerHeight = variant === "mobile" ? "h-5" : "h-6";

  return (
    <>
      {/* Pulsing border overlay */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-xl pointer-events-none",
          "border-2 border-primary/50",
          className
        )}
        animate={{
          borderColor: [
            "hsl(var(--primary) / 0.3)",
            "hsl(var(--primary) / 0.6)",
            "hsl(var(--primary) / 0.3)",
          ],
          boxShadow: [
            "0 0 0 0 hsl(var(--primary) / 0)",
            "0 0 12px 2px hsl(var(--primary) / 0.3)",
            "0 0 0 0 hsl(var(--primary) / 0)",
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Speaking indicator badge at top-right */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -5 }}
        className={cn(
          "absolute -top-2 -right-2 z-10",
          "flex items-center gap-1.5 px-2 py-1",
          "bg-primary text-primary-foreground",
          "rounded-full shadow-lg shadow-primary/30",
          variant === "mobile" ? "text-[9px]" : "text-[10px]"
        )}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <Volume2 className={variant === "mobile" ? "h-2.5 w-2.5" : "h-3 w-3"} />
        </motion.div>
        
        {/* Mini waveform */}
        <div className={cn("flex items-center gap-[2px]", containerHeight)}>
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              className={cn(barWidth, "rounded-full bg-primary-foreground")}
              animate={{
                height: [3, 10, 5, 12, 3],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.08,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </>
  );
}

/**
 * Inline waveform that appears at the bottom of the message bubble
 */
export function SpeakingWaveBar({
  isActive,
  variant = "desktop",
  className
}: SpeakingBubbleOverlayProps) {
  if (!isActive) return null;

  const barCount = variant === "mobile" ? 16 : 24;
  const barWidth = variant === "mobile" ? "w-[2px]" : "w-[2.5px]";
  const containerHeight = variant === "mobile" ? "h-4" : "h-5";
  const maxBarHeight = variant === "mobile" ? 14 : 18;
  const minBarHeight = 3;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "mt-2 pt-2 border-t border-primary/20",
        "flex items-center justify-center gap-[2px]",
        containerHeight,
        className
      )}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        // Create a wave pattern
        const phase = (i / barCount) * Math.PI * 2;
        const waveHeight1 = minBarHeight + Math.sin(phase) * (maxBarHeight - minBarHeight) * 0.5 + (maxBarHeight - minBarHeight) * 0.5;
        const waveHeight2 = minBarHeight + Math.sin(phase + Math.PI * 0.5) * (maxBarHeight - minBarHeight) * 0.5 + (maxBarHeight - minBarHeight) * 0.5;
        const waveHeight3 = minBarHeight + Math.sin(phase + Math.PI) * (maxBarHeight - minBarHeight) * 0.5 + (maxBarHeight - minBarHeight) * 0.5;
        const waveHeight4 = minBarHeight + Math.sin(phase + Math.PI * 1.5) * (maxBarHeight - minBarHeight) * 0.5 + (maxBarHeight - minBarHeight) * 0.5;

        return (
          <motion.div
            key={i}
            className={cn(
              barWidth,
              "rounded-full",
              "bg-gradient-to-t from-primary to-primary/60"
            )}
            animate={{
              height: [waveHeight1, waveHeight2, waveHeight3, waveHeight4, waveHeight1],
              opacity: [0.7, 1, 0.8, 1, 0.7],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.02,
            }}
          />
        );
      })}
    </motion.div>
  );
}
