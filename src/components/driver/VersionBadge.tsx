import { useState, useEffect } from 'react';

/**
 * Driver panelinde Versiyon göstergesi - güncel kodu aldığımızdan emin olmak için.
 * version.json'dan okur.
 */
export const VersionBadge = () => {
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
      className="fixed top-2 left-2 z-[9999] text-[10px] font-mono text-foreground/80 bg-muted/95 px-2 py-1 rounded pointer-events-auto border border-border/50"
      title="Versiyon"
    >
      Versiyon v{version}
    </div>
  );
};
