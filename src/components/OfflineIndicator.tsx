import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const translations = {
  EN: {
    offline: 'You are offline',
    offlineDesc: 'Please check your internet connection',
    reconnected: 'Back online!',
    retry: 'Retry',
  },
  TR: {
    offline: 'İnternet bağlantısı yok',
    offlineDesc: 'Lütfen internet bağlantınızı kontrol edin',
    reconnected: 'Tekrar çevrimiçi!',
    retry: 'Tekrar Dene',
  },
  DE: {
    offline: 'Sie sind offline',
    offlineDesc: 'Bitte überprüfen Sie Ihre Internetverbindung',
    reconnected: 'Wieder online!',
    retry: 'Erneut versuchen',
  },
  FR: {
    offline: 'Vous êtes hors ligne',
    offlineDesc: 'Veuillez vérifier votre connexion Internet',
    reconnected: 'De retour en ligne!',
    retry: 'Réessayer',
  },
  AR: {
    offline: 'أنت غير متصل',
    offlineDesc: 'يرجى التحقق من اتصالك بالإنترنت',
    reconnected: 'عدت متصلاً!',
    retry: 'إعادة المحاولة',
  },
  RU: {
    offline: 'Вы не в сети',
    offlineDesc: 'Пожалуйста, проверьте подключение к интернету',
    reconnected: 'Снова онлайн!',
    retry: 'Повторить',
  },
};

export const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const { language } = useLanguage();

  const t = translations[language as keyof typeof translations] || translations.EN;

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {/* Offline Banner */}
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-full">
                  <WifiOff className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.offline}</p>
                  <p className="text-xs opacity-90">{t.offlineDesc}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="text-destructive-foreground hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t.retry}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reconnected Toast */}
      {isOnline && wasOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-green-600 text-white"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-3">
              <Wifi className="h-5 w-5" />
              <p className="font-semibold text-sm">{t.reconnected}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
