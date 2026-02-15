import { supabase } from "@/integrations/supabase/client";

export type OAuthProvider = "google" | "apple";

/**
 * Production app URL. Set VITE_APP_URL=https://meettransfer.app in production
 * so OAuth redirectTo always matches your Supabase "Redirect URLs" and avoids
 * redirect_uri_mismatch. If unset, falls back to window.location.origin.
 */
const APP_URL =
  (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

/**
 * Supabase project URL (from env). Used only for documentation/logs.
 * For Google Cloud Console → Authorized redirect URIs you MUST add:
 *   https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
 * (Replace <YOUR_PROJECT_REF> with the ref from your VITE_SUPABASE_URL.)
 */
export const getSupabaseAuthCallbackForGoogle = (): string => {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
  const base = url.replace(/\/$/, "");
  return base ? `${base}/auth/v1/callback` : "";
};

/**
 * Detect custom domain (not lovable.app / lovableproject.com).
 */
function isCustomDomain(): boolean {
  const host = window.location.hostname;
  const isLovableDomain =
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host === "localhost";

  return !isLovableDomain;
}

export type OAuthExpectedRole = 'customer' | 'driver' | 'agency';

/**
 * Starts OAuth sign-in.
 *
 * Uses native Supabase OAuth on all domains.
 * Google/Apple OAuth credentials MUST be configured in
 * Lovable Cloud → Users → Authentication Settings → Sign In Methods.
 *
 * redirectTo: Uses VITE_APP_URL in production (e.g. https://meettransfer.app/oauth/callback)
 * so it matches Supabase redirect allowlist. Otherwise uses current origin.
 *
 * expectedRole: When provided (driver/agency), OAuth callback will verify the user's actual
 * role matches. If not, user is signed out and redirected to the login page with an error.
 */
export async function startOAuthSignIn(
  provider: OAuthProvider,
  options?: { expectedRole?: OAuthExpectedRole }
): Promise<{ error: Error | null }> {
  try {
    let callbackUrl = `${APP_URL || window.location.origin}/oauth/callback`;
    if (options?.expectedRole && (options.expectedRole === 'driver' || options.expectedRole === 'agency')) {
      callbackUrl += `?expected_role=${encodeURIComponent(options.expectedRole)}`;
    }
    console.log("[OAuth] Starting sign-in for provider:", provider);
    console.log("[OAuth] Callback URL:", callbackUrl);
    console.log("[OAuth] Is custom domain:", isCustomDomain());
    console.log("[OAuth] Google Console redirect URI (add this to Authorized redirect URIs):", getSupabaseAuthCallbackForGoogle());

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error("[OAuth] signInWithOAuth error:", error);
      return { error };
    }

    console.log("[OAuth] Got redirect URL:", data?.url ? "yes" : "no");

    // Manually redirect to provider's OAuth page
    if (data?.url) {
      window.location.href = data.url;
    }

    return { error: null };
  } catch (e) {
    console.error("[OAuth] Error:", e);
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}
