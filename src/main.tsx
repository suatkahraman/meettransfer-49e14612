import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Defer service worker registration to avoid render blocking and critical chain
if ('serviceWorker' in navigator) {
  const registerServiceWorkers = async () => {
    // Register PWA service worker dynamically
    try {
      // @ts-ignore - virtual module from vite-plugin-pwa
      const { registerSW } = await import('virtual:pwa-register');
      registerSW({ immediate: false });
    } catch (error) {
      console.log('PWA SW registration failed:', error);
    }
    
    // Register push notification service worker
    try {
      const registration = await navigator.serviceWorker.register('/sw-push.js');
      console.log('Push SW registered:', registration.scope);
    } catch (error) {
      console.log('Push SW registration failed:', error);
    }
  };

  // Use setTimeout to defer SW registration outside critical path
  window.addEventListener('load', () => {
    setTimeout(registerServiceWorkers, 3000);
  });
}