import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export type OAuthProvider = "google" | "apple";

/**
 * Detect custom domain (not lovable.app / lovableproject.com).
 */
function isCustomDomain(): boolean {
  const host = window.location.hostname;
  // Check for Lovable managed domains
  const isLovableDomain =
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host === "localhost";

  return !isLovableDomain;
}

function getBackendHost(): string | null {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url) return null;
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Starts OAuth sign-in.
 *
 * On custom domains: Uses native OAuth with skipBrowserRedirect to avoid auth-bridge issues.
 * On Lovable domains: Uses Lovable Cloud managed OAuth.
 */
export async function startOAuthSignIn(provider: OAuthProvider): Promise<{ error: Error | null }> {
  try {
    const customDomain = isCustomDomain();
    // Always use /oauth/callback as the redirect URL
    const callbackUrl = `${window.location.origin}/oauth/callback`;

    if (customDomain) {
      // Custom domain: bypass auth-bridge by getting OAuth URL directly
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) return { error };

      if (data?.url) {
        // Security: ensure we only redirect to our own backend auth endpoint
        const oauthUrl = new URL(data.url);
        const backendHost = getBackendHost();

        if (
          oauthUrl.protocol !== "https:" ||
          !backendHost ||
          oauthUrl.hostname !== backendHost ||
          !oauthUrl.pathname.startsWith("/auth/v1/authorize")
        ) {
          return { error: new Error("Invalid OAuth redirect URL") };
        }

        window.location.href = data.url;
      }

      return { error: null };
    }

    // Lovable domains: use managed OAuth (do NOT pass redirect_uri; the SDK manages it)
    const { error } = await lovable.auth.signInWithOAuth(provider);
    return { error: error ? new Error(error.message) : null };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}

