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
 * Gets the OAuth authorization URL for custom domains (BYOK).
 * Used by iOS PWA to open in a new window.
 */
export async function getOAuthUrl(provider: OAuthProvider): Promise<{ url: string | null; error: Error | null }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getOAuthReturnTo(),
      skipBrowserRedirect: true,
    },
  });

  if (error) return { url: null, error };

  if (!data?.url || !isSafeOAuthRedirectUrl(data.url)) {
    return { url: null, error: new Error("Unsafe OAuth redirect URL") };
  }

  return { url: data.url, error: null };
}

/**
 * Starts OAuth sign-in.
 * Always uses Lovable managed OAuth bridge which works on both Lovable domains and custom domains.
 * 
 * Note: The getOAuthUrl function is kept for iOS PWA popup flow (Safari blocks same-window redirects).
 * For BYOK (Bring Your Own Keys) setup, configure OAuth credentials in Lovable Cloud settings.
 */
export async function startOAuthSignIn(provider: OAuthProvider): Promise<{ error: Error | null }> {
  // Always use Lovable managed OAuth - works on all domains including custom domains
  const { error } = await lovable.auth.signInWithOAuth(provider, {
    redirect_uri: window.location.origin,
  });

  return { error: error ?? null };
}
