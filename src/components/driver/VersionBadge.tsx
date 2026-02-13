import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VersionBadgeProps {
  /** Menü içinde inline göstermek için */
  inline?: boolean;
}

/**
 * Driver panelinde Versiyon göstergesi - güncel kodu aldığımızdan emin olmak için.
 * version.json'dan okur.
 */
export const VersionBadge = ({ inline }: VersionBadgeProps) => {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch('/version.json', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setVersion(data?.version ?? null))
      .catch(() => setVersion(null));
  }, []);

  if (!version) return null;

  return (
    <div
      className={cn(
        'text-[10px] font-mono text-muted-foreground',
        inline ? 'px-2 py-1' : 'fixed top-2 left-2 z-[9999] bg-muted/95 px-2 py-1 rounded pointer-events-auto border border-border/50 text-foreground/80'
      )}
      title="Versiyon"
    >
      Versiyon v{version}
    </div>
  );
};
