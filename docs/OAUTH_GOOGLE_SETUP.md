# Google OAuth (Supabase) – Redirect URI & Setup

## 1. Redirect URI for Google Cloud Console

The **400: redirect_uri_mismatch** error means the redirect URI sent to Google is not in your OAuth client’s **Authorized redirect URIs**.

With Supabase, **Google redirects to Supabase**, not directly to your app. So you must allow **Supabase’s** callback URL in Google Cloud Console.

### Exact value to add

From your project’s Supabase URL (`VITE_SUPABASE_URL`):

- **Supabase URL:** `https://zqykoyugubaeealrspxm.supabase.co`
- **Redirect URI to add in Google Cloud Console:**

```text
https://zqykoyugubaeealrspxm.supabase.co/auth/v1/callback
```

Copy that line and add it in:

**Google Cloud Console** → **APIs & Services** → **Credentials** → your **OAuth 2.0 Client ID** (Web application) → **Authorized redirect URIs** → **ADD URI** → paste → **Save**.

---

## 2. Your app’s redirect (Supabase → your site)

After Supabase finishes the flow, it sends the user to your app. That target is the `redirectTo` you pass to `signInWithOAuth`.

- **Production:** set `VITE_APP_URL=https://meettransfer.app` in your production env so `redirectTo` is always `https://meettransfer.app/oauth/callback`.
- In **Supabase Dashboard** → **Authentication** → **URL Configuration**:
  - **Site URL:** `https://meettransfer.app`
  - **Redirect URLs:** include `https://meettransfer.app/oauth/callback` (and any preview/local URLs you use).

So:

- **Google Cloud Console** → add: `https://zqykoyugubaeealrspxm.supabase.co/auth/v1/callback`
- **Supabase Redirect URLs** → add: `https://meettransfer.app/oauth/callback`

---

## 3. Callback route

After a successful Google login, Supabase redirects to the URL you gave as `redirectTo`. Your app handles that on:

- `/oauth/callback` (and `/~oauth/callback`)

Implemented in `src/pages/OAuthCallback.tsx`: it reads the auth code/tokens from the URL, exchanges them for a session, then redirects by role (e.g. `/customer`, `/admin`, `/driver`, `/agency`).

---

## 4. Quick checklist

- [ ] **Google Cloud Console** – Authorized redirect URIs contains:  
  `https://zqykoyugubaeealrspxm.supabase.co/auth/v1/callback`
- [ ] **Supabase** – Redirect URLs contains:  
  `https://meettransfer.app/oauth/callback`
- [ ] **Production env** – `VITE_APP_URL=https://meettransfer.app` so OAuth always uses production for `redirectTo`.
