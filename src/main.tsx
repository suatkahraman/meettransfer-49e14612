import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals } from "@/utils/webVitals";

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

createRoot(document.getElementById("root")!).render(<App />);

// PWA service worker is registered by the app (prompt mode) and will
// show an in-app "Yeni Sürüm Hazır" banner when an update is available.


