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
 * - Custom domains MUST use Lovable Cloud managed OAuth.
 *   The native backend authorize endpoint requires an OAuth client secret and will otherwise
 *   fail with: "Unsupported provider: missing OAuth secret".
 * - On custom domains we provide an explicit redirect_uri back to this app.
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

