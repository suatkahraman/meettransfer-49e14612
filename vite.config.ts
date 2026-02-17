import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import { viteVersionPlugin } from "./scripts/vite-version-plugin";
import { asyncCssPlugin } from "./scripts/vite-async-css-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      mode === "production" && viteVersionPlugin(),
      mode === "production" && asyncCssPlugin(),
      VitePWA({
        // Auto-update: keep users on the latest published version (no manual prompt).
        registerType: "autoUpdate",
        injectRegister: null,
        // Enable SW in dev builds for /debug page to accurately show SW status.
        devOptions: { enabled: mode === "development", type: "module" },
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "robots.txt", "sitemap.xml"],
        manifest: {
          id: "/",
          name: "Meet Transfer - Premium Airport Transfers",
          short_name: "Meet Transfer",
          description: "Luxury airport transfer and chauffeur service across Turkey. Professional drivers, premium fleet, 24/7 availability.",
          lang: "en",
          dir: "ltr",
          theme_color: "#111111",
          background_color: "#111111",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/?source=pwa",
          categories: ["travel", "transportation", "lifestyle"],
          icons: [
            {
              src: "/favicon.ico",
              sizes: "48x48",
              type: "image/x-icon"
            },
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/pwa-maskable-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable"
            },
            {
              src: "/pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ],
          shortcuts: [
            {
              name: "Book Transfer",
              short_name: "Book",
              description: "Book a new airport transfer",
              url: "/whatsapp-booking?source=pwa",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
            },
            {
              name: "My Bookings",
              short_name: "Bookings",
              description: "View your reservations",
              url: "/customer?source=pwa",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
            },
            {
              name: "Contact Us",
              short_name: "Contact",
              description: "Get in touch with us",
              url: "/contact?source=pwa",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
            }
          ],
          screenshots: [
            {
              src: "/screenshot-wide.png",
              sizes: "1280x720",
              type: "image/png",
              form_factor: "wide",
              label: "Meet Transfer Homepage"
            },
            {
              src: "/screenshot-narrow.png",
              sizes: "720x1280",
              type: "image/png",
              form_factor: "narrow",
              label: "Meet Transfer Mobile View"
            }
          ]
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,svg,woff,woff2}"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
          cleanupOutdatedCaches: true,
          importScripts: ["sw-push.js"],
          skipWaiting: true,
          clientsClaim: true,
          navigationPreload: false,
           navigateFallbackDenylist: [
             /^\/~oauth\/.*/,   // Lovable managed OAuth broker paths (e.g. /~oauth/initiate)
             /^\/oauth\/.*/,    // Standard OAuth callback paths
             /^\/auth\/v1\/.*/  // Supabase auth API paths (if ever hit directly)
           ],
          runtimeCaching: [
            // Simplified caching strategy
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "gstatic-fonts-cache",
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "images-cache",
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ]
        }
      }),
      // Bundle analyzer - generates stats.html in project root
      mode === "production" && visualizer({
        filename: "stats.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: "treemap", // treemap, sunburst, network
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Vercel: VITE_GEMINI_API_KEY zorla enjekte edilir
    define: {
      "import.meta.env.VITE_GEMINI_API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    envPrefix: "VITE_",
    build: {
      sourcemap: false,
      minify: "esbuild",
      esbuild: {
        drop: ["debugger"],
      },
      target: ["es2015", "safari13"],
      cssCodeSplit: true,
      cssMinify: "esbuild",
      assetsInlineLimit: 2048,
      chunkSizeWarningLimit: 2000
    }
  };
});
// Build configuration simplified to fix loading issues - Updated to force deploy

