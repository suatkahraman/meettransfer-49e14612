# Driver Authentication Flow — iOS E2E Audit Report

**Date:** 2025-02-14  
**Scope:** Driver auth flow, iOS-specific issues (Android working)  
**Focus Areas:** Session handling, redirect loops, deep links, RLS/Authorization, platform logic

---

## 1. iOS Cookie & Session Handling

### Current Implementation

- **Supabase client** (`src/integrations/supabase/client.ts`): Uses `supabaseStorage` adapter, `persistSession: true`, `autoRefreshToken: true`.
- **supabaseStorage** (`src/lib/supabaseStorage.ts`): Hybrid localStorage + sessionStorage for auth keys (`sb-*`). On iOS, auth keys are written to both; localStorage is preferred on read, with sessionStorage fallback.
- **AuthContext** (`src/contexts/AuthContext.tsx`): iOS-specific retry for `getSession()` — 4 retries at 80ms, 150ms, 250ms, 400ms to cover WebKit/ITP storage delays.

### Findings

| Item | Status | Notes |
|------|--------|------|
| Hybrid storage | OK | Auth keys use both localStorage and sessionStorage on iOS. |
| getSession retry | OK | Up to ~880ms delay for ITP/storage sync. |
| OAuth PWA warning | OK | Comment notes iOS isolates PWA storage from Safari. |
| safeStorage / authRedirectGuard | OK | Uses try/catch; memory fallback for suppress flag. |
| useUserRole cache | OK | Wrapped in try/catch; fails safely on private mode. |

### Potential Gap

- **sessionStorage fallback on setItem**: If `localStorage.setItem` throws (e.g. quota or private mode), `tryLocalSet` returns false but `trySessionSet` is still called for auth keys on iOS. Behavior is correct.
- **supabaseStorage.removeItem**: Clears both storages but does not use try/catch; failures are ignored. Acceptable.

**Verdict:** iOS session handling is in good shape. No changes required.

---

## 2. Redirect Loop Prevention

### Current Flow

1. Unauthenticated user visits `/driver` → wrapped by `DriverRoute` (ProtectedRoute).
2. `ProtectedRoute` sees `!user` → `window.location.replace(LOGIN_REDIRECT_URLS.driver)` = `https://meettransfer.app/login?role=driver`.
3. User lands on `/login?role=driver` → `LoginScreen` (public route).
4. After login → `window.location.replace('/driver')` from LoginScreen.
5. User hits `/driver` again; now authenticated, access is granted.

### Analysis

- `/login` and `/login/driver` are **public routes**; they do not use ProtectedRoute.
- ProtectedRoute only guards `/driver`, `/customer`, `/agency`, `/admin`.
- So the chain is: protected route → login URL → login screen (no redirect) → post-login → protected route. No loop.

### Redirect Logic

```ts
// ProtectedRoute.tsx L156-161
if (redirectTo.startsWith('http')) {
  window.location.replace(redirectTo);
  return null;
}
return <Navigate to={redirectTo} replace />;
```

- When `redirectTo` is absolute (`https://...`), `window.location.replace` is used. This performs a full navigation and prevents a React Router loop.
- Redirecting to the same URL (e.g. already on login) is effectively a no-op; no loop.

### Potential Edge Case

- If `LOGIN_REDIRECT_BASE` differs from the current origin (e.g. subdomain), user is sent to the main domain. That is intentional.
- If `VITE_APP_URL` is unset, `LOGIN_REDIRECT_BASE` falls back to `window.location.origin`, which keeps the user on the same origin.

**Verdict:** Redirect loop risk is low. Logic is correct.

---

## 3. Deep Link / URL Mapping

### Current Handling

- **LoginScreen** (`src/pages/auth/LoginScreen.tsx`):
  - `roleParam = searchParams.get('role')` (from React Router `useSearchParams`).
  - Accepted values: `['customer', 'driver', 'agency']` (case-sensitive).
  - `roleParam === 'admin'` → redirect to `/auth`.

### Issues

| Scenario | Result | Severity |
|----------|--------|----------|
| `role=driver` | Matches, driver section shown | OK |
| `role=Driver` | Does not match (`'Driver' !== 'driver'`) | Medium |
| `role=driver/` or `role=driver%20` | Does not match | Medium |
| `/login/?role=driver` (trailing slash) | Usually handled by React Router | Low |
| iOS appends `#` or strips query | Possible `role` loss on some WebViews | Medium |
| `role=` (empty) | Treated as invalid, role selection shown | OK |

### Root Cause

```ts
// LoginScreen.tsx L72-76, L280-282
roleParam = searchParams.get('role') as LoginSection | null;
// ...
if (roleParam && ['customer', 'driver', 'agency'].includes(roleParam)) {
  setLoginSection(roleParam);
}
```

No normalization (trim, lowercasing) or tolerance for `admin` style variants.

**Recommendation:** Normalize `roleParam` before checks:

```ts
const rawRole = searchParams.get('role');
const roleParam = rawRole?.trim().toLowerCase() as LoginSection | null;
if (roleParam && ['customer', 'driver', 'agency'].includes(roleParam)) {
  setLoginSection(roleParam);
}
```

Also consider handling `role=admin` explicitly before other checks (as already done for redirect to `/auth`).

---

## 4. RLS Verification & Authorization Header

### Current Implementation

- **useUserRole** (`src/hooks/useUserRole.tsx`): Uses `session?.access_token` from AuthContext to call `get-user-role` edge function with `Authorization: Bearer ${token}`.
- **get-user-role** (`supabase/functions/get-user-role/index.ts`): Receives `Authorization` header, validates with `supabaseUser.auth.getUser()`, uses service role to bypass RLS for `user_roles`, `drivers`, `agencies`.

