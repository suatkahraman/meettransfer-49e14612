import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RecordingWaveformProps {
  isRecording: boolean;
  audioLevels?: number[];
  className?: string;
  variant?: "large" | "small" | "inline";
  color?: "destructive" | "primary" | "white";
}

/**
 * Dynamic waveform animation for push-to-talk recording
 * Uses real audio levels when available, falls back to animated simulation
 */
export function RecordingWaveform({
  isRecording,
  audioLevels = [],
  className,
  variant = "large",
  color = "destructive"
}: RecordingWaveformProps) {
  const colorClasses = {
    destructive: "bg-destructive-foreground",
    primary: "bg-primary-foreground",
    white: "bg-white"
  };

  const configs = {
    large: {
      barCount: 12,
      barWidth: "w-1.5",
      gap: "gap-1",
      minHeight: 8,
      maxHeight: 36,
      containerClass: "h-10"
    },
    small: {
      barCount: 7,
      barWidth: "w-1",
      gap: "gap-0.5",
      minHeight: 6,
      maxHeight: 20,
      containerClass: "h-6"
    },
    inline: {
      barCount: 5,
      barWidth: "w-0.5",
      gap: "gap-[2px]",
      minHeight: 4,
      maxHeight: 14,
      containerClass: "h-4"
    }
  };

  const config = configs[variant];
  const hasRealAudio = audioLevels.length >= config.barCount;

  // Animated wave patterns for when no real audio is available
  const wavePatterns = [
    [0.3, 0.7, 0.5, 0.9, 0.4, 0.8, 0.6, 0.95, 0.5, 0.7, 0.4, 0.6],
    [0.5, 0.9, 0.7, 0.5, 0.85, 0.6, 0.9, 0.4, 0.75, 0.5, 0.8, 0.4],
    [0.4, 0.6, 0.9, 0.7, 0.5, 0.95, 0.5, 0.8, 0.4, 0.9, 0.6, 0.7],
    [0.6, 0.4, 0.8, 0.6, 0.9, 0.4, 0.7, 0.6, 0.85, 0.4, 0.9, 0.5],
  ];

  return (
    <div className={cn("flex items-center", config.gap, config.containerClass, className)}>
      {Array.from({ length: config.barCount }).map((_, i) => {
        // Use real audio levels if available
        const realLevel = hasRealAudio 
          ? audioLevels[Math.floor(i * (audioLevels.length / config.barCount))] 
          : 0;

        const heightFromLevel = config.minHeight + realLevel * (config.maxHeight - config.minHeight);

        return (
          <motion.div
            key={i}
            className={cn(
              config.barWidth,
              "rounded-full",
              colorClasses[color],
              isRecording ? "opacity-90" : "opacity-50"
            )}
            animate={
              isRecording
                ? hasRealAudio
                  ? {
                      // Real audio mode - smooth transitions
                      height: Math.max(config.minHeight, heightFromLevel),
                    }
                  : {
                      // Simulated wave mode - animated pattern
                      height: wavePatterns.map(pattern => 
                        config.minHeight + pattern[i % pattern.length] * (config.maxHeight - config.minHeight)
                      ),
                    }
                : {
                    height: config.minHeight,
                  }
            }
            transition={
              hasRealAudio
                ? {
                    duration: 0.05,
                    ease: "linear",
                  }
                : {
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: i * 0.05,
                    ease: "easeInOut",
                  }
            }
          />
        );
      })}
    </div>
  );
}

/**
 * Circular waveform for the large PTT button
 * Creates a ring of bars that respond to audio
 */
export function CircularWaveform({
  isRecording,
  audioLevels = [],
  className,
  color = "white"
}: {
  isRecording: boolean;
  audioLevels?: number[];
  className?: string;
  color?: "destructive" | "primary" | "white";
}) {
  const barCount = 24;
  const hasRealAudio = audioLevels.length >= 8;

  const colorClasses = {
    destructive: "bg-destructive-foreground",
    primary: "bg-primary-foreground",
    white: "bg-white/90"
  };

  return (
    <div className={cn("absolute inset-0 flex items-center justify-center", className)}>
      {Array.from({ length: barCount }).map((_, i) => {
        const angle = (i / barCount) * 360;
        const audioIndex = Math.floor((i / barCount) * audioLevels.length);
        const level = hasRealAudio ? audioLevels[audioIndex] || 0 : 0;
        
        // Calculate distance from center based on audio level
        const baseDistance = 44; // Base distance in pixels
        const maxExtension = 12;
        const distance = baseDistance + (isRecording ? level * maxExtension : 0);

        return (
          <motion.div
            key={i}
            className={cn(
              "absolute w-1 rounded-full origin-center",
              colorClasses[color],
              isRecording ? "opacity-80" : "opacity-0"
            )}
            style={{
              transform: `rotate(${angle}deg) translateY(-${baseDistance}px)`,
            }}
            animate={
              isRecording
                ? hasRealAudio
                  ? {
                      height: 4 + level * 12,
                      opacity: 0.5 + level * 0.5,
                    }
                  : {
                      height: [4, 8, 12, 8, 4],
                      opacity: [0.4, 0.7, 0.9, 0.7, 0.4],
                    }
                : {
                    height: 4,
                    opacity: 0,
                  }
            }
            transition={
              hasRealAudio
                ? { duration: 0.05, ease: "linear" }
                : {
                    duration: 0.8,
                    repeat: Infinity,
                    delay: (i / barCount) * 0.3,
                    ease: "easeInOut",
                  }
            }
          />
        );
      })}
    </div>
  );
}

/**
 * Compact inline waveform for smaller buttons
 */
export function InlineRecordingWave({
  isRecording,
  className,
  barCount = 3
}: {
  isRecording: boolean;
  className?: string;
  barCount?: number;
}) {
  return (
    <motion.div
      className={cn("flex items-center gap-0.5", className)}
      animate={isRecording ? { scale: [1, 1.1, 1] } : { scale: 1 }}
      transition={{ duration: 0.3, repeat: isRecording ? Infinity : 0 }}
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-current rounded-full"
          animate={
            isRecording
              ? {
                  height: [6, 16, 10, 14, 6],
                }
              : { height: 6 }
          }
          transition={{
            duration: 0.5,
            repeat: isRecording ? Infinity : 0,
            delay: i * 0.08,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
}
