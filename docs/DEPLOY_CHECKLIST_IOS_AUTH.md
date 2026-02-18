# iOS Auth Update – Deploy Checklist

## 1. Supabase Redirect URLs

**Supabase Dashboard** → **Authentication** → **URL Configuration** → **Redirect URLs**

Add (if not already present):

```
https://meettransfer.app/login?role=driver
https://meettransfer.app/login?role=customer
https://meettransfer.app/login?role=agency
https://meettransfer.app/login?role=admin
https://meettransfer.app/login
https://meettransfer.app/auth
https://meettransfer.app/oauth/callback
https://meettransfer.app/login/driver
https://meettransfer.app/login/agency
```

**Site URL** should be: `https://meettransfer.app`

> Bu URL'ler şifre sıfırlama ve OAuth callback için gerekli. Yeni role parametreli login URL'leri iOS WebView'ların query string değişikliklerini tolere eder.

---

## 2. RLS Kuralları

SQL Editor'da şu tabloların RLS politikalarını kontrol edin:

- `user_roles` – okuma için auth.uid() veya service role
- `drivers` – driver user_id ile okuma
- `agencies` – agency user_id ile okuma

`get-user-role` edge function service_role kullandığı için RLS bypass yapıyor; ancak fallback path'te (client-side) bu tablolar doğrudan sorgulanıyor. RLS kurallarının aktif olduğundan emin olun.

---

## 3. Vercel/Netlify Environment

Production ortamında:

- `VITE_APP_URL=https://meettransfer.app` (login redirect base için)
- `VITE_SUPABASE_URL` ve `VITE_SUPABASE_PUBLISHABLE_KEY` ayarlı olmalı

---

## 4. Deploy

Bu commit push edildiğinde Vercel/Netlify otomatik deploy tetiklenir. Manuel deploy gerekiyorsa:

- **Vercel:** Dashboard → Project → Deployments → Redeploy
- **Netlify:** Site settings → Build & deploy → Trigger deploy
