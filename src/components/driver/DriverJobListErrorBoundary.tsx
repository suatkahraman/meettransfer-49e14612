import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary for DriverJobList - shows "Bir hata oluştu" instead of white screen on iOS.
 */
export class DriverJobListErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[DriverJobListErrorBoundary] Error caught:', error);
    console.error('[DriverJobListErrorBoundary] Error info:', errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-6 bg-background">
          <p className="text-destructive font-semibold mb-2">Bir hata oluştu</p>
          <p className="text-muted-foreground text-sm text-center mb-4">
            Sayfayı yenileyerek tekrar deneyin.
          </p>
          <Button onClick={this.handleRetry} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tekrar Dene
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
