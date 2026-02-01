import { safeLocalGet, safeLocalRemove, safeLocalSet } from "@/lib/safeStorage";

// localStorage can be blocked / throw on iOS Safari (especially PWA / private mode).
// We keep an in-memory fallback so the 2FA flow can still suppress redirects reliably.
const STORAGE_KEY = "suppress_auth_redirect";
const WINDOW_KEY = "__SUPPRESS_AUTH_REDIRECT__";

export const isSuppressAuthRedirect = (): boolean => {
  const mem = (window as any)[WINDOW_KEY] === true;
  const persisted = safeLocalGet(STORAGE_KEY) === "true";
  return mem || persisted;
};

export const setSuppressAuthRedirect = () => {
  (window as any)[WINDOW_KEY] = true;
  safeLocalSet(STORAGE_KEY, "true");
};

export const clearSuppressAuthRedirect = () => {
  try {
    delete (window as any)[WINDOW_KEY];
  } catch {
    // ignore
  }
  safeLocalRemove(STORAGE_KEY);
};
