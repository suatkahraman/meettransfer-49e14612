import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Copy,
  RefreshCw,
  Trash2,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Globe,
  Smartphone,
  Wifi,
  HardDrive,
  Clock,
} from "lucide-react";
import { loadGoogleMapsScript, isGoogleMapsLoaded, getGoogleMaps } from "@/utils/googleMapsLoader";
import { PWAHealthPanel } from "@/components/debug/PWAHealthPanel";

interface LogEntry {
  timestamp: string;
  level: "log" | "warn" | "error" | "info";
  message: string;
  stack?: string;
}

interface SystemInfo {
  userAgent: string;
  platform: string;
  language: string;
  cookiesEnabled: boolean;
  onLine: boolean;
  screenSize: string;
  viewport: string;
  devicePixelRatio: number;
  currentUrl: string;
  referrer: string;
  timezone: string;
  memory?: string;
}

interface ServiceWorkerInfo {
  supported: boolean;
  controller: string | null;
  registrations: number;
  state?: string;
}

interface CacheInfo {
  supported: boolean;
  cacheNames: string[];
  totalSize?: string;
}

interface GoogleMapsStatus {
  loaded: boolean;
  error: string | null;
  apiKey: string;
  scriptExists: boolean;
}

// Capture console logs
const capturedLogs: LogEntry[] = [];
const MAX_LOGS = 100;

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
};

