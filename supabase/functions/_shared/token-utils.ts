/**
 * Shared utilities for secure token handling
 * Uses SHA-256 hashing for magic link tokens
 */

/**
 * Generate a SHA-256 hash of a token
 * @param token - The raw token to hash
 * @returns The hex-encoded SHA-256 hash
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a new magic link token and its hash
 * @returns Object containing the raw token (for URL) and its hash (for storage)
 */
export async function generateMagicLinkToken(): Promise<{ token: string; tokenHash: string }> {
  const token = crypto.randomUUID();
  const tokenHash = await hashToken(token);
  return { token, tokenHash };
}
