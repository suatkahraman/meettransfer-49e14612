/**
 * iOS RLS senkronizasyonu: auth.uid() null olmasın diye session hazır olana kadar
 * children'ı göstermez. Driver ve customer panellerinde kullanılır.
 */
import { ReactNode } from 'react';
import { useSessionReady } from '@/hooks/useSessionReady';
import { Loader2 } from 'lucide-react';

interface SessionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SessionGate({ children, fallback }: SessionGateProps) {
  const ready = useSessionReady();

  if (!ready) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return <>{children}</>;
}
