import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const AUTH_SYNC_HINT_KEY = 'mt_auth_sync_hint';

const isSupabaseAuthKey = (key: string): boolean => {
  if (!key.startsWith('sb-')) return false;
  return key.includes('auth-token') || key.includes('code-verifier');
};

const safeStorageKeys = (storage: Storage | undefined): string[] => {
  if (!storage) return [];
  try {
    return Object.keys(storage);
  } catch {
    return [];
  }
};

const safeStorageRemove = (storage: Storage | undefined, key: string) => {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignore browser storage access errors.
  }
};

const getSafeStorage = (storageType: 'local' | 'session'): Storage | undefined => {
  try {
    if (storageType === 'local') return window.localStorage;
    return window.sessionStorage;
  } catch {
    return undefined;
  }
};

export const markAuthSessionSyncHint = () => {
  try {
    sessionStorage.setItem(AUTH_SYNC_HINT_KEY, String(Date.now()));
  } catch {
    // Ignore storage access issues.
  }
};

export const consumeAuthSessionSyncHint = (maxAgeMs = 15000): boolean => {
  try {
    const raw = sessionStorage.getItem(AUTH_SYNC_HINT_KEY);
    sessionStorage.removeItem(AUTH_SYNC_HINT_KEY);
    if (!raw) return false;
    const timestamp = Number(raw);
    if (!Number.isFinite(timestamp)) return false;
    return Date.now() - timestamp <= maxAgeMs;
  } catch {
    return false;
  }
};

export const waitForPersistedSession = async ({
  expectedUserId,
  timeoutMs = 4500,
  intervalMs = 150,
}: {
  expectedUserId?: string;
  timeoutMs?: number;
  intervalMs?: number;
} = {}): Promise<Session | null> => {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const { data } = await supabase.auth.getSession();
    const session = data?.session ?? null;
    if (session?.user) {
      if (!expectedUserId || session.user.id === expectedUserId) {
        return session;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
};

export const clearSupabaseAuthArtifacts = () => {
  const storages: Array<Storage | undefined> = [getSafeStorage('local'), getSafeStorage('session')];

  for (const storage of storages) {
    for (const key of safeStorageKeys(storage)) {
      if (!isSupabaseAuthKey(key)) continue;
      safeStorageRemove(storage, key);
    }
  }

  safeStorageRemove(getSafeStorage('session'), AUTH_SYNC_HINT_KEY);
};
