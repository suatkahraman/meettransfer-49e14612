import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SoundWaveAnimationProps {
  isPlaying: boolean;
  className?: string;
  barCount?: number;
  barColor?: string;
}

export function SoundWaveAnimation({ 
  isPlaying, 
  className,
  barCount = 4,
  barColor = "currentColor"
}: SoundWaveAnimationProps) {
  const bars = Array.from({ length: barCount }, (_, i) => i);
  
  return (
    <div className={cn("flex items-center gap-0.5 h-3", className)}>
      {bars.map((i) => (
        <motion.div
          key={i}
          className="w-0.5 rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ height: 4 }}
          animate={isPlaying ? {
            height: [4, 12, 6, 10, 4],
          } : { height: 4 }}
          transition={{
            duration: 0.8,
            repeat: isPlaying ? Infinity : 0,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

// Compact version for inline use
export function SoundWaveInline({ 
  isPlaying, 
  className 
}: { 
  isPlaying: boolean; 
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-[2px] h-2.5 mx-1", className)}>
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[2px] bg-current rounded-full"
          initial={{ height: 3 }}
          animate={isPlaying ? {
            height: [3, 10, 5, 8, 3],
          } : { height: 3 }}
          transition={{
            duration: 0.7,
            repeat: isPlaying ? Infinity : 0,
            delay: i * 0.08,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}