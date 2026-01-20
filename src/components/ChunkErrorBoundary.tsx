import { Component, ReactNode } from "react";
import { RefreshCw, AlertTriangle, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  isRefreshing: boolean;
}

// Detect chunk loading errors
function isChunkLoadError(error: Error): boolean {
  const message = error.message?.toLowerCase() || "";
  const name = error.name?.toLowerCase() || "";
  
  return (
    message.includes("loading chunk") ||
    message.includes("loading css chunk") ||
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("dynamically imported module") ||
    message.includes("error loading dynamically imported module") ||
    name.includes("chunkloaderror") ||
    message.includes("unexpected token") ||
    (message.includes("failed to fetch") && message.includes(".js"))
  );
}

// Clear all caches
async function clearAllCaches(): Promise<void> {
  if ("caches" in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          // Keep push notification caches
          if (!name.includes("push")) {
            return caches.delete(name);
          }
          return Promise.resolve();
        })
      );
    } catch (e) {
      console.warn("[ChunkErrorBoundary] Cache clear failed:", e);
    }
  }
}

// Unregister service workers
async function unregisterServiceWorkers(): Promise<void> {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister())
      );
    } catch (e) {
      console.warn("[ChunkErrorBoundary] SW unregister failed:", e);
    }
  }
}

class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isChunkError: false,
      isRefreshing: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      isChunkError: isChunkLoadError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ChunkErrorBoundary] Error caught:", error);
    console.error("[ChunkErrorBoundary] Error info:", errorInfo);

    // Auto-refresh for chunk errors after clearing cache
    if (isChunkLoadError(error)) {
      this.handleAutoRefresh();
    }
  }

  handleAutoRefresh = async () => {
    // Check if we already tried auto-refresh recently (prevent infinite loop)
    const lastRefreshKey = "chunk_error_last_refresh";
    const lastRefresh = sessionStorage.getItem(lastRefreshKey);
    const now = Date.now();

    if (lastRefresh && now - parseInt(lastRefresh) < 30000) {
      // If we refreshed within last 30 seconds, don't auto-refresh again
      console.log("[ChunkErrorBoundary] Skipping auto-refresh (too recent)");
      return;
    }

    sessionStorage.setItem(lastRefreshKey, now.toString());
    
    this.setState({ isRefreshing: true });

    try {
      await clearAllCaches();
      await unregisterServiceWorkers();
      
      // Wait a bit then reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (e) {
      console.error("[ChunkErrorBoundary] Auto-refresh failed:", e);
      this.setState({ isRefreshing: false });
    }
  };

  handleManualRefresh = async () => {
    this.setState({ isRefreshing: true });

    try {
      // Clear the auto-refresh check
      sessionStorage.removeItem("chunk_error_last_refresh");
      
      await clearAllCaches();
      await unregisterServiceWorkers();
      
      // Force reload from server
      window.location.href = window.location.href.split("?")[0] + "?_t=" + Date.now();
    } catch (e) {
      console.error("[ChunkErrorBoundary] Manual refresh failed:", e);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                {this.state.isChunkError ? (
                  <Wifi className="h-8 w-8 text-amber-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">
                {this.state.isChunkError
                  ? "Yeni Güncelleme Mevcut"
                  : "Bir Hata Oluştu"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {this.state.isChunkError
                  ? "Uygulama güncellendi. Yeni sürümü yüklemek için lütfen sayfayı yenileyin."
                  : "Beklenmeyen bir hata oluştu. Sayfayı yenileyerek tekrar deneyin."}
              </p>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={this.handleManualRefresh}
              disabled={this.state.isRefreshing}
              className="w-full h-12 text-base gap-2"
              size="lg"
            >
              {this.state.isRefreshing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Yenileniyor...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  Sayfayı Yenile
                </>
              )}
            </Button>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;
