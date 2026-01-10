import { motion } from 'framer-motion';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  isPulling: boolean;
  threshold?: number;
  language?: 'TR' | 'EN';
}

export const PullToRefreshIndicator = ({
  pullDistance,
  isRefreshing,
  isPulling,
  threshold = 80,
  language = 'EN',
}: PullToRefreshIndicatorProps) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const isReady = pullDistance >= threshold;

  if (!isPulling && !isRefreshing && pullDistance === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{
        opacity: isPulling || isRefreshing ? 1 : 0,
        height: isRefreshing ? 60 : pullDistance,
      }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex items-center justify-center overflow-hidden bg-gradient-to-b from-primary/5 to-transparent"
    >
      <motion.div
        animate={{
          rotate: isRefreshing ? 360 : progress * 180,
          scale: isReady ? 1.2 : 1,
        }}
        transition={{
          rotate: isRefreshing
            ? { repeat: Infinity, duration: 1, ease: 'linear' }
            : { type: 'spring', stiffness: 300 },
          scale: { type: 'spring', stiffness: 400 },
        }}
        className={cn(
          "p-2 rounded-full transition-colors",
          isReady || isRefreshing
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isRefreshing ? (
          <RefreshCw className="h-5 w-5" />
        ) : (
          <ArrowDown className={cn("h-5 w-5 transition-transform", isReady && "rotate-180")} />
        )}
      </motion.div>
      
      {isPulling && !isRefreshing && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="ml-2 text-sm text-muted-foreground"
        >
          {isReady 
            ? (language === 'TR' ? 'Bırak ve yenile' : 'Release to refresh')
            : (language === 'TR' ? 'Aşağı çek' : 'Pull down')}
        </motion.span>
      )}
      
      {isRefreshing && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ml-2 text-sm text-primary font-medium"
        >
          {language === 'TR' ? 'Yenileniyor...' : 'Refreshing...'}
        </motion.span>
      )}
    </motion.div>
  );
};

export default PullToRefreshIndicator;
