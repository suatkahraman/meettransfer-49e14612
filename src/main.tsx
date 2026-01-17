import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals } from "@/utils/webVitals";

// Initialize Core Web Vitals measurement (debug only in development)
initWebVitals({ debug: import.meta.env.DEV, reportToAnalytics: true });

createRoot(document.getElementById("root")!).render(<App />);

// PWA service worker is registered by the app (prompt mode) and will
// show an in-app "Yeni Sürüm Hazır" banner when an update is available.


