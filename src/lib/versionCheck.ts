/**
 * Early version check to prevent stale cache after deploys.
 * Runs before app render. If server version differs from last known,
 * clears caches and reloads so users get fresh code.
 * Fixes "second login fails" when old cached chunks conflict with new deployment.
 */
const VERSION_FINGERPRINT_KEY = "app_version_fingerprint";

async function clearAllCaches(): Promise<void> {
  if ("caches" in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
      /* ignore */
    }
  }
}

async function unregisterServiceWorkers(): Promise<void> {
  if ("serviceWorker" in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {
      /* ignore */
    }
  }
}

export async function runVersionCheck(): Promise<boolean> {
  if (import.meta.env.DEV) return true;

  try {
    const res = await fetch("/version.json?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) return true;

    const data = await res.json();
    const fingerprint = `${data?.version ?? ""}-${data?.buildNumber ?? ""}-${data?.releaseDate ?? ""}`;
    const last = sessionStorage.getItem(VERSION_FINGERPRINT_KEY);

    if (last && last !== fingerprint) {
      console.log("[VersionCheck] Server version changed, clearing cache and reloading");
      sessionStorage.setItem(VERSION_FINGERPRINT_KEY, fingerprint);
      await clearAllCaches();
      await unregisterServiceWorkers();
      const url = new URL(window.location.href);
      url.searchParams.set("_t", String(Date.now()));
      window.location.replace(url.toString());
      return false;
    }

    if (!last) {
      sessionStorage.setItem(VERSION_FINGERPRINT_KEY, fingerprint);
    }
  } catch {
    /* on any error, proceed with app load */
  }
  return true;
}
