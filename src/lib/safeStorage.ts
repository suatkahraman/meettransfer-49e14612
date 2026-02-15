/**
 * iOS uyumlu storage: localStorage öncelikli, hata/engel durumunda sessionStorage.
 * Güvenilir cihaz parmak izi (mt_device_id) ve benzeri için.
 */
const isIOS = () =>
  typeof navigator !== 'undefined' &&
  /iPhone|iPad|iPod|Macintosh.*Mobile/i.test(navigator.userAgent);

export const safeLocalGet = (key: string): string | null => {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return v;
    if (isIOS()) return sessionStorage.getItem(key);
    return null;
  } catch {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
};

export const safeLocalSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
    if (isIOS()) sessionStorage.setItem(key, value);
  } catch {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // ignore (iOS Safari/PWA can block storage)
    }
  }
};

export const safeLocalRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
};
