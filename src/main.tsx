import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initWebVitals } from "@/utils/webVitals";

// Load CSS synchronously - critical for preventing FOUC (Flash of Unstyled Content)
// This ensures styles are applied before React renders
import "./index.css";

// LCP image is now preloaded directly in index.html from public folder

// Initialize Core Web Vitals measurement (debug only in development)
// Defer in production so it doesn't compete with critical rendering work.
const startWebVitals = () => {
  initWebVitals({ debug: import.meta.env.DEV, reportToAnalytics: true });
};

if (import.meta.env.DEV) {
  startWebVitals();
} else if ("requestIdleCallback" in window) {
  requestIdleCallback(() => startWebVitals(), { timeout: 4000 });
} else {
  setTimeout(startWebVitals, 2500);
}

// Signal mounting BEFORE render starts (boot watchdog safety)
try {
  console.log("[Boot] Starting React render");
} catch {
  // ignore
}

createRoot(document.getElementById("root")!).render(<App />);

// Signal that the React app has mounted (used by index.html boot recovery watchdog)
try {
  (window as any).__APP_MOUNTED__ = true;
  // Also emit an event so the watchdog UI can dismiss itself if it already showed.
  window.dispatchEvent(new Event("lovable:app-mounted"));
  console.log("[Boot] React app mounted successfully");
} catch {
  // ignore
}

// PWA service worker is registered by the app (prompt mode) and will
// show an in-app "Yeni Sürüm Hazır" banner when an update is available.
