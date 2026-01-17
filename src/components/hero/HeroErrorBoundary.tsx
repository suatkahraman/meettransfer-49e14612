import { Component, ReactNode } from "react";
import { RefreshCw, AlertCircle, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSkeleton } from "./HeroSkeleton";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isRetrying: boolean;
  retryCount: number;
  isChunkError: boolean;
  isRefreshing: boolean;
}

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

async function clearAllCaches(): Promise<void> {
  if ("caches" in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          // Keep push notification caches
          if (!name.includes("push")) return caches.delete(name);
          return Promise.resolve(false);
        })
      );
    } catch (e) {
      console.warn("[HeroErrorBoundary] Cache clear failed:", e);
    }
  }
}

async function unregisterServiceWorkers(): Promise<void> {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    } catch (e) {
      console.warn("[HeroErrorBoundary] SW unregister failed:", e);
    }
  }
}

class HeroErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isRetrying: false,
      retryCount: 0,
      isChunkError: false,
      isRefreshing: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[HeroErrorBoundary] Error:", error);
    console.error("[HeroErrorBoundary] Error info:", errorInfo);

    // If it's a chunk error (stale cache / service worker), try a hard refresh
    if (isChunkLoadError(error)) {
      void this.handleHardRefresh();
      return;
    }

    // Auto-retry once after a short delay
    if (this.state.retryCount < 1) {
      setTimeout(() => {
        this.handleRetry();
      }, 1500);
    }
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
      isChunkError: false,
    }));

    // Reset retrying state after a moment
    setTimeout(() => {
      this.setState({ isRetrying: false });
    }, 500);
  };

  handleHardRefresh = async () => {
    const lastRefreshKey = "hero_chunk_error_last_refresh";
    const lastRefresh = sessionStorage.getItem(lastRefreshKey);
    const now = Date.now();

    // Prevent refresh loops
    if (lastRefresh && now - parseInt(lastRefresh) < 30000) {
      return;
    }

    sessionStorage.setItem(lastRefreshKey, now.toString());
    this.setState({ isRefreshing: true });

    try {
      await clearAllCaches();
      await unregisterServiceWorkers();

      // Force reload from server
      window.location.href = window.location.href.split("?")[0] + "?_t=" + Date.now();
    } catch (e) {
      console.error("[HeroErrorBoundary] Hard refresh failed:", e);
      window.location.reload();
    }
  };

  handleRefresh = () => {
    void this.handleHardRefresh();
  };

  render() {
    if (this.state.isRetrying) {
      return <HeroSkeleton />;
    }

    if (this.state.hasError) {
      // Show skeleton with subtle error indicator after retries exhausted
      if (this.state.retryCount >= 1 || this.state.isChunkError) {
        return (
          <section className="relative overflow-hidden bg-background">
            <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />

            <div className="container relative z-10 px-4 py-16 md:py-24">
              <div className="max-w-md mx-auto text-center space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                    {this.state.isChunkError ? (
                      <Wifi className="h-8 w-8 text-amber-500" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-amber-500" />
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    {this.state.isChunkError ? "Yeni Sürüm Hazır" : "Yükleme Hatası"}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {this.state.isChunkError
                      ? "Sayfa güncellendi. Yeni sürümü yüklemek için önbellek temizlenerek yenilenecek."
                      : "Rezervasyon formu yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin."}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {!this.state.isChunkError && (
                    <Button onClick={this.handleRetry} variant="outline" className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Tekrar Dene
                    </Button>
                  )}
                  <Button onClick={this.handleRefresh} className="gap-2" disabled={this.state.isRefreshing}>
                    <RefreshCw className={this.state.isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                    {this.state.isRefreshing ? "Yenileniyor..." : "Önbelleği Temizle & Yenile"}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        );
      }

      return <HeroSkeleton />;
    }

    return this.props.children;
  }
}

export default HeroErrorBoundary;