### RLS Bypass

- Role resolution uses the edge function with service role, not direct `profiles` or `user_roles` queries from the client.
- Drivers table is queried via the edge function with service role, so RLS is not involved there.

### Authorization Header on iOS

- `session?.access_token` comes from AuthContext, which reads from Supabase session (storage).
- On iOS, if storage fails or delays, `session` can be null or stale → `token` is null/undefined.
- Edge function receives `Authorization: Bearer undefined` or missing header → returns `{ success: false, role: "customer" }`.
- Fallback path uses direct Supabase client queries (`user_roles`, `drivers`, `agencies`) which rely on the in-memory session. If the client has no valid session, those also fail.

### Driver Login Flow

- **DriverLoginScreen** does `signInWithPassword` → gets session → calls `get-user-role` with `authData.session.access_token`.
- **LoginScreen** (unified): same pattern with `authData?.session?.access_token`.

Token is taken from the response of `signInWithPassword`, not from storage. So immediately after login, the token is present. The issue is after reload or navigation, when the session comes from storage.

### Potential iOS Problem

1. User logs in → session created and stored.
2. iOS storage delay → `getSession()` temporarily returns null.
3. AuthContext retries (up to ~880ms) → session eventually found.
4. In that window, role lookup may run with `session === null` → fallback to DB queries. If Supabase client has not yet rehydrated the session, those can fail.
5. ProtectedRoute fallback uses direct `drivers` / `agencies` queries with the Supabase client. These use whatever session the client has at that moment.

**Verdict:** Edge function and header usage are fine. Risk is timing between storage sync and AuthContext/session hydration on iOS. The existing iOS delays in AuthContext and ProtectedRoute (auth redirect grace, role grace) help, but timing issues cannot be fully ruled out.

---

## 5. Platform-Specific Logic (iOS User-Agent)

### iOS Detection Usage

Multiple patterns are used across the codebase:

| File | Pattern | Purpose |
|------|---------|---------|
| AuthContext | `/[iPhone|iPad|iPod|Macintosh.*Mobile]/i` | getSession retry |
| ProtectedRoute | Same | authRedirectGrace |
| supabaseStorage | Same (via detectIOS()) | Hybrid storage |
| usePWADetect | `/[iphone|ipad|ipod]/i` + `MacIntel` + touch | Broader PWA detection |
| DriverLoginScreen | `/[iPhone|iPad|iPod|Macintosh.*Mobile]/i` | Extra delay before redirect |
| SocialAuthButtons | usePWADetect | OAuth in PWA |

### Inconsistency

- `usePWADetect`: `(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)` — targets iPad with desktop UA.
- Others: `Macintosh.*Mobile` — does not match “Macintosh” alone; “Macintosh” appears in some iPad Safari UAs.
- Regexes differ: `iphone|ipad|ipod` vs `iPhone|iPad|iPod` — both are case-insensitive with `/i`, so equivalent.

### Risk

- iPad Pro (desktop Safari UA): `MacIntel` + touch may be detected by usePWADetect but not by `Macintosh.*Mobile`.
- Some WebView UAs might omit standard iOS identifiers.

**Recommendation:** Introduce a shared helper (e.g. `isIOSDevice()`) and use it consistently. Include:
- `iPhone|iPad|iPod`
- `MacIntel` + `maxTouchPoints > 1` for iPad
- Optional: `Macintosh` with mobile-like traits if needed

---

## 6. Additional Observations

### DriverLoginScreen vs LoginScreen

- `/login/driver` → DriverLoginScreen (dedicated, no 2FA).
- `/login?role=driver` → LoginScreen (unified, with 2FA for customer/agency).

ProtectedRoute sends drivers to `https://meettransfer.app/login?role=driver`, so they use the unified LoginScreen with 2FA. Dedicated DriverLoginScreen at `/login/driver` is only used when the user goes there directly.

If drivers should always use the no-2FA flow, DriverRoute could redirect to `/login/driver` instead of `/login?role=driver`. That would be a product decision.

### authRedirectGuard

- Uses in-memory + localStorage for `suppress_auth_redirect`.
- On iOS with blocked localStorage, the in-memory flag still works.
- `safeLocalGet` / `safeLocalSet` are wrapped in try/catch.

---

## 7. Recommended Fixes (Priority Order)

1. **Normalize role param in LoginScreen**  
   - Trim and lowercase `role` before comparison.  
   - Improves resilience to `role=Driver`, `role=driver/`, whitespace, etc.

2. **Shared iOS detection helper**  
   - Centralize detection and use it across AuthContext, ProtectedRoute, supabaseStorage, DriverLoginScreen, etc.  
   - Reduces inconsistency and improves coverage (e.g. iPad desktop Safari).

3. **Optional: Redirect drivers to `/login/driver`**  
   - If drivers must use the no-2FA flow, change DriverRoute `redirectTo` to `LOGIN_REDIRECT_BASE + '/login/driver'` instead of `/login?role=driver`.

4. **Optional: Same-URL guard before `window.location.replace`**  
   - If current URL already matches `redirectTo`, skip the replace to avoid a redundant reload.

---

## 8. Summary

| Area | Status | Action |
|------|--------|--------|
| iOS session/cookie handling | OK | None |
| Redirect loop | OK | None |
| Deep link / URL mapping | Needs improvement | Normalize `role` param |
| RLS / Authorization | OK | None (timing risk documented) |
| iOS User-Agent logic | Needs improvement | Shared helper |

Primary change: **normalize the `role` query parameter in LoginScreen** for better iOS and WebView compatibility. Secondary: **shared iOS detection** for consistency.
