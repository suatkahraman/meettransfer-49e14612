import { supabase } from "@/integrations/supabase/client";

export type OAuthProvider = "google" | "apple";

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

/**
 * Starts OAuth sign-in.
 *
 * Uses native Supabase OAuth on all domains.
 * Google/Apple OAuth credentials MUST be configured in
 * Lovable Cloud → Users → Authentication Settings → Sign In Methods.
 *
 * On custom domains (meettransfer.app), redirectTo uses the custom domain origin.
 * On preview domains, redirectTo uses the preview origin.
 */
export async function startOAuthSignIn(
  provider: OAuthProvider
): Promise<{ error: Error | null }> {
  try {
    const callbackUrl = `${window.location.origin}/oauth/callback`;
    console.log("[OAuth] Starting sign-in for provider:", provider);
    console.log("[OAuth] Callback URL:", callbackUrl);
    console.log("[OAuth] Is custom domain:", isCustomDomain());

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
