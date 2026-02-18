import { useState, useEffect } from 'react';

/**
 * iOS Safari/PWA'da localStorage'ın çalışıp çalışmadığını test eder.
 * Gizli mod veya ITP nedeniyle storage yazılamazsa kullanıcıya uyarı gösterilebilir.
 */
export function useStorageAvailable(): { available: boolean; checked: boolean } {
  const [available, setAvailable] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const test = () => {
      try {
        const key = '_storage_test_' + Date.now();
        localStorage.setItem(key, '1');
        const value = localStorage.getItem(key);
        localStorage.removeItem(key);
        if (!cancelled) setAvailable(value === '1');
      } catch {
        if (!cancelled) setAvailable(false);
      }
      if (!cancelled) setChecked(true);
    };
    test();
    return () => {
      cancelled = true;
    };
  }, []);

  return { available, checked };
}
