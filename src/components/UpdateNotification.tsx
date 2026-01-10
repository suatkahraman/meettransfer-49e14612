import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function UpdateNotification() {
  const { hasUpdate, refreshApp } = useAppUpdate();
  const { t } = useLanguage();
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (hasUpdate && !toastShownRef.current) {
      toastShownRef.current = true;
      
      toast(
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{t('newVersionAvailable')}</p>
            <p className="text-xs text-muted-foreground">
              {t('refreshToUpdate')}
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
            {t('update')}
          </Button>
        </div>,
        {
          duration: Infinity,
          id: 'app-update',
          className: 'update-toast',
        }
      );
    }
  }, [hasUpdate, refreshApp, t]);

  return null;
}
