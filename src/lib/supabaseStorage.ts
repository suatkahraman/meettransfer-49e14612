import { isIOSDevice } from '@/lib/platformDetect';

/**
 * iOS Safari uyumlu hibrit storage adapter for Supabase Auth.
 * - localStorage öncelikli, hata olursa sessionStorage fallback (iOS PWA, private mode vb.)
 * - iOS Safari'de localStorage bazen gecikmeli yazıyor; setItem sonrası okuma ile flush sağlanır
 * - ITP (Intelligent Tracking Prevention) engellerinden kaçınmak için first-party storage kullanımı
 *
 * Android'de oluşturulan hesaba iOS'tan giriş yapılamama sorununa yardımcı olur.
 */
const AUTH_STORAGE_KEY_PREFIX = 'sb-';

function tryLocalGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function tryLocalSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function trySessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function trySessionSet(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hibrit storage: localStorage öncelikli, iOS'ta sessionStorage fallback.
 * Auth token anahtarları (sb-*) için her iki storage'da da tutulur - iOS'ta biri
 * engellenirse diğeri çalışır.
 */
export const supabaseStorage = {
  getItem: (key: string): string | null => {
    // 1) localStorage dene
    const localVal = tryLocalGet(key);
    if (localVal !== null) return localVal;

    // 2) Auth key ise sessionStorage fallback (iOS Safari localStorage engeli)
    if (key.startsWith(AUTH_STORAGE_KEY_PREFIX)) {
      const sessionVal = trySessionGet(key);
      if (sessionVal !== null) return sessionVal;
    }

    return null;
  },

  setItem: (key: string, value: string): void => {
    const isAuthKey = key.startsWith(AUTH_STORAGE_KEY_PREFIX);
    const isIOS = isIOSDevice();

    // 1) localStorage'a yaz
    const localOk = tryLocalSet(key, value);

    // 2) iOS + auth key ise sessionStorage'a da yaz (hybrid persistence)
    if (isIOS && isAuthKey) {
      trySessionSet(key, value);
    }

    // 3) iOS: localStorage yazıldıysa hemen okuyarak flush et (bazı Safari sürümleri batch'ler)
    if (isIOS && localOk && isAuthKey) {
      try {
        void localStorage.getItem(key);
      } catch {
        // ignore
      }
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
