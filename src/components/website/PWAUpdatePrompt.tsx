import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

/**
 * Silent PWA update handler.
 * - Auto-applies updates in the background without any UI prompt.
 * - Shows a brief toast after reload to confirm the update.
 */

// Check if we're in a preview/development environment - skip updates there
const isPreviewEnvironment = () => {
  if (typeof window === "undefined") return true;
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname.includes("preview") ||
    hostname.includes("lovableproject.com") ||
    hostname.includes("webcontainer")
  );
};

const PWA_UPDATE_FLAG = "pwa_just_updated";

// Guards to prevent infinite reload loops on some browsers/SW edge-cases
const PWA_DISABLE_UPDATES_KEY = "pwa_disable_sw_updates";
const PWA_RELOAD_GUARD_KEY = "pwa_reload_guard";
const PWA_RELOAD_SCHEDULED_AT_KEY = "pwa_reload_scheduled_at";
const PWA_HARD_UPDATE_FINGERPRINT_KEY = "pwa_hard_update_fingerprint";

type ReloadGuardState = { ts: number; count: number };

const readReloadGuard = (): ReloadGuardState => {
  try {
    const raw = sessionStorage.getItem(PWA_RELOAD_GUARD_KEY);
    if (!raw) return { ts: 0, count: 0 };
    const parsed = JSON.parse(raw) as Partial<ReloadGuardState>;
    return {
      ts: typeof parsed.ts === "number" ? parsed.ts : 0,
      count: typeof parsed.count === "number" ? parsed.count : 0,
    };
  } catch {
    return { ts: 0, count: 0 };
  }
};

