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

    // PWA service worker registration disabled to prevent auto update/reload loops.
    // We keep ONLY push SW (/sw-push.js).
  };

  // Use setTimeout to defer SW registration outside critical path
  window.addEventListener('load', () => {
    setTimeout(registerServiceWorkers, 3000);
  });
}