// Intercept console
const interceptConsole = () => {
  const capture = (level: LogEntry["level"]) => (...args: unknown[]) => {
    const message = args
      .map((arg) => {
        if (typeof arg === "object") {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(" ");

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    // Capture stack for errors
    if (level === "error") {
      const err = args.find((a) => a instanceof Error) as Error | undefined;
      if (err?.stack) {
        entry.stack = err.stack;
      }
    }

    capturedLogs.unshift(entry);
    if (capturedLogs.length > MAX_LOGS) {
      capturedLogs.pop();
    }

    // Call original
    originalConsole[level](...args);
  };

  console.log = capture("log");
  console.warn = capture("warn");
  console.error = capture("error");
  console.info = capture("info");
};

// Initialize interception
if (typeof window !== "undefined") {
  interceptConsole();
}

export default function DebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [swInfo, setSwInfo] = useState<ServiceWorkerInfo | null>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [mapsStatus, setMapsStatus] = useState<GoogleMapsStatus | null>(null);
  const [isTestingMaps, setIsTestingMaps] = useState(false);
  const [versionInfo, setVersionInfo] = useState<Record<string, unknown> | null>(null);
  const refreshIntervalRef = useRef<number | null>(null);

  // Refresh logs
  const refreshLogs = useCallback(() => {
    setLogs([...capturedLogs]);
  }, []);

  // Clear logs
  const clearLogs = useCallback(() => {
    capturedLogs.length = 0;
    setLogs([]);
    toast.success("Loglar temizlendi");
  }, []);

  // Gather system info
  const gatherSystemInfo = useCallback(() => {
    const info: SystemInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenSize: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      currentUrl: window.location.href,
      referrer: document.referrer || "(none)",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    // Memory info (Chrome only)
    const perf = performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } };
    if (perf.memory) {
      const used = (perf.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
      const total = (perf.memory.totalJSHeapSize / 1024 / 1024).toFixed(1);
      info.memory = `${used}MB / ${total}MB`;
    }

    setSystemInfo(info);
  }, []);

  // Gather SW info
  const gatherSwInfo = useCallback(async () => {
    const info: ServiceWorkerInfo = {
      supported: "serviceWorker" in navigator,
      controller: null,
      registrations: 0,
    };

    if (info.supported) {
      info.controller = navigator.serviceWorker.controller?.scriptURL ?? null;
      info.state = navigator.serviceWorker.controller?.state;
      const regs = await navigator.serviceWorker.getRegistrations();
      info.registrations = regs.length;
    }

    setSwInfo(info);
  }, []);

  // Gather cache info
  const gatherCacheInfo = useCallback(async () => {
    const info: CacheInfo = {
      supported: "caches" in window,
      cacheNames: [],
    };

    if (info.supported) {
      info.cacheNames = await caches.keys();
    }

    setCacheInfo(info);
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
      setVersionInfo({ error: "Failed to fetch version.json" });
    }
  }, []);

  // Test Google Maps
  const testGoogleMaps = useCallback(async () => {
    setIsTestingMaps(true);

    const status: GoogleMapsStatus = {
      loaded: false,
      error: null,
      apiKey: "AIzaSyCk_A1D5LOqb2TuIFuOiVVjGDSAprap38M",
      scriptExists: false,
    };

    // Check if script tag exists
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    status.scriptExists = !!existingScript;

    // Check if already loaded
    if (isGoogleMapsLoaded()) {
      status.loaded = true;
      setMapsStatus(status);
      setIsTestingMaps(false);
      return;
    }

    // Try to load
    try {
      await loadGoogleMapsScript(["places"]);
      const maps = getGoogleMaps();
      status.loaded = !!maps;
      if (!maps) {
        status.error = "Google Maps yüklendi ama API nesnesi bulunamadı";
      }
    } catch (err) {
      status.error = err instanceof Error ? err.message : String(err);
    }

    setMapsStatus(status);
    setIsTestingMaps(false);
  }, []);

  // Copy full report
  const copyFullReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      system: systemInfo,
      serviceWorker: swInfo,
      cache: cacheInfo,
      googleMaps: mapsStatus,
      version: versionInfo,
      logs: logs.slice(0, 50),
    };

    const text = JSON.stringify(report, null, 2);
    navigator.clipboard.writeText(text).then(
      () => toast.success("Rapor panoya kopyalandı"),
      () => toast.error("Kopyalama başarısız")
    );
  }, [systemInfo, swInfo, cacheInfo, mapsStatus, versionInfo, logs]);

  // Initialize
  useEffect(() => {
    refreshLogs();
    gatherSystemInfo();
    gatherSwInfo();
    gatherCacheInfo();
    fetchVersionInfo();
    testGoogleMaps();

    // Auto-refresh logs every 2s
    refreshIntervalRef.current = window.setInterval(refreshLogs, 2000);

    return () => {
      if (refreshIntervalRef.current) {
        window.clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshLogs, gatherSystemInfo, gatherSwInfo, gatherCacheInfo, fetchVersionInfo, testGoogleMaps]);

  const getLevelIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLevelBadge = (level: LogEntry["level"]) => {
    const variants: Record<string, "destructive" | "secondary" | "default" | "outline"> = {
      error: "destructive",
      warn: "secondary",
      info: "default",
      log: "outline",
    };
    return <Badge variant={variants[level] || "outline"}>{level.toUpperCase()}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🛠️ Debug Panel</h1>
          <Button onClick={copyFullReport} className="gap-2">
            <Copy className="h-4 w-4" />
            Tam Raporu Kopyala
          </Button>
        </div>

        {/* Google Maps Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Google Maps Durumu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mapsStatus ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Yüklendi:</span>
                    {mapsStatus.loaded ? (
                      <Badge variant="default" className="bg-green-600">✓ Evet</Badge>
                    ) : (
                      <Badge variant="destructive">✗ Hayır</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Script:</span>
                    {mapsStatus.scriptExists ? (
                      <Badge variant="outline">Mevcut</Badge>
                    ) : (
                      <Badge variant="secondary">Yok</Badge>
                    )}
                  </div>
                </div>

                {mapsStatus.error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
                    <div className="font-semibold text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Hata Tespit Edildi
                    </div>
                    <pre className="mt-2 text-xs whitespace-pre-wrap break-all text-destructive/80">
                      {mapsStatus.error}
                    </pre>
                    {mapsStatus.error.includes("Referer") && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        💡 Bu hata genellikle Google Cloud Console'da API key'in domain kısıtlarında{" "}
                        <strong>{window.location.hostname}</strong> eklenmediği anlamına gelir.
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  API Key: <code className="bg-muted px-1 rounded">{mapsStatus.apiKey.slice(0, 12)}...</code>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={testGoogleMaps}
                  disabled={isTestingMaps}
                  className="gap-2"
                >
                  <RefreshCw className={isTestingMaps ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                  Tekrar Test Et
                </Button>
              </>
            ) : (
              <div className="text-muted-foreground text-sm">Yükleniyor...</div>
            )}
          </CardContent>
        </Card>

        {/* Version & PWA Info */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Version */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Sürüm Bilgisi
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {versionInfo ? (
                <>
                  <div>
                    <span className="text-muted-foreground">Version:</span>{" "}
                    <Badge variant="outline">{String(versionInfo.version || "?")}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Build:</span> {String(versionInfo.buildNumber || "?")}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span> {String(versionInfo.releaseDate || "?")}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">Yükleniyor...</div>
              )}
            </CardContent>
          </Card>

          {/* Service Worker */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <HardDrive className="h-5 w-5" />
                Service Worker
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {swInfo ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Destekleniyor:</span>
                    {swInfo.supported ? (
                      <Badge variant="default" className="bg-green-600">✓</Badge>
                    ) : (
                      <Badge variant="destructive">✗</Badge>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kayıt Sayısı:</span> {swInfo.registrations}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Durum:</span> {swInfo.state || "N/A"}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">Yükleniyor...</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PWA Health Panel - Real-time */}
        <PWAHealthPanel />

        {/* System Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5" />
              Sistem Bilgisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {systemInfo ? (
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">URL:</span>
                  <span className="truncate text-xs">{systemInfo.currentUrl}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Çevrimiçi:</span>
                  {systemInfo.onLine ? (
                    <Badge variant="default" className="bg-green-600">Evet</Badge>
                  ) : (
                    <Badge variant="destructive">Hayır</Badge>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Ekran:</span> {systemInfo.screenSize}
                </div>
                <div>
                  <span className="text-muted-foreground">Viewport:</span> {systemInfo.viewport}
                </div>
                <div>
                  <span className="text-muted-foreground">Dil:</span> {systemInfo.language}
                </div>
                <div>
                  <span className="text-muted-foreground">Timezone:</span> {systemInfo.timezone}
                </div>
                {systemInfo.memory && (
                  <div>
                    <span className="text-muted-foreground">Bellek:</span> {systemInfo.memory}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">Yükleniyor...</div>
            )}
          </CardContent>
        </Card>

        {/* Cache Info */}
        {cacheInfo && cacheInfo.cacheNames.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">📦 Önbellek ({cacheInfo.cacheNames.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {cacheInfo.cacheNames.map((name) => (
                  <Badge key={name} variant="outline" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Console Logs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">📜 Console Logları ({logs.length})</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={refreshLogs} className="gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Yenile
                </Button>
                <Button variant="outline" size="sm" onClick={clearLogs} className="gap-1">
                  <Trash2 className="h-3 w-3" />
                  Temizle
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] rounded-md border p-2">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">Henüz log yok</div>
              ) : (
                <div className="space-y-2">
                  {logs.slice(0, 50).map((log, i) => (
                    <div key={i} className="text-xs space-y-1">
                      <div className="flex items-start gap-2">
                        {getLevelIcon(log.level)}
                        <span className="text-muted-foreground font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {getLevelBadge(log.level)}
                      </div>
                      <pre className="ml-6 whitespace-pre-wrap break-all text-foreground/80 font-mono bg-muted/50 p-2 rounded">
                        {log.message.slice(0, 500)}
                        {log.message.length > 500 && "..."}
                      </pre>
                      {log.stack && (
                        <pre className="ml-6 text-[10px] text-destructive/70 whitespace-pre-wrap">
                          {log.stack.slice(0, 300)}
                        </pre>
                      )}
                      <Separator className="my-2" />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
