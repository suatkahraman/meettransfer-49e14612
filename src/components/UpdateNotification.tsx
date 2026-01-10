import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { Button } from '@/components/ui/button';

// Fallback translations for when LanguageProvider is not available
const fallbackTexts = {
  newVersionAvailable: 'New Version Available!',
  refreshToUpdate: 'Refresh to update the app',
  update: 'Update',
};

// Safe hook to get translations with fallback
function useSafeTranslation() {
  try {
    // Dynamic import to avoid crash if context is missing
    const { useLanguage } = require('@/contexts/LanguageContext');
    const { t } = useLanguage();
    return (key: keyof typeof fallbackTexts) => {
      const translated = t(key);
      // If translation returns the key itself, use fallback
      return translated === key ? fallbackTexts[key] : translated;
    };
  } catch {
    // Return fallback function if context fails
    return (key: keyof typeof fallbackTexts) => fallbackTexts[key];
  }
}

export function UpdateNotification() {
  const { hasUpdate, refreshApp } = useAppUpdate();
  const toastShownRef = useRef(false);
  
  // Get safe translation function
  const getText = useSafeTranslation();

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
              toast.dismiss();
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
