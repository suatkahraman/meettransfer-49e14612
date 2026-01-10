import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Service worker management:
// - Keep ONLY push SW (/sw-push.js)
// - Unregister any legacy PWA SW that may be caching old builds
if ("serviceWorker" in navigator) {
  const registerServiceWorkers = async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      const keepSuffix = "/sw-push.js";

      await Promise.all(
        regs.map(async (reg) => {
          const scriptURL =
            reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL;

          // If it's not our push SW, remove it (prevents stale cached frontend).
          if (scriptURL && !scriptURL.endsWith(keepSuffix)) {
            await reg.unregister();
          }
        })
      );
    } catch (error) {
      console.log("SW cleanup failed:", error);
    }

    // Register push notification service worker
    try {
      const registration = await navigator.serviceWorker.register("/sw-push.js");
      await registration.update();
      console.log("Push SW registered:", registration.scope);
    } catch (error) {
      console.log("Push SW registration failed:", error);
    }

    // PWA caching service worker registration intentionally disabled.
  };

  // Defer SW registration outside critical path
  window.addEventListener("load", () => {
    setTimeout(registerServiceWorkers, 1000);
  });
}

