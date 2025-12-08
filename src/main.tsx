import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register push notification service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw-push.js');
      console.log('Push SW registered:', registration.scope);
    } catch (error) {
      console.log('Push SW registration failed:', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);