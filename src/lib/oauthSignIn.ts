import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

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
 * IMPORTANT:
 * - Custom domains use native Supabase OAuth with skipBrowserRedirect to bypass
 *   the auth-bridge that can cause 404 errors.
 * - Lovable domains use managed OAuth.
 */
export async function startOAuthSignIn(
  provider: OAuthProvider
): Promise<{ error: Error | null }> {
  try {
    const customDomain = isCustomDomain();

    // Custom domains: use native Supabase OAuth to bypass auth-bridge 404 issues
    if (customDomain) {
      const callbackUrl = `${window.location.origin}/oauth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: true, // Get OAuth URL directly
        },
      });

      if (error) return { error };

      // Manually redirect to the OAuth URL
      if (data?.url) {
        window.location.href = data.url;
      }

      return { error: null };
    }

    // Lovable domains: use managed OAuth
    const result = await lovable.auth.signInWithOAuth(provider);
    return { error: result?.error ? new Error(result.error.message) : null };
  } catch (e) {
    console.error("[OAuth] Error:", e);
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}
