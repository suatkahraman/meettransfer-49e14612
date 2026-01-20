import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
}

/**
 * Catches rendering / chunk-load errors inside non-critical sections and fails silently
 * so the above-the-fold Hero never gets stuck behind a global skeleton.
 */
export class SilentSectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    // Keep logs low-volume (warn) to avoid noisy production consoles
    console.warn("[SilentSectionErrorBoundary] Non-critical section failed:", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
