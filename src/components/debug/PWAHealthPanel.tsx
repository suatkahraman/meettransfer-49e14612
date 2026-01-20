import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, 
  Activity, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Circle,
  Download,
  Play,
  Pause,
  Trash2
} from "lucide-react";

interface SWRegistrationInfo {
  scope: string;
  active: {
    scriptURL: string;
    state: ServiceWorkerState;
  } | null;
  waiting: {
    scriptURL: string;
    state: ServiceWorkerState;
  } | null;
  installing: {
    scriptURL: string;
    state: ServiceWorkerState;
  } | null;
  updateViaCache: ServiceWorkerUpdateViaCache;
}

interface PWAEvent {
  id: number;
  timestamp: string;
  type: string;
  detail: string;
}

interface VersionInfo {
  version?: string;
  buildNumber?: string;
  releaseDate?: string;
  fingerprint?: string;
  [key: string]: unknown;
}

let eventIdCounter = 0;
const pwaEvents: PWAEvent[] = [];
const MAX_EVENTS = 50;

function addPWAEvent(type: string, detail: string) {
  pwaEvents.unshift({
    id: ++eventIdCounter,
    timestamp: new Date().toISOString(),
    type,
    detail,
  });
  if (pwaEvents.length > MAX_EVENTS) {
    pwaEvents.pop();
  }
}

