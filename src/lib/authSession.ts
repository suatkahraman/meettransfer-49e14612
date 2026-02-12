import type { AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { safeLocalRemove } from '@/lib/safeStorage';

const BASE_AUTH_KEYS = [
  'supabase.auth.token',
  'suppress_auth_redirect',
];

const SIGN_OUT_ONLY_KEYS = [
  'guestRememberMe',
  'guestSavedEmail',
  'agencyRememberMe',
  'agencySavedEmail',
  'driverRememberMe',
  'driverSavedEmail',
];

const AUTH_COOKIE_MARKERS = ['sb-', 'supabase', 'auth-token'];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const removeAuthKeysInStorage = (storage: Storage) => {
  const keysToRemove: string[] = [];

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key) continue;

    // Supabase stores sessions as sb-<project-ref>-auth-token (+ helper keys)
    if (key.startsWith('sb-') && key.includes('auth-token')) {
      keysToRemove.push(key);
      continue;
    }

    if (key === 'supabase.auth.token') {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore storage errors (private mode / restricted WebView)
    }
  });
};

const removeAuthCookies = () => {
  if (typeof document === 'undefined') return;

  const cookies = document.cookie ? document.cookie.split(';') : [];
  if (cookies.length === 0) return;

  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const hostParts = host.split('.');
  const rootDomain = hostParts.length >= 2 ? hostParts.slice(-2).join('.') : host;

  for (const rawCookie of cookies) {
    const [namePart] = rawCookie.split('=');
    const cookieName = namePart?.trim();
    if (!cookieName) continue;

    const normalized = cookieName.toLowerCase();
    const isAuthCookie = AUTH_COOKIE_MARKERS.some((marker) => normalized.includes(marker));
    if (!isAuthCookie) continue;

    const base = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=/; SameSite=Lax`;
    try {
      document.cookie = base;
      if (host) document.cookie = `${base}; domain=${host}`;
      if (rootDomain && rootDomain !== host) document.cookie = `${base}; domain=.${rootDomain}`;
    } catch {
      // Ignore cookie cleanup failures
    }
  }
};

export const clearClientAuthStorage = (options: { clearRememberedLogin?: boolean } = {}) => {
  if (typeof window === 'undefined') return;

  try {
    removeAuthKeysInStorage(window.localStorage);
  } catch {
    // ignore
  }

  try {
    removeAuthKeysInStorage(window.sessionStorage);
  } catch {
    // ignore
  }

  BASE_AUTH_KEYS.forEach((key) => safeLocalRemove(key));
  if (options.clearRememberedLogin) {
    SIGN_OUT_ONLY_KEYS.forEach((key) => safeLocalRemove(key));
  }
  removeAuthCookies();
};

const isSameSession = (current: Session | null, expected: Session) => {
  return (
    current?.access_token === expected.access_token &&
    current?.user?.id === expected.user.id
  );
};

export const ensureSessionPersistence = async (
  expectedSession: Session | null,
  retryDelaysMs: number[] = [0, 60, 160, 300]
): Promise<boolean> => {
  if (!expectedSession) return false;

  for (const delayMs of retryDelaysMs) {
    if (delayMs > 0) await sleep(delayMs);
    const { data } = await supabase.auth.getSession();
    if (isSameSession(data.session, expectedSession)) {
      return true;
    }
  }

  // Fallback: force a setSession write when storage write timing is flaky.
  if (expectedSession.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: expectedSession.access_token,
      refresh_token: expectedSession.refresh_token,
    });

    if (!error) {
      const verify = await supabase.auth.getSession();
      if (isSameSession(verify.data.session, expectedSession)) {
        return true;
      }
    }
  }

  return false;
};

export const signOutAndClearClientAuth = async (
  options: { global?: boolean; clearRememberedLogin?: boolean } = {}
): Promise<{ error: AuthError | null }> => {
  let firstError: AuthError | null = null;

  if (options.global) {
    const { error: globalError } = await supabase.auth.signOut({ scope: 'global' });
    if (globalError) firstError = globalError;
  }

  const { error: localError } = await supabase.auth.signOut({ scope: 'local' });
  if (!firstError && localError) firstError = localError;

  clearClientAuthStorage({ clearRememberedLogin: options.clearRememberedLogin });
  return { error: firstError };
};
