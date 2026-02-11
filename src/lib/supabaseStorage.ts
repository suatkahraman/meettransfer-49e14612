/**
 * iOS uyumlu storage adapter for Supabase Auth.
 * iOS Safari/PWA localStorage erişim sorunlarını önler (private mode, storage izni vb.)
 * Android'de oluşturulan hesaba iOS'tan giriş yapılamama sorununa yardımcı olur.
 */
export const supabaseStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // iOS Safari/PWA bazen storage yazmayı engelleyebilir - sessizce devam et
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
