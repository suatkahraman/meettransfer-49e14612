import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AgencyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AgencyErrorBoundary] Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <h1 className="text-xl font-bold">Acenta Paneli Hatası</h1>
            <p className="text-muted-foreground">
              İşleminiz sırasında bir hata oluştu. Verileriniz korunmaktadır.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Yeniden Yükle
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
