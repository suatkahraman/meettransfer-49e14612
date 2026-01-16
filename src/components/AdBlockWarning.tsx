import { memo } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdBlockDetection } from '@/hooks/useAdBlockDetection';
import { motion, AnimatePresence } from 'framer-motion';

const AdBlockWarning = memo(() => {
  const { isBlocked, isDismissed, dismiss } = useAdBlockDetection();

  // Don't show if not blocked or already dismissed
  if (!isBlocked || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
      >
        <div className="bg-amber-50 dark:bg-amber-950/90 border border-amber-200 dark:border-amber-800 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                AdBlock Algılandı
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Reklam engelleyici kullanıyorsunuz. Bazı özellikler düzgün çalışmayabilir.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-6 w-6 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900"
              onClick={dismiss}
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

AdBlockWarning.displayName = 'AdBlockWarning';

export default AdBlockWarning;
