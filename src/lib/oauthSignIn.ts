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
 * - Use Lovable Cloud managed OAuth for both Lovable preview domains and custom domains.
 * - On custom domains we explicitly set redirect_uri back to /oauth/callback.
 */
export async function startOAuthSignIn(
  provider: OAuthProvider
): Promise<{ error: Error | null }> {
  try {
    const customDomain = isCustomDomain();

    const result = await lovable.auth.signInWithOAuth(
      provider,
      customDomain
        ? { redirect_uri: `${window.location.origin}/oauth/callback` }
        : undefined
    );

    return { error: result?.error ? new Error(result.error.message) : null };
  } catch (e) {
    console.error("[OAuth] Error:", e);
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}
