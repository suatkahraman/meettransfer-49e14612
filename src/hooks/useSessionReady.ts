/**
 * iOS RLS senkronizasyonu: Panel veri çekmeden önce session'ın storage'dan
 * okunup Supabase client'a yüklendiğinden emin olur.
 * auth.uid() null dönerse RLS tüm sorguları engeller.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  /iPhone|iPad|iPod|Macintosh.*Mobile/i.test(navigator.userAgent);

export function useSessionReady(): boolean {
  const { user, session } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setReady(false);
      return;
    }
    // Zaten session varsa hazır
    if (session?.access_token) {
      setReady(true);
      return;
    }
    // iOS: Session AuthContext'te gecikmeli olabilir, getSession ile bekle
    const ensureSession = async () => {
      let { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        if (isIOS()) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token ?? '',
          });
        }
        setReady(true);
        return;
      }
      if (!isIOS()) {
        setReady(true); // iOS değilse devam et
        return;
      }
      // iOS: Kısa aralıklarla 4 kez daha dene - storage gecikmesi
      for (const delay of [100, 200, 350, 500]) {
        await new Promise((r) => setTimeout(r, delay));
        const retry = await supabase.auth.getSession();
        if (retry.data.session?.access_token) {
          // Client'ı zorla senkronize et - sonraki RLS sorguları için
          await supabase.auth.setSession({
            access_token: retry.data.session.access_token,
            refresh_token: retry.data.session.refresh_token ?? '',
          });
          setReady(true);
          return;
        }
      }
      setReady(true); // Zaman aşımı - yine de devam et (fallback)
    };
    void ensureSession();
  }, [user, session]);

  return ready;
}
