import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App.tsx";
import "./index.css";

// Minimal inline Error Boundary to avoid external dependencies crashing startup
class StartupErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: "center", fontFamily: "system-ui" }}>
          <h1>Application Error</h1>
          <p>The application failed to start.</p>
          <pre style={{ background: "#f5f5f5", padding: 10, borderRadius: 5, overflow: "auto" }}>
            {this.state.error?.message || "Unknown error"}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", marginTop: 20 }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function boot() {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      console.error("Root element not found");
      return;
    }

    createRoot(rootElement).render(
      <StartupErrorBoundary>
        <App />
      </StartupErrorBoundary>
    );

    // Signal success
    try {
      (window as any).__APP_MOUNTED__ = true;
      window.dispatchEvent(new Event("lovable:app-mounted"));
    } catch { /* ignore */ }
    
  } catch (e) {
    console.error("Boot failed:", e);
  }
}

// Execute immediately
boot();
