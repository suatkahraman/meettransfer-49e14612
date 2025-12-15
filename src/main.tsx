import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);


// Defer service worker registration (PWA + Push)
if ('serviceWorker' in navigator) {
  const registerServiceWorkers = async () => {
    // Register push notification service worker
    try {
      const registration = await navigator.serviceWorker.register('/sw-push.js');
      console.log('Push SW registered:', registration.scope);
    } catch (error) {
      console.log('Push SW registration failed:', error);
    }

    // Register PWA service worker dynamically
    // NOTE: disable auto-reload on updates to avoid "page keeps refreshing" loops.
    try {
      // @ts-ignore - virtual module from vite-plugin-pwa
      const { registerSW } = await import('virtual:pwa-register');
      registerSW({
        immediate: false,
        onNeedRefresh() {
          // Intentionally no auto refresh; user can refresh manually.
          console.log('PWA update available (no auto-refresh)');
        },
        onOfflineReady() {
          console.log('PWA offline ready');
        },
      });
    } catch (error) {
      console.log('PWA SW registration failed:', error);
    }
  };

  // Use setTimeout to defer SW registration outside critical path
  window.addEventListener('load', () => {
    setTimeout(registerServiceWorkers, 3000);
  });
}
