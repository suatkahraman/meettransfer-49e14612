import { useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

// Fallback translations
const fallbackTexts = {
  newVersionAvailable: 'New Version Available!',
  refreshToUpdate: 'Refresh to update the app',
  update: 'Update',
};

export function UpdateNotification() {
  const { hasUpdate, refreshApp } = useAppUpdate();
  const toastShownRef = useRef(false);
  
  // Safe translation with fallback - always call hook unconditionally
  const { t } = useLanguage();
  
  // Memoize text getter to avoid recreating function
  const getText = useMemo(() => {
    return (key: keyof typeof fallbackTexts) => {
      try {
        const translated = t(key);
        // If translation returns the key itself or is undefined, use fallback
        return (translated && translated !== key) ? translated : fallbackTexts[key];
      } catch {
        return fallbackTexts[key];
      }
    };
  }, [t]);

  useEffect(() => {
    if (hasUpdate && !toastShownRef.current) {
      toastShownRef.current = true;
      
      toast(
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{getText('newVersionAvailable')}</p>
            <p className="text-xs text-muted-foreground">
              {getText('refreshToUpdate')}
            </p>
          </div>
          <Button 
            size="sm" 
            onClick={() => {
              toast.dismiss('app-update');
              refreshApp();
            }}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {getText('update')}
          </Button>
        </div>,
        {
          duration: Infinity,
          id: 'app-update',
          className: 'update-toast',
        }
      );
    }
  }, [hasUpdate, refreshApp, getText]);

  return null;
}
