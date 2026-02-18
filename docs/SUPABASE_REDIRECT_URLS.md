# Supabase Redirect URLs

This document lists the required Redirect URLs that must be configured in the Supabase Dashboard under **Authentication > URL Configuration > Redirect URLs**.

Ensure all the following URLs are added to the allowlist:

## Web Application URLs

- `https://meettransfer.app/`
- `https://meettransfer.app/auth`
- `https://meettransfer.app/auth/callback`
- `https://meettransfer.app/oauth/callback`
- `https://meettransfer.app/reset-password`
- `https://meettransfer.app/login`
- `https://meettransfer.app/login/driver`
- `https://meettransfer.app/login/agency`
- `https://meettransfer.app/login?role=driver`
- `https://meettransfer.app/login?role=customer`
- `https://meettransfer.app/login?role=agency`
- `https://meettransfer.app/login?role=admin`

## Mobile Application Deep Links

- `app.meettransfer.driver://*`
- `meettransfer.app://login-callback`

## Notes

- **`https://meettransfer.app/oauth/callback`**: Used for Google/Apple OAuth redirects.
- **`https://meettransfer.app/login`**: Default login page.
- **`https://meettransfer.app/reset-password`**: Endpoint for password reset flows (ensure your email templates use this if configured).
