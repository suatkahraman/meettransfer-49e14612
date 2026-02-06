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
 * - Custom domains use native Supabase OAuth with skipBrowserRedirect
 *   because the ~oauth/initiate bridge returns 404 on custom domains.
 * - Lovable preview domains use managed OAuth (auth-bridge works there).
 *
 * For custom domain OAuth to work, Google/Apple OAuth credentials MUST be
 * configured in Lovable Cloud → Authentication Settings → Sign In Methods.
 */
export async function startOAuthSignIn(
  provider: OAuthProvider
): Promise<{ error: Error | null }> {
  try {
    const customDomain = isCustomDomain();

    if (customDomain) {
      // Custom domains: use native Supabase OAuth, bypass auth-bridge
      const callbackUrl = `${window.location.origin}/oauth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) return { error };

      // Manually redirect to provider's OAuth page
      if (data?.url) {
        window.location.href = data.url;
      }

      return { error: null };
    }

    // Lovable preview domains: use managed OAuth (auth-bridge handles ~oauth)
    const result = await lovable.auth.signInWithOAuth(provider);
    return { error: result?.error ? new Error(result.error.message) : null };
  } catch (e) {
    console.error("[OAuth] Error:", e);
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}
