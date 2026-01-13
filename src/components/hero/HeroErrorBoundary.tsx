import { Component, ReactNode } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSkeleton } from "./HeroSkeleton";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isRetrying: boolean;
  retryCount: number;
}

class HeroErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isRetrying: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[HeroErrorBoundary] Error:", error);
    console.error("[HeroErrorBoundary] Error info:", errorInfo);

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
    }));

    // Reset retrying state after a moment
    setTimeout(() => {
      this.setState({ isRetrying: false });
    }, 500);
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.isRetrying) {
      return <HeroSkeleton />;
    }

    if (this.state.hasError) {
      // Show skeleton with subtle error indicator after retries exhausted
      if (this.state.retryCount >= 1) {
        return (
          <section className="relative overflow-hidden bg-background">
            <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />
            
            <div className="container relative z-10 px-4 py-16 md:py-24">
              <div className="max-w-md mx-auto text-center space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-amber-500" />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    Yükleme Hatası
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Rezervasyon formu yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={this.handleRetry}
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Tekrar Dene
                  </Button>
                  <Button
                    onClick={this.handleRefresh}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sayfayı Yenile
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
