import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// PWA service worker is registered by the app (prompt mode) and will
// show an in-app "Yeni Sürüm Hazır" banner when an update is available.