export function PWAHealthPanel() {
  const [registration, setRegistration] = useState<SWRegistrationInfo | null>(null);
  const [events, setEvents] = useState<PWAEvent[]>([]);
  const [lastUpdateCheck, setLastUpdateCheck] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const controllerChangeListenerRef = useRef<(() => void) | null>(null);
  const stateChangeListenerRef = useRef<Map<ServiceWorker, () => void>>(new Map());

  // Fetch SW registration info
  const fetchRegistrationInfo = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      setRegistration(null);
      return;
    }

    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (regs.length === 0) {
        setRegistration(null);
        return;
      }

      const reg = regs[0];
      const info: SWRegistrationInfo = {
        scope: reg.scope,
        active: reg.active ? {
          scriptURL: reg.active.scriptURL,
          state: reg.active.state,
        } : null,
        waiting: reg.waiting ? {
          scriptURL: reg.waiting.scriptURL,
          state: reg.waiting.state,
        } : null,
        installing: reg.installing ? {
          scriptURL: reg.installing.scriptURL,
          state: reg.installing.state,
        } : null,
        updateViaCache: reg.updateViaCache,
      };
      
      setRegistration(info);

      // Attach state change listeners to track SW lifecycle
      const attachStateListener = (sw: ServiceWorker | null, label: string) => {
        if (!sw) return;
        
        // Remove existing listener if any
        const existingListener = stateChangeListenerRef.current.get(sw);
        if (existingListener) {
          sw.removeEventListener("statechange", existingListener);
        }
        
        const listener = () => {
          addPWAEvent("statechange", `${label} → ${sw.state}`);
          setEvents([...pwaEvents]);
          fetchRegistrationInfo();
        };
        
        sw.addEventListener("statechange", listener);
        stateChangeListenerRef.current.set(sw, listener);
      };

      attachStateListener(reg.active, "active");
      attachStateListener(reg.waiting, "waiting");
      attachStateListener(reg.installing, "installing");

    } catch (err) {
      console.error("[PWA Health] Error fetching registration:", err);
    }
  }, []);

  // Fetch version.json
  const fetchVersionInfo = useCallback(async () => {
    try {
      const res = await fetch("/version.json", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setVersionInfo(data);
      }
    } catch {
      // ignore
    }
  }, []);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    
    setIsChecking(true);
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.update();
      }
      
      const now = new Date().toISOString();
      setLastUpdateCheck(now);
      addPWAEvent("update_check", "Manual update check triggered");
      setEvents([...pwaEvents]);
      
      await fetchRegistrationInfo();
      await fetchVersionInfo();
    } catch (err) {
      addPWAEvent("update_error", String(err));
      setEvents([...pwaEvents]);
    } finally {
      setIsChecking(false);
    }
  }, [fetchRegistrationInfo, fetchVersionInfo]);

  // Apply waiting SW
  const applyWaitingUpdate = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
          addPWAEvent("skip_waiting", "Sent SKIP_WAITING to waiting SW");
          setEvents([...pwaEvents]);
        }
      }
    } catch (err) {
      addPWAEvent("skip_waiting_error", String(err));
      setEvents([...pwaEvents]);
    }
  }, []);

  // Clear events
  const clearEvents = useCallback(() => {
    pwaEvents.length = 0;
    setEvents([]);
  }, []);

  // Setup controller change listener
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleControllerChange = () => {
      const newController = navigator.serviceWorker.controller;
      addPWAEvent(
        "controllerchange",
        newController 
          ? `New controller: ${newController.scriptURL.split("/").pop()}`
          : "Controller removed"
      );
      setEvents([...pwaEvents]);
      fetchRegistrationInfo();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    controllerChangeListenerRef.current = handleControllerChange;

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, [fetchRegistrationInfo]);

  // Online/offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addPWAEvent("network", "Online");
      setEvents([...pwaEvents]);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      addPWAEvent("network", "Offline");
      setEvents([...pwaEvents]);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchRegistrationInfo();
    fetchVersionInfo();
    setEvents([...pwaEvents]);
    
    // Log initial state
    addPWAEvent("init", "PWA Health Panel initialized");
    setEvents([...pwaEvents]);
  }, [fetchRegistrationInfo, fetchVersionInfo]);

  // Auto-refresh interval
  useEffect(() => {
    if (isAutoRefresh) {
      intervalRef.current = window.setInterval(() => {
        fetchRegistrationInfo();
        setEvents([...pwaEvents]);
      }, 3000);
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefresh, fetchRegistrationInfo]);

  // Cleanup state change listeners
  useEffect(() => {
    return () => {
      stateChangeListenerRef.current.forEach((listener, sw) => {
        sw.removeEventListener("statechange", listener);
      });
      stateChangeListenerRef.current.clear();
    };
  }, []);

  const getStateColor = (state: ServiceWorkerState | undefined) => {
    switch (state) {
      case "activated":
        return "bg-green-500";
      case "activating":
        return "bg-yellow-500";
      case "installed":
        return "bg-blue-500";
      case "installing":
        return "bg-yellow-500";
      case "redundant":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "controllerchange":
        return <RefreshCw className="h-3 w-3 text-blue-500" />;
      case "statechange":
        return <Activity className="h-3 w-3 text-yellow-500" />;
      case "update_check":
        return <Download className="h-3 w-3 text-green-500" />;
      case "network":
        return <Circle className="h-3 w-3 text-purple-500" />;
      case "skip_waiting":
        return <Play className="h-3 w-3 text-orange-500" />;
      case "update_error":
      case "skip_waiting_error":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Circle className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            PWA Health (Gerçek Zamanlı)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className="gap-1"
            >
              {isAutoRefresh ? (
                <>
                  <Pause className="h-3 w-3" />
                  Durdur
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Başlat
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={checkForUpdates}
              disabled={isChecking}
              className="gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
              Update Check
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">Ağ</span>
            </div>
            <Badge variant={isOnline ? "default" : "destructive"} className="mt-1">
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>

          <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Active SW</span>
            {registration?.active ? (
              <Badge className={`mt-1 ${getStateColor(registration.active.state)}`}>
                {registration.active.state}
              </Badge>
            ) : (
              <Badge variant="secondary" className="mt-1">Yok</Badge>
            )}
          </div>

          <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Waiting SW</span>
            {registration?.waiting ? (
              <Badge className={`mt-1 ${getStateColor(registration.waiting.state)}`}>
                {registration.waiting.state}
              </Badge>
            ) : (
              <Badge variant="outline" className="mt-1">Yok</Badge>
            )}
          </div>

          <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Installing SW</span>
            {registration?.installing ? (
              <Badge className={`mt-1 ${getStateColor(registration.installing.state)}`}>
                {registration.installing.state}
              </Badge>
            ) : (
              <Badge variant="outline" className="mt-1">Yok</Badge>
            )}
          </div>
        </div>

        {/* Waiting SW Action */}
        {registration?.waiting && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Bekleyen güncelleme mevcut!</span>
              </div>
              <Button size="sm" variant="default" onClick={applyWaitingUpdate}>
                Hemen Uygula
              </Button>
            </div>
          </div>
        )}

        {/* Version & Last Check */}
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
            <div className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Son Update Check
            </div>
            <div className="text-muted-foreground text-xs font-mono">
              {lastUpdateCheck 
                ? new Date(lastUpdateCheck).toLocaleTimeString()
                : "Henüz yapılmadı"
              }
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
            <div className="font-medium">version.json</div>
            <div className="text-muted-foreground text-xs font-mono">
              {versionInfo ? (
                <>
                  v{versionInfo.version || "?"} 
                  {versionInfo.fingerprint && (
                    <span className="ml-2 text-muted-foreground/60">
                      ({String(versionInfo.fingerprint).slice(0, 8)}...)
                    </span>
                  )}
                </>
              ) : (
                "Yükleniyor..."
              )}
            </div>
          </div>
        </div>

        {/* Registration Details */}
        {registration && (
          <div className="text-xs space-y-1 p-3 bg-muted/20 rounded-lg">
            <div className="font-medium text-sm mb-2">SW Registration Detayları</div>
            <div>
              <span className="text-muted-foreground">Scope:</span>{" "}
              <code className="bg-muted px-1 rounded">{registration.scope}</code>
            </div>
            <div>
              <span className="text-muted-foreground">Update Via Cache:</span>{" "}
              <Badge variant="outline" className="text-xs">{registration.updateViaCache}</Badge>
            </div>
            {registration.active && (
              <div>
                <span className="text-muted-foreground">Active Script:</span>{" "}
                <code className="bg-muted px-1 rounded text-[10px]">
                  {registration.active.scriptURL.split("/").pop()}
                </code>
              </div>
            )}
          </div>
        )}

        {/* Event Log */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">Olay Geçmişi ({events.length})</span>
            <Button variant="ghost" size="sm" onClick={clearEvents} className="h-7 gap-1">
              <Trash2 className="h-3 w-3" />
              Temizle
            </Button>
          </div>
          <ScrollArea className="h-[200px] rounded-md border p-2">
            {events.length === 0 ? (
              <div className="text-center text-muted-foreground py-4 text-sm">
                Henüz olay yok
              </div>
            ) : (
              <div className="space-y-1">
                {events.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex items-start gap-2 text-xs py-1 px-2 hover:bg-muted/50 rounded"
                  >
                    {getEventIcon(event.type)}
                    <span className="text-muted-foreground font-mono w-16 flex-shrink-0">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 h-5">
                      {event.type}
                    </Badge>
                    <span className="text-foreground/80 truncate flex-1">
                      {event.detail}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <Separator />

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className={`h-2 w-2 rounded-full ${isAutoRefresh ? "bg-green-500 animate-pulse" : "bg-muted"}`} />
          {isAutoRefresh ? "Otomatik yenileme aktif (3sn)" : "Otomatik yenileme kapalı"}
        </div>
      </CardContent>
    </Card>
  );
}
