import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals } from "@/utils/webVitals";

// LCP image preload - Vite resolves this to the hashed production URL
import heroLcpImage from "@/assets/hero/hero-futuristic-city.webp";

// Inject preload link for LCP image immediately (before React renders)
const preloadLcpImage = () => {
  const existingPreload = document.querySelector(`link[href="${heroLcpImage}"]`);
  if (!existingPreload) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.type = "image/webp";
    link.href = heroLcpImage;
    link.fetchPriority = "high";
    document.head.appendChild(link);
  }
};
preloadLcpImage();

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


