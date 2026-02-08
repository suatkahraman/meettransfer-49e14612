import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";

const ReadingProgressBar = () => {
  const [progress, setProgress] = useState(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const updateProgress = () => {
      // Cancel any pending rAF to avoid stacking
      if (rafIdRef.current) return;

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        setProgress(Math.min(100, Math.max(0, scrollPercent)));
      });
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener("scroll", updateProgress);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Progress value={progress} className="h-1 rounded-none bg-transparent" />
    </div>
  );
};

export default ReadingProgressBar;
