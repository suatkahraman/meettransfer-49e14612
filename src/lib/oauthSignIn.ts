import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export type OAuthProvider = "google" | "apple";

// Helper to detect if we're on a custom domain (not Lovable's domains)
export const isCustomDomain = () => {
  const hostname = window.location.hostname;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const isLovableHosted = hostname.endsWith("lovable.app") || hostname.endsWith("lovableproject.com");
  return !isLocal && !isLovableHosted;
};

const getOAuthReturnTo = () => `${window.location.origin}/~oauth/callback`;

const isSafeOAuthRedirectUrl = (url: string) => {
  try {
    const u = new URL(url);
    const backendHost = new URL(import.meta.env.VITE_SUPABASE_URL).hostname;
    // Expect the provider authorization URL served by our backend
    return u.hostname === backendHost && u.pathname.startsWith("/auth/v1/authorize");
  } catch {
    return false;
  }
};

/**
 * Starts OAuth sign-in.
 * - On custom domains, starts a direct backend OAuth flow and navigates to the authorize URL.
 * - On Lovable-hosted domains, uses the managed OAuth bridge.
 */
export async function startOAuthSignIn(provider: OAuthProvider): Promise<{ error: Error | null }> {
  const onCustomDomain = isCustomDomain();

  if (onCustomDomain) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getOAuthReturnTo(),
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error };

    if (!data?.url || !isSafeOAuthRedirectUrl(data.url)) {
      return { error: new Error("Unsafe OAuth redirect URL") };
    }

    window.location.assign(data.url);
    return { error: null };
  }

  const { error } = await lovable.auth.signInWithOAuth(provider, {
    redirect_uri: window.location.origin,
  });

  return { error: error ?? null };
}
