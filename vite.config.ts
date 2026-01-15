import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import { viteVersionPlugin } from "./scripts/vite-version-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && viteVersionPlugin(),
    VitePWA({
      // Auto-update: keep users on the latest published version (no manual prompt).
      registerType: "autoUpdate",
      injectRegister: null,
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
        // Merge our push-notification handlers into the SAME SW scope
        importScripts: ["sw-push.js"],
        // Activate new SW immediately (prevents users getting stuck on an old cached app shell)
        skipWaiting: true,
        clientsClaim: true,
        // Navigation preload for faster page loads
        navigationPreload: true,
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
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
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
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
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
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year (hashed files)
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
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
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
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
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
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
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
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // ============================================
          // API CALLS - StaleWhileRevalidate (instant + fresh)
          // ============================================
          
          // Supabase Edge Functions (cacheable) - StaleWhileRevalidate
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/(get-google-reviews|get-all-vehicle-prices|get-exchange-rate|get-destinations)/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-functions-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Supabase REST API (read-only tables) - StaleWhileRevalidate
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(hourly_rental_prices|region_prices|intercity_prices|google_reviews_cache)/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-readonly-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 15 // 15 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // ============================================
          // DYNAMIC API - NetworkFirst (fresh data priority)
          // ============================================
          
          // Supabase REST API (dynamic tables) - NetworkFirst with timeout
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-rest-cache",
              networkTimeoutSeconds: 3, // Fast fallback to cache
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Other Edge Functions - NetworkFirst
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-edge-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 10 // 10 minutes
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
      },
      devOptions: {
        enabled: false
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
  build: {
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: {
          // Vendor chunks - split by usage pattern
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-popover",
            "@radix-ui/react-accordion",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-progress",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-separator",
            "@radix-ui/react-collapsible"
          ],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-motion": ["framer-motion"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-date": ["date-fns", "react-day-picker"],
          "vendor-pdf": ["jspdf", "jspdf-autotable"],
          "vendor-excel": ["xlsx"],
          "vendor-markdown": ["react-markdown", "remark-gfm"]
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Enable source maps for production debugging
    sourcemap: false,
    // Minification
    minify: "esbuild",
    // Target modern browsers
    target: "es2020"
  }
}));
