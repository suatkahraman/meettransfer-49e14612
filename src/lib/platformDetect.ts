/**
 * Unified iOS/iPad device detection for auth, storage, and redirect logic.
 * Use this instead of inline regex patterns to ensure consistent behavior
 * across Safari, WKWebView, PWA, and iPad Pro (desktop Safari UA).
 *
 * Covers:
 * - iPhone, iPad, iPod (userAgent)
 * - iPad Pro with desktop Safari (MacIntel + maxTouchPoints)
 * - Macintosh in mobile context (e.g. some WebView UAs)
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /iPhone|iPad|iPod/i.test(ua) ||
    /Macintosh.*Mobile/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Normalize login role from URL query param.
 * Handles iOS WebView quirks: trailing slashes, extra whitespace, case variants.
 *
 * @param raw - Raw value from searchParams.get('role')
 * @param validRoles - Allowed values (default: customer, driver, agency)
 * @returns Normalized role or null if invalid
 */
export function normalizeLoginRole(
  raw: string | null,
  validRoles: readonly string[] = ['customer', 'driver', 'agency']
): string | null {
  if (raw == null || typeof raw !== 'string') return null;
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;
  return validRoles.includes(normalized) ? normalized : null;
}