const writeReloadGuard = (state: ReloadGuardState) => {
  try {
    sessionStorage.setItem(PWA_RELOAD_GUARD_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

const hardReloadWithBust = () => {
  const url = new URL(window.location.href);
  url.searchParams.set("_t", String(Date.now()));
  window.location.href = url.toString();
};

async function unregisterAllServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
}

async function clearAllCaches() {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.map((k) => caches.delete(k)));
}

export function PWAUpdatePrompt() {
  const { language } = useLanguage();
  const lastPromptedSwUrlRef = useRef<string | null>(null);
  const lastSeenVersionRef = useRef<string | null>(null);

  // If the page had no SW controller at boot, the first controllerchange is the initial install.
  // We should NOT reload in that case.
  const hadControllerAtStartRef = useRef<boolean>(false);

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  // Show toast if we just updated (flag set before reload)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const flag = sessionStorage.getItem(PWA_UPDATE_FLAG);
    if (flag) {
      sessionStorage.removeItem(PWA_UPDATE_FLAG);

      const toastText =
        {
          TR: "Uygulama güncellendi ✓",
          EN: "App updated ✓",
          DE: "App aktualisiert ✓",
          FR: "Application mise à jour ✓",
          RU: "Приложение обновлено ✓",
          IT: "App aggiornata ✓",
          ES: "App actualizada ✓",
          AR: "تم تحديث التطبيق ✓",
          UK: "Додаток оновлено ✓",
          JA: "アプリが更新されました ✓",
          PT: "App updated ✓",
        }[language] ?? "App updated ✓";

      // Short delay to let the app settle
      setTimeout(() => {
        toast.success(toastText, {
          duration: 2500,
          icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
        });
      }, 800);
    }
  }, [language]);

  useEffect(() => {
    // Skip in preview/development environments
    if (isPreviewEnvironment()) {
      console.log("[PWA Update] Skipping in preview environment:", window.location.hostname);
      return;
    }

    // If we detected a reload loop earlier in this session, disable the update manager.
    if (sessionStorage.getItem(PWA_DISABLE_UPDATES_KEY) === "1") {
      console.warn("[PWA Update] Disabled due to previous reload loop; skipping SW update manager.");
      return;
    }

    console.log("[PWA Update] Initializing silent updates on production:", window.location.hostname);

    if (!("serviceWorker" in navigator)) {
      console.log("[PWA Update] Service Worker not supported");
      return;
    }

    const applyUpdateAutomatically = async () => {
      const registration = registrationRef.current;
      const waitingUrl = registration?.waiting?.scriptURL ?? null;
      console.log("[PWA Update] 🚀 Auto-applying update!", { waitingUrl });

      // If the same waiting SW was already processed, skip
      if (waitingUrl && lastPromptedSwUrlRef.current === waitingUrl) {
        console.log("[PWA Update] Update already applied for this version, skipping");
        return;
      }

      lastPromptedSwUrlRef.current = waitingUrl;

      try {
        // Force update check to get the absolute latest SW
        await registration?.update();
        await new Promise((resolve) => setTimeout(resolve, 300));
        await registration?.update();
        await new Promise((resolve) => setTimeout(resolve, 200));

        const latestWaiting = registration?.waiting;
        console.log("[PWA Update] ✅ Auto-applying LATEST update:", {
          scriptURL: latestWaiting?.scriptURL,
          state: latestWaiting?.state,
        });

        // Set flag before reload so we can show toast after
        sessionStorage.setItem(PWA_UPDATE_FLAG, "1");

        // Use vite-plugin-pwa helper if available (it can reload itself)
        if (updateSWRef.current) {
          try {
            sessionStorage.setItem(PWA_RELOAD_SCHEDULED_AT_KEY, String(Date.now()));
          } catch {
            // ignore
          }
          console.log("[PWA Update] Using updateSW helper for auto-update");
          void updateSWRef.current(true);
          return;
        }

        // Fallback - tell the waiting SW to take over; controllerchange listener will reload once.
        if (latestWaiting) {
          console.log("[PWA Update] Using SKIP_WAITING message for auto-update");
          latestWaiting.postMessage({ type: "SKIP_WAITING" });
          return;
        }
      } catch (error) {
        console.error("[PWA Update] Auto-update error:", error);
        // Even on error, try to apply
        if (updateSWRef.current) {
          sessionStorage.setItem(PWA_UPDATE_FLAG, "1");
          try {
            sessionStorage.setItem(PWA_RELOAD_SCHEDULED_AT_KEY, String(Date.now()));
          } catch {
            // ignore
          }
          void updateSWRef.current(true);
        }
      }
    };

    // Register SW once.
    console.log("[PWA Update] Registering service worker...");
    updateSWRef.current = registerSW({
      immediate: true,
      onRegisteredSW: (swUrl, registration) => {
        console.log("[PWA Update] ✅ SW registered:", swUrl);
        registrationRef.current = registration ?? null;

        // Log current SW state
        console.log("[PWA Update] SW State:", {
          active: registration?.active?.state,
          waiting: !!registration?.waiting,
          installing: !!registration?.installing,
        });

        const requestUpdateCheck = async () => {
          try {
            await registration?.update();
            if (registration?.waiting) {
              console.log("[PWA Update] New version waiting after check, auto-applying");
              applyUpdateAutomatically();
            }
          } catch (e) {
            console.log("[PWA Update] Update check error:", e);
          }
        };

        // Hard update (unregister + clear caches) is a last resort and MUST be guarded.
        const forceHardUpdate = async (reason: string, fingerprint?: string) => {
          console.log("[PWA Update] ☢️ Forcing hard update:", reason);

          if (fingerprint) {
            const last = sessionStorage.getItem(PWA_HARD_UPDATE_FINGERPRINT_KEY);
            if (last === fingerprint) {
              console.log("[PWA Update] Hard update already attempted for fingerprint; skipping", fingerprint);
              return;
            }
            sessionStorage.setItem(PWA_HARD_UPDATE_FINGERPRINT_KEY, fingerprint);
          }

          try {
            sessionStorage.setItem(PWA_UPDATE_FLAG, "1");
          } catch {
            // ignore
          }

          try {
            if (registration) {
              await registration.unregister();
            } else {
              await unregisterAllServiceWorkers();
            }
          } catch {
            // ignore
          }

          try {
            await clearAllCaches();
          } catch {
            // ignore
          }

          hardReloadWithBust();
        };

        // If there's already a waiting worker, auto-apply.
        if (registration?.waiting) {
          console.log("[PWA Update] Found waiting worker, auto-applying update");
          applyUpdateAutomatically();
        }

        // version.json is fetched with no-store to bypass caches; if it changes, we trigger update.
        const pollVersionJson = async () => {
          try {
            const res = await fetch("/version.json", { cache: "no-store" });
            if (!res.ok) return;
            const v = (await res.json()) as {
              version?: string;
              buildNumber?: number;
              releaseDate?: string;
            };
            const fingerprint = `${v?.version ?? ""}-${v?.buildNumber ?? ""}-${v?.releaseDate ?? ""}`;
            if (!fingerprint || fingerprint === "--") return;

            if (!lastSeenVersionRef.current) {
              lastSeenVersionRef.current = fingerprint;
              return;
            }

            if (lastSeenVersionRef.current !== fingerprint) {
              console.log("[PWA Update] 🔥 version.json changed → checking update", {
                from: lastSeenVersionRef.current,
                to: fingerprint,
              });
              lastSeenVersionRef.current = fingerprint;

              // IMPORTANT: Do NOT do any "hard update" (SW unregister + cache purge + hard reload)
              // based on version.json changes. We only trigger a normal SW update check.
              await requestUpdateCheck();
            }
          } catch {
            // ignore
          }
        };

        // Reasonable update checks (avoid aggressive loops in production)
        const interval = window.setInterval(requestUpdateCheck, 60 * 1000);
        const versionInterval = window.setInterval(pollVersionJson, 60 * 1000);

        // One early check after load
        setTimeout(requestUpdateCheck, 1500);
        setTimeout(pollVersionJson, 2500);

        const onFastTrigger = () => {
          void requestUpdateCheck();
          void pollVersionJson();
        };

        const onVisible = () => {
          if (document.visibilityState === "visible") onFastTrigger();
        };

        window.addEventListener("focus", onFastTrigger);
        window.addEventListener("online", onFastTrigger);
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("pageshow", onFastTrigger);

        const onFirstInteraction = () => {
          onFastTrigger();
        };
        window.addEventListener("touchstart", onFirstInteraction, { once: true, passive: true });
        window.addEventListener("click", onFirstInteraction, { once: true });

        return () => {
          window.clearInterval(interval);
          window.clearInterval(versionInterval);
          window.removeEventListener("focus", onFastTrigger);
          window.removeEventListener("online", onFastTrigger);
          document.removeEventListener("visibilitychange", onVisible);
          window.removeEventListener("pageshow", onFastTrigger);
          window.removeEventListener("touchstart", onFirstInteraction);
          window.removeEventListener("click", onFirstInteraction);
        };
      },
      onNeedRefresh: () => {
        console.log("[PWA Update] 🔔 onNeedRefresh triggered! Auto-applying...");
        applyUpdateAutomatically();
      },
      onRegisterError: (error) => {
        console.error("[PWA Update] ❌ SW register error:", error);
      },
    });

    // Fallback: if the browser already has a waiting worker but callbacks didn't fire yet.
    navigator.serviceWorker.getRegistration().then((reg) => {
      console.log("[PWA Update] Existing registration check:", {
        hasRegistration: !!reg,
        waiting: !!reg?.waiting,
        active: reg?.active?.state,
      });
      if (reg?.waiting) {
        registrationRef.current = reg;
        applyUpdateAutomatically();
      }
    });

    // Reload when the new SW takes control — with loop protection.
    const onControllerChange = async () => {
      const now = Date.now();

      // On first install (no controller at initial load), DON'T reload.
      // Some browsers can get stuck in a reload loop during first boot.
      if (!hadControllerAtStartRef.current) {
        hadControllerAtStartRef.current = true;
        console.log("[PWA Update] controllerchange on first install; skipping reload");
        return;
      }

      // If an explicit reload was already scheduled very recently, skip double-reload.
      const scheduledAt = Number(sessionStorage.getItem(PWA_RELOAD_SCHEDULED_AT_KEY) ?? "0");
      if (scheduledAt && now - scheduledAt < 8000) {
        console.log("[PWA Update] controllerchange: reload already scheduled, skipping");
        return;
      }

      // Extra safety: avoid reloading during the very first seconds of navigation.
      try {
        if (typeof performance !== "undefined" && performance.now() < 8000 && document.readyState !== "complete") {
          console.log("[PWA Update] controllerchange during early boot; skipping reload");
          return;
        }
      } catch {
        // ignore
      }

      // Detect rapid reload loops (3 controllerchanges within 15s)
      const prev = readReloadGuard();
      const isRapid = prev.ts && now - prev.ts < 15000;
      const next: ReloadGuardState = isRapid
        ? { ts: prev.ts, count: prev.count + 1 }
        : { ts: now, count: 1 };
      writeReloadGuard(next);

      if (next.count >= 3) {
        console.warn("[PWA Update] Detected reload loop; disabling updates for this session.");
        try {
          sessionStorage.setItem(PWA_DISABLE_UPDATES_KEY, "1");
        } catch {
          // ignore
        }
        return;
      }

      console.log("[PWA Update] Controller changed, reloading once...");
      try {
        sessionStorage.setItem(PWA_UPDATE_FLAG, "1");
        sessionStorage.setItem(PWA_RELOAD_SCHEDULED_AT_KEY, String(now));
      } catch {
        // ignore
      }
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  // Silent mode - no UI rendered
  return null;
}
