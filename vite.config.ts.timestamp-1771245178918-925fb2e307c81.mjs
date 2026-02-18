// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/suat-/Documents/trae_projects/meettransfer/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/suat-/Documents/trae_projects/meettransfer/node_modules/@vitejs/plugin-react-swc/index.js";
import path2 from "path";
import { componentTagger } from "file:///C:/Users/suat-/Documents/trae_projects/meettransfer/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///C:/Users/suat-/Documents/trae_projects/meettransfer/node_modules/vite-plugin-pwa/dist/index.js";
import { visualizer } from "file:///C:/Users/suat-/Documents/trae_projects/meettransfer/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";

// scripts/vite-version-plugin.ts
import fs from "fs";
import path from "path";
var VERSION_FILE = "public/version.json";
function getExistingVersion() {
  try {
    const content = fs.readFileSync(VERSION_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}
function incrementVersion(version) {
  const parts = version.split(".").map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join(".");
}
function formatDate() {
  return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
}
function viteVersionPlugin() {
  let isProduction = false;
  return {
    name: "vite-version-plugin",
    configResolved(config) {
      isProduction = config.command === "build" && config.mode === "production";
    },
    buildStart() {
      if (!isProduction) return;
      const existing = getExistingVersion();
      const defaultNotes = {
        TR: "Performans iyile\u015Ftirmeleri ve hata d\xFCzeltmeleri",
        EN: "Performance improvements and bug fixes",
        DE: "Leistungsverbesserungen und Fehlerbehebungen",
        FR: "Am\xE9liorations des performances et corrections de bugs"
      };
      const newVersion = {
        version: existing ? incrementVersion(existing.version) : "1.0.0",
        releaseDate: formatDate(),
        buildNumber: (existing?.buildNumber || 0) + 1,
        notes: existing?.notes || defaultNotes
      };
      const dir = path.dirname(VERSION_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(VERSION_FILE, JSON.stringify(newVersion, null, 2));
      console.log("\n");
      console.log("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
      console.log("\u2551         \u{1F4E6} VERSION AUTO-GENERATED          \u2551");
      console.log("\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563");
      console.log(`\u2551  Version:      v${newVersion.version.padEnd(25)}\u2551`);
      console.log(`\u2551  Build:        #${String(newVersion.buildNumber).padEnd(25)}\u2551`);
      console.log(`\u2551  Date:         ${newVersion.releaseDate.padEnd(26)}\u2551`);
      console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");
      console.log("\n");
    }
  };
}

// scripts/vite-async-css-plugin.ts
function asyncCssPlugin() {
  return {
    name: "vite-async-css",
    enforce: "post",
    apply: "build",
    transformIndexHtml(html) {
      const cssLinkRegex = /<link\s+([^>]*?)rel=["']stylesheet["']([^>]*?)href=["']([^"']+\.css)["']([^>]*?)\s*\/?\s*>/gi;
      const noscriptFallbacks = [];
      const transformed = html.replace(
        cssLinkRegex,
        (_match, before, mid, href, after) => {
          noscriptFallbacks.push(
            `<link rel="stylesheet" ${before}${mid}href="${href}"${after} />`
          );
          return `<link rel="stylesheet" ${before}${mid}href="${href}"${after} media="print" onload="this.media='all'" />`;
        }
      );
      if (noscriptFallbacks.length > 0) {
        const noscriptBlock = `<noscript>${noscriptFallbacks.join("")}</noscript>`;
        return transformed.replace("</head>", `${noscriptBlock}
</head>`);
      }
      return transformed;
    }
  };
}

// vite.config.ts
var __vite_injected_original_dirname = "C:\\Users\\suat-\\Documents\\trae_projects\\meettransfer";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080
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
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // 5 MB limit
          cleanupOutdatedCaches: true,
          // Merge our push-notification handlers into the SAME SW scope
          importScripts: ["sw-push.js"],
          // Activate new SW immediately (prevents users getting stuck on an old cached app shell)
          skipWaiting: true,
          clientsClaim: true,
          // Navigation preload can produce "navigation preload was cancelled" warnings
          // when the SW doesn't explicitly consume preload responses (Workbox internal behavior).
          // Disable for a clean, stable production console.
          navigationPreload: false,
          // CRITICAL (iOS PWA OAuth): allow ALL OAuth broker endpoints to hit the network.
          // If the Service Worker serves index.html for /~oauth/*, the app router shows 404
          // and the OAuth flow never actually starts.
          navigateFallbackDenylist: [
            /^\/~oauth\/.*/,
            // Lovable managed OAuth broker paths (e.g. /~oauth/initiate)
            /^\/oauth\/.*/,
            // Standard OAuth callback paths
            /^\/auth\/v1\/.*/
            // Supabase auth API paths (if ever hit directly)
          ],
          runtimeCaching: [
            // ============================================
            // STATIC ASSETS - CacheFirst (immutable content)
            // ============================================
            // Google Fonts CSS - CacheFirst (1 year)
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                  // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Google Fonts Files - CacheFirst (1 year)
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "gstatic-fonts-cache",
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                  // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Local static JS/CSS bundles - CacheFirst (hashed filenames)
            {
              urlPattern: /\/assets\/.*\.(?:js|css)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "static-assets-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                  // 1 year (hashed files)
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Supabase Storage - CacheFirst for static assets
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "supabase-storage-cache",
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                  // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Mapbox tiles and assets - CacheFirst
            {
              urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "mapbox-cache",
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 7
                  // 7 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // ============================================
            // IMAGES - StaleWhileRevalidate (fast + fresh)
            // ============================================
            // Local images - StaleWhileRevalidate
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "images-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                  // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // External images (Unsplash, etc) - StaleWhileRevalidate
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "external-images-cache",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7
                  // 7 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // ============================================
            // STATIC READ-ONLY DATA - Short cache (price lists, destinations)
            // ============================================
            // Supabase Edge Functions (cacheable static data only)
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/(get-google-reviews|get-destinations)/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "supabase-static-cache",
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 30
                  // 30 minutes for static content
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Supabase REST API (truly static tables) - Short cache
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(google_reviews_cache)/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "supabase-reviews-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 15
                  // 15 minutes
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // ============================================
            // DYNAMIC/CRITICAL API - NetworkOnly (always fresh)
            // ============================================
            // Price-related endpoints - NEVER cache (prices change frequently)
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/(get-all-vehicle-prices|get-exchange-rate|calculate-price|get-price)/i,
              handler: "NetworkOnly"
            },
            // Price tables - NEVER cache
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(hourly_rental_prices|region_prices|intercity_prices|price_thresholds)/i,
              handler: "NetworkOnly"
            },
            // Reservations and bookings - NEVER cache
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(reservations|quick_booking_requests|bookings)/i,
              handler: "NetworkOnly"
            },
            // User/customer data - NEVER cache  
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(profiles|user_roles|agencies|drivers)/i,
              handler: "NetworkOnly"
            },
            // Promo codes - NEVER cache (validity changes)
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(promo_codes)/i,
              handler: "NetworkOnly"
            },
            // AI/Chat endpoints - NEVER cache
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/(ai-chat|whatsapp|send-|create-|confirm-|track-)/i,
              handler: "NetworkOnly"
            },
            // ============================================
            // FALLBACK - Other Supabase calls with very short cache
            // ============================================
            // Supabase REST API (other tables) - NetworkFirst with 1 min cache
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-rest-fallback",
                networkTimeoutSeconds: 2,
                // Fast timeout
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60
                  // 1 minute only
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Other Edge Functions - NetworkFirst with 2 min cache
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-edge-fallback",
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 2
                  // 2 minutes
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // ============================================
            // NEVER CACHE - NetworkOnly
            // ============================================
            // Supabase Auth - Never cache
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
              handler: "NetworkOnly"
            },
            // Supabase Realtime - Never cache
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/realtime\/.*/i,
              handler: "NetworkOnly"
            },
            // Google Analytics - Never cache
            {
              urlPattern: /^https:\/\/www\.google-analytics\.com\/.*/i,
              handler: "NetworkOnly"
            },
            {
              urlPattern: /^https:\/\/www\.googletagmanager\.com\/.*/i,
              handler: "NetworkOnly"
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
        template: "treemap"
        // treemap, sunburst, network
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path2.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    // Vercel: VITE_GEMINI_API_KEY zorla enjekte edilir
    define: {
      "import.meta.env.VITE_GEMINI_API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY)
    },
    envPrefix: "VITE_",
    build: {
      rollupOptions: {
        output: {
          // Manual chunks for better code splitting
          manualChunks: (id) => {
            if (id.includes("/src/contexts/i18n/") || id.includes("\\src\\contexts\\i18n\\")) {
              const match = id.match(/[\\/]i18n[\\/](\w+)\.ts$/i);
              if (match?.[1]) {
                return `translations-${match[1].toLowerCase()}`;
              }
              return "translations-main";
            }
            if (id.includes("/src/contexts/LanguageContext.tsx") || id.includes("\\src\\contexts\\LanguageContext.tsx")) {
              return "translations-runtime";
            }
            if (id.includes("/src/contexts/BlogTranslations.tsx") || id.includes("\\src\\contexts\\BlogTranslations.tsx")) {
              return "translations-blog";
            }
            if (id.includes("node_modules/react-dom")) {
              return "vendor-react-dom";
            }
            if (id.includes("node_modules/react/") || id.includes("node_modules/scheduler")) {
              return "vendor-react";
            }
            if (id.includes("node_modules/react-router")) {
              return "vendor-router";
            }
            if (id.includes("@radix-ui/primitive") || id.includes("@radix-ui/react-primitive") || id.includes("@radix-ui/react-slot") || id.includes("@radix-ui/react-compose-refs") || id.includes("@radix-ui/react-context") || id.includes("@radix-ui/react-id") || id.includes("@radix-ui/react-use-") || id.includes("@radix-ui/react-collection") || id.includes("@radix-ui/react-direction") || id.includes("@radix-ui/react-presence") || id.includes("@radix-ui/react-portal") || id.includes("@radix-ui/react-focus-scope") || id.includes("@radix-ui/react-focus-guards") || id.includes("@radix-ui/react-dismissable-layer") || id.includes("@radix-ui/react-roving-focus") || id.includes("@radix-ui/react-popper") || id.includes("@radix-ui/react-visually-hidden") || id.includes("@radix-ui/react-arrow") || id.includes("@radix-ui/number") || id.includes("@radix-ui/rect")) {
              return "vendor-radix-base";
            }
            if (id.includes("@radix-ui/")) {
              return "vendor-radix-components";
            }
            if (id.includes("react-hook-form") || id.includes("@hookform/resolvers") || id.includes("node_modules/zod")) {
              return "vendor-forms";
            }
            if (id.includes("@tanstack/react-query")) {
              return "vendor-query";
            }
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }
            if (id.includes("@supabase/")) {
              return "vendor-supabase";
            }
            if (id.includes("date-fns") || id.includes("react-day-picker")) {
              return "vendor-date";
            }
            if (id.includes("jspdf")) {
              return "vendor-pdf";
            }
            if (id.includes("node_modules/exceljs")) {
              return "vendor-excel";
            }
            if (id.includes("react-markdown") || id.includes("remark-gfm")) {
              return "vendor-markdown";
            }
            if (id.includes("embla-carousel")) {
              return "vendor-carousel";
            }
            if (id.includes("mapbox-gl")) {
              return "vendor-map";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("clsx") || id.includes("tailwind-merge") || id.includes("class-variance-authority")) {
              return "vendor-utils";
            }
          },
          // Isolate large app chunks for better caching
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.name?.startsWith("translations-")) {
              return "assets/[name]-[hash].js";
            }
            return "assets/[name]-[hash].js";
          }
        }
      },
      // Optimize module preloading - don't preload heavy vendor chunks
      modulePreload: {
        resolveDependencies: (filename, deps, { hostId, hostType }) => {
          return deps.filter((dep) => {
            if (dep.includes("vendor-radix-components") || dep.includes("vendor-motion") || dep.includes("vendor-map") || dep.includes("vendor-pdf") || dep.includes("vendor-excel") || dep.includes("vendor-markdown") || dep.includes("vendor-carousel") || dep.includes("vendor-forms") || dep.includes("vendor-date") || dep.includes("vendor-supabase") || dep.includes("translations-")) {
              return false;
            }
            return true;
          });
        }
      },
      // Bundles are intentionally split into large optional feature chunks.
      // Raise warning threshold to reduce noise after manual chunking.
      chunkSizeWarningLimit: 1e3,
      // Enable source maps for production debugging
      sourcemap: false,
      // Minification - use esbuild to avoid rare terser minification edge-cases
      // that can break vendor chunks on some devices/browsers.
      minify: "esbuild",
      esbuild: {
        // Drop debugger only; keep console.warn/error for production diagnostics (e.g. VITE_GEMINI_API_KEY)
        drop: ["debugger"]
      },
      // Target modern browsers
      target: "es2020",
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Enable CSS minification (uses esbuild by default in Vite 5+)
      cssMinify: "esbuild",
      // Reduce asset inline limit for better caching
      assetsInlineLimit: 2048
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic2NyaXB0cy92aXRlLXZlcnNpb24tcGx1Z2luLnRzIiwgInNjcmlwdHMvdml0ZS1hc3luYy1jc3MtcGx1Z2luLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc3VhdC1cXFxcRG9jdW1lbnRzXFxcXHRyYWVfcHJvamVjdHNcXFxcbWVldHRyYW5zZmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzdWF0LVxcXFxEb2N1bWVudHNcXFxcdHJhZV9wcm9qZWN0c1xcXFxtZWV0dHJhbnNmZXJcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3N1YXQtL0RvY3VtZW50cy90cmFlX3Byb2plY3RzL21lZXR0cmFuc2Zlci92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gXCJsb3ZhYmxlLXRhZ2dlclwiO1xyXG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSBcInZpdGUtcGx1Z2luLXB3YVwiO1xyXG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSBcInJvbGx1cC1wbHVnaW4tdmlzdWFsaXplclwiO1xyXG5pbXBvcnQgeyB2aXRlVmVyc2lvblBsdWdpbiB9IGZyb20gXCIuL3NjcmlwdHMvdml0ZS12ZXJzaW9uLXBsdWdpblwiO1xyXG5pbXBvcnQgeyBhc3luY0Nzc1BsdWdpbiB9IGZyb20gXCIuL3NjcmlwdHMvdml0ZS1hc3luYy1jc3MtcGx1Z2luXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgLy8gTG9hZCBlbnYgZmlsZSBiYXNlZCBvbiBgbW9kZWAgaW4gdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkuXHJcbiAgLy8gU2V0IHRoZSB0aGlyZCBwYXJhbWV0ZXIgdG8gJycgdG8gbG9hZCBhbGwgZW52IHJlZ2FyZGxlc3Mgb2YgdGhlIGBWSVRFX2AgcHJlZml4LlxyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIGhvc3Q6IFwiOjpcIixcclxuICAgICAgcG9ydDogODA4MCxcclxuICAgIH0sXHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIHJlYWN0KCksXHJcbiAgICAgIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKSxcclxuICAgICAgbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCIgJiYgdml0ZVZlcnNpb25QbHVnaW4oKSxcclxuICAgICAgbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCIgJiYgYXN5bmNDc3NQbHVnaW4oKSxcclxuICAgICAgVml0ZVBXQSh7XHJcbiAgICAgICAgLy8gQXV0by11cGRhdGU6IGtlZXAgdXNlcnMgb24gdGhlIGxhdGVzdCBwdWJsaXNoZWQgdmVyc2lvbiAobm8gbWFudWFsIHByb21wdCkuXHJcbiAgICAgICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIixcclxuICAgICAgICBpbmplY3RSZWdpc3RlcjogbnVsbCxcclxuICAgICAgICAvLyBFbmFibGUgU1cgaW4gZGV2IGJ1aWxkcyBmb3IgL2RlYnVnIHBhZ2UgdG8gYWNjdXJhdGVseSBzaG93IFNXIHN0YXR1cy5cclxuICAgICAgICBkZXZPcHRpb25zOiB7IGVuYWJsZWQ6IG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiwgdHlwZTogXCJtb2R1bGVcIiB9LFxyXG4gICAgICAgIGluY2x1ZGVBc3NldHM6IFtcImZhdmljb24uaWNvXCIsIFwiYXBwbGUtdG91Y2gtaWNvbi5wbmdcIiwgXCJyb2JvdHMudHh0XCIsIFwic2l0ZW1hcC54bWxcIl0sXHJcbiAgICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICAgIGlkOiBcIi9cIixcclxuICAgICAgICAgIG5hbWU6IFwiTWVldCBUcmFuc2ZlciAtIFByZW1pdW0gQWlycG9ydCBUcmFuc2ZlcnNcIixcclxuICAgICAgICAgIHNob3J0X25hbWU6IFwiTWVldCBUcmFuc2ZlclwiLFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246IFwiTHV4dXJ5IGFpcnBvcnQgdHJhbnNmZXIgYW5kIGNoYXVmZmV1ciBzZXJ2aWNlIGFjcm9zcyBUdXJrZXkuIFByb2Zlc3Npb25hbCBkcml2ZXJzLCBwcmVtaXVtIGZsZWV0LCAyNC83IGF2YWlsYWJpbGl0eS5cIixcclxuICAgICAgICAgIGxhbmc6IFwiZW5cIixcclxuICAgICAgICAgIGRpcjogXCJsdHJcIixcclxuICAgICAgICAgIHRoZW1lX2NvbG9yOiBcIiMxMTExMTFcIixcclxuICAgICAgICAgIGJhY2tncm91bmRfY29sb3I6IFwiIzExMTExMVwiLFxyXG4gICAgICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXHJcbiAgICAgICAgICBvcmllbnRhdGlvbjogXCJwb3J0cmFpdFwiLFxyXG4gICAgICAgICAgc2NvcGU6IFwiL1wiLFxyXG4gICAgICAgICAgc3RhcnRfdXJsOiBcIi8/c291cmNlPXB3YVwiLFxyXG4gICAgICAgICAgY2F0ZWdvcmllczogW1widHJhdmVsXCIsIFwidHJhbnNwb3J0YXRpb25cIiwgXCJsaWZlc3R5bGVcIl0sXHJcbiAgICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcIi9mYXZpY29uLmljb1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjQ4eDQ4XCIsXHJcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS94LWljb25cIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcIi9wd2EtMTkyeDE5Mi5wbmdcIixcclxuICAgICAgICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXHJcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICAgICAgICBwdXJwb3NlOiBcImFueVwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6IFwiL3B3YS01MTJ4NTEyLnBuZ1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICAgIHB1cnBvc2U6IFwiYW55XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNyYzogXCIvcHdhLW1hc2thYmxlLTE5MngxOTIucG5nXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxyXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAgICAgICAgICAgcHVycG9zZTogXCJtYXNrYWJsZVwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzcmM6IFwiL3B3YS1tYXNrYWJsZS01MTJ4NTEyLnBuZ1wiLFxyXG4gICAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICAgIHB1cnBvc2U6IFwibWFza2FibGVcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgc2hvcnRjdXRzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBuYW1lOiBcIkJvb2sgVHJhbnNmZXJcIixcclxuICAgICAgICAgICAgICBzaG9ydF9uYW1lOiBcIkJvb2tcIixcclxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJCb29rIGEgbmV3IGFpcnBvcnQgdHJhbnNmZXJcIixcclxuICAgICAgICAgICAgICB1cmw6IFwiL3doYXRzYXBwLWJvb2tpbmc/c291cmNlPXB3YVwiLFxyXG4gICAgICAgICAgICAgIGljb25zOiBbeyBzcmM6IFwiL3B3YS0xOTJ4MTkyLnBuZ1wiLCBzaXplczogXCIxOTJ4MTkyXCIgfV1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIG5hbWU6IFwiTXkgQm9va2luZ3NcIixcclxuICAgICAgICAgICAgICBzaG9ydF9uYW1lOiBcIkJvb2tpbmdzXCIsXHJcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVmlldyB5b3VyIHJlc2VydmF0aW9uc1wiLFxyXG4gICAgICAgICAgICAgIHVybDogXCIvY3VzdG9tZXI/c291cmNlPXB3YVwiLFxyXG4gICAgICAgICAgICAgIGljb25zOiBbeyBzcmM6IFwiL3B3YS0xOTJ4MTkyLnBuZ1wiLCBzaXplczogXCIxOTJ4MTkyXCIgfV1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIG5hbWU6IFwiQ29udGFjdCBVc1wiLFxyXG4gICAgICAgICAgICAgIHNob3J0X25hbWU6IFwiQ29udGFjdFwiLFxyXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBpbiB0b3VjaCB3aXRoIHVzXCIsXHJcbiAgICAgICAgICAgICAgdXJsOiBcIi9jb250YWN0P3NvdXJjZT1wd2FcIixcclxuICAgICAgICAgICAgICBpY29uczogW3sgc3JjOiBcIi9wd2EtMTkyeDE5Mi5wbmdcIiwgc2l6ZXM6IFwiMTkyeDE5MlwiIH1dXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICBzY3JlZW5zaG90czogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3JjOiBcIi9zY3JlZW5zaG90LXdpZGUucG5nXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiMTI4MHg3MjBcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICAgIGZvcm1fZmFjdG9yOiBcIndpZGVcIixcclxuICAgICAgICAgICAgICBsYWJlbDogXCJNZWV0IFRyYW5zZmVyIEhvbWVwYWdlXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHNyYzogXCIvc2NyZWVuc2hvdC1uYXJyb3cucG5nXCIsXHJcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiNzIweDEyODBcIixcclxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICAgIGZvcm1fZmFjdG9yOiBcIm5hcnJvd1wiLFxyXG4gICAgICAgICAgICAgIGxhYmVsOiBcIk1lZXQgVHJhbnNmZXIgTW9iaWxlIFZpZXdcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICB3b3JrYm94OiB7XHJcbiAgICAgICAgICBnbG9iUGF0dGVybnM6IFtcIioqLyoue2pzLGNzcyxodG1sLGljbyxzdmcsd29mZix3b2ZmMn1cIl0sXHJcbiAgICAgICAgICBtYXhpbXVtRmlsZVNpemVUb0NhY2hlSW5CeXRlczogNSAqIDEwMjQgKiAxMDI0LCAvLyA1IE1CIGxpbWl0XHJcbiAgICAgICAgICBjbGVhbnVwT3V0ZGF0ZWRDYWNoZXM6IHRydWUsXHJcbiAgICAgICAgICAvLyBNZXJnZSBvdXIgcHVzaC1ub3RpZmljYXRpb24gaGFuZGxlcnMgaW50byB0aGUgU0FNRSBTVyBzY29wZVxyXG4gICAgICAgICAgaW1wb3J0U2NyaXB0czogW1wic3ctcHVzaC5qc1wiXSxcclxuICAgICAgICAgIC8vIEFjdGl2YXRlIG5ldyBTVyBpbW1lZGlhdGVseSAocHJldmVudHMgdXNlcnMgZ2V0dGluZyBzdHVjayBvbiBhbiBvbGQgY2FjaGVkIGFwcCBzaGVsbClcclxuICAgICAgICAgIHNraXBXYWl0aW5nOiB0cnVlLFxyXG4gICAgICAgICAgY2xpZW50c0NsYWltOiB0cnVlLFxyXG4gICAgICAgICAgLy8gTmF2aWdhdGlvbiBwcmVsb2FkIGNhbiBwcm9kdWNlIFwibmF2aWdhdGlvbiBwcmVsb2FkIHdhcyBjYW5jZWxsZWRcIiB3YXJuaW5nc1xyXG4gICAgICAgICAgLy8gd2hlbiB0aGUgU1cgZG9lc24ndCBleHBsaWNpdGx5IGNvbnN1bWUgcHJlbG9hZCByZXNwb25zZXMgKFdvcmtib3ggaW50ZXJuYWwgYmVoYXZpb3IpLlxyXG4gICAgICAgICAgLy8gRGlzYWJsZSBmb3IgYSBjbGVhbiwgc3RhYmxlIHByb2R1Y3Rpb24gY29uc29sZS5cclxuICAgICAgICAgIG5hdmlnYXRpb25QcmVsb2FkOiBmYWxzZSxcclxuXHJcbiAgICAgICAgICAgLy8gQ1JJVElDQUwgKGlPUyBQV0EgT0F1dGgpOiBhbGxvdyBBTEwgT0F1dGggYnJva2VyIGVuZHBvaW50cyB0byBoaXQgdGhlIG5ldHdvcmsuXHJcbiAgICAgICAgICAgLy8gSWYgdGhlIFNlcnZpY2UgV29ya2VyIHNlcnZlcyBpbmRleC5odG1sIGZvciAvfm9hdXRoLyosIHRoZSBhcHAgcm91dGVyIHNob3dzIDQwNFxyXG4gICAgICAgICAgIC8vIGFuZCB0aGUgT0F1dGggZmxvdyBuZXZlciBhY3R1YWxseSBzdGFydHMuXHJcbiAgICAgICAgICAgbmF2aWdhdGVGYWxsYmFja0RlbnlsaXN0OiBbXHJcbiAgICAgICAgICAgICAvXlxcL35vYXV0aFxcLy4qLywgICAvLyBMb3ZhYmxlIG1hbmFnZWQgT0F1dGggYnJva2VyIHBhdGhzIChlLmcuIC9+b2F1dGgvaW5pdGlhdGUpXHJcbiAgICAgICAgICAgICAvXlxcL29hdXRoXFwvLiovLCAgICAvLyBTdGFuZGFyZCBPQXV0aCBjYWxsYmFjayBwYXRoc1xyXG4gICAgICAgICAgICAgL15cXC9hdXRoXFwvdjFcXC8uKi8gIC8vIFN1cGFiYXNlIGF1dGggQVBJIHBhdGhzIChpZiBldmVyIGhpdCBkaXJlY3RseSlcclxuICAgICAgICAgICBdLFxyXG4gICAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcclxuICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgICAgLy8gU1RBVElDIEFTU0VUUyAtIENhY2hlRmlyc3QgKGltbXV0YWJsZSBjb250ZW50KVxyXG4gICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gR29vZ2xlIEZvbnRzIENTUyAtIENhY2hlRmlyc3QgKDEgeWVhcilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvZm9udHNcXC5nb29nbGVhcGlzXFwuY29tXFwvLiovaSxcclxuICAgICAgICAgICAgICBoYW5kbGVyOiBcIkNhY2hlRmlyc3RcIixcclxuICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwiZ29vZ2xlLWZvbnRzLWNhY2hlXCIsXHJcbiAgICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDEwLFxyXG4gICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzNjUgLy8gMSB5ZWFyXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcclxuICAgICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBHb29nbGUgRm9udHMgRmlsZXMgLSBDYWNoZUZpcnN0ICgxIHllYXIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2ZvbnRzXFwuZ3N0YXRpY1xcLmNvbVxcLy4qL2ksXHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXHJcbiAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcImdzdGF0aWMtZm9udHMtY2FjaGVcIixcclxuICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogMjAsXHJcbiAgICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDM2NSAvLyAxIHllYXJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZToge1xyXG4gICAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIExvY2FsIHN0YXRpYyBKUy9DU1MgYnVuZGxlcyAtIENhY2hlRmlyc3QgKGhhc2hlZCBmaWxlbmFtZXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXFwvYXNzZXRzXFwvLipcXC4oPzpqc3xjc3MpJC8sXHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXHJcbiAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcInN0YXRpYy1hc3NldHMtY2FjaGVcIixcclxuICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogMTAwLFxyXG4gICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzNjUgLy8gMSB5ZWFyIChoYXNoZWQgZmlsZXMpXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcclxuICAgICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBTdXBhYmFzZSBTdG9yYWdlIC0gQ2FjaGVGaXJzdCBmb3Igc3RhdGljIGFzc2V0c1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC8uKlxcLnN1cGFiYXNlXFwuY29cXC9zdG9yYWdlXFwvdjFcXC9vYmplY3RcXC9wdWJsaWNcXC8uKi9pLFxyXG4gICAgICAgICAgICAgIGhhbmRsZXI6IFwiQ2FjaGVGaXJzdFwiLFxyXG4gICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJzdXBhYmFzZS1zdG9yYWdlLWNhY2hlXCIsXHJcbiAgICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDIwMCxcclxuICAgICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzAgLy8gMzAgZGF5c1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XHJcbiAgICAgICAgICAgICAgICAgIHN0YXR1c2VzOiBbMCwgMjAwXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gTWFwYm94IHRpbGVzIGFuZCBhc3NldHMgLSBDYWNoZUZpcnN0XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2FwaVxcLm1hcGJveFxcLmNvbVxcLy4qL2ksXHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXHJcbiAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcIm1hcGJveC1jYWNoZVwiLFxyXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiA1MDAsXHJcbiAgICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDcgLy8gNyBkYXlzXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcclxuICAgICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgICAgLy8gSU1BR0VTIC0gU3RhbGVXaGlsZVJldmFsaWRhdGUgKGZhc3QgKyBmcmVzaClcclxuICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIExvY2FsIGltYWdlcyAtIFN0YWxlV2hpbGVSZXZhbGlkYXRlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXFwuKD86cG5nfGpwZ3xqcGVnfHN2Z3xnaWZ8d2VicHxhdmlmfGljbykkL2ksXHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJTdGFsZVdoaWxlUmV2YWxpZGF0ZVwiLFxyXG4gICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJpbWFnZXMtY2FjaGVcIixcclxuICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogMTAwLFxyXG4gICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzMCAvLyAzMCBkYXlzXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcclxuICAgICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBFeHRlcm5hbCBpbWFnZXMgKFVuc3BsYXNoLCBldGMpIC0gU3RhbGVXaGlsZVJldmFsaWRhdGVcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvaW1hZ2VzXFwudW5zcGxhc2hcXC5jb21cXC8uKi9pLFxyXG4gICAgICAgICAgICAgIGhhbmRsZXI6IFwiU3RhbGVXaGlsZVJldmFsaWRhdGVcIixcclxuICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwiZXh0ZXJuYWwtaW1hZ2VzLWNhY2hlXCIsXHJcbiAgICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDUwLFxyXG4gICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiA3IC8vIDcgZGF5c1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XHJcbiAgICAgICAgICAgICAgICAgIHN0YXR1c2VzOiBbMCwgMjAwXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAgIC8vIFNUQVRJQyBSRUFELU9OTFkgREFUQSAtIFNob3J0IGNhY2hlIChwcmljZSBsaXN0cywgZGVzdGluYXRpb25zKVxyXG4gICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gU3VwYWJhc2UgRWRnZSBGdW5jdGlvbnMgKGNhY2hlYWJsZSBzdGF0aWMgZGF0YSBvbmx5KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC8uKlxcLnN1cGFiYXNlXFwuY29cXC9mdW5jdGlvbnNcXC92MVxcLyhnZXQtZ29vZ2xlLXJldmlld3N8Z2V0LWRlc3RpbmF0aW9ucykvaSxcclxuICAgICAgICAgICAgICBoYW5kbGVyOiBcIlN0YWxlV2hpbGVSZXZhbGlkYXRlXCIsXHJcbiAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcInN1cGFiYXNlLXN0YXRpYy1jYWNoZVwiLFxyXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAyMCxcclxuICAgICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiAzMCAvLyAzMCBtaW51dGVzIGZvciBzdGF0aWMgY29udGVudFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XHJcbiAgICAgICAgICAgICAgICAgIHN0YXR1c2VzOiBbMCwgMjAwXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gU3VwYWJhc2UgUkVTVCBBUEkgKHRydWx5IHN0YXRpYyB0YWJsZXMpIC0gU2hvcnQgY2FjaGVcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvLipcXC5zdXBhYmFzZVxcLmNvXFwvcmVzdFxcL3YxXFwvKGdvb2dsZV9yZXZpZXdzX2NhY2hlKS9pLFxyXG4gICAgICAgICAgICAgIGhhbmRsZXI6IFwiU3RhbGVXaGlsZVJldmFsaWRhdGVcIixcclxuICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwic3VwYWJhc2UtcmV2aWV3cy1jYWNoZVwiLFxyXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAxMCxcclxuICAgICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiAxNSAvLyAxNSBtaW51dGVzXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcclxuICAgICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAgICAgLy8gRFlOQU1JQy9DUklUSUNBTCBBUEkgLSBOZXR3b3JrT25seSAoYWx3YXlzIGZyZXNoKVxyXG4gICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gUHJpY2UtcmVsYXRlZCBlbmRwb2ludHMgLSBORVZFUiBjYWNoZSAocHJpY2VzIGNoYW5nZSBmcmVxdWVudGx5KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC8uKlxcLnN1cGFiYXNlXFwuY29cXC9mdW5jdGlvbnNcXC92MVxcLyhnZXQtYWxsLXZlaGljbGUtcHJpY2VzfGdldC1leGNoYW5nZS1yYXRlfGNhbGN1bGF0ZS1wcmljZXxnZXQtcHJpY2UpL2ksXHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJOZXR3b3JrT25seVwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIFByaWNlIHRhYmxlcyAtIE5FVkVSIGNhY2hlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcLy4qXFwuc3VwYWJhc2VcXC5jb1xcL3Jlc3RcXC92MVxcLyhob3VybHlfcmVudGFsX3ByaWNlc3xyZWdpb25fcHJpY2VzfGludGVyY2l0eV9wcmljZXN8cHJpY2VfdGhyZXNob2xkcykvaSxcclxuICAgICAgICAgICAgICBoYW5kbGVyOiBcIk5ldHdvcmtPbmx5XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gUmVzZXJ2YXRpb25zIGFuZCBib29raW5ncyAtIE5FVkVSIGNhY2hlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcLy4qXFwuc3VwYWJhc2VcXC5jb1xcL3Jlc3RcXC92MVxcLyhyZXNlcnZhdGlvbnN8cXVpY2tfYm9va2luZ19yZXF1ZXN0c3xib29raW5ncykvaSxcclxuICAgICAgICAgICAgICBoYW5kbGVyOiBcIk5ldHdvcmtPbmx5XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gVXNlci9jdXN0b21lciBkYXRhIC0gTkVWRVIgY2FjaGUgIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC8uKlxcLnN1cGFiYXNlXFwuY29cXC9yZXN0XFwvdjFcXC8ocHJvZmlsZXN8dXNlcl9yb2xlc3xhZ2VuY2llc3xkcml2ZXJzKS9pLFxyXG4gICAgICAgICAgICAgIGhhbmRsZXI6IFwiTmV0d29ya09ubHlcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBQcm9tbyBjb2RlcyAtIE5FVkVSIGNhY2hlICh2YWxpZGl0eSBjaGFuZ2VzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC8uKlxcLnN1cGFiYXNlXFwuY29cXC9yZXN0XFwvdjFcXC8ocHJvbW9fY29kZXMpL2ksXHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJOZXR3b3JrT25seVwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIEFJL0NoYXQgZW5kcG9pbnRzIC0gTkVWRVIgY2FjaGVcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvLipcXC5zdXBhYmFzZVxcLmNvXFwvZnVuY3Rpb25zXFwvdjFcXC8oYWktY2hhdHx3aGF0c2FwcHxzZW5kLXxjcmVhdGUtfGNvbmZpcm0tfHRyYWNrLSkvaSxcclxuICAgICAgICAgICAgICBoYW5kbGVyOiBcIk5ldHdvcmtPbmx5XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAgIC8vIEZBTExCQUNLIC0gT3RoZXIgU3VwYWJhc2UgY2FsbHMgd2l0aCB2ZXJ5IHNob3J0IGNhY2hlXHJcbiAgICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBTdXBhYmFzZSBSRVNUIEFQSSAob3RoZXIgdGFibGVzKSAtIE5ldHdvcmtGaXJzdCB3aXRoIDEgbWluIGNhY2hlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcLy4qXFwuc3VwYWJhc2VcXC5jb1xcL3Jlc3RcXC92MVxcLy4qL2ksXHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJOZXR3b3JrRmlyc3RcIixcclxuICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwic3VwYWJhc2UtcmVzdC1mYWxsYmFja1wiLFxyXG4gICAgICAgICAgICAgICAgbmV0d29ya1RpbWVvdXRTZWNvbmRzOiAyLCAvLyBGYXN0IHRpbWVvdXRcclxuICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogNTAsXHJcbiAgICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwIC8vIDEgbWludXRlIG9ubHlcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZToge1xyXG4gICAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIE90aGVyIEVkZ2UgRnVuY3Rpb25zIC0gTmV0d29ya0ZpcnN0IHdpdGggMiBtaW4gY2FjaGVcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvLipcXC5zdXBhYmFzZVxcLmNvXFwvZnVuY3Rpb25zXFwvdjFcXC8uKi9pLFxyXG4gICAgICAgICAgICAgIGhhbmRsZXI6IFwiTmV0d29ya0ZpcnN0XCIsXHJcbiAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcInN1cGFiYXNlLWVkZ2UtZmFsbGJhY2tcIixcclxuICAgICAgICAgICAgICAgIG5ldHdvcmtUaW1lb3V0U2Vjb25kczogMyxcclxuICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogMzAsXHJcbiAgICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogMiAvLyAyIG1pbnV0ZXNcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZToge1xyXG4gICAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICAgICAvLyBORVZFUiBDQUNIRSAtIE5ldHdvcmtPbmx5XHJcbiAgICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBTdXBhYmFzZSBBdXRoIC0gTmV2ZXIgY2FjaGVcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvLipcXC5zdXBhYmFzZVxcLmNvXFwvYXV0aFxcLy4qL2ksXHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJOZXR3b3JrT25seVwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIFN1cGFiYXNlIFJlYWx0aW1lIC0gTmV2ZXIgY2FjaGVcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvLipcXC5zdXBhYmFzZVxcLmNvXFwvcmVhbHRpbWVcXC8uKi9pLFxyXG4gICAgICAgICAgICAgIGhhbmRsZXI6IFwiTmV0d29ya09ubHlcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBHb29nbGUgQW5hbHl0aWNzIC0gTmV2ZXIgY2FjaGVcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvd3d3XFwuZ29vZ2xlLWFuYWx5dGljc1xcLmNvbVxcLy4qL2ksXHJcbiAgICAgICAgICAgICAgaGFuZGxlcjogXCJOZXR3b3JrT25seVwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL3d3d1xcLmdvb2dsZXRhZ21hbmFnZXJcXC5jb21cXC8uKi9pLFxyXG4gICAgICAgICAgICAgIGhhbmRsZXI6IFwiTmV0d29ya09ubHlcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgICB9KSxcclxuICAgICAgLy8gQnVuZGxlIGFuYWx5emVyIC0gZ2VuZXJhdGVzIHN0YXRzLmh0bWwgaW4gcHJvamVjdCByb290XHJcbiAgICAgIG1vZGUgPT09IFwicHJvZHVjdGlvblwiICYmIHZpc3VhbGl6ZXIoe1xyXG4gICAgICAgIGZpbGVuYW1lOiBcInN0YXRzLmh0bWxcIixcclxuICAgICAgICBvcGVuOiBmYWxzZSxcclxuICAgICAgICBnemlwU2l6ZTogdHJ1ZSxcclxuICAgICAgICBicm90bGlTaXplOiB0cnVlLFxyXG4gICAgICAgIHRlbXBsYXRlOiBcInRyZWVtYXBcIiwgLy8gdHJlZW1hcCwgc3VuYnVyc3QsIG5ldHdvcmtcclxuICAgICAgfSlcclxuICAgIF0uZmlsdGVyKEJvb2xlYW4pLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIC8vIFZlcmNlbDogVklURV9HRU1JTklfQVBJX0tFWSB6b3JsYSBlbmpla3RlIGVkaWxpclxyXG4gICAgZGVmaW5lOiB7XHJcbiAgICAgIFwiaW1wb3J0Lm1ldGEuZW52LlZJVEVfR0VNSU5JX0FQSV9LRVlcIjogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfR0VNSU5JX0FQSV9LRVkpLFxyXG4gICAgfSxcclxuICAgIGVudlByZWZpeDogXCJWSVRFX1wiLFxyXG4gICAgYnVpbGQ6IHtcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgLy8gTWFudWFsIGNodW5rcyBmb3IgYmV0dGVyIGNvZGUgc3BsaXR0aW5nXHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiAoaWQpID0+IHtcclxuICAgICAgICAgIC8vIFNwbGl0IGkxOG4gZGljdGlvbmFyaWVzIGJ5IGxvY2FsZSAtIHRoaXMgd2FzIHRoZSBsYXJnZXN0IG1haW4gY2h1bmsgY29udHJpYnV0b3IuXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy9zcmMvY29udGV4dHMvaTE4bi8nKSB8fCBpZC5pbmNsdWRlcygnXFxcXHNyY1xcXFxjb250ZXh0c1xcXFxpMThuXFxcXCcpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gaWQubWF0Y2goL1tcXFxcL11pMThuW1xcXFwvXShcXHcrKVxcLnRzJC9pKTtcclxuICAgICAgICAgICAgaWYgKG1hdGNoPy5bMV0pIHtcclxuICAgICAgICAgICAgICByZXR1cm4gYHRyYW5zbGF0aW9ucy0ke21hdGNoWzFdLnRvTG93ZXJDYXNlKCl9YDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0aW9ucy1tYWluJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIEtlZXAgbGFuZ3VhZ2UgcnVudGltZSBzZXBhcmF0ZSBmcm9tIGFwcCBlbnRyeS5cclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3NyYy9jb250ZXh0cy9MYW5ndWFnZUNvbnRleHQudHN4JykgfHwgaWQuaW5jbHVkZXMoJ1xcXFxzcmNcXFxcY29udGV4dHNcXFxcTGFuZ3VhZ2VDb250ZXh0LnRzeCcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRpb25zLXJ1bnRpbWUnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCcvc3JjL2NvbnRleHRzL0Jsb2dUcmFuc2xhdGlvbnMudHN4JykgfHwgaWQuaW5jbHVkZXMoJ1xcXFxzcmNcXFxcY29udGV4dHNcXFxcQmxvZ1RyYW5zbGF0aW9ucy50c3gnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0aW9ucy1ibG9nJztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDb3JlIFJlYWN0IC0gc21hbGxlc3QgcG9zc2libGUgaW5pdGlhbCBjaHVua1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMvcmVhY3QtZG9tJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItcmVhY3QtZG9tJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzL3JlYWN0LycpIHx8IGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMvc2NoZWR1bGVyJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItcmVhY3QnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMvcmVhY3Qtcm91dGVyJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3Itcm91dGVyJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gUmFkaXggVUk6IFNwbGl0IGludG8gYmFzZSBwcmltaXRpdmVzIChsb2FkZWQgZmlyc3QpIGFuZCBjb21wb25lbnRzXHJcbiAgICAgICAgICAvLyBUaGlzIGF2b2lkcyBjaXJjdWxhciBkZXBlbmRlbmN5IGlzc3VlcyB3aGlsZSBrZWVwaW5nIGNodW5rcyBzbWFsbGVyXHJcbiAgICAgICAgICAvLyBCYXNlIHByaW1pdGl2ZXMgdGhhdCBBTEwgUmFkaXggY29tcG9uZW50cyBkZXBlbmQgb24gLSBNVVNUIGxvYWQgZmlyc3RcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHJhZGl4LXVpL3ByaW1pdGl2ZScpIHx8XHJcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC1wcmltaXRpdmUnKSB8fFxyXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdAcmFkaXgtdWkvcmVhY3Qtc2xvdCcpIHx8XHJcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC1jb21wb3NlLXJlZnMnKSB8fFxyXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdAcmFkaXgtdWkvcmVhY3QtY29udGV4dCcpIHx8XHJcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC1pZCcpIHx8XHJcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC11c2UtJykgfHxcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnQHJhZGl4LXVpL3JlYWN0LWNvbGxlY3Rpb24nKSB8fFxyXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdAcmFkaXgtdWkvcmVhY3QtZGlyZWN0aW9uJykgfHxcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnQHJhZGl4LXVpL3JlYWN0LXByZXNlbmNlJykgfHxcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnQHJhZGl4LXVpL3JlYWN0LXBvcnRhbCcpIHx8XHJcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC1mb2N1cy1zY29wZScpIHx8XHJcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC1mb2N1cy1ndWFyZHMnKSB8fFxyXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdAcmFkaXgtdWkvcmVhY3QtZGlzbWlzc2FibGUtbGF5ZXInKSB8fFxyXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdAcmFkaXgtdWkvcmVhY3Qtcm92aW5nLWZvY3VzJykgfHxcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnQHJhZGl4LXVpL3JlYWN0LXBvcHBlcicpIHx8XHJcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ0ByYWRpeC11aS9yZWFjdC12aXN1YWxseS1oaWRkZW4nKSB8fFxyXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdAcmFkaXgtdWkvcmVhY3QtYXJyb3cnKSB8fFxyXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdAcmFkaXgtdWkvbnVtYmVyJykgfHxcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnQHJhZGl4LXVpL3JlY3QnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1yYWRpeC1iYXNlJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIEhpZ2hlci1sZXZlbCBSYWRpeCBjb21wb25lbnRzIC0gY2FuIGxvYWQgYWZ0ZXIgYmFzZVxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAcmFkaXgtdWkvJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItcmFkaXgtY29tcG9uZW50cyc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIEZvcm1zICYgdmFsaWRhdGlvblxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdC1ob29rLWZvcm0nKSB8fCBpZC5pbmNsdWRlcygnQGhvb2tmb3JtL3Jlc29sdmVycycpIHx8IGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMvem9kJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItZm9ybXMnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBEYXRhIGZldGNoaW5nXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0B0YW5zdGFjay9yZWFjdC1xdWVyeScpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXF1ZXJ5JztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gQW5pbWF0aW9uIC0gaGVhdnksIGRlZmVyIGxvYWRpbmdcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZnJhbWVyLW1vdGlvbicpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yLW1vdGlvbic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIEJhY2tlbmRcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHN1cGFiYXNlLycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXN1cGFiYXNlJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gRGF0ZSBoYW5kbGluZ1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdkYXRlLWZucycpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kYXktcGlja2VyJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItZGF0ZSc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIEhlYXZ5IHV0aWxpdGllcyAtIG9ubHkgbG9hZGVkIHdoZW4gbmVlZGVkXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2pzcGRmJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItcGRmJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzL2V4Y2VsanMnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1leGNlbCc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0LW1hcmtkb3duJykgfHwgaWQuaW5jbHVkZXMoJ3JlbWFyay1nZm0nKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1tYXJrZG93bic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIENhcm91c2VsIC0gZGVmZXIgKGtlZXAgc21hbGwpXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2VtYmxhLWNhcm91c2VsJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItY2Fyb3VzZWwnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBNYXAgLSBoZWF2eSwgZGVmZXJcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbWFwYm94LWdsJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItbWFwJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gTHVjaWRlIGljb25zIC0gY29tbW9uIGFjcm9zcyBwYWdlc1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsdWNpZGUtcmVhY3QnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1pY29ucyc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIGNsc3gsIHRhaWx3aW5kLW1lcmdlLCBjbGFzcy12YXJpYW5jZS1hdXRob3JpdHkgLSB2ZXJ5IHNtYWxsLCBidXQgdXNlZCBldmVyeXdoZXJlXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2Nsc3gnKSB8fCBpZC5pbmNsdWRlcygndGFpbHdpbmQtbWVyZ2UnKSB8fCBpZC5pbmNsdWRlcygnY2xhc3MtdmFyaWFuY2UtYXV0aG9yaXR5JykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItdXRpbHMnO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gSXNvbGF0ZSBsYXJnZSBhcHAgY2h1bmtzIGZvciBiZXR0ZXIgY2FjaGluZ1xyXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAoY2h1bmtJbmZvKSA9PiB7XHJcbiAgICAgICAgICAvLyBLZWVwIGFsbCB0cmFuc2xhdGlvbiBjaHVua3MgZWFzeSB0byBjYWNoZS9pbnZhbGlkYXRlLlxyXG4gICAgICAgICAgaWYgKGNodW5rSW5mby5uYW1lPy5zdGFydHNXaXRoKCd0cmFuc2xhdGlvbnMtJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcyc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvLyBPcHRpbWl6ZSBtb2R1bGUgcHJlbG9hZGluZyAtIGRvbid0IHByZWxvYWQgaGVhdnkgdmVuZG9yIGNodW5rc1xyXG4gICAgbW9kdWxlUHJlbG9hZDoge1xyXG4gICAgICByZXNvbHZlRGVwZW5kZW5jaWVzOiAoZmlsZW5hbWU6IHN0cmluZywgZGVwczogc3RyaW5nW10sIHsgaG9zdElkLCBob3N0VHlwZSB9OiB7IGhvc3RJZDogc3RyaW5nOyBob3N0VHlwZTogJ2h0bWwnIHwgJ2pzJyB9KSA9PiB7XHJcbiAgICAgICAgLy8gRG9uJ3QgcHJlbG9hZCBoZWF2eS9kZWZlcnJlZCBjaHVua3NcclxuICAgICAgICByZXR1cm4gZGVwcy5maWx0ZXIoKGRlcDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAvLyBTa2lwIHByZWxvYWRpbmcgdGhlc2UgXHUyMDE0IHRoZXkncmUgbG9hZGVkIG9uIGRlbWFuZCBvciBub3QgbmVlZGVkIGZvciBmaXJzdCBwYWludFxyXG4gICAgICAgICAgaWYgKGRlcC5pbmNsdWRlcygndmVuZG9yLXJhZGl4LWNvbXBvbmVudHMnKSB8fFxyXG4gICAgICAgICAgICAgIGRlcC5pbmNsdWRlcygndmVuZG9yLW1vdGlvbicpIHx8XHJcbiAgICAgICAgICAgICAgZGVwLmluY2x1ZGVzKCd2ZW5kb3ItbWFwJykgfHxcclxuICAgICAgICAgICAgICBkZXAuaW5jbHVkZXMoJ3ZlbmRvci1wZGYnKSB8fFxyXG4gICAgICAgICAgICAgIGRlcC5pbmNsdWRlcygndmVuZG9yLWV4Y2VsJykgfHxcclxuICAgICAgICAgICAgICBkZXAuaW5jbHVkZXMoJ3ZlbmRvci1tYXJrZG93bicpIHx8XHJcbiAgICAgICAgICAgICAgZGVwLmluY2x1ZGVzKCd2ZW5kb3ItY2Fyb3VzZWwnKSB8fFxyXG4gICAgICAgICAgICAgIGRlcC5pbmNsdWRlcygndmVuZG9yLWZvcm1zJykgfHxcclxuICAgICAgICAgICAgICBkZXAuaW5jbHVkZXMoJ3ZlbmRvci1kYXRlJykgfHxcclxuICAgICAgICAgICAgICBkZXAuaW5jbHVkZXMoJ3ZlbmRvci1zdXBhYmFzZScpIHx8XHJcbiAgICAgICAgICAgICAgZGVwLmluY2x1ZGVzKCd0cmFuc2xhdGlvbnMtJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvLyBCdW5kbGVzIGFyZSBpbnRlbnRpb25hbGx5IHNwbGl0IGludG8gbGFyZ2Ugb3B0aW9uYWwgZmVhdHVyZSBjaHVua3MuXHJcbiAgICAvLyBSYWlzZSB3YXJuaW5nIHRocmVzaG9sZCB0byByZWR1Y2Ugbm9pc2UgYWZ0ZXIgbWFudWFsIGNodW5raW5nLlxyXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxyXG4gICAgLy8gRW5hYmxlIHNvdXJjZSBtYXBzIGZvciBwcm9kdWN0aW9uIGRlYnVnZ2luZ1xyXG4gICAgc291cmNlbWFwOiBmYWxzZSxcclxuICAgIC8vIE1pbmlmaWNhdGlvbiAtIHVzZSBlc2J1aWxkIHRvIGF2b2lkIHJhcmUgdGVyc2VyIG1pbmlmaWNhdGlvbiBlZGdlLWNhc2VzXHJcbiAgICAvLyB0aGF0IGNhbiBicmVhayB2ZW5kb3IgY2h1bmtzIG9uIHNvbWUgZGV2aWNlcy9icm93c2Vycy5cclxuICAgIG1pbmlmeTogXCJlc2J1aWxkXCIsXHJcbiAgICBlc2J1aWxkOiB7XHJcbiAgICAgIC8vIERyb3AgZGVidWdnZXIgb25seTsga2VlcCBjb25zb2xlLndhcm4vZXJyb3IgZm9yIHByb2R1Y3Rpb24gZGlhZ25vc3RpY3MgKGUuZy4gVklURV9HRU1JTklfQVBJX0tFWSlcclxuICAgICAgZHJvcDogW1wiZGVidWdnZXJcIl0sXHJcbiAgICB9LFxyXG4gICAgLy8gVGFyZ2V0IG1vZGVybiBicm93c2Vyc1xyXG4gICAgdGFyZ2V0OiBcImVzMjAyMFwiLFxyXG4gICAgLy8gRW5hYmxlIENTUyBjb2RlIHNwbGl0dGluZ1xyXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxyXG4gICAgLy8gRW5hYmxlIENTUyBtaW5pZmljYXRpb24gKHVzZXMgZXNidWlsZCBieSBkZWZhdWx0IGluIFZpdGUgNSspXHJcbiAgICBjc3NNaW5pZnk6IFwiZXNidWlsZFwiLFxyXG4gICAgLy8gUmVkdWNlIGFzc2V0IGlubGluZSBsaW1pdCBmb3IgYmV0dGVyIGNhY2hpbmdcclxuICAgIGFzc2V0c0lubGluZUxpbWl0OiAyMDQ4XHJcbiAgfVxyXG4gIH07XHJcbn0pOyAvLyBGaXhlZCBzeW50YXggZXJyb3JcclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzdWF0LVxcXFxEb2N1bWVudHNcXFxcdHJhZV9wcm9qZWN0c1xcXFxtZWV0dHJhbnNmZXJcXFxcc2NyaXB0c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc3VhdC1cXFxcRG9jdW1lbnRzXFxcXHRyYWVfcHJvamVjdHNcXFxcbWVldHRyYW5zZmVyXFxcXHNjcmlwdHNcXFxcdml0ZS12ZXJzaW9uLXBsdWdpbi50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvc3VhdC0vRG9jdW1lbnRzL3RyYWVfcHJvamVjdHMvbWVldHRyYW5zZmVyL3NjcmlwdHMvdml0ZS12ZXJzaW9uLXBsdWdpbi50c1wiOy8qKlxyXG4gKiBWaXRlIHBsdWdpbiB0byBhdXRvLWdlbmVyYXRlIHZlcnNpb24uanNvbiBvbiBwcm9kdWN0aW9uIGJ1aWxkc1xyXG4gKi9cclxuXHJcbmltcG9ydCB0eXBlIHsgUGx1Z2luIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuaW50ZXJmYWNlIFZlcnNpb25JbmZvIHtcclxuICB2ZXJzaW9uOiBzdHJpbmc7XHJcbiAgcmVsZWFzZURhdGU6IHN0cmluZztcclxuICBidWlsZE51bWJlcjogbnVtYmVyO1xyXG4gIG5vdGVzOiB7XHJcbiAgICBUUjogc3RyaW5nO1xyXG4gICAgRU46IHN0cmluZztcclxuICAgIFJVPzogc3RyaW5nO1xyXG4gICAgSVQ/OiBzdHJpbmc7XHJcbiAgICBFUz86IHN0cmluZztcclxuICAgIEFSPzogc3RyaW5nO1xyXG4gICAgVUs/OiBzdHJpbmc7XHJcbiAgICBKQT86IHN0cmluZztcclxuICAgIERFOiBzdHJpbmc7XHJcbiAgICBGUjogc3RyaW5nO1xyXG4gIH07XHJcbn1cclxuXHJcbmNvbnN0IFZFUlNJT05fRklMRSA9ICdwdWJsaWMvdmVyc2lvbi5qc29uJztcclxuXHJcbmZ1bmN0aW9uIGdldEV4aXN0aW5nVmVyc2lvbigpOiBWZXJzaW9uSW5mbyB8IG51bGwge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKFZFUlNJT05fRklMRSwgJ3V0Zi04Jyk7XHJcbiAgICByZXR1cm4gSlNPTi5wYXJzZShjb250ZW50KTtcclxuICB9IGNhdGNoIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaW5jcmVtZW50VmVyc2lvbih2ZXJzaW9uOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIGNvbnN0IHBhcnRzID0gdmVyc2lvbi5zcGxpdCgnLicpLm1hcChOdW1iZXIpO1xyXG4gIHBhcnRzWzJdID0gKHBhcnRzWzJdIHx8IDApICsgMTtcclxuICByZXR1cm4gcGFydHMuam9pbignLicpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmb3JtYXREYXRlKCk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdml0ZVZlcnNpb25QbHVnaW4oKTogUGx1Z2luIHtcclxuICBsZXQgaXNQcm9kdWN0aW9uID0gZmFsc2U7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiAndml0ZS12ZXJzaW9uLXBsdWdpbicsXHJcbiAgICBcclxuICAgIGNvbmZpZ1Jlc29sdmVkKGNvbmZpZykge1xyXG4gICAgICBpc1Byb2R1Y3Rpb24gPSBjb25maWcuY29tbWFuZCA9PT0gJ2J1aWxkJyAmJiBjb25maWcubW9kZSA9PT0gJ3Byb2R1Y3Rpb24nO1xyXG4gICAgfSxcclxuXHJcbiAgICBidWlsZFN0YXJ0KCkge1xyXG4gICAgICBpZiAoIWlzUHJvZHVjdGlvbikgcmV0dXJuO1xyXG5cclxuICAgICAgY29uc3QgZXhpc3RpbmcgPSBnZXRFeGlzdGluZ1ZlcnNpb24oKTtcclxuICAgICAgXHJcbiAgICAgIGNvbnN0IGRlZmF1bHROb3RlcyA9IHtcclxuICAgICAgICBUUjogXCJQZXJmb3JtYW5zIGl5aWxlXHUwMTVGdGlybWVsZXJpIHZlIGhhdGEgZFx1MDBGQ3plbHRtZWxlcmlcIixcclxuICAgICAgICBFTjogXCJQZXJmb3JtYW5jZSBpbXByb3ZlbWVudHMgYW5kIGJ1ZyBmaXhlc1wiLFxyXG4gICAgICAgIERFOiBcIkxlaXN0dW5nc3ZlcmJlc3NlcnVuZ2VuIHVuZCBGZWhsZXJiZWhlYnVuZ2VuXCIsXHJcbiAgICAgICAgRlI6IFwiQW1cdTAwRTlsaW9yYXRpb25zIGRlcyBwZXJmb3JtYW5jZXMgZXQgY29ycmVjdGlvbnMgZGUgYnVnc1wiXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCBuZXdWZXJzaW9uOiBWZXJzaW9uSW5mbyA9IHtcclxuICAgICAgICB2ZXJzaW9uOiBleGlzdGluZyA/IGluY3JlbWVudFZlcnNpb24oZXhpc3RpbmcudmVyc2lvbikgOiBcIjEuMC4wXCIsXHJcbiAgICAgICAgcmVsZWFzZURhdGU6IGZvcm1hdERhdGUoKSxcclxuICAgICAgICBidWlsZE51bWJlcjogKGV4aXN0aW5nPy5idWlsZE51bWJlciB8fCAwKSArIDEsXHJcbiAgICAgICAgbm90ZXM6IGV4aXN0aW5nPy5ub3RlcyB8fCBkZWZhdWx0Tm90ZXNcclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8vIEVuc3VyZSBkaXJlY3RvcnkgZXhpc3RzXHJcbiAgICAgIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShWRVJTSU9OX0ZJTEUpO1xyXG4gICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkge1xyXG4gICAgICAgIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmcy53cml0ZUZpbGVTeW5jKFZFUlNJT05fRklMRSwgSlNPTi5zdHJpbmdpZnkobmV3VmVyc2lvbiwgbnVsbCwgMikpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coJ1xcbicpO1xyXG4gICAgICBjb25zb2xlLmxvZygnXHUyNTU0XHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTU3Jyk7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdcdTI1NTEgICAgICAgICBcdUQ4M0RcdURDRTYgVkVSU0lPTiBBVVRPLUdFTkVSQVRFRCAgICAgICAgICBcdTI1NTEnKTtcclxuICAgICAgY29uc29sZS5sb2coJ1x1MjU2MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU1MFx1MjU2MycpO1xyXG4gICAgICBjb25zb2xlLmxvZyhgXHUyNTUxICBWZXJzaW9uOiAgICAgIHYke25ld1ZlcnNpb24udmVyc2lvbi5wYWRFbmQoMjUpfVx1MjU1MWApO1xyXG4gICAgICBjb25zb2xlLmxvZyhgXHUyNTUxICBCdWlsZDogICAgICAgICMke1N0cmluZyhuZXdWZXJzaW9uLmJ1aWxkTnVtYmVyKS5wYWRFbmQoMjUpfVx1MjU1MWApO1xyXG4gICAgICBjb25zb2xlLmxvZyhgXHUyNTUxICBEYXRlOiAgICAgICAgICR7bmV3VmVyc2lvbi5yZWxlYXNlRGF0ZS5wYWRFbmQoMjYpfVx1MjU1MWApO1xyXG4gICAgICBjb25zb2xlLmxvZygnXHUyNTVBXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTUwXHUyNTVEJyk7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdcXG4nKTtcclxuICAgIH1cclxuICB9O1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc3VhdC1cXFxcRG9jdW1lbnRzXFxcXHRyYWVfcHJvamVjdHNcXFxcbWVldHRyYW5zZmVyXFxcXHNjcmlwdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHN1YXQtXFxcXERvY3VtZW50c1xcXFx0cmFlX3Byb2plY3RzXFxcXG1lZXR0cmFuc2ZlclxcXFxzY3JpcHRzXFxcXHZpdGUtYXN5bmMtY3NzLXBsdWdpbi50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvc3VhdC0vRG9jdW1lbnRzL3RyYWVfcHJvamVjdHMvbWVldHRyYW5zZmVyL3NjcmlwdHMvdml0ZS1hc3luYy1jc3MtcGx1Z2luLnRzXCI7aW1wb3J0IHR5cGUgeyBQbHVnaW4gfSBmcm9tIFwidml0ZVwiO1xyXG5cclxuLyoqXHJcbiAqIFZpdGUgcGx1Z2luIHRoYXQgbWFrZXMgQ1NTIGA8bGluaz5gIHRhZ3Mgbm9uLWJsb2NraW5nIGluIHByb2R1Y3Rpb24gYnVpbGRzLlxyXG4gKlxyXG4gKiBUZWNobmlxdWU6IGNvbnZlcnQgcmVuZGVyLWJsb2NraW5nIGA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgaHJlZj1cIi4uLlwiPmAgdGFnc1xyXG4gKiBpbnRvIGA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgbWVkaWE9XCJwcmludFwiIG9ubG9hZD1cInRoaXMubWVkaWE9J2FsbCdcIiAuLi4+YFxyXG4gKiB3aXRoIGEgYDxub3NjcmlwdD5gIGZhbGxiYWNrLiBUaGlzIGFsbG93cyB0aGUgYnJvd3NlciB0byBwYWludCBpbW1lZGlhdGVseVxyXG4gKiB1c2luZyB0aGUgY3JpdGljYWwgQ1NTIGFscmVhZHkgaW5saW5lZCBpbiBgPHN0eWxlPmAgdGFncywgd2hpbGUgdGhlIGZ1bGxcclxuICogc3R5bGVzaGVldCBsb2FkcyBpbiB0aGUgYmFja2dyb3VuZC5cclxuICpcclxuICogUmVmZXJlbmNlOiBodHRwczovL3dlYi5kZXYvZGVmZXItbm9uLWNyaXRpY2FsLWNzcy9cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBhc3luY0Nzc1BsdWdpbigpOiBQbHVnaW4ge1xyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiBcInZpdGUtYXN5bmMtY3NzXCIsXHJcbiAgICBlbmZvcmNlOiBcInBvc3RcIixcclxuICAgIGFwcGx5OiBcImJ1aWxkXCIsXHJcbiAgICB0cmFuc2Zvcm1JbmRleEh0bWwoaHRtbCkge1xyXG4gICAgICAvLyBNYXRjaCBhbGwgPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIC4uLj4gdGFncyB0aGF0IHBvaW50IHRvIGhhc2hlZCBDU1MgYnVuZGxlc1xyXG4gICAgICAvLyBlLmcuIDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiBjcm9zc29yaWdpbiBocmVmPVwiL2Fzc2V0cy9pbmRleC1DOVdfQkdpMC5jc3NcIj5cclxuICAgICAgY29uc3QgY3NzTGlua1JlZ2V4ID1cclxuICAgICAgICAvPGxpbmtcXHMrKFtePl0qPylyZWw9W1wiJ11zdHlsZXNoZWV0W1wiJ10oW14+XSo/KWhyZWY9W1wiJ10oW15cIiddK1xcLmNzcylbXCInXShbXj5dKj8pXFxzKlxcLz9cXHMqPi9naTtcclxuXHJcbiAgICAgIGNvbnN0IG5vc2NyaXB0RmFsbGJhY2tzOiBzdHJpbmdbXSA9IFtdO1xyXG5cclxuICAgICAgY29uc3QgdHJhbnNmb3JtZWQgPSBodG1sLnJlcGxhY2UoXHJcbiAgICAgICAgY3NzTGlua1JlZ2V4LFxyXG4gICAgICAgIChfbWF0Y2gsIGJlZm9yZSwgbWlkLCBocmVmLCBhZnRlcikgPT4ge1xyXG4gICAgICAgICAgLy8gS2VlcCB0aGUgb3JpZ2luYWwgdGFnIGFzIGEgPG5vc2NyaXB0PiBmYWxsYmFja1xyXG4gICAgICAgICAgbm9zY3JpcHRGYWxsYmFja3MucHVzaChcclxuICAgICAgICAgICAgYDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiAke2JlZm9yZX0ke21pZH1ocmVmPVwiJHtocmVmfVwiJHthZnRlcn0gLz5gXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIC8vIFJldHVybiB0aGUgbm9uLWJsb2NraW5nIHZlcnNpb25cclxuICAgICAgICAgIHJldHVybiBgPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiICR7YmVmb3JlfSR7bWlkfWhyZWY9XCIke2hyZWZ9XCIke2FmdGVyfSBtZWRpYT1cInByaW50XCIgb25sb2FkPVwidGhpcy5tZWRpYT0nYWxsJ1wiIC8+YDtcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcblxyXG4gICAgICAvLyBJbmplY3QgPG5vc2NyaXB0PiBmYWxsYmFja3MganVzdCBiZWZvcmUgPC9oZWFkPlxyXG4gICAgICBpZiAobm9zY3JpcHRGYWxsYmFja3MubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnN0IG5vc2NyaXB0QmxvY2sgPSBgPG5vc2NyaXB0PiR7bm9zY3JpcHRGYWxsYmFja3Muam9pbihcIlwiKX08L25vc2NyaXB0PmA7XHJcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybWVkLnJlcGxhY2UoXCI8L2hlYWQ+XCIsIGAke25vc2NyaXB0QmxvY2t9XFxuPC9oZWFkPmApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdHJhbnNmb3JtZWQ7XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1VixTQUFTLGNBQWMsZUFBZTtBQUM3WCxPQUFPLFdBQVc7QUFDbEIsT0FBT0EsV0FBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLGVBQWU7QUFDeEIsU0FBUyxrQkFBa0I7OztBQ0EzQixPQUFPLFFBQVE7QUFDZixPQUFPLFVBQVU7QUFvQmpCLElBQU0sZUFBZTtBQUVyQixTQUFTLHFCQUF5QztBQUNoRCxNQUFJO0FBQ0YsVUFBTSxVQUFVLEdBQUcsYUFBYSxjQUFjLE9BQU87QUFDckQsV0FBTyxLQUFLLE1BQU0sT0FBTztBQUFBLEVBQzNCLFFBQVE7QUFDTixXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRUEsU0FBUyxpQkFBaUIsU0FBeUI7QUFDakQsUUFBTSxRQUFRLFFBQVEsTUFBTSxHQUFHLEVBQUUsSUFBSSxNQUFNO0FBQzNDLFFBQU0sQ0FBQyxLQUFLLE1BQU0sQ0FBQyxLQUFLLEtBQUs7QUFDN0IsU0FBTyxNQUFNLEtBQUssR0FBRztBQUN2QjtBQUVBLFNBQVMsYUFBcUI7QUFDNUIsVUFBTyxvQkFBSSxLQUFLLEdBQUUsWUFBWSxFQUFFLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDOUM7QUFFTyxTQUFTLG9CQUE0QjtBQUMxQyxNQUFJLGVBQWU7QUFFbkIsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBRU4sZUFBZSxRQUFRO0FBQ3JCLHFCQUFlLE9BQU8sWUFBWSxXQUFXLE9BQU8sU0FBUztB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
