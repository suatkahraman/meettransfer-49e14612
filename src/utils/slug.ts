/**
 * URL path segment sanitization to avoid 400 Bad Request from
 * Turkish/special characters or malformed paths (e.g. /destinations/Mardin%20Havalimanı).
 */

/** Safe slug for /destinations/:slug – only a-z, 0-9, hyphen. */
export function safeDestinationSlug(name: string | undefined | null): string {
  if (name == null || name === "") return "";
  return name.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

/** Safe slug for /blog/:slug – only a-z, 0-9, hyphen (defensive for link generation). */
export function safeBlogSlug(id: string | undefined | null): string {
  if (id == null || id === "") return "";
  return id.toLowerCase().replace(/[^a-z0-9-]/g, "") || "blog";
}
