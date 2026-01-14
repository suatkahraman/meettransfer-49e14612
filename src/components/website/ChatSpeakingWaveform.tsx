import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSpeakingWaveformProps {
  language: string;
  className?: string;
}

export function ChatSpeakingWaveform({ language, className }: ChatSpeakingWaveformProps) {
  // Create more bars for a richer waveform effect
  const barCount = 12;
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex gap-2", className)}
    >
      {/* AI Avatar with pulse */}
      <motion.div
        className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shrink-0 shadow-lg shadow-primary/40"
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 10px 25px -5px hsl(var(--primary) / 0.4)",
            "0 15px 35px -5px hsl(var(--primary) / 0.6)",
            "0 10px 25px -5px hsl(var(--primary) / 0.4)",
          ],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "easeInOut",
        }}
      >
        <Volume2 className="h-4 w-4 text-primary-foreground" />
      </motion.div>

      {/* Waveform Container */}
      <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 rounded-2xl px-4 py-3 border border-primary/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Label */}
          <span className="text-xs font-semibold text-primary whitespace-nowrap">
            {language === "TR" ? "AI Konuşuyor" : "AI Speaking"}
          </span>

          {/* Animated Waveform Bars */}
          <div className="flex items-center gap-[3px] h-6">
            {bars.map((i) => {
              // Create different animation patterns for each bar
              const minHeight = 3 + Math.random() * 2;
              const maxHeight = 16 + Math.random() * 8;
              const duration = 0.3 + Math.random() * 0.3;
              const delay = i * 0.05;

              return (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-gradient-to-t from-primary to-primary/60"
                  animate={{
                    height: [minHeight, maxHeight, minHeight + 4, maxHeight - 4, minHeight],
                    opacity: [0.6, 1, 0.8, 1, 0.6],
                  }}
                  transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay,
                    repeatType: "mirror",
                  }}
                  style={{
                    originY: 0.5,
                  }}
                />
              );
            })}
          </div>

          {/* Decorative dots animation */}
          <div className="flex items-center gap-1 ml-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary/50"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
