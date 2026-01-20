import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Bug, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Smartphone,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SWInfo {
  status: "loading" | "active" | "waiting" | "installing" | "none" | "error";
  activeScriptURL?: string;
  waitingScriptURL?: string;
  installingScriptURL?: string;
  scope?: string;
  lastUpdateCheck?: Date;
  updateAvailable: boolean;
  error?: string;
  cacheKeys?: string[];
  versionFingerprint?: string;
  versionData?: { version?: string; buildNumber?: number; releaseDate?: string };
}

/**
 * PWA Debug Panel - Shows service worker status and update controls
 * Only visible in development or when triggered via ?pwa-debug=1
 */
export function PWADebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [swInfo, setSwInfo] = useState<SWInfo>({
    status: "loading",
    updateAvailable: false,
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Check if debug panel should be visible
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get("pwa-debug") || urlParams.get("pwa_debug");
    const isDev = import.meta.env.DEV;
    
    // Show if in dev mode or debug param is set
    setIsVisible(isDev || debugParam === "1" || debugParam === "true");
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Get SW info
  const fetchSWInfo = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      setSwInfo({
        status: "none",
        updateAvailable: false,
        error: "Service Worker not supported",
      });
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      // Fetch cache keys
      let cacheKeys: string[] = [];
      if ("caches" in window) {
        try {
          cacheKeys = await caches.keys();
        } catch {
          // ignore
        }
      }

      // Fetch version.json
      let versionFingerprint: string | undefined;
      let versionData: SWInfo["versionData"];
      try {
        const res = await fetch("/version.json", { cache: "no-store" });
        if (res.ok) {
          versionData = await res.json();
          versionFingerprint = `${versionData?.version ?? ""}-${versionData?.buildNumber ?? ""}-${versionData?.releaseDate ?? ""}`;
        }
      } catch {
        // ignore
      }

      if (!registration) {
        setSwInfo({
          status: "none",
          updateAvailable: false,
          cacheKeys,
          versionFingerprint,
          versionData,
        });
        return;
      }

      const activeWorker = registration.active;
      const waitingWorker = registration.waiting;
      const installingWorker = registration.installing;

      let status: SWInfo["status"] = "none";
      if (installingWorker) status = "installing";
      else if (waitingWorker) status = "waiting";
      else if (activeWorker) status = "active";

      setSwInfo({
        status,
        activeScriptURL: activeWorker?.scriptURL,
        waitingScriptURL: waitingWorker?.scriptURL,
        installingScriptURL: installingWorker?.scriptURL,
        scope: registration.scope,
        lastUpdateCheck: new Date(),
        updateAvailable: !!waitingWorker,
        cacheKeys,
        versionFingerprint,
        versionData,
      });
    } catch (error) {
      setSwInfo({
        status: "error",
        updateAvailable: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, []);

  // Initial fetch and periodic refresh (only when panel is open)
  useEffect(() => {
    if (!isVisible || !isOpen) return;

    fetchSWInfo();
    const interval = setInterval(fetchSWInfo, 15000);

    return () => clearInterval(interval);
  }, [isVisible, isOpen, fetchSWInfo]);

  // Check for updates
  const handleCheckUpdate = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;

    setIsChecking(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        await fetchSWInfo();
      }
    } catch (error) {
      console.error("[PWA Debug] Update check failed:", error);
    } finally {
      setIsChecking(false);
    }
  }, [fetchSWInfo]);

  // Force update (skip waiting)
  const handleForceUpdate = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    } catch (error) {
      console.error("[PWA Debug] Force update failed:", error);
    }
  }, []);

  // Clear caches
  const handleClearCaches = useCallback(async () => {
    if (!("caches" in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      alert(`Cleared ${cacheNames.length} cache(s). Reloading...`);
      window.location.reload();
    } catch (error) {
      console.error("[PWA Debug] Clear caches failed:", error);
    }
  }, []);

  // Unregister SW
  const handleUnregister = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
      alert(`Unregistered ${registrations.length} service worker(s). Reloading...`);
      window.location.reload();
    } catch (error) {
      console.error("[PWA Debug] Unregister failed:", error);
    }
  }, []);

  // Get status icon and color
  const getStatusDisplay = () => {
    switch (swInfo.status) {
      case "active":
        return { icon: CheckCircle, color: "text-green-500", label: "Active" };
      case "waiting":
        return { icon: AlertCircle, color: "text-yellow-500", label: "Update Ready" };
      case "installing":
        return { icon: Loader2, color: "text-blue-500", label: "Installing" };
      case "none":
        return { icon: AlertCircle, color: "text-muted-foreground", label: "No SW" };
      case "error":
        return { icon: AlertCircle, color: "text-destructive", label: "Error" };
      default:
        return { icon: Loader2, color: "text-muted-foreground", label: "Loading" };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  // Extract version from script URL (last part before .js)
  const extractVersion = (url?: string) => {
    if (!url) return "N/A";
    const match = url.match(/sw(?:-[^.]+)?\.js|workbox-[a-f0-9]+\.js/);
    return match ? match[0] : url.split("/").pop() || "Unknown";
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={cn(
          "fixed bottom-32 right-4 z-[9997] w-10 h-10 rounded-full",
          "bg-card border border-border shadow-lg",
          "flex items-center justify-center",
          "hover:bg-muted transition-colors",
          swInfo.updateAvailable && "ring-2 ring-yellow-500 ring-offset-2 ring-offset-background"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bug className={cn("h-5 w-5", swInfo.updateAvailable ? "text-yellow-500" : "text-muted-foreground")} />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-44 right-4 z-[9997] w-80 max-h-[70vh] overflow-auto bg-card border border-border rounded-xl shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">PWA Debug</span>
              </div>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-destructive" />
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="p-3 space-y-4">
              {/* Status */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Service Worker Status
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <StatusIcon className={cn("h-5 w-5", statusDisplay.color, swInfo.status === "installing" && "animate-spin")} />
                  <span className="font-medium text-sm">{statusDisplay.label}</span>
                </div>
              </div>

              {/* Versions */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Versions
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">Active:</span>
                    <code className="text-foreground">{extractVersion(swInfo.activeScriptURL)}</code>
                  </div>
                  {swInfo.waitingScriptURL && (
                    <div className="flex justify-between p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                      <span className="text-yellow-600">Waiting:</span>
                      <code className="text-yellow-600">{extractVersion(swInfo.waitingScriptURL)}</code>
                    </div>
                  )}
                  {swInfo.installingScriptURL && (
                    <div className="flex justify-between p-2 bg-blue-500/10 rounded">
                      <span className="text-blue-500">Installing:</span>
                      <code className="text-blue-500">{extractVersion(swInfo.installingScriptURL)}</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Version.json Fingerprint */}
              {swInfo.versionFingerprint && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Version Fingerprint
                  </div>
                  <code className="block text-xs p-2 bg-primary/10 border border-primary/20 rounded break-all text-primary font-mono">
                    {swInfo.versionFingerprint}
                  </code>
                  {swInfo.versionData && (
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <div className="p-1.5 bg-muted/30 rounded text-center">
                        <div className="text-muted-foreground">Ver</div>
                        <div className="font-medium">{swInfo.versionData.version || "-"}</div>
                      </div>
                      <div className="p-1.5 bg-muted/30 rounded text-center">
                        <div className="text-muted-foreground">Build</div>
                        <div className="font-medium">{swInfo.versionData.buildNumber || "-"}</div>
                      </div>
                      <div className="p-1.5 bg-muted/30 rounded text-center">
                        <div className="text-muted-foreground">Date</div>
                        <div className="font-medium">{swInfo.versionData.releaseDate || "-"}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cache Keys */}
              {swInfo.cacheKeys && swInfo.cacheKeys.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cache Keys ({swInfo.cacheKeys.length})
                  </div>
                  <div className="max-h-24 overflow-auto space-y-1">
                    {swInfo.cacheKeys.map((key, i) => (
                      <code key={i} className="block text-[10px] p-1.5 bg-muted/30 rounded break-all font-mono">
                        {key}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Scope */}
              {swInfo.scope && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Scope
                  </div>
                  <code className="block text-xs p-2 bg-muted/30 rounded break-all">
                    {swInfo.scope}
                  </code>
                </div>
              )}

              {/* Last Update Check */}
              {swInfo.lastUpdateCheck && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last check: {swInfo.lastUpdateCheck.toLocaleTimeString()}</span>
                </div>
              )}

              {/* Error */}
              {swInfo.error && (
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                  {swInfo.error}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-border">
                <Button
                  onClick={handleCheckUpdate}
                  disabled={isChecking}
                  size="sm"
                  className="w-full gap-2"
                >
                  <RefreshCw className={cn("h-4 w-4", isChecking && "animate-spin")} />
                  {isChecking ? "Checking..." : "Check for Update"}
                </Button>

                {swInfo.updateAvailable && (
                  <Button
                    onClick={handleForceUpdate}
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500/10"
                  >
                    <Smartphone className="h-4 w-4" />
                    Apply Update Now
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleClearCaches}
                    size="sm"
                    variant="ghost"
                    className="flex-1 text-xs"
                  >
                    Clear Caches
                  </Button>
                  <Button
                    onClick={handleUnregister}
                    size="sm"
                    variant="ghost"
                    className="flex-1 text-xs text-destructive hover:text-destructive"
                  >
                    Unregister SW
                  </Button>
                </div>
              </div>

              {/* Tip */}
              <p className="text-[10px] text-muted-foreground text-center">
                Add ?pwa_debug=1 to URL to show this panel
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
