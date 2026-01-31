const STORAGE_KEY = "post_oauth_redirect";

function normalizeTarget(target: string): string | null {
  const trimmed = (target || "").trim();
  if (!trimmed) return null;

  // Allow absolute URLs only if they match current origin.
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.origin !== window.location.origin) return null;
      return `${url.pathname}${url.search}`;
    } catch {
      return null;
    }
  }

  // Allow only internal absolute paths.
  if (trimmed.startsWith("/")) return trimmed;

  return null;
}

/**
 * Stores an internal path (or same-origin absolute URL) to navigate to after OAuth completes.
 * Uses sessionStorage to avoid persisting across browser sessions.
 */
export function setPostOAuthRedirect(target: string) {
  try {
    const normalized = normalizeTarget(target);
    if (!normalized) return;
    sessionStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // ignore storage errors
  }
}

/**
 * Reads and clears the stored post-OAuth redirect target.
 */
export function consumePostOAuthRedirect(): string | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (value) sessionStorage.removeItem(STORAGE_KEY);
    return value;
  } catch {
    return null;
  }
}
